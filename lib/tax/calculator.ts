import {
  type TaxCountryCode,
  type CAProvinceCode,
  type Steuerklasse,
  type USFilingStatus,
  type DeductionId,
  getCountryConfig,
  US_STANDARD_DEDUCTION,
  DE_GRUNDFREIBETRAG,
  DE_ALLEINERZIEHENDE_BONUS,
  DE_KINDERFREIBETRAG,
  DE_KINDERFREIBETRAG_MAX_CHILDREN,
  DE_AFA_DEFAULT_RATE,
  DE_RENTAL_FLAT_EXPENSE_PERCENT,
  DE_WERBUNGSKOSTEN_PAUSCH,
  DE_HOMEOFFICE_MAX,
  DE_ENTFERNUNGSPAUSCHALE_EXAMPLE,
  CA_FEDERAL_BRACKETS,
  CA_PROVINCIAL_BRACKETS,
  CA_BASIC_PERSONAL_AMOUNT,
} from './country-config';

export type FilingStatus = USFilingStatus;

/** German annual return filing: Einzelveranlagung vs Zusammenveranlagung */
export type DEFilingMode = 'einzel' | 'zusammen';

export interface SplittingComparison {
  /** Combined tax if each spouse filed separately (Einzelveranlagung) */
  separateTaxTotal: number;
  /** Tax under joint filing with Ehegattensplitting */
  jointTax: number;
  /** separateTaxTotal − jointTax (positive = joint filing saves tax) */
  savingsFromJointFiling: number;
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface DeductionInput {
  id: DeductionId;
  enabled: boolean;
  amount: number;
}

export interface VorauszahlungInput {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

export interface CrossBorderInput {
  enabled: boolean;
  workCountry: string;
  residenceCountry: string;
  foreignTaxPaid: number;
  /** Portion of employment income earned abroad (simplified credit base) */
  foreignIncome?: number;
}

export interface RentalIncomeInput {
  enabled: boolean;
  grossRent: number;
  operatingCosts: number;
  numberOfUnits?: number;
  buildingValue?: number;
  afaRate?: number;
  useFlatExpensePercent?: boolean;
  flatExpensePercent?: number;
}

export interface TaxCalculationInput {
  country: TaxCountryCode;
  income: number;
  taxWithheld: number;
  year: number;
  filingStatus?: USFilingStatus;
  steuerklasse?: Steuerklasse;
  /** CA: province for provincial tax estimate */
  caProvince?: CAProvinceCode;
  /** DE: Einzelveranlagung (single) or Zusammenveranlagung (married joint return) */
  deFilingMode?: DEFilingMode;
  /** DE Zusammenveranlagung: spouse annual employment income */
  spouseIncome?: number;
  /** DE Zusammenveranlagung: spouse tax withheld (optional) */
  spouseTaxWithheld?: number;
  /** DE Zusammenveranlagung: spouse deductions (Werbungskosten, etc.) */
  spouseDeductions?: DeductionInput[];
  deductions: DeductionInput[];
  vorauszahlungen?: VorauszahlungInput;
  crossBorder?: CrossBorderInput;
  rental?: RentalIncomeInput;
}

export interface IncomeBreakdown {
  employment: number;
  rentalGross: number;
  rentalExpenses: number;
  rentalProfit: number;
  total: number;
}

export interface VorauszahlungSummary {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  total: number;
  /** Positive = Nachzahlung (additional payment due) */
  nachzahlung: number;
  /** Positive = Erstattung (refund from advance payments) */
  erstattung: number;
}

export interface OptimizationHint {
  id: string;
  labelKey: string;
  descriptionKey: string;
  categoryKey: string;
  /** Estimated tax savings in EUR; null = educational only */
  estimatedSavingsEur: number | null;
  rank: number;
}

export interface SavingsSummary {
  taxBeforeDeductions: number;
  taxAfterDeductions: number;
  savingsFromDeductions: number;
  incomeBreakdown: IncomeBreakdown;
  foreignTaxCredit?: number;
  vorauszahlungen?: VorauszahlungSummary;
  /** Present when Zusammenveranlagung with spouse income */
  splittingComparison?: SplittingComparison;
  tipKeys: string[];
  optimizationHints: OptimizationHint[];
}

export interface TaxBreakdownRow {
  bracket: string;
  amount: number;
  tax: number;
  rate?: number;
}

export interface AppliedDeduction {
  id: DeductionId;
  labelKey: string;
  amount: number;
}

export interface TaxCalculationResult {
  country: TaxCountryCode;
  currency: string;
  currencySymbol: string;
  mode: 'full' | 'stub';
  isEstimate: true;
  disclaimerKey: string;
  taxableIncome: number;
  totalDeductions: number;
  appliedDeductions: AppliedDeduction[];
  taxOwed: number;
  churchTax?: number;
  taxWithheld: number;
  refundOrOwed: number;
  effectiveRate: number;
  marginalRate: number;
  breakdown: TaxBreakdownRow[];
  isRefund: boolean;
  steuerklasse?: Steuerklasse;
  deFilingMode?: DEFilingMode;
  filingStatus?: USFilingStatus;
  caProvince?: CAProvinceCode;
  savings?: SavingsSummary;
}

// ─── US brackets (2024) ───────────────────────────────────────────────────────

export const TAX_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 11000, rate: 0.1 },
    { min: 11000, max: 44725, rate: 0.12 },
    { min: 44725, max: 95350, rate: 0.22 },
    { min: 95350, max: 201050, rate: 0.24 },
    { min: 201050, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married: [
    { min: 0, max: 22000, rate: 0.1 },
    { min: 22000, max: 89450, rate: 0.12 },
    { min: 89450, max: 190750, rate: 0.22 },
    { min: 190750, max: 364200, rate: 0.24 },
    { min: 364200, max: 462500, rate: 0.32 },
    { min: 462500, max: 693750, rate: 0.35 },
    { min: 693750, max: Infinity, rate: 0.37 },
  ],
  headOfHousehold: [
    { min: 0, max: 15700, rate: 0.1 },
    { min: 15700, max: 59850, rate: 0.12 },
    { min: 59850, max: 95350, rate: 0.22 },
    { min: 95350, max: 201050, rate: 0.24 },
    { min: 201050, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
};

// ─── German brackets (2024 simplified progressive tariff) ─────────────────────

const DE_BRACKETS_SINGLE: TaxBracket[] = [
  { min: 0, max: 11604, rate: 0 },
  { min: 11604, max: 17005, rate: 0.14 },
  { min: 17005, max: 66760, rate: 0.24 },
  { min: 66760, max: 277825, rate: 0.42 },
  { min: 277825, max: Infinity, rate: 0.45 },
];

const DE_BRACKETS_MARRIED: TaxBracket[] = [
  { min: 0, max: 23208, rate: 0 },
  { min: 23208, max: 34010, rate: 0.14 },
  { min: 34010, max: 133520, rate: 0.24 },
  { min: 133520, max: 555650, rate: 0.42 },
  { min: 555650, max: Infinity, rate: 0.45 },
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calculateBracketTax(income: number, brackets: TaxBracket[]): {
  tax: number;
  breakdown: TaxBreakdownRow[];
  marginalRate: number;
} {
  let tax = 0;
  let remaining = income;
  const breakdown: TaxBreakdownRow[] = [];
  let marginalRate = 0;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const width = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remaining, width);
    const taxInBracket = taxableInBracket * bracket.rate;
    tax += taxInBracket;

    if (taxableInBracket > 0) {
      marginalRate = bracket.rate * 100;
      breakdown.push({
        bracket:
          bracket.max === Infinity
            ? `${bracket.min.toLocaleString()}+`
            : `${bracket.min.toLocaleString()} – ${bracket.max.toLocaleString()}`,
        amount: round2(taxableInBracket),
        tax: round2(taxInBracket),
        rate: bracket.rate * 100,
      });
    }
    remaining -= taxableInBracket;
  }

  return { tax: round2(tax), breakdown, marginalRate };
}

export function getMarginalRate(income: number, filingStatus: FilingStatus): number {
  const brackets = TAX_BRACKETS[filingStatus];
  for (const bracket of brackets) {
    if (income >= bracket.min && income < bracket.max) {
      return bracket.rate * 100;
    }
  }
  return 37;
}

function buildAppliedDeductions(
  deductions: DeductionInput[],
  amounts: Map<DeductionId, number>
): AppliedDeduction[] {
  const config = getCountryConfig('DE');
  const allDeductions = [...config.deductions];
  const usConfig = getCountryConfig('US');
  allDeductions.push(...usConfig.deductions);

  return deductions
    .filter((d) => d.enabled && (amounts.get(d.id) ?? 0) > 0)
    .map((d) => {
      const meta = allDeductions.find((x) => x.id === d.id);
      return {
        id: d.id,
        labelKey: meta?.labelKey ?? d.id,
        amount: amounts.get(d.id) ?? 0,
      };
    });
}

function resolveGermanAllowance(steuerklasse: Steuerklasse): {
  brackets: TaxBracket[];
  allowance: number;
  useSplitting: boolean;
} {
  switch (steuerklasse) {
    case 'II':
      return {
        brackets: DE_BRACKETS_SINGLE,
        allowance: DE_GRUNDFREIBETRAG + DE_ALLEINERZIEHENDE_BONUS,
        useSplitting: false,
      };
    case 'III':
      return {
        brackets: DE_BRACKETS_MARRIED,
        allowance: DE_GRUNDFREIBETRAG * 2,
        useSplitting: true,
      };
    case 'VI':
      return {
        brackets: DE_BRACKETS_SINGLE,
        allowance: 0,
        useSplitting: false,
      };
    case 'I':
    case 'IV':
    case 'V':
    default:
      return {
        brackets: DE_BRACKETS_SINGLE,
        allowance: DE_GRUNDFREIBETRAG,
        useSplitting: false,
      };
  }
}

function estimateTaxSavingsFromDeduction(
  deductionAmount: number,
  marginalRatePercent: number
): number {
  if (deductionAmount <= 0 || marginalRatePercent <= 0) return 0;
  return round2(deductionAmount * (marginalRatePercent / 100));
}

function generateOptimizationHints(
  input: TaxCalculationInput,
  marginalRatePercent: number,
  deductions: DeductionInput[]
): OptimizationHint[] {
  const hints: OptimizationHint[] = [];
  const isEnabled = (id: DeductionId) =>
    deductions.some((d) => d.id === id && d.enabled);

  const addHint = (
    id: string,
    labelKey: string,
    descriptionKey: string,
    categoryKey: string,
    deductionEstimate: number | null
  ) => {
    hints.push({
      id,
      labelKey,
      descriptionKey,
      categoryKey,
      estimatedSavingsEur:
        deductionEstimate !== null
          ? estimateTaxSavingsFromDeduction(deductionEstimate, marginalRatePercent)
          : null,
      rank: 0,
    });
  };

  if (!isEnabled('werbungskosten')) {
    addHint(
      'werbungskosten',
      'hintWerbungskosten',
      'hintWerbungskostenDesc',
      'categoryWerbungskosten',
      DE_WERBUNGSKOSTEN_PAUSCH
    );
  }
  if (!isEnabled('entfernungspauschale')) {
    addHint(
      'entfernungspauschale',
      'hintEntfernungspauschale',
      'hintEntfernungspauschaleDesc',
      'categoryWerbungskosten',
      DE_ENTFERNUNGSPAUSCHALE_EXAMPLE
    );
  }
  if (!isEnabled('homeoffice')) {
    addHint(
      'homeoffice',
      'hintHomeoffice',
      'hintHomeofficeDesc',
      'categoryWerbungskosten',
      DE_HOMEOFFICE_MAX
    );
  }
  if (!isEnabled('vorsorgeaufwendungen')) {
    addHint(
      'vorsorgeaufwendungen',
      'hintVorsorge',
      'hintVorsorgeDesc',
      'categorySonderausgaben',
      null
    );
  }
  if (!isEnabled('sonderausgaben')) {
    addHint(
      'sonderausgaben',
      'hintSonderausgaben',
      'hintSonderausgabenDesc',
      'categorySonderausgaben',
      null
    );
  }
  if (!isEnabled('kinderfreibetrag')) {
    addHint(
      'kinderfreibetrag',
      'hintKinderfreibetrag',
      'hintKinderfreibetragDesc',
      'categoryFamily',
      DE_KINDERFREIBETRAG
    );
  }
  addHint('kindergeld', 'hintKindergeld', 'hintKindergeldDesc', 'categoryFamily', null);
  addHint('riester', 'hintRiester', 'hintRiesterDesc', 'categoryPension', null);
  addHint('ruerup', 'hintRuerup', 'hintRuerupDesc', 'categoryPension', null);

  if (input.crossBorder?.enabled && input.crossBorder.foreignTaxPaid === 0) {
    addHint(
      'foreignTaxCredit',
      'hintForeignTaxCredit',
      'hintForeignTaxCreditDesc',
      'categoryCrossBorder',
      null
    );
  } else if (!input.crossBorder?.enabled) {
    addHint(
      'grenzgaenger',
      'hintGrenzgaenger',
      'hintGrenzgaengerDesc',
      'categoryCrossBorder',
      null
    );
  }

  if (input.rental?.enabled) {
    if (!input.rental.useFlatExpensePercent && !input.rental.buildingValue) {
      addHint(
        'rentalAfa',
        'hintRentalAfa',
        'hintRentalAfaDesc',
        'categoryRental',
        input.rental.grossRent > 0
          ? round2(input.rental.grossRent * (DE_AFA_DEFAULT_RATE / 100))
          : null
      );
    }
  } else {
    addHint('vermietung', 'hintVermietung', 'hintVermietungDesc', 'categoryRental', null);
  }

  if (input.vorauszahlungen) {
    const total = round2(
      input.vorauszahlungen.q1 +
        input.vorauszahlungen.q2 +
        input.vorauszahlungen.q3 +
        input.vorauszahlungen.q4
    );
    if (total === 0) {
      addHint(
        'vorauszahlungen',
        'hintVorauszahlungen',
        'hintVorauszahlungenDesc',
        'categoryVorauszahlungen',
        null
      );
    }
  }

  const marriedSteuerklassen: Steuerklasse[] = ['III', 'IV', 'V'];
  const steuerklasse = input.steuerklasse ?? 'I';
  if (
    input.deFilingMode !== 'zusammen' &&
    marriedSteuerklassen.includes(steuerklasse)
  ) {
    addHint(
      'zusammenveranlagung',
      'hintZusammenveranlagung',
      'hintZusammenveranlagungDesc',
      'categoryFamily',
      null
    );
  } else if (input.deFilingMode === 'zusammen') {
    addHint(
      'ehegattensplitting',
      'hintEhegattensplitting',
      'hintEhegattensplittingDesc',
      'categoryFamily',
      null
    );
  }

  hints.sort((a, b) => {
    const aVal = a.estimatedSavingsEur ?? -1;
    const bVal = b.estimatedSavingsEur ?? -1;
    return bVal - aVal;
  });

  return hints.map((h, idx) => ({ ...h, rank: idx + 1 }));
}

function computeRentalProfit(rental?: RentalIncomeInput): {
  gross: number;
  expenses: number;
  profit: number;
} {
  if (!rental?.enabled || rental.grossRent <= 0) {
    return { gross: 0, expenses: 0, profit: 0 };
  }

  let expenses = rental.operatingCosts;
  if (rental.useFlatExpensePercent) {
    const pct = rental.flatExpensePercent ?? DE_RENTAL_FLAT_EXPENSE_PERCENT;
    expenses = rental.grossRent * (pct / 100);
  } else if (rental.buildingValue && rental.buildingValue > 0) {
    const rate = rental.afaRate ?? DE_AFA_DEFAULT_RATE;
    expenses += rental.buildingValue * (rate / 100);
  }

  const profit = Math.max(0, rental.grossRent - expenses);
  return {
    gross: rental.grossRent,
    expenses: round2(expenses),
    profit: round2(profit),
  };
}

function computeGermanDeductions(
  deductions: DeductionInput[],
  config: ReturnType<typeof getCountryConfig>
): { totalDeductions: number; deductionAmounts: Map<DeductionId, number> } {
  const deductionAmounts = new Map<DeductionId, number>();
  let totalDeductions = 0;

  for (const d of deductions) {
    if (!d.enabled) continue;
    const meta = config.deductions.find((x) => x.id === d.id);
    if (!meta) continue;

    let amount = d.amount;
    if (meta.type === 'checkbox' && meta.defaultAmount && amount === 0) {
      amount = meta.defaultAmount;
    }
    if (meta.maxAmount !== undefined) {
      amount = Math.min(amount, meta.maxAmount);
    }
    if (d.id === 'kirchensteuer') continue;

    if (d.id === 'kinderfreibetrag') {
      const childCount = Math.min(
        DE_KINDERFREIBETRAG_MAX_CHILDREN,
        Math.max(1, Math.round(d.amount || 1))
      );
      amount = DE_KINDERFREIBETRAG * childCount;
    }

    deductionAmounts.set(d.id, (deductionAmounts.get(d.id) ?? 0) + amount);
    totalDeductions += amount;
  }

  return { totalDeductions, deductionAmounts };
}

function computeGermanIncomeTax(
  taxableIncome: number,
  brackets: TaxBracket[],
  applySplitting: boolean
): { taxOwed: number; breakdown: TaxBreakdownRow[]; marginalRate: number } {
  if (applySplitting) {
    const halfIncome = taxableIncome / 2;
    const halfResult = calculateBracketTax(halfIncome, brackets);
    return {
      taxOwed: round2(halfResult.tax * 2),
      breakdown: halfResult.breakdown.map((row) => ({
        ...row,
        tax: round2(row.tax * 2),
        bracket: `${row.bracket} (×2 Ehegattensplitting)`,
      })),
      marginalRate: halfResult.marginalRate,
    };
  }

  const result = calculateBracketTax(taxableIncome, brackets);
  return {
    taxOwed: result.tax,
    breakdown: result.breakdown,
    marginalRate: result.marginalRate,
  };
}

interface GermanTaxCoreResult {
  totalIncome: number;
  totalDeductions: number;
  deductionAmounts: Map<DeductionId, number>;
  taxableIncome: number;
  taxOwed: number;
  breakdown: TaxBreakdownRow[];
  marginalRate: number;
  allowance: number;
}

function computeGermanTaxCore(params: {
  employmentIncome: number;
  rentalProfit: number;
  deductions: DeductionInput[];
  steuerklasse: Steuerklasse;
  config: ReturnType<typeof getCountryConfig>;
  /** Zusammenveranlagung: combined household income with Ehegattensplitting */
  jointFiling?: boolean;
}): GermanTaxCoreResult {
  const { employmentIncome, rentalProfit, deductions, steuerklasse, config, jointFiling } =
    params;

  const totalIncome = round2(employmentIncome + rentalProfit);
  const { totalDeductions, deductionAmounts } = computeGermanDeductions(
    deductions,
    config
  );

  let brackets: TaxBracket[];
  let allowance: number;
  let applySplitting: boolean;

  if (jointFiling) {
    brackets = DE_BRACKETS_MARRIED;
    allowance = DE_GRUNDFREIBETRAG * 2;
    applySplitting = true;
  } else {
    const resolved = resolveGermanAllowance(steuerklasse);
    brackets = resolved.brackets;
    allowance = resolved.allowance;
    applySplitting = resolved.useSplitting;
  }

  const taxableBeforeAllowance = Math.max(0, totalIncome - totalDeductions);
  const taxableIncome = Math.max(0, taxableBeforeAllowance - allowance);

  const { taxOwed, breakdown, marginalRate } = computeGermanIncomeTax(
    taxableIncome,
    brackets,
    applySplitting
  );

  return {
    totalIncome,
    totalDeductions,
    deductionAmounts,
    taxableIncome,
    taxOwed,
    breakdown,
    marginalRate,
    allowance,
  };
}

function computeSeparateFilingTax(params: {
  primaryIncome: number;
  primaryDeductions: DeductionInput[];
  spouseIncome: number;
  spouseDeductions: DeductionInput[];
  rentalProfit: number;
  config: ReturnType<typeof getCountryConfig>;
}): number {
  const primaryCore = computeGermanTaxCore({
    employmentIncome: params.primaryIncome,
    rentalProfit: params.rentalProfit,
    deductions: params.primaryDeductions,
    steuerklasse: 'I',
    config: params.config,
  });
  const spouseCore = computeGermanTaxCore({
    employmentIncome: params.spouseIncome,
    rentalProfit: 0,
    deductions: params.spouseDeductions,
    steuerklasse: 'I',
    config: params.config,
  });
  return round2(primaryCore.taxOwed + spouseCore.taxOwed);
}

function generateSavingsTips(
  deductions: DeductionInput[],
  crossBorder?: CrossBorderInput,
  rental?: RentalIncomeInput
): string[] {
  const tips: string[] = [];
  const isEnabled = (id: DeductionId) =>
    deductions.some((d) => d.id === id && d.enabled);

  if (!isEnabled('werbungskosten')) {
    tips.push('tipWerbungskosten');
  }
  if (!isEnabled('homeoffice')) {
    tips.push('tipHomeoffice');
  }
  if (crossBorder?.enabled && !isEnabled('entfernungspauschale')) {
    tips.push('tipCommuting');
  }
  if (!isEnabled('kinderfreibetrag')) {
    tips.push('tipKinderfreibetrag');
  }
  if (rental?.enabled && !rental.useFlatExpensePercent && !rental.buildingValue) {
    tips.push('tipRentalAfa');
  }
  if (rental?.enabled && rental.operatingCosts === 0) {
    tips.push('tipRentalExpenses');
  }
  if (crossBorder?.enabled && crossBorder.foreignTaxPaid === 0) {
    tips.push('tipForeignTaxCredit');
  }

  return tips;
}

function calculateGermanTax(input: TaxCalculationInput): TaxCalculationResult {
  const config = getCountryConfig('DE');
  const steuerklasse = input.steuerklasse ?? 'I';
  const deFilingMode = input.deFilingMode ?? 'einzel';
  const spouseIncome = input.spouseIncome ?? 0;
  const spouseDeductions = input.spouseDeductions ?? [];
  const isJointFiling = deFilingMode === 'zusammen' && spouseIncome > 0;

  const rental = computeRentalProfit(input.rental);

  let core: GermanTaxCoreResult;
  let combinedEmploymentIncome: number;
  let combinedDeductions: DeductionInput[];
  let combinedDeductionAmounts: Map<DeductionId, number>;

  if (isJointFiling) {
    combinedEmploymentIncome = round2(input.income + spouseIncome);
    combinedDeductions = [...input.deductions, ...spouseDeductions];
    core = computeGermanTaxCore({
      employmentIncome: combinedEmploymentIncome,
      rentalProfit: rental.profit,
      deductions: combinedDeductions,
      steuerklasse,
      config,
      jointFiling: true,
    });
    combinedDeductionAmounts = core.deductionAmounts;
  } else {
    combinedEmploymentIncome = input.income;
    combinedDeductions = input.deductions;
    core = computeGermanTaxCore({
      employmentIncome: input.income,
      rentalProfit: rental.profit,
      deductions: input.deductions,
      steuerklasse,
      config,
    });
    combinedDeductionAmounts = core.deductionAmounts;
  }

  const { taxableIncome, breakdown, marginalRate } = core;
  let taxOwed = core.taxOwed;
  const totalIncome = core.totalIncome;
  const totalDeductions = core.totalDeductions;

  let foreignTaxCredit: number | undefined;

  if (input.crossBorder?.enabled && input.crossBorder.foreignTaxPaid > 0) {
    const foreignIncome =
      input.crossBorder.foreignIncome ?? input.income;
    const foreignShare = totalIncome > 0 ? foreignIncome / totalIncome : 0;
    const estimatedForeignTax = round2(taxOwed * foreignShare);
    foreignTaxCredit = round2(
      Math.min(input.crossBorder.foreignTaxPaid, estimatedForeignTax)
    );
    taxOwed = round2(Math.max(0, taxOwed - foreignTaxCredit));
  }

  let churchTax: number | undefined;
  const kirchensteuerEnabled = input.deductions.some(
    (d) => d.id === 'kirchensteuer' && d.enabled
  );
  if (kirchensteuerEnabled) {
    churchTax = round2(taxOwed * 0.09);
    taxOwed = round2(taxOwed + churchTax);
  }

  const taxBeforeCore = computeGermanTaxCore({
    employmentIncome: isJointFiling ? combinedEmploymentIncome : input.income,
    rentalProfit: rental.profit,
    deductions: [],
    steuerklasse,
    config,
    jointFiling: isJointFiling,
  });
  let taxBeforeDeductions = taxBeforeCore.taxOwed;
  if (kirchensteuerEnabled) {
    taxBeforeDeductions = round2(taxBeforeDeductions * 1.09);
  }

  let splittingComparison: SplittingComparison | undefined;
  if (isJointFiling) {
    const separateTaxTotal = computeSeparateFilingTax({
      primaryIncome: input.income,
      primaryDeductions: input.deductions,
      spouseIncome,
      spouseDeductions,
      rentalProfit: rental.profit,
      config,
    });
    let jointTaxForCompare = core.taxOwed;
    if (kirchensteuerEnabled) {
      jointTaxForCompare = round2(jointTaxForCompare * 1.09);
    }
    splittingComparison = {
      separateTaxTotal,
      jointTax: jointTaxForCompare,
      savingsFromJointFiling: round2(separateTaxTotal - jointTaxForCompare),
    };
  }

  let vorauszahlungSummary: VorauszahlungSummary | undefined;
  const totalTaxWithheld = round2(
    input.taxWithheld + (input.spouseTaxWithheld ?? 0)
  );
  if (input.vorauszahlungen) {
    const { q1, q2, q3, q4 } = input.vorauszahlungen;
    const total = round2(q1 + q2 + q3 + q4);
    const balance = round2(taxOwed - total);
    vorauszahlungSummary = {
      q1: round2(q1),
      q2: round2(q2),
      q3: round2(q3),
      q4: round2(q4),
      total,
      nachzahlung: balance > 0 ? balance : 0,
      erstattung: balance < 0 ? round2(-balance) : 0,
    };
  }

  const savings: SavingsSummary = {
    taxBeforeDeductions: round2(taxBeforeDeductions),
    taxAfterDeductions: taxOwed,
    savingsFromDeductions: round2(Math.max(0, taxBeforeDeductions - taxOwed)),
    incomeBreakdown: {
      employment: round2(isJointFiling ? combinedEmploymentIncome : input.income),
      rentalGross: rental.gross,
      rentalExpenses: rental.expenses,
      rentalProfit: rental.profit,
      total: totalIncome,
    },
    foreignTaxCredit,
    vorauszahlungen: vorauszahlungSummary,
    splittingComparison,
    tipKeys: generateSavingsTips(input.deductions, input.crossBorder, input.rental),
    optimizationHints: generateOptimizationHints(
      input,
      marginalRate,
      combinedDeductions
    ),
  };

  const refundOrOwed = totalTaxWithheld - taxOwed;

  return {
    country: 'DE',
    currency: config.currency,
    currencySymbol: config.currencySymbol,
    mode: 'full',
    isEstimate: true,
    disclaimerKey: 'disclaimer',
    taxableIncome: round2(taxableIncome),
    totalDeductions: round2(totalDeductions),
    appliedDeductions: buildAppliedDeductions(combinedDeductions, combinedDeductionAmounts),
    taxOwed,
    churchTax,
    taxWithheld: totalTaxWithheld,
    refundOrOwed: round2(refundOrOwed),
    effectiveRate: totalIncome > 0 ? round2((taxOwed / totalIncome) * 100) : 0,
    marginalRate,
    breakdown,
    isRefund: refundOrOwed > 0,
    steuerklasse,
    deFilingMode,
    savings,
  };
}

function calculateUSTax(input: TaxCalculationInput): TaxCalculationResult {
  const config = getCountryConfig('US');
  const filingStatus = input.filingStatus ?? 'single';
  const deductionAmounts = new Map<DeductionId, number>();
  let totalDeductions = 0;

  const useStandard = input.deductions.some(
    (d) => d.id === 'standardDeduction' && d.enabled
  );
  if (useStandard) {
    const stdAmount = US_STANDARD_DEDUCTION[filingStatus];
    deductionAmounts.set('standardDeduction', stdAmount);
    totalDeductions += stdAmount;
  }

  for (const d of input.deductions) {
    if (!d.enabled || d.id === 'standardDeduction') continue;
    const meta = config.deductions.find((x) => x.id === d.id);
    if (!meta) continue;

    let amount = d.amount;
    if (meta.maxAmount !== undefined) {
      amount = Math.min(amount, meta.maxAmount);
    }

    if (d.id === 'medicalExpenses') {
      const threshold = input.income * 0.075;
      amount = Math.max(0, amount - threshold);
    }

    if (amount > 0) {
      deductionAmounts.set(d.id, amount);
      totalDeductions += amount;
    }
  }

  const taxableIncome = Math.max(0, input.income - totalDeductions);
  const brackets = TAX_BRACKETS[filingStatus];
  const { tax: taxOwed, breakdown, marginalRate } = calculateBracketTax(
    taxableIncome,
    brackets
  );
  const refundOrOwed = input.taxWithheld - taxOwed;

  return {
    country: 'US',
    currency: config.currency,
    currencySymbol: config.currencySymbol,
    mode: 'full',
    isEstimate: true,
    disclaimerKey: 'disclaimer',
    taxableIncome: round2(taxableIncome),
    totalDeductions: round2(totalDeductions),
    appliedDeductions: buildAppliedDeductions(input.deductions, deductionAmounts),
    taxOwed,
    taxWithheld: input.taxWithheld,
    refundOrOwed: round2(refundOrOwed),
    effectiveRate: input.income > 0 ? round2((taxOwed / input.income) * 100) : 0,
    marginalRate,
    breakdown,
    isRefund: refundOrOwed > 0,
    filingStatus,
  };
}

function calculateCATax(input: TaxCalculationInput): TaxCalculationResult {
  const config = getCountryConfig('CA');
  const province: CAProvinceCode = input.caProvince ?? 'ON';
  const taxableIncome = Math.max(0, input.income - CA_BASIC_PERSONAL_AMOUNT);

  const federal = calculateBracketTax(taxableIncome, [...CA_FEDERAL_BRACKETS]);
  const provincial = calculateBracketTax(
    taxableIncome,
    [...CA_PROVINCIAL_BRACKETS[province]]
  );

  const taxOwed = round2(federal.tax + provincial.tax);
  const breakdown: TaxBreakdownRow[] = [
    ...federal.breakdown.map((row) => ({
      ...row,
      bracket: `Federal ${row.bracket}`,
    })),
    ...provincial.breakdown.map((row) => ({
      ...row,
      bracket: `${province} ${row.bracket}`,
    })),
  ];
  const marginalRate = Math.max(federal.marginalRate, provincial.marginalRate);
  const refundOrOwed = input.taxWithheld - taxOwed;

  return {
    country: 'CA',
    currency: config.currency,
    currencySymbol: config.currencySymbol,
    mode: 'full',
    isEstimate: true,
    disclaimerKey: 'caDisclaimer',
    taxableIncome: round2(taxableIncome),
    totalDeductions: round2(CA_BASIC_PERSONAL_AMOUNT),
    appliedDeductions: [
      {
        id: 'standardDeduction' as DeductionId,
        labelKey: 'caBasicPersonalAmount',
        amount: CA_BASIC_PERSONAL_AMOUNT,
      },
    ],
    taxOwed,
    taxWithheld: input.taxWithheld,
    refundOrOwed: round2(refundOrOwed),
    effectiveRate: input.income > 0 ? round2((taxOwed / input.income) * 100) : 0,
    marginalRate,
    breakdown,
    isRefund: refundOrOwed > 0,
    filingStatus: input.filingStatus,
    caProvince: province,
  };
}

function calculateStubTax(input: TaxCalculationInput): TaxCalculationResult {
  const config = getCountryConfig(input.country);
  const rate = config.stubRate ?? 0.25;
  const taxableIncome = input.income;
  const taxOwed = round2(taxableIncome * rate);
  const refundOrOwed = input.taxWithheld - taxOwed;

  return {
    country: input.country,
    currency: config.currency,
    currencySymbol: config.currencySymbol,
    mode: 'stub',
    isEstimate: true,
    disclaimerKey: 'disclaimer',
    taxableIncome: round2(taxableIncome),
    totalDeductions: 0,
    appliedDeductions: [],
    taxOwed,
    taxWithheld: input.taxWithheld,
    refundOrOwed: round2(refundOrOwed),
    effectiveRate: input.income > 0 ? round2(rate * 100) : 0,
    marginalRate: round2(rate * 100),
    breakdown: [
      {
        bracket: `Flat ${round2(rate * 100)}% (estimate)`,
        amount: round2(taxableIncome),
        tax: taxOwed,
        rate: round2(rate * 100),
      },
    ],
    isRefund: refundOrOwed > 0,
  };
}

export function calculateCountryTax(input: TaxCalculationInput): TaxCalculationResult {
  switch (input.country) {
    case 'DE':
      return calculateGermanTax(input);
    case 'US':
      return calculateUSTax(input);
    case 'CA':
      return calculateCATax(input);
    case 'RO':
    case 'ES':
    case 'GR':
    case 'AT':
    case 'CH':
      return calculateStubTax(input);
    default:
      return calculateGermanTax({ ...input, country: 'DE' });
  }
}

/** @deprecated Use calculateCountryTax */
export function calculateTaxSummary(input: {
  income: number;
  deductions: number;
  taxWithheld: number;
  filingStatus: FilingStatus;
}): TaxCalculationResult {
  return calculateCountryTax({
    country: 'US',
    income: input.income,
    taxWithheld: input.taxWithheld,
    year: new Date().getFullYear(),
    filingStatus: input.filingStatus,
    deductions: [
      { id: 'standardDeduction', enabled: false, amount: 0 },
      { id: 'mortgageInterest', enabled: true, amount: input.deductions },
    ],
  });
}

export function calculateTax(income: number, filingStatus: FilingStatus): number {
  const brackets = TAX_BRACKETS[filingStatus];
  return calculateBracketTax(income, brackets).tax;
}

export function getTaxBreakdown(income: number, filingStatus: FilingStatus) {
  return calculateBracketTax(income, TAX_BRACKETS[filingStatus]).breakdown;
}

export function createDefaultDeductions(country: TaxCountryCode): DeductionInput[] {
  const config = getCountryConfig(country);
  return config.deductions.map((d) => ({
    id: d.id,
    enabled: d.id === 'standardDeduction' && country === 'US',
    amount: d.defaultAmount ?? 0,
  }));
}
