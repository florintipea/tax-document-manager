import { describe, expect, it } from 'vitest';
import { calculateTax, getMarginalRate } from '@/lib/tax/calculator';

describe('US tax calculator basics', () => {
  it('calculates positive tax for taxable income', () => {
    const tax = calculateTax(75000, 'single');
    expect(tax).toBeGreaterThan(0);
  });

  it('returns zero tax for zero income', () => {
    expect(calculateTax(0, 'single')).toBe(0);
  });

  it('returns marginal rate within bracket range', () => {
    const rate = getMarginalRate(50000, 'single');
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThanOrEqual(37);
  });
});
