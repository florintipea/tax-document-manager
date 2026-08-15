/**
 * Truthful KI Beleg-Sortierhilfe — rules + optional AI.
 * Categories are what we actually assign; never claim perfect auto-filing.
 */

export const DE_BELEG_CATEGORIES = [
  'Lohnabrechnung',
  'Rechnung',
  'Spende',
  'Fahrt',
  'Versicherung',
  'Kontoauszug',
  'Steuerdokument',
  'Auslandsbeleg',
  'Homeoffice',
  'Fortbildung',
  'Mietvertrag',
  'Hausgeldabrechnung',
  'Sonstiges',
] as const;

export type DeBelegCategory = (typeof DE_BELEG_CATEGORIES)[number];

export type BelegSortMethod = 'ai' | 'rules';

export interface BelegSortResult {
  category: DeBelegCategory | string;
  taxCategory?: string;
  isTaxRelevant: boolean;
  year: number;
  confidence: number;
  method: BelegSortMethod;
  suggestions: string[];
  /** Short German label for UI */
  categoryLabelDe: string;
}

const CATEGORY_LABELS_DE: Record<string, string> = {
  Lohnabrechnung: 'Lohnabrechnung / Gehalt',
  Rechnung: 'Rechnung / Quittung',
  Spende: 'Spende',
  Fahrt: 'Fahrt / Pendeln',
  Versicherung: 'Versicherung',
  Kontoauszug: 'Kontoauszug',
  Steuerdokument: 'Steuerdokument',
  Auslandsbeleg: 'Auslandsbeleg (CH/AT …)',
  Homeoffice: 'Homeoffice / Arbeitszimmer',
  Fortbildung: 'Fortbildung / Fachliteratur',
  Mietvertrag: 'Mietvertrag',
  Hausgeldabrechnung: 'Hausgeldabrechnung',
  Sonstiges: 'Sonstiges',
  // legacy aliases from DocumentAnalyzer
  Gehaltsabrechnungen: 'Lohnabrechnung / Gehalt',
  Rechnungen: 'Rechnung / Quittung',
  Belege: 'Rechnung / Quittung',
  Mietverträge: 'Mietvertrag',
  Nebenkostenabrechnung: 'Hausgeldabrechnung',
  'Vermietung & Verpachtung': 'Mietvertrag',
  Kontoauszüge: 'Kontoauszug',
  Steuerdokumente: 'Steuerdokument',
  Versicherungen: 'Versicherung',
};

/** Normalize legacy or AI-freeform category names into our DE set. */
export function normalizeDeBelegCategory(raw: string | null | undefined): DeBelegCategory {
  if (!raw) return 'Sonstiges';
  const t = raw.toLowerCase().trim();

  // Ausland first — Lohnausweis (CH) is not a DE Gehaltsabrechnung
  if (
    /ausland|grenzgänger|grenzgaenger|lohnausweis|quellensteuer|ansässig|ansaessig|a1[- ]?bescheinigung|schweiz|\bch\b|österreich|oesterreich|\bat\b/.test(
      t
    )
  ) {
    return 'Auslandsbeleg';
  }
  if (
    /gehaltsabrechnung|lohnsteuerbescheinigung|lohnabrechnung|payslip|pay.?stub|\bgehalt\b|\blohn\b/.test(
      t
    )
  ) {
    return 'Lohnabrechnung';
  }
  if (/spende|donation|charit|zuwendung/.test(t)) return 'Spende';
  if (/fahrt|pendel|kilometer|entfernung|bahn|öpnv|tank|commute|fahrkarte/.test(t)) {
    return 'Fahrt';
  }
  if (/versicherung|insurance|haftpflicht|krankenversicherung/.test(t)) return 'Versicherung';
  if (/konto|bank|sparkasse|statement|überweisung/.test(t)) return 'Kontoauszug';
  if (
    /steuerbescheid|finanzamt|elster|einkommensteuer|anlage |steuerdokument/.test(t)
  ) {
    return 'Steuerdokument';
  }
  if (/home.?office|arbeitszimmer|telearbeit/.test(t)) return 'Homeoffice';
  if (/fortbildung|fachliteratur|seminar|weiterbildung|kurs/.test(t)) return 'Fortbildung';
  if (
    /hausgeld|hausgeldabrechnung|wohnungseigentümer|wohnungseigentuemer|weg-abrechnung|umlagefähig|umlagefaehig|nebenkostenabrechnung|betriebskostenabrechnung/.test(
      t
    )
  ) {
    return 'Hausgeldabrechnung';
  }
  if (/mietvertrag|wohnraummietvertrag|untermietvertrag|mietverhältnis|mietverhaeltnis/.test(t)) {
    return 'Mietvertrag';
  }
  if (/rechnung|quittung|beleg|invoice|receipt|apotheke|arzt/.test(t)) return 'Rechnung';
  if (/\bmiete\b|wohnraum/.test(t)) return 'Mietvertrag';

  const exact = DE_BELEG_CATEGORIES.find((c) => c.toLowerCase() === t);
  if (exact) return exact;

  return 'Sonstiges';
}

export function categoryLabelDe(category: string): string {
  return CATEGORY_LABELS_DE[category] || CATEGORY_LABELS_DE[normalizeDeBelegCategory(category)] || category;
}

function extractYear(fileName: string, fileContent?: string): number {
  const combined = `${fileName} ${fileContent || ''}`;
  const yearMatch = combined.match(/\b(20\d{2})\b/);
  return yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
}

function inferTaxCategory(category: DeBelegCategory): string | undefined {
  switch (category) {
    case 'Lohnabrechnung':
      return 'income';
    case 'Rechnung':
    case 'Spende':
    case 'Fahrt':
    case 'Homeoffice':
    case 'Fortbildung':
      return 'deduction';
    case 'Versicherung':
      return 'insurance';
    case 'Steuerdokument':
      return 'tax';
    case 'Auslandsbeleg':
      return 'foreign';
    case 'Kontoauszug':
      return 'bank';
    case 'Mietvertrag':
      return 'rental';
    case 'Hausgeldabrechnung':
      return 'property';
    default:
      return undefined;
  }
}

function isTaxRelevantText(text: string): boolean {
  const keywords = [
    'steuer',
    'finanzamt',
    'rechnung',
    'beleg',
    'quittung',
    'gehalt',
    'lohn',
    'gehaltsabrechnung',
    'kontoauszug',
    'versicherung',
    'werbungskosten',
    'elster',
    'bescheid',
    'spende',
    'fahrt',
    'pendel',
    'lohnausweis',
    'quellensteuer',
    'ansässig',
    'mietvertrag',
    'hausgeld',
    'nebenkosten',
    'invoice',
    'receipt',
    'salary',
    'tax',
  ];
  return keywords.some((k) => text.includes(k));
}

/**
 * Rules-based classify — always available, no API keys required.
 * Uses filename + optional extracted text (PDF).
 */
export function classifyBelegRules(
  fileName: string,
  fileContent?: string
): BelegSortResult {
  const searchText = `${fileName} ${fileContent || ''}`.toLowerCase();
  const category = normalizeDeBelegCategory(searchText);
  const isTaxRelevant =
    category !== 'Sonstiges' || isTaxRelevantText(searchText);
  const hasContent = Boolean(fileContent && fileContent.trim().length > 40);
  const nameHit = normalizeDeBelegCategory(fileName) !== 'Sonstiges';

  let confidence = 0.55;
  if (nameHit && hasContent) confidence = 0.82;
  else if (nameHit) confidence = 0.72;
  else if (hasContent && category !== 'Sonstiges') confidence = 0.68;
  else if (hasContent) confidence = 0.5;

  const suggestions: string[] = [];
  if (category === 'Auslandsbeleg') {
    suggestions.push('Für Grenzgänger: Ansässigkeit & Lohnausweis in Mein ELSTER prüfen');
  } else if (category === 'Fahrt') {
    suggestions.push('km und Arbeitstage für Entfernungspauschale notieren');
  } else if (isTaxRelevant) {
    suggestions.push('Dokument für die Steuererklärung prüfen');
  }

  return {
    category,
    categoryLabelDe: categoryLabelDe(category),
    taxCategory: inferTaxCategory(category),
    isTaxRelevant,
    year: extractYear(fileName, fileContent),
    confidence,
    method: 'rules',
    suggestions,
  };
}

/** Category list string for AI prompts (DE). */
export function deBelegCategoryHint(): string {
  return DE_BELEG_CATEGORIES.join(', ');
}
