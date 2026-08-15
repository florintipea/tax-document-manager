/**
 * Shared login lockout thresholds and user-facing messages.
 */

export const ACCOUNT_LOCKOUT_ATTEMPTS = 10;
export const ACCOUNT_LOCKOUT_MS = 15 * 60 * 1000;

export function getAccountLockUntil(failedAttempts: number): Date | null {
  if (failedAttempts < ACCOUNT_LOCKOUT_ATTEMPTS) {
    return null;
  }
  return new Date(Date.now() + ACCOUNT_LOCKOUT_MS);
}

export function formatLockoutMessage(until: Date, locale = 'de-DE'): string {
  const minutesRemaining = Math.max(
    1,
    Math.ceil((until.getTime() - Date.now()) / (60 * 1000))
  );
  const when = until.toLocaleString(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  return `Konto vorübergehend gesperrt. Bitte in ${minutesRemaining} Min. erneut versuchen (ab ${when}).`;
}

export function formatRateLimitMessage(until: Date, locale = 'de-DE'): string {
  const when = until.toLocaleString(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  return `Zu viele Anmeldeversuche. Bitte erneut versuchen ab ${when}.`;
}

export function normalizeAdminEmail(email: string | undefined): string | null {
  const normalized = email?.toLowerCase().trim();
  return normalized || null;
}

/**
 * Admin allowlist from env.
 * Primary: ADMIN_EMAIL (singular — also used by ensure-admin).
 * Optional: ADMIN_EMAILS (comma-separated) for extra lockout-exempt / auto-promote emails.
 */
export function getAdminAllowlistEmails(): string[] {
  const emails = new Set<string>();
  const primary = normalizeAdminEmail(process.env.ADMIN_EMAIL);
  if (primary) emails.add(primary);

  const extra = process.env.ADMIN_EMAILS ?? "";
  for (const part of extra.split(",")) {
    const normalized = normalizeAdminEmail(part);
    if (normalized) emails.add(normalized);
  }

  return [...emails];
}

export function isAdminLoginEmail(email: string): boolean {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;
  return getAdminAllowlistEmails().includes(normalized);
}
