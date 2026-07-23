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

export function isAdminLoginEmail(email: string): boolean {
  const adminEmail = normalizeAdminEmail(process.env.ADMIN_EMAIL);
  return adminEmail !== null && email === adminEmail;
}
