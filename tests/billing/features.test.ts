import { describe, expect, it } from 'vitest';
import { tierMeetsRequirement } from '@/lib/billing/features';

describe('billing tier requirements', () => {
  it('orders tiers free < standard < advisor', () => {
    expect(tierMeetsRequirement('free', 'free')).toBe(true);
    expect(tierMeetsRequirement('free', 'standard')).toBe(false);
    expect(tierMeetsRequirement('standard', 'standard')).toBe(true);
    expect(tierMeetsRequirement('standard', 'advisor')).toBe(false);
    expect(tierMeetsRequirement('advisor', 'standard')).toBe(true);
    expect(tierMeetsRequirement('advisor', 'advisor')).toBe(true);
  });
});
