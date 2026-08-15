/**
 * Referral MVP (Phase 1): invite 3 friends → Pro unlock stub.
 * Honest: unlock creates a 100% Pro-license UserDiscount when 3 accepted;
 * Stripe checkout still required if discount system applies at checkout.
 */

import { createHash, randomBytes } from 'crypto';
import { db } from '@/lib/db/client';
import { EUR_CANONICAL } from '@/lib/billing/market-pricing';

export const REFERRAL_TARGET = 3;
export const REFERRAL_REASON = 'referral-3-friends-pro';

export function generateReferralCode(userId: string): string {
  const hash = createHash('sha256')
    .update(userId + (process.env.NEXTAUTH_SECRET || 'taxdoc'))
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  return `TD${hash}`;
}

export function randomReferralCode(): string {
  return `TD${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function ensureUserReferralCode(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, referralCode: true },
  });
  if (!user) throw new Error('User not found');
  if (user.referralCode) return user.referralCode;

  let code = generateReferralCode(userId);
  // collision unlikely; retry once
  const existing = await db.user.findFirst({ where: { referralCode: code } });
  if (existing && existing.id !== userId) {
    code = randomReferralCode();
  }

  await db.user.update({
    where: { id: userId },
    data: { referralCode: code },
  });
  return code;
}

export async function countAcceptedReferrals(code: string): Promise<number> {
  return db.user.count({
    where: { referredByCode: code },
  });
}

export async function getReferralStatus(userId: string) {
  const code = await ensureUserReferralCode(userId);
  const accepted = await countAcceptedReferrals(code);
  const unlocked = accepted >= REFERRAL_TARGET;

  const discount = await db.userDiscount.findFirst({
    where: {
      userId,
      reason: REFERRAL_REASON,
      active: true,
    },
  });

  return {
    code,
    accepted,
    target: REFERRAL_TARGET,
    unlocked: unlocked || Boolean(discount),
    hasDiscount: Boolean(discount),
    invitePath: `/auth/register?ref=${encodeURIComponent(code)}`,
  };
}

/** Attribute new user to inviter; maybe grant Pro discount to inviter. */
export async function applyReferralOnRegister(
  newUserId: string,
  refCode: string | null | undefined
): Promise<void> {
  if (!refCode || typeof refCode !== 'string') return;
  const code = refCode.trim().toUpperCase();
  if (!code.startsWith('TD') || code.length < 4) return;

  const inviter = await db.user.findFirst({
    where: { referralCode: code },
    select: { id: true },
  });
  if (!inviter || inviter.id === newUserId) return;

  await db.user.update({
    where: { id: newUserId },
    data: { referredByCode: code },
  });

  const accepted = await countAcceptedReferrals(code);
  if (accepted < REFERRAL_TARGET) return;

  const existing = await db.userDiscount.findFirst({
    where: { userId: inviter.id, reason: REFERRAL_REASON, active: true },
  });
  if (existing) return;

  // Partial Pro unlock: 100% off Pro license at checkout (honest — still checkout flow)
  await db.userDiscount.create({
    data: {
      userId: inviter.id,
      percentOff: 100,
      amountOff: null,
      reason: REFERRAL_REASON,
      active: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
}

export function referralRewardLabel(): string {
  return `Pro (${EUR_CANONICAL.pro} €) freigeschaltet — 100 % Rabatt beim Checkout (Referral)`;
}
