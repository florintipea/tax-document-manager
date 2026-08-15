/**
 * Map Steuerprofil + TaxLines / Belege → Steuerrechner draft.
 * Unverbindlich — keine Garantie, bitte prüfen.
 */

import {
  createDefaultDeductions,
  type CrossBorderInput,
  type DeductionInput,
  type DEFilingMode,
  type RentalIncomeInput,
  type VorauszahlungInput,
} from '@/lib/tax/calculator';
import type { DeductionId, Steuerklasse } from '@/lib/tax/country-config';

export const CALCULATOR_AUTOFILL_DISCLAIMER_DE =
  'KI-Vorschlag aus Steuerprofil + Belegen — unverbindlich, bitte prüfen. Keine Steuerberatung, keine Auto-Abgabe.';

export interface TaxLineForCalculator {
  kind: string;
  category: string;
  amount: number;
  needsReview?: boolean;
}

export interface RentalForCalculator {
  grossRent: number;
  operatingCosts: number;
  werbungskosten?: number;
}

export interface ProfileForCalculator {
  country?: string | null;
  steuerklasse?: string | null;
  deFilingMode?: string | null;
  spouseIncome?: number | null;
  numberOfChildren?: number | null;
  hasRentalIncome?: boolean | null;
  isCrossBorder?: boolean | null;
  workCountry?: string | null;
}

export interface CalculatorAutofillDraft {
  income: string;
  taxWithheld: string;
  steuerklasse?: Steuerklasse;
  deFilingMode?: DEFilingMode;
  spouseIncome?: string;
  deductions: DeductionInput[];
  rental: RentalIncomeInput;
  crossBorder: CrossBorderInput;
  vorauszahlungen: VorauszahlungInput;
  showVorauszahlungen: boolean;
  sourceSummaryDe: string;
  needsReview: boolean;
  confidenceLabel: 'high' | 'medium' | 'low';
  disclaimerDe: string;
}

const DEDUCTION_MAP: Record<string, DeductionId> = {
  werbungskosten: 'werbungskosten',
  versicherung: 'vorsorgeaufwendungen',
  sonderausgaben: 'sonderausgaben',
  spenden: 'sonderausgaben',
  gesundheit: 'aussergewoehnliche_belastungen',
  agb: 'aussergewoehnliche_belastungen',
  homeoffice: 'homeoffice',
};

function sumBy(
  lines: TaxLineForCalculator[],
  pred: (l: TaxLineForCalculator) => boolean
): number {
  return lines
    .filter(pred)
    .reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);
}

export function buildCalculatorDraftFromBelege(opts: {
  profile: ProfileForCalculator;
  taxLines: TaxLineForCalculator[];
  rentals?: RentalForCalculator[];
  employmentIncomeHint?: number | null;
  taxWithheldHint?: number | null;
}): CalculatorAutofillDraft {
  const { profile, taxLines } = opts;
  const country = (profile.country || 'DE') as 'DE';
  const deductions = createDefaultDeductions(country);

  const gehalt = sumBy(
    taxLines,
    (l) => l.kind === 'income' && (l.category === 'gehalt' || l.category === 'income')
  );
  const kapital = sumBy(
    taxLines,
    (l) => l.category === 'kapital' || l.category === 'sonstige_einnahmen'
  );

  let income = gehalt;
  if (income <= 0 && opts.employmentIncomeHint && opts.employmentIncomeHint > 0) {
    income = opts.employmentIncomeHint;
  }
  // Annualize monthly-looking Gehaltsabrechnung sums if clearly < typical annual
  // (heuristic only — leave as-is; user reviews)

  const expenseBuckets = new Map<DeductionId, number>();
  for (const line of taxLines) {
    if (line.kind !== 'expense') continue;
    const dedId = DEDUCTION_MAP[line.category];
    if (!dedId) continue;
    expenseBuckets.set(dedId, (expenseBuckets.get(dedId) || 0) + line.amount);
  }

  const nextDeductions = deductions.map((d) => {
    const fromBelege = expenseBuckets.get(d.id);
    if (fromBelege != null && fromBelege > 0) {
      return { ...d, enabled: true, amount: Math.round(fromBelege * 100) / 100 };
    }
    if (d.id === 'kinderfreibetrag' && (profile.numberOfChildren || 0) > 0) {
      return {
        ...d,
        enabled: true,
        amount: profile.numberOfChildren || 0,
      };
    }
    return d;
  });

  const rentalSum = (opts.rentals || []).reduce(
    (acc, r) => ({
      grossRent: acc.grossRent + (r.grossRent || 0),
      operatingCosts: acc.operatingCosts + (r.operatingCosts || 0),
      werbungskosten: (acc.werbungskosten || 0) + (r.werbungskosten || 0),
    }),
    { grossRent: 0, operatingCosts: 0, werbungskosten: 0 }
  );

  const rentalEnabled =
    Boolean(profile.hasRentalIncome) ||
    rentalSum.grossRent > 0 ||
    rentalSum.operatingCosts > 0;

  const review =
    taxLines.some((l) => l.needsReview) ||
    income <= 0 ||
    (expenseBuckets.size > 0 && gehalt <= 0);

  let confidenceLabel: 'high' | 'medium' | 'low' = 'medium';
  if (gehalt > 0 && expenseBuckets.size > 0 && !review) confidenceLabel = 'high';
  if (gehalt <= 0 && expenseBuckets.size === 0) confidenceLabel = 'low';
  if (review) confidenceLabel = confidenceLabel === 'high' ? 'medium' : confidenceLabel;

  const parts: string[] = [];
  if (gehalt > 0) parts.push(`Gehalt/Belege ${gehalt.toLocaleString('de-DE')} €`);
  if (kapital > 0) parts.push(`sonst. Einnahmen ${kapital.toLocaleString('de-DE')} €`);
  if (expenseBuckets.size) parts.push(`${expenseBuckets.size} Abzugsarten`);
  if (rentalEnabled) parts.push('V&V');

  return {
    income: income > 0 ? String(Math.round(income * 100) / 100) : '',
    taxWithheld:
      opts.taxWithheldHint && opts.taxWithheldHint > 0
        ? String(Math.round(opts.taxWithheldHint * 100) / 100)
        : '',
    steuerklasse: (profile.steuerklasse as Steuerklasse) || 'I',
    deFilingMode: (profile.deFilingMode as DEFilingMode) || 'einzel',
    spouseIncome:
      profile.spouseIncome && profile.spouseIncome > 0
        ? String(profile.spouseIncome)
        : '',
    deductions: nextDeductions,
    rental: {
      enabled: rentalEnabled,
      grossRent: rentalSum.grossRent,
      operatingCosts: rentalSum.operatingCosts + (rentalSum.werbungskosten || 0),
      useFlatExpensePercent: false,
    },
    crossBorder: {
      enabled: Boolean(profile.isCrossBorder),
      workCountry: profile.workCountry || 'AT',
      residenceCountry: 'DE',
      foreignTaxPaid: 0,
      foreignIncome: 0,
    },
    vorauszahlungen: { q1: 0, q2: 0, q3: 0, q4: 0 },
    showVorauszahlungen: false,
    sourceSummaryDe: parts.length
      ? `Übernommen: ${parts.join(' · ')}`
      : 'Wenige Belegdaten — Profilwerte / manuelle Eingabe prüfen',
    needsReview: true, // always truthful
    confidenceLabel,
    disclaimerDe: CALCULATOR_AUTOFILL_DISCLAIMER_DE,
  };
}
