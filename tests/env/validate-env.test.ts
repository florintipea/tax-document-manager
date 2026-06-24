import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { validateEnv } from '@/lib/utils/env';

describe('validateEnv', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'file:./test.db',
      NEXTAUTH_SECRET: 'a'.repeat(32),
      ENCRYPTION_KEY: 'b'.repeat(32),
      NODE_ENV: 'test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    expect(() => validateEnv()).toThrow(/DATABASE_URL/);
  });

  it('warns instead of throwing for missing NEXTAUTH_SECRET in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.NEXTAUTH_SECRET;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => validateEnv()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('NEXTAUTH_SECRET'));
  });
});
