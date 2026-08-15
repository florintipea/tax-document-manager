import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS, CSP_CONNECT_SRC } from '@/lib/security/headers';

describe('security headers', () => {
  it('includes HSTS, CSP, nosniff, and frame options', () => {
    const map = Object.fromEntries(SECURITY_HEADERS.map((h) => [h.key, h.value]));
    expect(map['Strict-Transport-Security']).toContain('max-age=');
    expect(map['X-Content-Type-Options']).toBe('nosniff');
    expect(map['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(map['Content-Security-Policy']).toContain("default-src 'self'");
    expect(map['Content-Security-Policy']).toContain('upgrade-insecure-requests');
    expect(map['Referrer-Policy']).toBeTruthy();
    expect(map['Permissions-Policy']).toContain('camera=');
  });

  it('keeps connect-src allowlist non-empty', () => {
    expect(CSP_CONNECT_SRC.length).toBeGreaterThan(3);
    expect(CSP_CONNECT_SRC).toContain("'self'");
  });
});
