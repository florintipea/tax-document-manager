import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_LOCKOUT_ATTEMPTS,
  formatLockoutMessage,
  getAccountLockUntil,
  isAdminLoginEmail,
  normalizeAdminEmail,
} from '@/lib/auth/login-lockout';

describe('login lockout helpers', () => {
  it('returns null until threshold attempts', () => {
    expect(getAccountLockUntil(ACCOUNT_LOCKOUT_ATTEMPTS - 1)).toBeNull();
  });

  it('locks account at threshold', () => {
    const until = getAccountLockUntil(ACCOUNT_LOCKOUT_ATTEMPTS);
    expect(until).toBeInstanceOf(Date);
    expect(until!.getTime()).toBeGreaterThan(Date.now());
  });

  it('formats lockout message in German', () => {
    const until = new Date(Date.now() + 5 * 60 * 1000);
    const message = formatLockoutMessage(until);
    expect(message).toContain('Konto vorübergehend gesperrt');
  });

  it('normalizes admin email', () => {
    expect(normalizeAdminEmail('  Admin@Example.COM ')).toBe('admin@example.com');
    expect(normalizeAdminEmail(undefined)).toBeNull();
  });

  it('detects admin login email from env', () => {
    const original = process.env.ADMIN_EMAIL;
    const originalList = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAIL = 'admin@taxdoc.test';
    delete process.env.ADMIN_EMAILS;
    expect(isAdminLoginEmail('admin@taxdoc.test')).toBe(true);
    expect(isAdminLoginEmail('other@taxdoc.test')).toBe(false);
    process.env.ADMIN_EMAILS = 'extra@taxdoc.test, Second@TaxDoc.Test';
    expect(isAdminLoginEmail('extra@taxdoc.test')).toBe(true);
    expect(isAdminLoginEmail('second@taxdoc.test')).toBe(true);
    process.env.ADMIN_EMAIL = original;
    if (originalList === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = originalList;
  });
});
