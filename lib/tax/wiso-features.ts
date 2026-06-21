/**
 * WISO Steuer-like Tax Calculation Features
 * Complete tax calculation system similar to WISO but more comprehensive
 */

export interface TaxForm {
  id: string;
  name: string;
  type: 'income' | 'deduction' | 'credit' | 'other';
  category: string;
  year: number;
  fields: TaxFormField[];
  required: boolean;
}

export interface TaxFormField {
  id: string;
  label: string;
  type: 'number' | 'text' | 'date' | 'select' | 'checkbox';
  value: any;
  required: boolean;
  validation?: (value: any) => boolean;
  options?: Array<{ label: string; value: any }>;
}

export interface TaxCalculation {
  year: number;
  filingStatus: 'single' | 'married' | 'headOfHousehold';
  country: string;
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxOwed: number;
  taxCredits: number;
  taxWithheld: number;
  refundOrOwed: number;
  effectiveRate: number;
  marginalRate: number;
  breakdown: TaxBreakdown[];
  forms: TaxFormData[];
}

export interface TaxBreakdown {
  bracket: string;
  taxableAmount: number;
  rate: number;
  tax: number;
}

export interface TaxFormData {
  formId: string;
  formName: string;
  data: Record<string, any>;
  calculated: boolean;
}

/**
 * German Tax System (like WISO Steuer)
 */
export class WISOLikeTaxSystem {
  /**
   * Calculate German income tax (Einkommensteuer)
   */
  static calculateGermanTax(
    income: number,
    filingStatus: 'single' | 'married',
    year: number = new Date().getFullYear()
  ): TaxCalculation {
    // German tax brackets 2024
    const brackets = filingStatus === 'married' 
      ? [
          { min: 0, max: 11604, rate: 0 },
          { min: 11604, max: 19200, rate: 0.14 },
          { min: 19200, max: 31616, rate: 0.2397 },
          { min: 31616, max: 63232, rate: 0.42 },
          { min: 63232, max: Infinity, rate: 0.45 },
        ]
      : [
          { min: 0, max: 11604, rate: 0 },
          { min: 11604, max: 19200, rate: 0.14 },
          { min: 19200, max: 31616, rate: 0.2397 },
          { min: 31616, max: 63232, rate: 0.42 },
          { min: 63232, max: Infinity, rate: 0.45 },
        ];

    let tax = 0;
    let remainingIncome = income;
    const breakdown: TaxBreakdown[] = [];

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      const taxInBracket = taxableInBracket * bracket.rate;
      tax += taxInBracket;
      
      if (taxableInBracket > 0) {
        breakdown.push({
          bracket: `${bracket.min.toLocaleString('de-DE')}€ - ${bracket.max === Infinity ? '∞' : bracket.max.toLocaleString('de-DE')}€`,
          taxableAmount: taxableInBracket,
          rate: bracket.rate * 100,
          tax: taxInBracket,
        });
      }
      
      remainingIncome -= taxableInBracket;
    }

    const effectiveRate = income > 0 ? (tax / income) * 100 : 0;
    const marginalRate = this.getMarginalRate(income, brackets) * 100;

    return {
      year,
      filingStatus,
      country: 'DE',
      totalIncome: income,
      totalDeductions: 0,
      taxableIncome: income,
      taxOwed: Math.round(tax * 100) / 100,
      taxCredits: 0,
      taxWithheld: 0,
      refundOrOwed: 0,
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      marginalRate: Math.round(marginalRate * 100) / 100,
      breakdown,
      forms: [],
    };
  }

  /**
   * Get marginal tax rate
   */
  private static getMarginalRate(income: number, brackets: Array<{ min: number; max: number; rate: number }>): number {
    for (const bracket of brackets) {
      if (income >= bracket.min && income < bracket.max) {
        return bracket.rate;
      }
    }
    return brackets[brackets.length - 1].rate;
  }

  /**
   * Calculate with deductions
   */
  static calculateWithDeductions(
    income: number,
    deductions: number,
    filingStatus: 'single' | 'married',
    year: number = new Date().getFullYear()
  ): TaxCalculation {
    const taxableIncome = Math.max(0, income - deductions);
    const calculation = this.calculateGermanTax(taxableIncome, filingStatus, year);
    
    return {
      ...calculation,
      totalDeductions: deductions,
      taxableIncome,
    };
  }

  /**
   * Get German tax forms
   */
  static getGermanTaxForms(year: number): TaxForm[] {
    return [
      {
        id: 'anlage_n',
        name: 'Anlage N - Einkünfte aus nichtselbstständiger Arbeit',
        type: 'income',
        category: 'employment',
        year,
        required: true,
        fields: [
          { id: 'brutto', label: 'Bruttoeinkommen', type: 'number', value: 0, required: true },
          { id: 'lohnsteuer', label: 'Lohnsteuer', type: 'number', value: 0, required: true },
          { id: 'kirchensteuer', label: 'Kirchensteuer', type: 'number', value: 0, required: false },
        ],
      },
      {
        id: 'anlage_kap',
        name: 'Anlage KAP - Kapitalerträge',
        type: 'income',
        category: 'capital',
        year,
        required: false,
        fields: [
          { id: 'zinsen', label: 'Zinserträge', type: 'number', value: 0, required: false },
          { id: 'dividenden', label: 'Dividenden', type: 'number', value: 0, required: false },
        ],
      },
      {
        id: 'anlage_vorsorge',
        name: 'Anlage Vorsorgeaufwendungen',
        type: 'deduction',
        category: 'insurance',
        year,
        required: false,
        fields: [
          { id: 'krankenversicherung', label: 'Krankenversicherung', type: 'number', value: 0, required: false },
          { id: 'rentenversicherung', label: 'Rentenversicherung', type: 'number', value: 0, required: false },
        ],
      },
      {
        id: 'anlage_werbung',
        name: 'Anlage Werbungskosten',
        type: 'deduction',
        category: 'expenses',
        year,
        required: false,
        fields: [
          { id: 'fahrtkosten', label: 'Fahrtkosten', type: 'number', value: 0, required: false },
          { id: 'homeoffice', label: 'Homeoffice-Pauschale', type: 'number', value: 0, required: false },
        ],
      },
    ];
  }

  /**
   * Calculate tax for multiple countries
   */
  static calculateMultiCountry(
    country: string,
    income: number,
    deductions: number,
    filingStatus: string,
    year: number
  ): TaxCalculation {
    switch (country) {
      case 'DE':
        return this.calculateWithDeductions(income, deductions, filingStatus as any, year);
      case 'US':
        return this.calculateUSTax(income, deductions, filingStatus as any, year);
      case 'FR':
        return this.calculateFrenchTax(income, deductions, filingStatus as any, year);
      default:
        return this.calculateGenericTax(income, deductions, filingStatus as any, year);
    }
  }

  /**
   * US Tax calculation
   */
  private static calculateUSTax(
    income: number,
    deductions: number,
    filingStatus: 'single' | 'married' | 'headOfHousehold',
    year: number
  ): TaxCalculation {
    // Simplified US tax calculation
    const taxableIncome = Math.max(0, income - deductions);
    const brackets = this.getUSBrackets(filingStatus);
    
    let tax = 0;
    const breakdown: TaxBreakdown[] = [];
    let remainingIncome = taxableIncome;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      const taxInBracket = taxableInBracket * bracket.rate;
      tax += taxInBracket;
      
      if (taxableInBracket > 0) {
        breakdown.push({
          bracket: `$${bracket.min.toLocaleString()} - $${bracket.max === Infinity ? '∞' : bracket.max.toLocaleString()}`,
          taxableAmount: taxableInBracket,
          rate: bracket.rate * 100,
          tax: taxInBracket,
        });
      }
      
      remainingIncome -= taxableInBracket;
    }

    return {
      year,
      filingStatus,
      country: 'US',
      totalIncome: income,
      totalDeductions: deductions,
      taxableIncome,
      taxOwed: Math.round(tax * 100) / 100,
      taxCredits: 0,
      taxWithheld: 0,
      refundOrOwed: 0,
      effectiveRate: income > 0 ? Math.round((tax / income) * 100 * 100) / 100 : 0,
      marginalRate: this.getMarginalRate(taxableIncome, brackets) * 100,
      breakdown,
      forms: [],
    };
  }

  private static getUSBrackets(filingStatus: string) {
    if (filingStatus === 'married') {
      return [
        { min: 0, max: 22000, rate: 0.10 },
        { min: 22000, max: 89450, rate: 0.12 },
        { min: 89450, max: 190750, rate: 0.22 },
        { min: 190750, max: 364200, rate: 0.24 },
        { min: 364200, max: 462500, rate: 0.32 },
        { min: 462500, max: 693750, rate: 0.35 },
        { min: 693750, max: Infinity, rate: 0.37 },
      ];
    }
    return [
      { min: 0, max: 11000, rate: 0.10 },
      { min: 11000, max: 44725, rate: 0.12 },
      { min: 44725, max: 95350, rate: 0.22 },
      { min: 95350, max: 201050, rate: 0.24 },
      { min: 201050, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 },
    ];
  }

  private static calculateFrenchTax(
    income: number,
    deductions: number,
    filingStatus: string,
    year: number
  ): TaxCalculation {
    // Simplified French tax
    const taxableIncome = Math.max(0, income - deductions);
    const tax = taxableIncome * 0.30; // Simplified flat rate
    
    return {
      year,
      filingStatus: filingStatus as any,
      country: 'FR',
      totalIncome: income,
      totalDeductions: deductions,
      taxableIncome,
      taxOwed: Math.round(tax * 100) / 100,
      taxCredits: 0,
      taxWithheld: 0,
      refundOrOwed: 0,
      effectiveRate: income > 0 ? Math.round((tax / income) * 100 * 100) / 100 : 0,
      marginalRate: 30,
      breakdown: [],
      forms: [],
    };
  }

  private static calculateGenericTax(
    income: number,
    deductions: number,
    filingStatus: string,
    year: number
  ): TaxCalculation {
    const taxableIncome = Math.max(0, income - deductions);
    const tax = taxableIncome * 0.25; // Generic rate
    
    return {
      year,
      filingStatus: filingStatus as any,
      country: 'XX',
      totalIncome: income,
      totalDeductions: deductions,
      taxableIncome,
      taxOwed: Math.round(tax * 100) / 100,
      taxCredits: 0,
      taxWithheld: 0,
      refundOrOwed: 0,
      effectiveRate: income > 0 ? Math.round((tax / income) * 100 * 100) / 100 : 0,
      marginalRate: 25,
      breakdown: [],
      forms: [],
    };
  }
}


