import { db } from '@/lib/db/client';
import { BETA_TESTER_PLAN_ID, isAdminRole, isTestPhaseEnabled } from '@/lib/test-phase/access';
import type { PlanTier } from './plans';
import { licensePeriodEnd, normalizePlanTier, updatesPeriodEnd } from './plans';

export type EffectiveTier = 'free' | PlanTier;

export interface TierFeatures {
  tier: EffectiveTier;
  maxDocuments: number | null;
  calculatorCountries: 'DE_ONLY' | 'ALL';
  calculatorFullDe: boolean;
  aiMessagesPerMonth: number | null;
  multiClient: boolean;
  exportEnabled: boolean;
  prioritySupport: boolean;
  updatesPolicy: 'none' | 'bugfixes' | 'full';
  hasLicense: boolean;
  updatesActive: boolean;
  updatesUntil: string | null;
}

const TIER_FEATURES: Record<EffectiveTier, Omit<TierFeatures, 'tier' | 'hasLicense' | 'updatesActive' | 'updatesUntil'>> = {
  free: {
    maxDocuments: 5,
    calculatorCountries: 'DE_ONLY',
    calculatorFullDe: false,
    aiMessagesPerMonth: 0,
    multiClient: false,
    exportEnabled: false,
    prioritySupport: false,
    updatesPolicy: 'none',
  },
  standard: {
    maxDocuments: null,
    calculatorCountries: 'ALL',
    calculatorFullDe: true,
    aiMessagesPerMonth: null,
    multiClient: false,
    exportEnabled: false,
    prioritySupport: false,
    updatesPolicy: 'full',
  },
  advisor: {
    maxDocuments: null,
    calculatorCountries: 'ALL',
    calculatorFullDe: true,
    aiMessagesPerMonth: null,
    multiClient: true,
    exportEnabled: true,
    prioritySupport: true,
    updatesPolicy: 'full',
  },
};

function resolveEffectiveTier(
  planId: string | undefined,
  status: string | undefined,
  periodEnd: Date | undefined,
  role?: string | null
): EffectiveTier {
  if (isAdminRole(role)) return 'advisor';

  const active =
    status === 'active' && periodEnd !== undefined && periodEnd > new Date();

  if (active) {
    const normalized = normalizePlanTier(planId);
    if (normalized) return normalized;
    if (planId === 'trial' || planId === BETA_TESTER_PLAN_ID) return 'standard';
  }

  if (
    planId === BETA_TESTER_PLAN_ID &&
    isTestPhaseEnabled() &&
    active
  ) {
    return 'standard';
  }

  return 'free';
}

export async function getUserTierFeatures(
  userId: string,
  role?: string | null
): Promise<TierFeatures> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: {
      planId: true,
      status: true,
      currentPeriodEnd: true,
      billingInterval: true,
    },
  });

  const tier = resolveEffectiveTier(
    subscription?.planId,
    subscription?.status,
    subscription?.currentPeriodEnd,
    role
  );

  const base = TIER_FEATURES[tier];

  const updatesActive =
    subscription?.billingInterval === 'updates' &&
    subscription.status === 'active' &&
    subscription.currentPeriodEnd > new Date();

  const updatesUntil =
    updatesActive && subscription?.currentPeriodEnd
      ? subscription.currentPeriodEnd.toISOString()
      : null;

  return {
    tier,
    ...base,
    hasLicense: tier !== 'free',
    updatesActive: Boolean(updatesActive),
    updatesUntil,
  };
}

export function tierMeetsRequirement(
  userTier: EffectiveTier,
  required: EffectiveTier
): boolean {
  const order: EffectiveTier[] = ['free', 'standard', 'advisor'];
  return order.indexOf(userTier) >= order.indexOf(required);
}

export { licensePeriodEnd, updatesPeriodEnd };
