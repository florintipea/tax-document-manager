/**
 * Country-specific tax calculator configuration.
 * Estimates only — not legal or tax advice.
 */

export type TaxCountryCode = 'DE' | 'US' | 'CA' | 'RO' | 'ES' | 'GR' | 'AT' | 'CH';

/** Canadian province quick-pick for provincial tax estimate */
export type CAProvinceCode = 'ON' | 'BC' | 'AB' | 'OTHER';

export type CountrySupportLevel = 'full' | 'basic';

export type Steuerklasse = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export type USFilingStatus = 'single' | 'married' | 'headOfHousehold';

export type DeductionId =
  | 'werbungskosten'
  | 'vorsorgeaufwendungen'
  | 'sonderausgaben'
  | 'aussergewoehnliche_belastungen'
  | 'homeoffice'
  | 'entfernungspauschale'
  | 'kinderfreibetrag'
  | 'kirchensteuer'
  | 'standardDeduction'
  | 'mortgageInterest'
  | 'charitableContributions'
  | 'medicalExpenses'
  | 'stateLocalTax'
  | 'studentLoanInterest'
  | 'retirementContributions';

export interface DeductionConfig {
  id: DeductionId;
  /** i18n key under calculator.deductions.* */
  labelKey: string;
  descriptionKey: string;
  type: 'checkbox' | 'amount' | 'children';
  /** Default amount when checkbox is enabled (optional) */
  defaultAmount?: number;
  /** Max cap for amount-type deductions */
  maxAmount?: number;
  /** Only applies when another deduction is enabled */
  requires?: DeductionId;
}

export interface CountryTaxConfig {
  code: TaxCountryCode;
  currency: string;
  currencySymbol: string;
  /** Full calculator vs flat-rate stub */
  mode: 'full' | 'stub';
  /** UI badge: full Steuerrechner vs basic estimate */
  supportLevel: CountrySupportLevel;
  /** Germany-first: primary market flag */
  isPrimary?: boolean;
  stubRate?: number;
  /** i18n key for stub notice */
  stubNoticeKey?: string;
  fields: {
    steuerklasse?: boolean;
    filingStatus?: boolean;
    taxWithheld?: boolean;
    caProvince?: boolean;
  };
  deductions: DeductionConfig[];
}

/** Calculator countries — DE first (primary market) */
export const SUPPORTED_CALCULATOR_COUNTRIES: TaxCountryCode[] = [
  'DE',
  'US',
  'CA',
  'RO',
  'ES',
  'GR',
  'AT',
  'CH',
];

/** Germany + optional calculator countries for grouped selectors */
export const PRIMARY_TAX_COUNTRY: TaxCountryCode = 'DE';

export const OTHER_CALCULATOR_COUNTRIES: TaxCountryCode[] =
  SUPPORTED_CALCULATOR_COUNTRIES.filter((c) => c !== PRIMARY_TAX_COUNTRY);

export const DE_DEDUCTIONS: DeductionConfig[] = [
  {
    id: 'werbungskosten',
    labelKey: 'werbungskosten',
    descriptionKey: 'werbungskostenDesc',
    type: 'amount',
    defaultAmount: 1230,
  },
  {
    id: 'vorsorgeaufwendungen',
    labelKey: 'vorsorgeaufwendungen',
    descriptionKey: 'vorsorgeaufwendungenDesc',
    type: 'amount',
  },
  {
    id: 'sonderausgaben',
    labelKey: 'sonderausgaben',
    descriptionKey: 'sonderausgabenDesc',
    type: 'amount',
  },
  {
    id: 'aussergewoehnliche_belastungen',
    labelKey: 'aussergewoehnlicheBelastungen',
    descriptionKey: 'aussergewoehnlicheBelastungenDesc',
    type: 'amount',
  },
  {
    id: 'homeoffice',
    labelKey: 'homeoffice',
    descriptionKey: 'homeofficeDesc',
    type: 'amount',
    maxAmount: 1260,
  },
  {
    id: 'entfernungspauschale',
    labelKey: 'entfernungspauschale',
    descriptionKey: 'entfernungspauschaleDesc',
    type: 'amount',
  },
  {
    id: 'kinderfreibetrag',
    labelKey: 'kinderfreibetrag',
    descriptionKey: 'kinderfreibetragDesc',
    type: 'children',
    defaultAmount: 1,
  },
  {
    id: 'kirchensteuer',
    labelKey: 'kirchensteuer',
    descriptionKey: 'kirchensteuerDesc',
    type: 'checkbox',
  },
];

export const US_DEDUCTIONS: DeductionConfig[] = [
  {
    id: 'standardDeduction',
    labelKey: 'standardDeduction',
    descriptionKey: 'standardDeductionDesc',
    type: 'checkbox',
  },
  {
    id: 'mortgageInterest',
    labelKey: 'mortgageInterest',
    descriptionKey: 'mortgageInterestDesc',
    type: 'amount',
  },
  {
    id: 'charitableContributions',
    labelKey: 'charitableContributions',
    descriptionKey: 'charitableContributionsDesc',
    type: 'amount',
  },
  {
    id: 'medicalExpenses',
    labelKey: 'medicalExpenses',
    descriptionKey: 'medicalExpensesDesc',
    type: 'amount',
  },
  {
    id: 'stateLocalTax',
    labelKey: 'stateLocalTax',
    descriptionKey: 'stateLocalTaxDesc',
    type: 'amount',
    maxAmount: 10000,
  },
  {
    id: 'studentLoanInterest',
    labelKey: 'studentLoanInterest',
    descriptionKey: 'studentLoanInterestDesc',
    type: 'amount',
    maxAmount: 2500,
  },
  {
    id: 'retirementContributions',
    labelKey: 'retirementContributions',
    descriptionKey: 'retirementContributionsDesc',
    type: 'amount',
  },
];

export const COUNTRY_TAX_CONFIG: Record<TaxCountryCode, CountryTaxConfig> = {
  DE: {
    code: 'DE',
    currency: 'EUR',
    currencySymbol: '€',
    mode: 'full',
    supportLevel: 'full',
    isPrimary: true,
    fields: {
      steuerklasse: true,
      taxWithheld: true,
    },
    deductions: DE_DEDUCTIONS,
  },
  US: {
    code: 'US',
    currency: 'USD',
    currencySymbol: '$',
    mode: 'full',
    supportLevel: 'full',
    fields: {
      filingStatus: true,
      taxWithheld: true,
    },
    deductions: US_DEDUCTIONS,
  },
  CA: {
    code: 'CA',
    currency: 'CAD',
    currencySymbol: '$',
    mode: 'full',
    supportLevel: 'full',
    fields: {
      filingStatus: true,
      taxWithheld: true,
      caProvince: true,
    },
    deductions: [],
  },
  RO: {
    code: 'RO',
    currency: 'RON',
    currencySymbol: 'lei',
    mode: 'stub',
    supportLevel: 'basic',
    stubRate: 0.1,
    stubNoticeKey: 'stubNotice',
    fields: { taxWithheld: true },
    deductions: [],
  },
  ES: {
    code: 'ES',
    currency: 'EUR',
    currencySymbol: '€',
    mode: 'stub',
    supportLevel: 'basic',
    stubRate: 0.19,
    stubNoticeKey: 'stubNotice',
    fields: { taxWithheld: true },
    deductions: [],
  },
  GR: {
    code: 'GR',
    currency: 'EUR',
    currencySymbol: '€',
    mode: 'stub',
    supportLevel: 'basic',
    stubRate: 0.15,
    stubNoticeKey: 'stubNotice',
    fields: { taxWithheld: true },
    deductions: [],
  },
  AT: {
    code: 'AT',
    currency: 'EUR',
    currencySymbol: '€',
    mode: 'stub',
    supportLevel: 'basic',
    stubRate: 0.2,
    stubNoticeKey: 'stubNotice',
    fields: { taxWithheld: true },
    deductions: [],
  },
  CH: {
    code: 'CH',
    currency: 'CHF',
    currencySymbol: 'CHF',
    mode: 'stub',
    supportLevel: 'basic',
    stubRate: 0.15,
    stubNoticeKey: 'stubNotice',
    fields: { taxWithheld: true },
    deductions: [],
  },
};

/** Canada federal brackets (2024 simplified) */
export const CA_FEDERAL_BRACKETS = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 173205, rate: 0.26 },
  { min: 173205, max: 246752, rate: 0.29 },
  { min: 246752, max: Infinity, rate: 0.33 },
] as const;

/** Canada basic personal amount (2024) */
export const CA_BASIC_PERSONAL_AMOUNT = 15705;

/** Provincial brackets for quick-pick provinces; OTHER uses flat 10% */
export const CA_PROVINCIAL_BRACKETS: Record<
  CAProvinceCode,
  { min: number; max: number; rate: number }[]
> = {
  ON: [
    { min: 0, max: 51446, rate: 0.0505 },
    { min: 51446, max: 102894, rate: 0.0915 },
    { min: 102894, max: 150000, rate: 0.1116 },
    { min: 150000, max: 220000, rate: 0.1216 },
    { min: 220000, max: Infinity, rate: 0.1316 },
  ],
  BC: [
    { min: 0, max: 47937, rate: 0.0506 },
    { min: 47937, max: 95875, rate: 0.077 },
    { min: 95875, max: 110076, rate: 0.105 },
    { min: 110076, max: 133664, rate: 0.1229 },
    { min: 133664, max: 181232, rate: 0.147 },
    { min: 181232, max: 252752, rate: 0.168 },
    { min: 252752, max: Infinity, rate: 0.205 },
  ],
  AB: [
    { min: 0, max: 148269, rate: 0.1 },
    { min: 148269, max: 177922, rate: 0.12 },
    { min: 177922, max: 237670, rate: 0.13 },
    { min: 237670, max: 355845, rate: 0.14 },
    { min: 355845, max: Infinity, rate: 0.15 },
  ],
  OTHER: [{ min: 0, max: Infinity, rate: 0.1 }],
};

/** US standard deduction amounts (2024) */
export const US_STANDARD_DEDUCTION: Record<USFilingStatus, number> = {
  single: 14600,
  married: 29200,
  headOfHousehold: 21900,
};

/** German Grundfreibetrag (2024/2025 simplified) */
export const DE_GRUNDFREIBETRAG = 11604;

/** Extra allowance for Alleinerziehende (Steuerklasse II) */
export const DE_ALLEINERZIEHENDE_BONUS = 4260;

/** Per-child allowance estimate (Kinderfreibetrag, 2024/2025 simplified) */
export const DE_KINDERFREIBETRAG = 9540;

/** Maximum selectable children for Kinderfreibetrag in the calculator */
export const DE_KINDERFREIBETRAG_MAX_CHILDREN = 10;

/** Default AfA rate for residential buildings (simplified, % per year) */
export const DE_AFA_DEFAULT_RATE = 2;

/** Default flat Werbungskosten percentage for rental (simplified) */
export const DE_RENTAL_FLAT_EXPENSE_PERCENT = 20;

/** Common cross-border work countries for Grenzgänger */
export const GRENZGAENGER_WORK_COUNTRIES = [
  'AT',
  'CH',
  'LU',
  'NL',
  'FR',
  'PL',
  'CZ',
  'BE',
  'IT',
  'DK',
] as const;

export function getCountryConfig(country: string): CountryTaxConfig {
  const code = country as TaxCountryCode;
  return COUNTRY_TAX_CONFIG[code] ?? COUNTRY_TAX_CONFIG.DE;
}

export function getCountrySupportLevel(country: string): CountrySupportLevel {
  return getCountryConfig(country).supportLevel;
}

export function isCalculatorCountry(country: string): country is TaxCountryCode {
  return country in COUNTRY_TAX_CONFIG;
}

export function normalizeCalculatorCountry(country: string | undefined): TaxCountryCode {
  if (country === 'EL') return 'GR';
  if (country && country in COUNTRY_TAX_CONFIG) {
    return country as TaxCountryCode;
  }
  return 'DE';
}

/** German Bundesländer (optional Steuerprofil stub) */
export const DE_BUNDESLAENDER = [
  { code: 'BW', nameKey: 'bundeslandBW' },
  { code: 'BY', nameKey: 'bundeslandBY' },
  { code: 'BE', nameKey: 'bundeslandBE' },
  { code: 'BB', nameKey: 'bundeslandBB' },
  { code: 'HB', nameKey: 'bundeslandHB' },
  { code: 'HH', nameKey: 'bundeslandHH' },
  { code: 'HE', nameKey: 'bundeslandHE' },
  { code: 'MV', nameKey: 'bundeslandMV' },
  { code: 'NI', nameKey: 'bundeslandNI' },
  { code: 'NW', nameKey: 'bundeslandNW' },
  { code: 'RP', nameKey: 'bundeslandRP' },
  { code: 'SL', nameKey: 'bundeslandSL' },
  { code: 'SN', nameKey: 'bundeslandSN' },
  { code: 'ST', nameKey: 'bundeslandST' },
  { code: 'SH', nameKey: 'bundeslandSH' },
  { code: 'TH', nameKey: 'bundeslandTH' },
] as const;

/** Arbeitnehmer-Pauschbetrag 2024/2025 */
export const DE_WERBUNGSKOSTEN_PAUSCH = 1230;

/** Homeoffice-Pauschale max per year */
export const DE_HOMEOFFICE_MAX = 1260;

/** Example commute: 30 km × 230 days × €0.30 */
export const DE_ENTFERNUNGSPAUSCHALE_EXAMPLE = 2070;
