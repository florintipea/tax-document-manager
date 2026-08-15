import { describe, expect, it } from 'vitest';
import { applyDiscountToAmount, type AppliedDiscount } from '@/lib/billing/discounts';

describe('applyDiscountToAmount', () => {
  it('applies percent off', () => {
    const d: AppliedDiscount = {
      kind: 'promo',
      label: 'Test',
      percentOff: 20,
      amountOff: null,
    };
    const r = applyDiscountToAmount(29.99, d);
    expect(r.final).toBe(23.99);
    expect(r.saved).toBe(6);
  });

  it('applies fixed amount after percent', () => {
    const d: AppliedDiscount = {
      kind: 'user',
      label: 'User',
      percentOff: 10,
      amountOff: 5,
    };
    const r = applyDiscountToAmount(100, d);
    expect(r.final).toBe(85);
  });

  it('leaves free / zero alone', () => {
    const d: AppliedDiscount = {
      kind: 'promo',
      label: 'X',
      percentOff: 50,
      amountOff: null,
    };
    expect(applyDiscountToAmount(0, d).final).toBe(0);
  });
});
