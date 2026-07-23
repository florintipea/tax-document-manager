/**
 * Beta tester slot helpers (email format, limits).
 * Slots 1–99 may use 2-digit padding (legacy); 100+ uses width for MAX_TESTER_COUNT (5 digits).
 */

export const MAX_TESTER_COUNT = 10_000;
export const DEFAULT_TEST_ACCOUNT_COUNT = 50;

export function testerPaddingWidth(count: number = MAX_TESTER_COUNT): number {
  return Math.max(2, String(count).length);
}

export function formatTesterNumber(
  n: number,
  count: number = MAX_TESTER_COUNT
): string {
  return String(n).padStart(testerPaddingWidth(count), '0');
}

export function formatTesterEmail(
  n: number,
  domain = process.env.TEST_ACCOUNT_DOMAIN || 'taxdoc.test',
  count: number = MAX_TESTER_COUNT
): string {
  return `tester${formatTesterNumber(n, count)}@${domain}`;
}

export function parseTesterSlot(
  email: string,
  domain = process.env.TEST_ACCOUNT_DOMAIN || 'taxdoc.test',
  maxCount: number = MAX_TESTER_COUNT
): number | null {
  const escaped = domain.replace(/\./g, '\\.');
  const match = email.match(new RegExp(`^tester(\\d+)@${escaped}$`, 'i'));
  if (!match) return null;
  const slot = Number(match[1]);
  if (!Number.isInteger(slot) || slot < 1 || slot > maxCount) return null;
  return slot;
}

export function resolveAccountCount(envValue?: string): number {
  const n = Number(envValue ?? DEFAULT_TEST_ACCOUNT_COUNT);
  if (!Number.isInteger(n) || n < 1 || n > MAX_TESTER_COUNT) {
    throw new Error(`TEST_ACCOUNT_COUNT must be 1..${MAX_TESTER_COUNT}`);
  }
  return n;
}
