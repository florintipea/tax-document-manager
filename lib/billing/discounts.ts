/**
 * Resolve effective license discounts from UserDiscount + active PromoCampaign.
 * Best (lowest final price) wins when multiple apply.
 */

import { db } from '@/lib/db/client';

export type DiscountKind = 'user' | 'promo' | 'none';

export interface AppliedDiscount {
  kind: DiscountKind;
  label: string;
  percentOff: number | null;
  amountOff: number | null;
  code?: string | null;
  expiresAt?: string | null;
  sourceId?: string;
}

export interface PricedAmount {
  original: number;
  final: number;
  saved: number;
  discount: AppliedDiscount;
}

function roundMoney(n: number): number {
  return Math.round(Math.max(0, n) * 100) / 100;
}

export function applyDiscountToAmount(
  original: number,
  discount: AppliedDiscount
): PricedAmount {
  if (discount.kind === 'none' || original <= 0) {
    return { original, final: original, saved: 0, discount };
  }
  let final = original;
  if (discount.percentOff != null && discount.percentOff > 0) {
    final = original * (1 - Math.min(100, discount.percentOff) / 100);
  }
  if (discount.amountOff != null && discount.amountOff > 0) {
    final = final - discount.amountOff;
  }
  final = roundMoney(final);
  const saved = roundMoney(original - final);
  return { original, final, saved, discount };
}

function betterDiscount(a: AppliedDiscount, b: AppliedDiscount, base: number): AppliedDiscount {
  if (a.kind === 'none') return b;
  if (b.kind === 'none') return a;
  const fa = applyDiscountToAmount(base, a).final;
  const fb = applyDiscountToAmount(base, b).final;
  return fa <= fb ? a : b;
}

function isAutoCampaign(code: string | null | undefined): boolean {
  return !code || !String(code).trim();
}

export async function resolveDiscountForUser(options: {
  userId?: string | null;
  promoCode?: string | null;
  now?: Date;
}): Promise<AppliedDiscount> {
  const now = options.now ?? new Date();
  let best: AppliedDiscount = {
    kind: 'none',
    label: '',
    percentOff: null,
    amountOff: null,
  };
  const compareBase = 100;

  if (options.userId) {
    const userDisc = await db.userDiscount.findFirst({
      where: {
        userId: options.userId,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (userDisc && (userDisc.percentOff || userDisc.amountOff)) {
      best = betterDiscount(
        best,
        {
          kind: 'user',
          label: userDisc.reason || 'Persönlicher Rabatt',
          percentOff: userDisc.percentOff,
          amountOff: userDisc.amountOff,
          expiresAt: userDisc.expiresAt?.toISOString() ?? null,
          sourceId: userDisc.id,
        },
        compareBase
      );
    }
  }

  const activePromos = await db.promoCampaign.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const code = options.promoCode?.trim().toUpperCase() || null;
  const auto = activePromos.filter((p) => isAutoCampaign(p.code));
  const coded = code
    ? activePromos.filter((p) => (p.code || '').toUpperCase() === code)
    : [];

  const pool = code && coded.length > 0 ? [...coded, ...auto] : auto;

  for (const p of pool) {
    if (!p.percentOff && !p.amountOff) continue;
    best = betterDiscount(
      best,
      {
        kind: 'promo',
        label: p.name,
        percentOff: p.percentOff,
        amountOff: p.amountOff,
        code: p.code,
        expiresAt: p.endsAt.toISOString(),
        sourceId: p.id,
      },
      compareBase
    );
  }

  return best;
}

export function discountSummaryDe(d: AppliedDiscount): string | null {
  if (d.kind === 'none') return null;
  const parts: string[] = [];
  if (d.percentOff) parts.push(`${d.percentOff} %`);
  if (d.amountOff) parts.push(`${d.amountOff} €`);
  return `${d.label}: ${parts.join(' + ')} Rabatt`;
}
