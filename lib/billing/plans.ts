export type PlanTier = 'starter' | 'standard' | 'advisor';
export type PurchaseType = 'license' | 'updates';

export type PlanId =
  | 'starter-license'
  | 'starter-updates'
  | 'standard-license'
  | 'standard-updates'
  | 'advisor-license'
  | 'advisor-updates';

export const PLAN_IDS: PlanId[] = [
  'starter-license',
  'starter-updates',
  'standard-license',
  'standard-updates',
  'advisor-license',
  'advisor-updates',
];

/** @deprecated Legacy tiers — mapped to standard in features.ts */
export type LegacyPlanTier = 'basic' | 'professional';

export interface PlanPricing {
  tier: PlanTier;
  license: number;
  updatesYearly: number;
  currency: 'EUR';
}

/**
 * Canonical EUR checkout prices (Aug 2026 worldwide strategy).
 * Pro = `standard` for Stripe/env compatibility.
 * See docs/PRICING-STRATEGY-WORLDWIDE-DE.md
 */
export const PLAN_PRICING: Record<PlanTier, PlanPricing> = {
  starter: { tier: 'starter', license: 24.99, updatesYearly: 9.99, currency: 'EUR' },
  standard: { tier: 'standard', license: 29.99, updatesYearly: 14.99, currency: 'EUR' },
  advisor: { tier: 'advisor', license: 249, updatesYearly: 99, currency: 'EUR' },
};

export const PLAN_TIERS: PlanTier[] = ['starter', 'standard', 'advisor'];

const STRIPE_PRICE_ENV: Record<PlanTier, Record<PurchaseType, string>> = {
  starter: {
    license: 'STRIPE_PRICE_STARTER_LICENSE',
    updates: 'STRIPE_PRICE_STARTER_UPDATES',
  },
  standard: {
    license: 'STRIPE_PRICE_STANDARD_LICENSE',
    updates: 'STRIPE_PRICE_STANDARD_UPDATES',
  },
  advisor: {
    license: 'STRIPE_PRICE_ADVISOR_LICENSE',
    updates: 'STRIPE_PRICE_ADVISOR_UPDATES',
  },
};

export function parsePlanId(planId: string): { tier: PlanTier; purchaseType: PurchaseType } | null {
  if (planId === 'starter-license') return { tier: 'starter', purchaseType: 'license' };
  if (planId === 'starter-updates') return { tier: 'starter', purchaseType: 'updates' };
  if (planId === 'standard-license') return { tier: 'standard', purchaseType: 'license' };
  if (planId === 'standard-updates') return { tier: 'standard', purchaseType: 'updates' };
  if (planId === 'advisor-license') return { tier: 'advisor', purchaseType: 'license' };
  if (planId === 'advisor-updates') return { tier: 'advisor', purchaseType: 'updates' };
  return null;
}

export function normalizePlanTier(planId: string | undefined): PlanTier | null {
  if (!planId) return null;
  if (planId === 'starter' || planId === 'standard' || planId === 'advisor') return planId;
  if (planId === 'basic' || planId === 'professional' || planId === 'monthly' || planId === 'annual') {
    return 'standard';
  }
  const parsed = parsePlanId(planId);
  if (parsed) return parsed.tier;
  return null;
}

export function toPlanId(tier: PlanTier, purchaseType: PurchaseType): PlanId {
  return `${tier}-${purchaseType}` as PlanId;
}

export function getStripePriceEnvKey(tier: PlanTier, purchaseType: PurchaseType): string {
  return STRIPE_PRICE_ENV[tier][purchaseType];
}

export function getStripePriceId(tier: PlanTier, purchaseType: PurchaseType): string | null {
  const envKey = STRIPE_PRICE_ENV[tier][purchaseType];
  return process.env[envKey] || null;
}

export function isStripeCheckoutConfigured(): boolean {
  if (!process.env.STRIPE_SECRET_KEY) return false;
  return PLAN_TIERS.some((tier) =>
    (['license', 'updates'] as PurchaseType[]).some((purchaseType) =>
      Boolean(getStripePriceId(tier, purchaseType))
    )
  );
}

/** Default Steuerjahr for seasonal UI hints (German filing season: Jan–May → prior year). */
export function defaultSteuerjahr(at: Date = new Date()): number {
  const month = at.getMonth() + 1;
  const year = at.getFullYear();
  return month <= 5 ? year - 1 : year;
}

export function updatesPeriodEnd(from: Date = new Date()): Date {
  const end = new Date(from);
  end.setFullYear(end.getFullYear() + 1);
  return end;
}

export function licensePeriodEnd(): Date {
  return new Date(2099, 11, 31, 23, 59, 59, 999);
}

export function isSteuerjahrSeason(at: Date = new Date()): boolean {
  const month = at.getMonth() + 1;
  return month >= 2 && month <= 5;
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
