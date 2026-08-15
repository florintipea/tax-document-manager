/** @typedef {import('../lib/test-phase/tester-accounts.ts')} TesterAccounts */

export const MAX_TESTER_COUNT = 10_000;
export const DEFAULT_TEST_ACCOUNT_COUNT = 50;

export function testerPaddingWidth(count = MAX_TESTER_COUNT) {
  return Math.max(2, String(count).length);
}

export function formatTesterNumber(n, count = MAX_TESTER_COUNT) {
  return String(n).padStart(testerPaddingWidth(count), '0');
}

export function formatTesterEmail(n, domain, count = MAX_TESTER_COUNT) {
  return `tester${formatTesterNumber(n, count)}@${domain}`;
}

export function parseTesterSlot(email, domain, maxCount = MAX_TESTER_COUNT) {
  const escaped = domain.replace(/\./g, '\\.');
  const match = email.match(new RegExp(`^tester(\\d+)@${escaped}$`, 'i'));
  if (!match) return null;
  const slot = Number(match[1]);
  if (!Number.isInteger(slot) || slot < 1 || slot > maxCount) return null;
  return slot;
}

export function resolveAccountCount(envValue) {
  const n = Number(envValue ?? DEFAULT_TEST_ACCOUNT_COUNT);
  if (!Number.isInteger(n) || n < 1 || n > MAX_TESTER_COUNT) {
    throw new Error(`TEST_ACCOUNT_COUNT must be 1..${MAX_TESTER_COUNT}`);
  }
  return n;
}
