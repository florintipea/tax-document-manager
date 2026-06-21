import { db } from '@/lib/db/client';

export const BETA_TESTER_PLAN_ID = 'beta-tester';
export const TESTER_EMAIL_DOMAIN =
  process.env.TEST_ACCOUNT_DOMAIN || 'taxdoc.test';

export function isTestPhaseEnabled(): boolean {
  return process.env.TEST_PHASE_ENABLED !== 'false';
}

export function isBetaTesterEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${TESTER_EMAIL_DOMAIN.toLowerCase()}`);
}

export function isAdminRole(role?: string | null): boolean {
  return role === 'admin' || role === 'super_admin';
}

export type AppAccessResult =
  | { allowed: true }
  | { allowed: false; message: string; code: 'test_phase_ended' | 'beta_expired' };

export async function checkUserAppAccess(
  userId: string,
  email: string,
  role?: string | null
): Promise<AppAccessResult> {
  if (isAdminRole(role)) {
    return { allowed: true };
  }

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: {
      planId: true,
      status: true,
      currentPeriodEnd: true,
    },
  });

  const isBetaTester =
    subscription?.planId === BETA_TESTER_PLAN_ID || isBetaTesterEmail(email);

  if (!isBetaTester) {
    return { allowed: true };
  }

  if (!isTestPhaseEnabled()) {
    return {
      allowed: false,
      code: 'test_phase_ended',
      message: 'The beta test phase has ended. Thank you for testing TaxDoc!',
    };
  }

  if (!subscription || subscription.status !== 'active') {
    return {
      allowed: false,
      code: 'beta_expired',
      message: 'Your beta test access is no longer active.',
    };
  }

  if (subscription.currentPeriodEnd < new Date()) {
    return {
      allowed: false,
      code: 'beta_expired',
      message: 'Your beta test period has expired.',
    };
  }

  return { allowed: true };
}

export async function endBetaTestPhase(): Promise<number> {
  const result = await db.subscription.updateMany({
    where: { planId: BETA_TESTER_PLAN_ID },
    data: {
      status: 'expired',
      cancelAtPeriodEnd: true,
    },
  });
  return result.count;
}

export async function reactivateBetaTestPhase(days = 90): Promise<number> {
  const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const result = await db.subscription.updateMany({
    where: { planId: BETA_TESTER_PLAN_ID },
    data: {
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: end,
    },
  });
  return result.count;
}
