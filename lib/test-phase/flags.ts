/**
 * Edge-safe test-phase helpers (no Prisma).
 * Use from middleware; API routes may use lib/test-phase/access.ts instead.
 */

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
