import { describe, expect, it } from 'vitest';
import {
  commuteAllowanceEur,
  estimateArbeitnehmer,
  estimateGrenzgaenger,
  roughMarginalRate,
} from '@/lib/growth/quick-check';
import { DE_WERBUNGSKOSTEN_PAUSCH } from '@/lib/tax/country-config';

describe('quick-check estimates', () => {
  it('uses pauschbetrag when commute is low', () => {
    const r = estimateArbeitnehmer({
      annualIncome: 45000,
      commuteKmOneWay: 5,
      workDays: 200,
      extraWerbungskosten: 0,
    });
    expect(r.estimatedDeductionEur).toBe(DE_WERBUNGSKOSTEN_PAUSCH);
    expect(r.summaryKey).toBe('quickCheck.resultPausch');
  });

  it('itemizes when commute exceeds pausch', () => {
    const commute = commuteAllowanceEur(40, 230);
    expect(commute).toBeGreaterThan(DE_WERBUNGSKOSTEN_PAUSCH);
    const r = estimateArbeitnehmer({
      annualIncome: 55000,
      commuteKmOneWay: 40,
      workDays: 230,
      extraWerbungskosten: 0,
    });
    expect(r.estimatedDeductionEur).toBe(commute);
    expect(r.summaryKey).toBe('quickCheck.resultItemized');
  });

  it('grenzgaenger returns labeled estimate', () => {
    const r = estimateGrenzgaenger({
      workCountry: 'CH',
      foreignIncome: 80000,
      commuteKmOneWay: 25,
      workDays: 220,
    });
    expect(r.mode).toBe('grenzgaenger');
    expect(r.estimatedDeductionEur).toBeGreaterThan(0);
    expect(r.shareSnippetDe).toContain('Schätzung');
  });

  it('rough marginal rate bands', () => {
    expect(roughMarginalRate(10000)).toBe(0);
    expect(roughMarginalRate(30000)).toBe(0.24);
  });
});
