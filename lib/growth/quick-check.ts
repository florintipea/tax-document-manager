/**
 * Public Quick-Check estimates (Phase 1 growth).
 * Educational rough estimates only — not tax advice, not filing.
 */

import { DE_WERBUNGSKOSTEN_PAUSCH } from '@/lib/tax/country-config';

export type QuickCheckMode = 'arbeitnehmer' | 'grenzgaenger';

export type WorkCountry = 'CH' | 'AT' | 'OTHER';

export interface ArbeitnehmerInput {
  annualIncome: number;
  commuteKmOneWay: number;
  workDays: number;
  extraWerbungskosten: number;
}

export interface GrenzgaengerInput {
  workCountry: WorkCountry;
  foreignIncome: number;
  commuteKmOneWay: number;
  workDays: number;
}

export interface QuickCheckResult {
  mode: QuickCheckMode;
  /** Rough deductible Werbungskosten / commute-related (EUR) */
  estimatedDeductionEur: number;
  /** Rough tax effect at simplified marginal rate (EUR) — may be 0 */
  estimatedTaxEffectEur: number;
  marginalRateUsed: number;
  pauschbetragEur: number;
  commuteAllowanceEur: number;
  summaryKey: string;
  detailKeys: string[];
  /** Share-friendly one-liner (German) */
  shareSnippetDe: string;
}

const KM_RATE_FIRST = 0.3;
const KM_RATE_AFTER = 0.38;
const KM_THRESHOLD = 20;
const DEFAULT_WORK_DAYS = 230;

/** Simplified DE marginal rate by taxable income band (rough). */
export function roughMarginalRate(income: number): number {
  if (income <= 12096) return 0;
  if (income <= 17443) return 0.14;
  if (income <= 68480) return 0.24;
  if (income <= 277825) return 0.42;
  return 0.45;
}

export function commuteAllowanceEur(kmOneWay: number, workDays: number): number {
  const km = Math.max(0, kmOneWay);
  const days = Math.min(365, Math.max(0, workDays || DEFAULT_WORK_DAYS));
  if (km <= 0 || days <= 0) return 0;
  const first = Math.min(km, KM_THRESHOLD) * KM_RATE_FIRST;
  const rest = Math.max(0, km - KM_THRESHOLD) * KM_RATE_AFTER;
  return Math.round((first + rest) * days * 100) / 100;
}

export function estimateArbeitnehmer(input: ArbeitnehmerInput): QuickCheckResult {
  const income = Math.max(0, input.annualIncome || 0);
  const commute = commuteAllowanceEur(input.commuteKmOneWay, input.workDays);
  const extra = Math.max(0, input.extraWerbungskosten || 0);
  const itemized = commute + extra;
  const deduction = Math.max(DE_WERBUNGSKOSTEN_PAUSCH, itemized);
  const rate = roughMarginalRate(income);
  const taxEffect = Math.round(deduction * rate * 100) / 100;

  const usedPausch = deduction === DE_WERBUNGSKOSTEN_PAUSCH && itemized <= DE_WERBUNGSKOSTEN_PAUSCH;

  return {
    mode: 'arbeitnehmer',
    estimatedDeductionEur: deduction,
    estimatedTaxEffectEur: taxEffect,
    marginalRateUsed: rate,
    pauschbetragEur: DE_WERBUNGSKOSTEN_PAUSCH,
    commuteAllowanceEur: commute,
    summaryKey: usedPausch ? 'quickCheck.resultPausch' : 'quickCheck.resultItemized',
    detailKeys: [
      'quickCheck.detailSchaetzung',
      'quickCheck.detailNoAdvice',
      'quickCheck.detailMeinElster',
    ],
    shareSnippetDe: usedPausch
      ? `Meine TaxDoc-Schätzung: ~${formatEur(deduction)} Werbungskosten-Pauschale (unverbindlich). Steuer-Chaos verhindern →`
      : `Meine TaxDoc-Schätzung: ~${formatEur(deduction)} mögliche Werbungskosten (~${formatEur(taxEffect)} Steuer-Effekt grob). Unverbindlich →`,
  };
}

export function estimateGrenzgaenger(input: GrenzgaengerInput): QuickCheckResult {
  const foreign = Math.max(0, input.foreignIncome || 0);
  const commute = commuteAllowanceEur(input.commuteKmOneWay, input.workDays);
  const deduction = Math.max(DE_WERBUNGSKOSTEN_PAUSCH, commute);
  // Very rough: treat foreign employment income as DE-taxable base for estimate only
  const rate = roughMarginalRate(foreign);
  const taxEffect = Math.round(deduction * rate * 100) / 100;
  const countryLabel =
    input.workCountry === 'CH' ? 'CH' : input.workCountry === 'AT' ? 'AT' : 'Ausland';

  return {
    mode: 'grenzgaenger',
    estimatedDeductionEur: deduction,
    estimatedTaxEffectEur: taxEffect,
    marginalRateUsed: rate,
    pauschbetragEur: DE_WERBUNGSKOSTEN_PAUSCH,
    commuteAllowanceEur: commute,
    summaryKey: 'quickCheck.resultGrenzgaenger',
    detailKeys: [
      'quickCheck.detailGrenzDba',
      'quickCheck.detailSchaetzung',
      'quickCheck.detailNoAdvice',
    ],
    shareSnippetDe: `Grenzgänger (${countryLabel}) TaxDoc-Schätzung: ~${formatEur(deduction)} Pendel-/WK-Ansatz (~${formatEur(taxEffect)} grober Effekt). Unverbindliche Schätzung — Auslandsbelege vorbereiten →`,
  };
}

function formatEur(n: number): string {
  return `${n.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €`;
}

export function buildShareUrl(origin: string, mode: QuickCheckMode): string {
  const path = mode === 'grenzgaenger' ? '/grenzgaenger' : '/rechner';
  return `${origin.replace(/\/$/, '')}${path}?utm_source=share&utm_medium=quickcheck&utm_campaign=phase1`;
}
