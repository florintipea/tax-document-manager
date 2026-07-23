/**
 * Aggregates real user tax/finance data for the dashboard charts.
 * Never invents numbers — missing sources yield null / empty series.
 */

import {
  calculateCountryTax,
  createDefaultDeductions,
  type DeductionInput,
  type OptimizationHint,
  type TaxCalculationInput,
} from '@/lib/tax/calculator';
import {
  normalizeCalculatorCountry,
  type Steuerklasse,
  type TaxCountryCode,
} from '@/lib/tax/country-config';

export interface YearTotals {
  year: number;
  income: number;
  expenses: number;
  tax: number | null;
  hasIncomeOrExpenses: boolean;
  sources: string[];
}

export interface MonthlyPoint {
  month: number; // 1–12
  income: number;
  expenses: number;
  tax: number | null;
  hasData: boolean;
}

export interface DashboardTip {
  id: string;
  labelKey: string;
  descriptionKey: string;
  href: string;
  estimatedSavingsEur: number | null;
  source: 'static' | 'optimizer';
}

export interface FinanceOverview {
  currentYear: number;
  pie: {
    income: number;
    expenses: number;
    tax: number | null;
    hasData: boolean;
    sources: string[];
  };
  monthly: MonthlyPoint[];
  yearly: YearTotals[];
  tips: DashboardTip[];
  empty: {
    noFinanceData: boolean;
    suggestUpload: boolean;
    suggestProfile: boolean;
    suggestCalculator: boolean;
  };
}

interface TaxLineRow {
  year: number;
  kind: string;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RentalRow {
  year: number;
  grossRent: number;
  operatingCosts: number;
  werbungskosten: number;
  afaAmount: number | null;
}

interface GrenzRow {
  year: number;
  enabled: boolean;
  foreignEmploymentIncome: number;
  foreignWithholdingTax: number;
}

interface DocRow {
  year: number;
  date: Date;
  taxAmount: number | null;
  isTaxRelevant: boolean;
  taxCategory: string | null;
}

interface UserFinanceContext {
  country: string | null;
  steuerklasse: string | null;
  deFilingMode: string | null;
  spouseIncome: number | null;
  /** Persisted Steuerrechner draft JSON on User — survives deploys when DB is on disk */
  calculatorDraft: string | null;
  vorname: string | null;
  nachname: string | null;
  steuernummer: string | null;
  hasRentalIncome?: boolean | null;
  isCrossBorder?: boolean | null;
  numberOfChildren?: number | null;
}

const STATIC_TIPS: DashboardTip[] = [
  {
    id: 'werbungskosten',
    labelKey: 'dashboard.tips.werbungskostenTitle',
    descriptionKey: 'dashboard.tips.werbungskostenDesc',
    href: '/calculator',
    estimatedSavingsEur: null,
    source: 'static',
  },
  {
    id: 'documents',
    labelKey: 'dashboard.tips.documentsTitle',
    descriptionKey: 'dashboard.tips.documentsDesc',
    href: '/documents',
    estimatedSavingsEur: null,
    source: 'static',
  },
  {
    id: 'steuererklaerung',
    labelKey: 'dashboard.tips.steuererklaerungTitle',
    descriptionKey: 'dashboard.tips.steuererklaerungDesc',
    href: '/steuererklaerung',
    estimatedSavingsEur: null,
    source: 'static',
  },
  {
    id: 'grenzgaenger',
    labelKey: 'dashboard.tips.grenzgaengerTitle',
    descriptionKey: 'dashboard.tips.grenzgaengerDesc',
    href: '/grenzgaenger',
    estimatedSavingsEur: null,
    source: 'static',
  },
  {
    id: 'profile',
    labelKey: 'dashboard.tips.profileTitle',
    descriptionKey: 'dashboard.tips.profileDesc',
    href: '/settings',
    estimatedSavingsEur: null,
    source: 'static',
  },
];

const OPTIMIZER_HREF: Record<string, string> = {
  werbungskosten: '/calculator',
  entfernungspauschale: '/calculator',
  homeoffice: '/calculator',
  vorsorgeaufwendungen: '/calculator',
  sonderausgaben: '/calculator',
  kinderfreibetrag: '/calculator',
  kindergeld: '/calculator',
  riester: '/calculator',
  ruerup: '/calculator',
  foreignTaxCredit: '/grenzgaenger',
  grenzgaenger: '/grenzgaenger',
  rentalAfa: '/steuererklaerung',
  vermietung: '/steuererklaerung',
  vorauszahlungen: '/calculator',
  zusammenveranlagung: '/settings',
  ehegattensplitting: '/calculator',
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseDraft(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function buildCalculatorInput(
  user: UserFinanceContext,
  draft: Record<string, unknown> | null,
  year: number
): TaxCalculationInput | null {
  const income = num(draft?.income);
  if (income <= 0) return null;

  const country = normalizeCalculatorCountry(user.country ?? undefined) as TaxCountryCode;
  const defaultDeds = createDefaultDeductions(country);
  const draftDeds = Array.isArray(draft?.deductions)
    ? (draft!.deductions as DeductionInput[])
    : defaultDeds;

  return {
    country,
    income,
    taxWithheld: num(draft?.taxWithheld),
    year,
    filingStatus:
      draft?.filingStatus === 'married' || draft?.filingStatus === 'headOfHousehold'
        ? draft.filingStatus
        : 'single',
    steuerklasse: (user.steuerklasse as Steuerklasse) || 'I',
    deFilingMode: user.deFilingMode === 'zusammen' ? 'zusammen' : 'einzel',
    spouseIncome: user.spouseIncome && user.spouseIncome > 0 ? user.spouseIncome : undefined,
    spouseTaxWithheld: num(draft?.spouseTaxWithheld) || undefined,
    deductions: draftDeds,
    vorauszahlungen: draft?.vorauszahlungen as TaxCalculationInput['vorauszahlungen'],
    crossBorder: draft?.crossBorder as TaxCalculationInput['crossBorder'],
    rental: draft?.rental as TaxCalculationInput['rental'],
    caProvince:
      draft?.caProvince === 'ON' ||
      draft?.caProvince === 'BC' ||
      draft?.caProvince === 'AB' ||
      draft?.caProvince === 'OTHER'
        ? draft.caProvince
        : undefined,
  };
}

function sumLines(lines: TaxLineRow[], year: number, kind: 'income' | 'expense'): number {
  return round2(
    lines
      .filter((l) => l.year === year && l.kind === kind)
      .reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0)
  );
}

function rentalForYear(rentals: RentalRow[], year: number) {
  const rows = rentals.filter((r) => r.year === year);
  const gross = round2(rows.reduce((s, r) => s + r.grossRent, 0));
  const costs = round2(
    rows.reduce(
      (s, r) => s + r.operatingCosts + r.werbungskosten + (r.afaAmount ?? 0),
      0
    )
  );
  return { gross, costs };
}

function grenzForYear(rows: GrenzRow[], year: number) {
  const row = rows.find((g) => g.year === year && g.enabled);
  if (!row) return { income: 0, tax: 0 };
  return {
    income: round2(row.foreignEmploymentIncome),
    tax: round2(row.foreignWithholdingTax),
  };
}

function isExpenseCategory(taxCategory: string | null): boolean {
  if (!taxCategory) return false;
  const c = taxCategory.toLowerCase();
  return (
    c.includes('werbung') ||
    c.includes('ausgabe') ||
    c.includes('expense') ||
    c.includes('spende') ||
    c.includes('versicherung') ||
    c.includes('gesundheit') ||
    c.includes('sonder') ||
    c.includes('agb') ||
    c.includes('kosten')
  );
}

function isIncomeCategory(taxCategory: string | null): boolean {
  if (!taxCategory) return false;
  const c = taxCategory.toLowerCase();
  return (
    c.includes('gehalt') ||
    c.includes('lohn') ||
    c.includes('einnahme') ||
    c.includes('income') ||
    c.includes('kapital') ||
    c.includes('miete') ||
    c.includes('rent')
  );
}

function buildYearTotals(
  year: number,
  lines: TaxLineRow[],
  rentals: RentalRow[],
  grenz: GrenzRow[],
  calc: { income: number; expenses: number; tax: number | null } | null
): YearTotals {
  const sources: string[] = [];
  let income = sumLines(lines, year, 'income');
  let expenses = sumLines(lines, year, 'expense');
  if (income > 0 || expenses > 0) sources.push('tax_lines');

  const rental = rentalForYear(rentals, year);
  if (rental.gross > 0 || rental.costs > 0) {
    income = round2(income + rental.gross);
    expenses = round2(expenses + rental.costs);
    sources.push('rental');
  }

  const g = grenzForYear(grenz, year);
  if (g.income > 0) {
    income = round2(income + g.income);
    sources.push('grenzgaenger');
  }

  let tax: number | null = g.tax > 0 ? g.tax : null;

  // Calculator draft only fills gaps for the current/selected year when lines are empty
  if (calc && income === 0 && expenses === 0) {
    income = calc.income;
    expenses = calc.expenses;
    tax = calc.tax;
    if (income > 0 || expenses > 0 || tax !== null) sources.push('calculator');
  } else if (calc && tax === null && calc.tax !== null && income > 0) {
    // Prefer calculated tax when we have income but no withheld/foreign tax figure
    tax = calc.tax;
    sources.push('calculator_tax');
  }

  return {
    year,
    income,
    expenses,
    tax,
    hasIncomeOrExpenses: income > 0 || expenses > 0 || (tax !== null && tax > 0),
    sources,
  };
}

function buildMonthlyFromDocuments(docs: DocRow[], year: number): MonthlyPoint[] {
  const buckets = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expenses: 0,
    tax: 0,
    hasIncome: false,
    hasExpense: false,
    hasTax: false,
  }));

  for (const doc of docs) {
    if (doc.year !== year || doc.taxAmount == null || !Number.isFinite(doc.taxAmount)) continue;
    const d = doc.date instanceof Date ? doc.date : new Date(doc.date);
    if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) continue;
    const m = d.getMonth(); // 0–11
    const amount = Math.abs(doc.taxAmount);
    if (isExpenseCategory(doc.taxCategory)) {
      buckets[m].expenses = round2(buckets[m].expenses + amount);
      buckets[m].hasExpense = true;
    } else if (isIncomeCategory(doc.taxCategory)) {
      buckets[m].income = round2(buckets[m].income + amount);
      buckets[m].hasIncome = true;
    } else if (doc.isTaxRelevant) {
      // Ambiguous tax-relevant amount — track as tax-related volume under tax
      buckets[m].tax = round2(buckets[m].tax + amount);
      buckets[m].hasTax = true;
    }
  }

  return buckets.map((b) => ({
    month: b.month,
    income: b.income,
    expenses: b.expenses,
    tax: b.hasTax ? b.tax : null,
    hasData: b.hasIncome || b.hasExpense || b.hasTax,
  }));
}

function applyVorauszahlungenToMonthly(
  monthly: MonthlyPoint[],
  voraus: { q1?: number; q2?: number; q3?: number; q4?: number } | null
): MonthlyPoint[] {
  if (!voraus) return monthly;
  const quarters: Array<{ month: number; amount: number }> = [
    { month: 3, amount: num(voraus.q1) },
    { month: 6, amount: num(voraus.q2) },
    { month: 9, amount: num(voraus.q3) },
    { month: 12, amount: num(voraus.q4) },
  ];
  return monthly.map((p) => {
    const q = quarters.find((x) => x.month === p.month && x.amount > 0);
    if (!q) return p;
    return {
      ...p,
      tax: p.tax !== null ? round2(p.tax + q.amount) : q.amount,
      hasData: true,
    };
  });
}

function tipFromHint(hint: OptimizationHint): DashboardTip {
  return {
    id: `opt-${hint.id}`,
    labelKey: `calculator.optimization.${hint.labelKey}`,
    descriptionKey: `calculator.optimization.${hint.descriptionKey}`,
    href: OPTIMIZER_HREF[hint.id] || '/calculator',
    estimatedSavingsEur: hint.estimatedSavingsEur,
    source: 'optimizer',
  };
}

export function buildFinanceOverview(input: {
  currentYear?: number;
  user: UserFinanceContext;
  taxLines: TaxLineRow[];
  rentals: RentalRow[];
  grenzgaenger: GrenzRow[];
  documents: DocRow[];
}): FinanceOverview {
  const currentYear = input.currentYear ?? new Date().getFullYear();
  const draft = parseDraft(input.user.calculatorDraft);
  const calcInput = buildCalculatorInput(input.user, draft, currentYear);

  let calcSnapshot: { income: number; expenses: number; tax: number | null } | null = null;
  let optimizationHints: OptimizationHint[] = [];

  if (calcInput) {
    const result = calculateCountryTax(calcInput);
    const expenses = round2(
      (calcInput.deductions || [])
        .filter((d) => d.enabled && d.amount > 0)
        .reduce((s, d) => s + d.amount, 0)
    );
    calcSnapshot = {
      income: calcInput.income,
      expenses,
      tax: result.taxOwed,
    };
    optimizationHints = result.savings?.optimizationHints?.slice(0, 4) ?? [];
  }

  const yearsPresent = new Set<number>();
  for (const l of input.taxLines) yearsPresent.add(l.year);
  for (const r of input.rentals) yearsPresent.add(r.year);
  for (const g of input.grenzgaenger) yearsPresent.add(g.year);
  for (const d of input.documents) yearsPresent.add(d.year);
  yearsPresent.add(currentYear);
  if (calcSnapshot) yearsPresent.add(currentYear);

  const yearList = Array.from(yearsPresent)
    .filter((y) => y >= currentYear - 4 && y <= currentYear)
    .sort((a, b) => a - b);

  const yearly = yearList.map((year) =>
    buildYearTotals(
      year,
      input.taxLines,
      input.rentals,
      input.grenzgaenger,
      year === currentYear ? calcSnapshot : null
    )
  );

  const current = yearly.find((y) => y.year === currentYear) || {
    year: currentYear,
    income: 0,
    expenses: 0,
    tax: null as number | null,
    hasIncomeOrExpenses: false,
    sources: [] as string[],
  };

  let monthly = buildMonthlyFromDocuments(input.documents, currentYear);
  const voraus =
    draft?.vorauszahlungen && typeof draft.vorauszahlungen === 'object'
      ? (draft.vorauszahlungen as { q1?: number; q2?: number; q3?: number; q4?: number })
      : null;
  monthly = applyVorauszahlungenToMonthly(monthly, voraus);

  const optimizerTips = optimizationHints.map(tipFromHint);
  const staticIds = new Set(optimizerTips.map((t) => t.id.replace(/^opt-/, '')));
  let staticTips = STATIC_TIPS.filter((t) => !staticIds.has(t.id));
  // Surface profile-relevant tips first when flags are set on persisted Steuerprofil
  if (input.user.isCrossBorder) {
    staticTips = [
      ...staticTips.filter((t) => t.id === 'grenzgaenger'),
      ...staticTips.filter((t) => t.id !== 'grenzgaenger'),
    ];
  }
  if (input.user.hasRentalIncome) {
    const rentalTip: DashboardTip = {
      id: 'rental',
      labelKey: 'dashboard.tips.steuererklaerungTitle',
      descriptionKey: 'dashboard.tips.steuererklaerungDesc',
      href: '/steuererklaerung',
      estimatedSavingsEur: null,
      source: 'static',
    };
    if (!staticTips.some((t) => t.id === 'steuererklaerung' || t.id === 'rental')) {
      staticTips = [rentalTip, ...staticTips];
    }
  }
  const tips = [...optimizerTips, ...staticTips].slice(0, 5);

  const profileSparse =
    !input.user.vorname && !input.user.nachname && !input.user.steuernummer;
  const noFinanceData = !current.hasIncomeOrExpenses && !monthly.some((m) => m.hasData);

  return {
    currentYear,
    pie: {
      income: current.income,
      expenses: current.expenses,
      tax: current.tax,
      hasData: current.hasIncomeOrExpenses,
      sources: current.sources,
    },
    monthly,
    yearly: yearly.filter((y) => y.hasIncomeOrExpenses || y.year === currentYear),
    tips,
    empty: {
      noFinanceData,
      suggestUpload: input.documents.length === 0,
      suggestProfile: profileSparse,
      suggestCalculator: !calcSnapshot,
    },
  };
}
