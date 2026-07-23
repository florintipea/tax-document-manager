/**
 * ELSTER preview mapping — Phase 1
 * Maps documents, profile, property/rental/tax-line inputs → Mein ELSTER field hints.
 * Does NOT produce official ELSTER XML or submit to Finanzamt.
 */

export type ElsterAnlage =
  | 'ESt'
  | 'N'
  | 'KAP'
  | 'V'
  | 'AUS'
  | 'Sonderausgaben'
  | 'Außergewöhnliche Belastungen'
  | 'Vorsorge'
  | 'Sonstige';

export type ElsterConfidence = 'high' | 'medium' | 'low' | 'manual';

export interface ElsterLinkedDocument {
  id: string;
  name: string;
  categoryName?: string | null;
  year: number;
  taxAmount?: number | null;
  aiConfidence?: number | null;
}

export interface ElsterPreviewField {
  anlage: ElsterAnlage;
  fieldKey: string;
  fieldLabelDe: string;
  /** Suggested value; null if only a checklist / qualitative hint */
  value: number | string | null;
  valueFormatted?: string;
  documents: ElsterLinkedDocument[];
  notes: string;
  /** User must verify before transferring to Mein ELSTER */
  needsReview: boolean;
  confidence: ElsterConfidence;
  source: string;
  elsterHintDe: string;
}

export interface ElsterGap {
  id: string;
  severity: 'info' | 'warn';
  messageDe: string;
  categoryHint?: string;
}

export interface ElsterAnlageSummary {
  anlage: ElsterAnlage;
  labelDe: string;
  fieldCount: number;
  hasData: boolean;
}

export interface ElsterPreviewResult {
  year: number;
  generatedAt: string;
  disclaimerDe: string;
  gaps: ElsterGap[];
  anlagen: ElsterAnlageSummary[];
  fields: ElsterPreviewField[];
  checklist: string[];
}

export interface TaxProfileForPreview {
  name?: string | null;
  email?: string | null;
  country: string;
  steuerklasse?: string | null;
  bundesland?: string | null;
  deFilingMode?: string | null;
  numberOfChildren?: number | null;
  spouseIncome?: number | null;
  hasRentalIncome?: boolean | null;
  isCrossBorder?: boolean | null;
  workCountry?: string | null;
}

export interface DocumentForPreview {
  id: string;
  name: string;
  year: number;
  taxAmount?: number | null;
  aiConfidence?: number | null;
  isTaxRelevant?: boolean;
  categoryName?: string | null;
  taxCategory?: string | null;
  notes?: string | null;
}

export interface PropertyForPreview {
  id: string;
  label?: string | null;
  address: string;
  purchaseDate?: Date | string | null;
  purchasePrice?: number | null;
  purchaseCosts?: number | null;
  buildingValue?: number | null;
  landValue?: number | null;
  notes?: string | null;
  documentIds: string[];
}

export interface NebenkostenForPreview {
  id: string;
  year: number;
  settlementAmount: number;
  isNachzahlung: boolean;
  objectLabel?: string | null;
  notes?: string | null;
  documentIds: string[];
  propertyId?: string | null;
}

export interface RentalForPreview {
  id: string;
  year: number;
  objectLabel?: string | null;
  grossRent: number;
  operatingCosts: number;
  werbungskosten: number;
  afaAmount?: number | null;
  afaRate?: number | null;
  buildingValue?: number | null;
  notes?: string | null;
  documentIds: string[];
  needsReview?: boolean;
  propertyId?: string | null;
}

export interface TaxLineForPreview {
  id: string;
  year: number;
  kind: string;
  category: string;
  label?: string | null;
  amount: number;
  notes?: string | null;
  documentIds: string[];
  needsReview?: boolean;
}

export interface GrenzgaengerForPreview {
  id: string;
  year: number;
  enabled: boolean;
  workCountry: string;
  residenceCountry: string;
  foreignEmploymentIncome: number;
  foreignWithholdingTax: number;
  commutingKmOneWay?: number | null;
  commutingDays?: number | null;
  socialInsuranceCountry?: string | null;
  dbaMethodHint?: string | null;
  notes?: string | null;
  documentIds: string[];
  needsReview?: boolean;
}

const DISCLAIMER_DE =
  'Keine Steuerberatung. TaxDoc schlägt nur vor, welche Werte Sie in Mein ELSTER prüfen und selbst eintragen können. Elektronische Abgabe ist Pflicht — Übermittlung erfolgt ausschließlich durch Sie über Mein ELSTER. Kein offizielles ELSTER-XML und keine automatische Abgabe.';

const ANLAGE_LABELS: Record<ElsterAnlage, string> = {
  ESt: 'Mantelbogen / ESt',
  N: 'Anlage N (nichtselbstständige Arbeit)',
  KAP: 'Anlage KAP (Kapitalerträge)',
  V: 'Anlage V (Vermietung & Verpachtung)',
  AUS: 'Anlage AUS / ausländische Einkünfte',
  Sonderausgaben: 'Sonderausgaben',
  'Außergewöhnliche Belastungen': 'Außergewöhnliche Belastungen',
  Vorsorge: 'Vorsorgeaufwendungen',
  Sonstige: 'Sonstige Angaben',
};

const CATEGORY_TO_KIND: Array<{
  match: RegExp;
  anlage: ElsterAnlage;
  fieldKey: string;
  fieldLabelDe: string;
  elsterHintDe: string;
  expense?: boolean;
  needsReviewAlways?: boolean;
}> = [
  {
    match: /gehalt|lohn|w-2|pay.?stub|lohnsteuerbescheinigung/i,
    anlage: 'N',
    fieldKey: 'n.brutto',
    fieldLabelDe: 'Bruttoarbeitslohn / Einkünfte aus nichtselbstständiger Arbeit',
    elsterHintDe: 'Anlage N — Zeile Bruttoarbeitslohn (laut Lohnsteuerbescheinigung prüfen)',
  },
  {
    match: /kapital|dividende|zinsen|depot|1099/i,
    anlage: 'KAP',
    fieldKey: 'kap.ertraege',
    fieldLabelDe: 'Kapitalerträge',
    elsterHintDe: 'Anlage KAP — Kapitalerträge laut Steuerbescheinigung der Bank',
  },
  {
    match: /vermiet|verpacht|mieteinnahm/i,
    anlage: 'V',
    fieldKey: 'v.einnahmen',
    fieldLabelDe: 'Einnahmen aus Vermietung und Verpachtung',
    elsterHintDe: 'Anlage V — Einnahmen (Miete)',
  },
  {
    match: /nebenkosten/i,
    anlage: 'V',
    fieldKey: 'v.nebenkosten',
    fieldLabelDe: 'Nebenkostenabrechnung (Bezug Objekt)',
    elsterHintDe: 'Je nach Rolle (Vermieter/Mieter) in Anlage V oder als Nachweis prüfen',
    needsReviewAlways: true,
  },
  {
    match: /immobilienkauf|kaufvertrag|notar/i,
    anlage: 'V',
    fieldKey: 'v.kauf',
    fieldLabelDe: 'Immobilienkauf / Anschaffungskosten',
    elsterHintDe: 'Anlage V — Anschaffungskosten / AfA-Grundlage (vom Nutzer zu prüfen)',
    needsReviewAlways: true,
  },
  {
    match: /werbungskosten|fahrt|homeoffice|fortbildung/i,
    anlage: 'N',
    fieldKey: 'n.werbungskosten',
    fieldLabelDe: 'Werbungskosten (Arbeitnehmer)',
    elsterHintDe: 'Anlage N — Werbungskosten (Pauschale vs. Einzelnachweis prüfen)',
    expense: true,
  },
  {
    match: /versicherung|vorsorge|kranken|renten/i,
    anlage: 'Vorsorge',
    fieldKey: 'vorsorge.beitraege',
    fieldLabelDe: 'Versicherungs- / Vorsorgebeiträge',
    elsterHintDe: 'Vorsorgeaufwendungen — Beiträge laut Bescheinigung',
    expense: true,
  },
  {
    match: /spende|zuwendung/i,
    anlage: 'Sonderausgaben',
    fieldKey: 'sa.spenden',
    fieldLabelDe: 'Spenden / Zuwendungen',
    elsterHintDe: 'Sonderausgaben — Spenden (Zuwendungsbestätigung beilegen)',
    expense: true,
  },
  {
    match: /sonderausgabe/i,
    anlage: 'Sonderausgaben',
    fieldKey: 'sa.sonstige',
    fieldLabelDe: 'Sonderausgaben',
    elsterHintDe: 'Sonderausgaben — Position prüfen',
    expense: true,
  },
  {
    match: /apotheke|gesundheit|arzt|medizin|krankenhaustage/i,
    anlage: 'Außergewöhnliche Belastungen',
    fieldKey: 'agb.gesundheit',
    fieldLabelDe: 'Gesundheits- / Apothekenkosten',
    elsterHintDe:
      'Außergewöhnliche Belastungen — Zumutbarkeitsgrenze prüfen; Beträge nur nach Prüfung eintragen',
    expense: true,
    needsReviewAlways: true,
  },
  {
    match: /außergew|aussergew|agb/i,
    anlage: 'Außergewöhnliche Belastungen',
    fieldKey: 'agb.sonstige',
    fieldLabelDe: 'Außergewöhnliche Belastungen',
    elsterHintDe: 'Außergewöhnliche Belastungen — Voraussetzungen und Zumutbarkeit prüfen',
    expense: true,
    needsReviewAlways: true,
  },
  {
    match: /lohnausweis|ausland.*lohn|foreign.?pay/i,
    anlage: 'AUS',
    fieldKey: 'aus.lohnausweis',
    fieldLabelDe: 'Lohnausweis Ausland',
    elsterHintDe: 'Anlage AUS / N — ausländische Einkünfte in Mein ELSTER prüfen',
    needsReviewAlways: true,
  },
  {
    match: /quellensteuer/i,
    anlage: 'AUS',
    fieldKey: 'aus.quellensteuer',
    fieldLabelDe: 'Quellensteuer-Bescheinigung',
    elsterHintDe: 'Anrechnung / Freistellung laut DBA in Mein ELSTER prüfen',
    needsReviewAlways: true,
  },
  {
    match: /\ba1\b|a1-bescheinigung/i,
    anlage: 'AUS',
    fieldKey: 'aus.a1',
    fieldLabelDe: 'A1-Bescheinigung (Sozialversicherung)',
    elsterHintDe: 'Nachweis Sozialversicherung — Zuordnung in Mein ELSTER prüfen',
    needsReviewAlways: true,
  },
  {
    match: /ansässigkeit|ansaessigkeit|ansassigkeit/i,
    anlage: 'AUS',
    fieldKey: 'aus.ansaessigkeit',
    fieldLabelDe: 'Ansässigkeitsbescheinigung',
    elsterHintDe: 'Ansässigkeit DE — Beleg für DBA / Freistellung prüfen',
    needsReviewAlways: true,
  },
  {
    match: /grenzgänger|grenzgaenger|grenzganger|cross.?border/i,
    anlage: 'AUS',
    fieldKey: 'aus.grenzgaenger',
    fieldLabelDe: 'Grenzgänger-Nachweis',
    elsterHintDe: 'Grenzgänger-Status und DBA-Regel in Mein ELSTER prüfen',
    needsReviewAlways: true,
  },
];

const TAX_LINE_CATEGORY_MAP: Record<
  string,
  {
    anlage: ElsterAnlage;
    fieldKey: string;
    fieldLabelDe: string;
    elsterHintDe: string;
    needsReviewAlways?: boolean;
  }
> = {
  gehalt: {
    anlage: 'N',
    fieldKey: 'n.brutto.manual',
    fieldLabelDe: 'Gehalt / Lohn (manuell)',
    elsterHintDe: 'Anlage N — Bruttoarbeitslohn',
  },
  kapital: {
    anlage: 'KAP',
    fieldKey: 'kap.manual',
    fieldLabelDe: 'Kapitalerträge (manuell)',
    elsterHintDe: 'Anlage KAP',
  },
  sonstige_einnahmen: {
    anlage: 'Sonstige',
    fieldKey: 'sonst.einnahmen',
    fieldLabelDe: 'Sonstige Einnahmen',
    elsterHintDe: 'Je nach Art der Einnahme passende Anlage wählen',
    needsReviewAlways: true,
  },
  werbungskosten: {
    anlage: 'N',
    fieldKey: 'n.wk.manual',
    fieldLabelDe: 'Werbungskosten',
    elsterHintDe: 'Anlage N — Werbungskosten',
  },
  sonderausgaben: {
    anlage: 'Sonderausgaben',
    fieldKey: 'sa.manual',
    fieldLabelDe: 'Sonderausgaben',
    elsterHintDe: 'Sonderausgaben',
  },
  agb: {
    anlage: 'Außergewöhnliche Belastungen',
    fieldKey: 'agb.manual',
    fieldLabelDe: 'Außergewöhnliche Belastungen',
    elsterHintDe: 'Zumutbarkeit prüfen',
    needsReviewAlways: true,
  },
  gesundheit: {
    anlage: 'Außergewöhnliche Belastungen',
    fieldKey: 'agb.gesundheit.manual',
    fieldLabelDe: 'Apotheke / Gesundheit',
    elsterHintDe: 'Außergewöhnliche Belastungen — Zumutbarkeitsgrenze prüfen',
    needsReviewAlways: true,
  },
  versicherung: {
    anlage: 'Vorsorge',
    fieldKey: 'vorsorge.manual',
    fieldLabelDe: 'Versicherungen',
    elsterHintDe: 'Vorsorgeaufwendungen',
  },
  spenden: {
    anlage: 'Sonderausgaben',
    fieldKey: 'sa.spenden.manual',
    fieldLabelDe: 'Spenden',
    elsterHintDe: 'Sonderausgaben — Spenden',
  },
};

function parseDocumentIds(raw: string | string[] | null | undefined): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDateDe(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('de-DE');
}

function linkDocs(
  ids: string[],
  byId: Map<string, DocumentForPreview>
): ElsterLinkedDocument[] {
  return ids
    .map((id) => byId.get(id))
    .filter((d): d is DocumentForPreview => Boolean(d))
    .map((d) => ({
      id: d.id,
      name: d.name,
      categoryName: d.categoryName,
      year: d.year,
      taxAmount: d.taxAmount,
      aiConfidence: d.aiConfidence,
    }));
}

function matchCategoryRule(categoryName: string | null | undefined) {
  if (!categoryName) return null;
  return CATEGORY_TO_KIND.find((r) => r.match.test(categoryName)) ?? null;
}

function sumAmounts(docs: DocumentForPreview[]): number {
  return docs.reduce((sum, d) => sum + (typeof d.taxAmount === 'number' ? d.taxAmount : 0), 0);
}

function confidenceFromDocs(docs: DocumentForPreview[]): ElsterConfidence {
  if (docs.length === 0) return 'manual';
  const confs = docs
    .map((d) => d.aiConfidence)
    .filter((c): c is number => typeof c === 'number');
  if (confs.length === 0) return 'medium';
  const avg = confs.reduce((a, b) => a + b, 0) / confs.length;
  if (avg >= 0.8) return 'high';
  if (avg >= 0.5) return 'medium';
  return 'low';
}

export function buildElsterPreview(input: {
  year: number;
  profile: TaxProfileForPreview;
  documents: DocumentForPreview[];
  properties: PropertyForPreview[];
  nebenkosten: NebenkostenForPreview[];
  rentals: RentalForPreview[];
  taxLines: TaxLineForPreview[];
  grenzgaenger?: GrenzgaengerForPreview | null;
}): ElsterPreviewResult {
  const {
    year,
    profile,
    documents,
    properties,
    nebenkosten,
    rentals,
    taxLines,
    grenzgaenger,
  } = input;
  const fields: ElsterPreviewField[] = [];
  const gaps: ElsterGap[] = [];
  const docById = new Map(documents.map((d) => [d.id, d]));
  const yearDocs = documents.filter((d) => d.year === year);

  // Profile → ESt
  fields.push({
    anlage: 'ESt',
    fieldKey: 'est.veranlagungsart',
    fieldLabelDe: 'Veranlagungsart',
    value: profile.deFilingMode === 'zusammen' ? 'Zusammenveranlagung' : 'Einzelveranlagung',
    documents: [],
    notes: 'Aus Steuerprofil',
    needsReview: true,
    confidence: 'manual',
    source: 'profil',
    elsterHintDe: 'Mantelbogen — Veranlagungsart wählen',
  });

  if (profile.steuerklasse) {
    fields.push({
      anlage: 'ESt',
      fieldKey: 'est.steuerklasse',
      fieldLabelDe: 'Steuerklasse (Hinweis)',
      value: profile.steuerklasse,
      documents: [],
      notes: 'Nur Hinweis — Lohnsteuerklasse steht auf der Lohnsteuerbescheinigung',
      needsReview: false,
      confidence: 'high',
      source: 'profil',
      elsterHintDe: 'Zur Plausibilitätsprüfung mit Lohnsteuerbescheinigung abgleichen',
    });
  }

  if (profile.numberOfChildren && profile.numberOfChildren > 0) {
    fields.push({
      anlage: 'ESt',
      fieldKey: 'est.kinder',
      fieldLabelDe: 'Anzahl Kinder (Profil)',
      value: profile.numberOfChildren,
      documents: [],
      notes: 'Kindergeld / Kinderfreibetrag in ELSTER gesondert prüfen',
      needsReview: true,
      confidence: 'manual',
      source: 'profil',
      elsterHintDe: 'Anlage Kind / Kindergeld — Angaben prüfen',
    });
  }

  if (profile.deFilingMode === 'zusammen' && (profile.spouseIncome ?? 0) > 0) {
    fields.push({
      anlage: 'N',
      fieldKey: 'n.spouse',
      fieldLabelDe: 'Einkünfte Ehepartner (Profil-Schätzung)',
      value: profile.spouseIncome ?? 0,
      valueFormatted: formatEur(profile.spouseIncome ?? 0),
      documents: [],
      notes: 'Aus Steuerprofil — mit Lohnsteuerbescheinigung des Partners abgleichen',
      needsReview: true,
      confidence: 'low',
      source: 'profil',
      elsterHintDe: 'Anlage N (Ehepartner)',
    });
  }

  // Group year documents by mapped category
  const grouped = new Map<string, DocumentForPreview[]>();
  for (const doc of yearDocs) {
    const rule = matchCategoryRule(doc.categoryName) ?? matchCategoryRule(doc.taxCategory);
    const key = rule
      ? `${rule.anlage}::${rule.fieldKey}`
      : doc.categoryName
        ? `Sonstige::cat.${doc.categoryName}`
        : 'Sonstige::uncategorized';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(doc);
  }

  for (const [key, docs] of grouped) {
    const sample = docs[0];
    const rule =
      matchCategoryRule(sample.categoryName) ?? matchCategoryRule(sample.taxCategory);
    const total = sumAmounts(docs);
    const hasAmount = total > 0;

    if (rule) {
      fields.push({
        anlage: rule.anlage,
        fieldKey: rule.fieldKey,
        fieldLabelDe: rule.fieldLabelDe,
        value: hasAmount ? total : null,
        valueFormatted: hasAmount ? formatEur(total) : undefined,
        documents: docs.map((d) => ({
          id: d.id,
          name: d.name,
          categoryName: d.categoryName,
          year: d.year,
          taxAmount: d.taxAmount,
          aiConfidence: d.aiConfidence,
        })),
        notes: hasAmount
          ? `Summe aus ${docs.length} Beleg(en) — vom Nutzer zu prüfen`
          : `${docs.length} Beleg(e) ohne Betrag — Betrag manuell ergänzen`,
        needsReview: true,
        confidence: confidenceFromDocs(docs),
        source: 'dokumente',
        elsterHintDe: rule.elsterHintDe,
      });
    } else {
      fields.push({
        anlage: 'Sonstige',
        fieldKey: key,
        fieldLabelDe: sample.categoryName || 'Unkategorisierte Belege',
        value: hasAmount ? total : null,
        valueFormatted: hasAmount ? formatEur(total) : undefined,
        documents: docs.map((d) => ({
          id: d.id,
          name: d.name,
          categoryName: d.categoryName,
          year: d.year,
          taxAmount: d.taxAmount,
          aiConfidence: d.aiConfidence,
        })),
        notes: 'Kategorie keinem festen ELSTER-Feld zugeordnet — Zuordnung prüfen',
        needsReview: true,
        confidence: 'low',
        source: 'dokumente',
        elsterHintDe: 'Passende Anlage in Mein ELSTER manuell wählen',
      });
    }
  }

  // Properties (Kauf)
  for (const prop of properties) {
    const linked = linkDocs(parseDocumentIds(prop.documentIds), docById);
    const label = prop.label || prop.address;
    if (prop.purchasePrice != null) {
      fields.push({
        anlage: 'V',
        fieldKey: `v.kauf.preis.${prop.id}`,
        fieldLabelDe: `Kaufpreis — ${label}`,
        value: prop.purchasePrice,
        valueFormatted: formatEur(prop.purchasePrice),
        documents: linked,
        notes: [
          prop.purchaseDate ? `Kaufdatum: ${formatDateDe(prop.purchaseDate)}` : null,
          prop.address,
          prop.notes,
        ]
          .filter(Boolean)
          .join(' · '),
        needsReview: true,
        confidence: 'manual',
        source: 'immobilie',
        elsterHintDe: 'Anlage V — Anschaffungskosten / Grundlage AfA (prüfen)',
      });
    }
    if (prop.purchaseCosts != null && prop.purchaseCosts > 0) {
      fields.push({
        anlage: 'V',
        fieldKey: `v.kauf.nebenkosten.${prop.id}`,
        fieldLabelDe: `Anschaffungsnebenkosten — ${label}`,
        value: prop.purchaseCosts,
        valueFormatted: formatEur(prop.purchaseCosts),
        documents: linked,
        notes: 'Notar, Grunderwerbsteuer, Makler etc. — AfA-fähiger Anteil prüfen',
        needsReview: true,
        confidence: 'manual',
        source: 'immobilie',
        elsterHintDe: 'Anlage V — Anschaffungsnebenkosten',
      });
    }
    if (prop.buildingValue != null && prop.buildingValue > 0) {
      fields.push({
        anlage: 'V',
        fieldKey: `v.afa.basis.${prop.id}`,
        fieldLabelDe: `Gebäudewert (AfA-Basis) — ${label}`,
        value: prop.buildingValue,
        valueFormatted: formatEur(prop.buildingValue),
        documents: linked,
        notes: 'AfA-Satz und Nutzungsdauer vom Nutzer zu prüfen (kein automatischer Rechtsanspruch)',
        needsReview: true,
        confidence: 'low',
        source: 'immobilie',
        elsterHintDe: 'Anlage V — AfA Gebäude',
      });
    }
  }

  // Nebenkostenabrechnungen for year
  for (const nk of nebenkosten.filter((n) => n.year === year)) {
    const linked = linkDocs(parseDocumentIds(nk.documentIds), docById);
    const signed = nk.isNachzahlung ? nk.settlementAmount : -Math.abs(nk.settlementAmount);
    fields.push({
      anlage: 'V',
      fieldKey: `v.nk.${nk.id}`,
      fieldLabelDe: `Nebenkostenabrechnung ${year}${nk.objectLabel ? ` — ${nk.objectLabel}` : ''}`,
      value: signed,
      valueFormatted: `${nk.isNachzahlung ? 'Nachzahlung' : 'Guthaben'}: ${formatEur(Math.abs(nk.settlementAmount))}`,
      documents: linked,
      notes: nk.notes || 'Rolle (Vermieter/Mieter) und steuerliche Behandlung prüfen',
      needsReview: true,
      confidence: linked.length ? 'medium' : 'manual',
      source: 'nebenkosten',
      elsterHintDe: 'Anlage V bzw. Nachweis — Zuordnung prüfen',
    });
  }

  // Rental year entries
  for (const r of rentals.filter((x) => x.year === year)) {
    const linked = linkDocs(parseDocumentIds(r.documentIds), docById);
    const label = r.objectLabel || 'Objekt';
    if (r.grossRent > 0) {
      fields.push({
        anlage: 'V',
        fieldKey: `v.miete.${r.id}`,
        fieldLabelDe: `Mieteinnahmen — ${label}`,
        value: r.grossRent,
        valueFormatted: formatEur(r.grossRent),
        documents: linked,
        notes: r.notes || '',
        needsReview: r.needsReview !== false,
        confidence: 'manual',
        source: 'vermietung',
        elsterHintDe: 'Anlage V — Einnahmen',
      });
    }
    const costs = r.operatingCosts + r.werbungskosten;
    if (costs > 0) {
      fields.push({
        anlage: 'V',
        fieldKey: `v.wk.${r.id}`,
        fieldLabelDe: `Werbungskosten V&V — ${label}`,
        value: costs,
        valueFormatted: formatEur(costs),
        documents: linked,
        notes: `Betriebskosten ${formatEur(r.operatingCosts)} + weitere WK ${formatEur(r.werbungskosten)}`,
        needsReview: true,
        confidence: 'manual',
        source: 'vermietung',
        elsterHintDe: 'Anlage V — Werbungskosten',
      });
    }
    if (r.afaAmount != null && r.afaAmount > 0) {
      fields.push({
        anlage: 'V',
        fieldKey: `v.afa.${r.id}`,
        fieldLabelDe: `AfA (Stub) — ${label}`,
        value: r.afaAmount,
        valueFormatted: formatEur(r.afaAmount),
        documents: linked,
        notes: [
          r.afaRate != null ? `Satz ${r.afaRate}%` : null,
          r.buildingValue != null ? `Gebäudewert ${formatEur(r.buildingValue)}` : null,
          'AfA-Berechnung ist ein Stub — rechtliche Zulässigkeit selbst prüfen',
        ]
          .filter(Boolean)
          .join(' · '),
        needsReview: true,
        confidence: 'low',
        source: 'vermietung',
        elsterHintDe: 'Anlage V — Absetzung für Abnutzung',
      });
    }
  }

  // Manual tax lines
  for (const line of taxLines.filter((l) => l.year === year)) {
    const map = TAX_LINE_CATEGORY_MAP[line.category] ?? {
      anlage: 'Sonstige' as ElsterAnlage,
      fieldKey: `line.${line.category}`,
      fieldLabelDe: line.label || line.category,
      elsterHintDe: 'Zuordnung in Mein ELSTER prüfen',
      needsReviewAlways: true,
    };
    const linked = linkDocs(parseDocumentIds(line.documentIds), docById);
    fields.push({
      anlage: map.anlage,
      fieldKey: `${map.fieldKey}.${line.id}`,
      fieldLabelDe: line.label || map.fieldLabelDe,
      value: line.amount,
      valueFormatted: formatEur(line.amount),
      documents: linked,
      notes: line.notes || (line.kind === 'income' ? 'Einnahme' : 'Ausgabe'),
      needsReview: line.needsReview !== false || Boolean(map.needsReviewAlways),
      confidence: 'manual',
      source: 'manuell',
      elsterHintDe: map.elsterHintDe,
    });
  }

  // Grenzgänger / Ausland
  const gg =
    grenzgaenger && grenzgaenger.year === year && grenzgaenger.enabled
      ? grenzgaenger
      : null;
  if (gg || profile.isCrossBorder) {
    const linked = gg ? linkDocs(parseDocumentIds(gg.documentIds), docById) : [];
    const workCountry = gg?.workCountry || profile.workCountry || '—';
    const residence = gg?.residenceCountry || 'DE';

    fields.push({
      anlage: 'AUS',
      fieldKey: 'aus.status',
      fieldLabelDe: 'Grenzgänger-Status',
      value: `Wohnsitz ${residence}, Arbeit ${workCountry}`,
      documents: linked,
      notes:
        'Keine Steuerberatung. DBA-Regeln (Freistellung vs. Anrechnung) unterscheiden sich je Arbeitsland — in Mein ELSTER und ggf. mit Fachkunde prüfen.',
      needsReview: true,
      confidence: 'manual',
      source: 'grenzgaenger',
      elsterHintDe: 'Anlage AUS / ausländische Einkünfte — Status und DBA in Mein ELSTER prüfen',
    });

    if (gg && gg.foreignEmploymentIncome > 0) {
      fields.push({
        anlage: 'AUS',
        fieldKey: `aus.lohn.${gg.id}`,
        fieldLabelDe: `Auslandseinkommen / Arbeitslohn (${workCountry})`,
        value: gg.foreignEmploymentIncome,
        valueFormatted: formatEur(gg.foreignEmploymentIncome),
        documents: linked,
        notes: 'Mit Lohnausweis Ausland abgleichen — vom Nutzer zu prüfen',
        needsReview: true,
        confidence: linked.length ? 'medium' : 'manual',
        source: 'grenzgaenger',
        elsterHintDe: 'Anlage AUS / N — ausländische Einkünfte in Mein ELSTER prüfen',
      });
    }

    if (gg && gg.foreignWithholdingTax > 0) {
      fields.push({
        anlage: 'AUS',
        fieldKey: `aus.quellen.${gg.id}`,
        fieldLabelDe: `Quellensteuer / ausländische Abzüge (${workCountry})`,
        value: gg.foreignWithholdingTax,
        valueFormatted: formatEur(gg.foreignWithholdingTax),
        documents: linked,
        notes:
          'Anrechnung oder Freistellung hängt vom DBA ab — Betrag nicht ungeprüft als deutsche Steuerüberzahlung übernehmen',
        needsReview: true,
        confidence: 'low',
        source: 'grenzgaenger',
        elsterHintDe: 'Anlage AUS — ausländische Steuer / Anrechnung in Mein ELSTER prüfen',
      });
    }

    if (gg?.dbaMethodHint) {
      const dbaLabel =
        gg.dbaMethodHint === 'freistellung'
          ? 'Hinweis Freistellungsmethode (DBA)'
          : gg.dbaMethodHint === 'anrechnung'
            ? 'Hinweis Anrechnungsmethode (DBA)'
            : 'DBA-Methode unbekannt / zu klären';
      fields.push({
        anlage: 'AUS',
        fieldKey: `aus.dba.${gg.id}`,
        fieldLabelDe: dbaLabel,
        value: gg.dbaMethodHint,
        documents: linked,
        notes:
          'Nur Info-Hinweis, keine Rechtsauskunft. Das konkrete DBA mit dem Arbeitsland entscheidet — in Mein ELSTER prüfen.',
        needsReview: true,
        confidence: 'low',
        source: 'grenzgaenger',
        elsterHintDe: 'DBA-Behandlung in Mein ELSTER / Anlage AUS prüfen',
      });
    }

    if (gg && (gg.commutingKmOneWay || gg.commutingDays)) {
      const km = gg.commutingKmOneWay ?? 0;
      const days = gg.commutingDays ?? 0;
      const stubPauschale = km > 0 && days > 0 ? Math.round(km * 0.3 * days * 100) / 100 : null;
      fields.push({
        anlage: 'N',
        fieldKey: `aus.pendel.${gg.id}`,
        fieldLabelDe: 'Pendlerpauschale / Fahrten DE ↔ Ausland (Stub)',
        value: stubPauschale,
        valueFormatted: stubPauschale != null ? formatEur(stubPauschale) : undefined,
        documents: linked,
        notes: [
          km > 0 ? `${km} km einfach` : null,
          days > 0 ? `${days} Tage` : null,
          'Entfernungspauschale-Regeln und Grenzgänger-Sonderfälle prüfen — Stub ist keine verbindliche Berechnung',
        ]
          .filter(Boolean)
          .join(' · '),
        needsReview: true,
        confidence: 'low',
        source: 'grenzgaenger',
        elsterHintDe: 'Anlage N — Werbungskosten / Entfernungspauschale in Mein ELSTER prüfen',
      });
    }

    if (gg?.socialInsuranceCountry) {
      fields.push({
        anlage: 'AUS',
        fieldKey: `aus.sv.${gg.id}`,
        fieldLabelDe: 'Sozialversicherung — Versicherungsland',
        value: gg.socialInsuranceCountry,
        documents: linked,
        notes: 'A1 / SV-Nachweise zuordnen — vom Nutzer zu prüfen',
        needsReview: true,
        confidence: 'manual',
        source: 'grenzgaenger',
        elsterHintDe: 'Sozialversicherung / A1 in Mein ELSTER bzw. Belege prüfen',
      });
    }
  }

  // Gaps
  if (yearDocs.length === 0) {
    gaps.push({
      id: 'no-docs',
      severity: 'warn',
      messageDe: `Keine Dokumente für ${year}. Bitte Belege hochladen oder manuelle Beträge erfassen.`,
    });
  }
  const hasGehalt =
    yearDocs.some((d) => /gehalt|lohn/i.test(d.categoryName || '')) ||
    taxLines.some((l) => l.year === year && l.category === 'gehalt') ||
    Boolean(gg && gg.foreignEmploymentIncome > 0);
  if (!hasGehalt) {
    gaps.push({
      id: 'gap-gehalt',
      severity: 'warn',
      messageDe: 'Keine Gehalts-/Lohnbelege erkannt — Anlage N möglicherweise unvollständig.',
      categoryHint: 'Gehaltsabrechnungen',
    });
  }
  if (profile.hasRentalIncome && rentals.filter((r) => r.year === year).length === 0) {
    gaps.push({
      id: 'gap-rental',
      severity: 'warn',
      messageDe: 'Vermietung im Profil aktiv, aber keine V&V-Daten für dieses Jahr.',
      categoryHint: 'Vermietung & Verpachtung',
    });
  }
  if (properties.length === 0 && yearDocs.some((d) => /immobilie|kauf/i.test(d.categoryName || ''))) {
    gaps.push({
      id: 'gap-property-form',
      severity: 'info',
      messageDe: 'Immobilienkauf-Belege vorhanden — Kaufdaten im Assistenten erfassen für bessere Zuordnung.',
      categoryHint: 'Immobilienkauf',
    });
  }
  const healthDocs = yearDocs.filter((d) =>
    /apotheke|gesundheit|arzt/i.test(d.categoryName || '')
  );
  if (healthDocs.length > 0) {
    gaps.push({
      id: 'gap-agb-threshold',
      severity: 'info',
      messageDe:
        'Gesundheitsbelege gefunden. Außergewöhnliche Belastungen unterliegen der Zumutbarkeitsgrenze — Beträge als „prüfen“ markiert, keine automatische Anrechnung.',
      categoryHint: 'Apotheke/Gesundheit',
    });
  }
  if (gg || profile.isCrossBorder) {
    gaps.push({
      id: 'gap-cross-border',
      severity: 'info',
      messageDe:
        'Grenzgänger: DBA unterscheidet sich nach Arbeitsland (Freistellung vs. Anrechnung). TaxDoc gibt keine Rechtsberatung — Angaben in Mein ELSTER selbst prüfen.',
      categoryHint: 'Lohnausweis Ausland',
    });
    const ggDocCats = yearDocs.filter((d) =>
      /lohnausweis|quellensteuer|a1|ansässigkeit|ansaessigkeit|grenzgänger|grenzgaenger/i.test(
        d.categoryName || ''
      )
    );
    if (ggDocCats.length === 0) {
      gaps.push({
        id: 'gap-gg-docs',
        severity: 'warn',
        messageDe:
          'Grenzgänger aktiv, aber keine typischen Auslandsbelege (Lohnausweis, Quellensteuer, A1, Ansässigkeit, Grenzgänger-Nachweis).',
        categoryHint: 'Lohnausweis Ausland',
      });
    }
  }

  // Anlagen summary — only those with data
  const anlageCounts = new Map<ElsterAnlage, number>();
  for (const f of fields) {
    anlageCounts.set(f.anlage, (anlageCounts.get(f.anlage) || 0) + 1);
  }
  const anlagen: ElsterAnlageSummary[] = (
    Object.keys(ANLAGE_LABELS) as ElsterAnlage[]
  )
    .map((anlage) => ({
      anlage,
      labelDe: ANLAGE_LABELS[anlage],
      fieldCount: anlageCounts.get(anlage) || 0,
      hasData: (anlageCounts.get(anlage) || 0) > 0,
    }))
    .filter((a) => a.hasData);

  const checklist = [
    'In Mein ELSTER anmelden und das richtige Veranlagungsjahr wählen.',
    'Mantelbogen: Personendaten und Veranlagungsart mit Ihrem Profil abgleichen.',
    ...anlagen.map(
      (a) =>
        `${a.labelDe}: ${a.fieldCount} Vorschau-Feld(er) in TaxDoc prüfen und Beträge übertragen.`
    ),
    'Jeden Betrag mit den verlinkten Belegen abgleichen — „prüfen“-Markierungen nicht überspringen.',
    'Gesundheits-/Apothekenkosten: Zumutbarkeit selbst prüfen, nicht ungeprüft übernehmen.',
    'AfA und Immobilienkauf: Anschaffungskosten und Gebäudeanteil mit Kaufunterlagen prüfen.',
    ...(gg || profile.isCrossBorder
      ? [
          'Grenzgänger: Lohnausweis Ausland, Quellensteuer und DBA-Methode (Freistellung/Anrechnung) landesspezifisch prüfen.',
          'Pendlerpauschale DE ↔ Ausland und Sozialversicherungsland (A1) in Mein ELSTER prüfen.',
        ]
      : []),
    'Elektronisch über Mein ELSTER absenden (Abgabepflicht). TaxDoc übermittelt nichts.',
  ];

  return {
    year,
    generatedAt: new Date().toISOString(),
    disclaimerDe: DISCLAIMER_DE,
    gaps,
    anlagen,
    fields,
    checklist,
  };
}

export function parseDocumentIdList(raw: string | string[] | null | undefined): string[] {
  return parseDocumentIds(raw);
}

export function serializeDocumentIds(ids: string[]): string {
  return JSON.stringify(ids.filter(Boolean));
}

export const TAX_LINE_CATEGORIES = [
  { id: 'gehalt', kind: 'income', labelDe: 'Gehalt / Lohn' },
  { id: 'kapital', kind: 'income', labelDe: 'Kapitalerträge' },
  { id: 'sonstige_einnahmen', kind: 'income', labelDe: 'Sonstige Einnahmen' },
  { id: 'werbungskosten', kind: 'expense', labelDe: 'Werbungskosten' },
  { id: 'sonderausgaben', kind: 'expense', labelDe: 'Sonderausgaben' },
  { id: 'agb', kind: 'expense', labelDe: 'Außergewöhnliche Belastungen' },
  { id: 'gesundheit', kind: 'expense', labelDe: 'Apotheke / Gesundheit' },
  { id: 'versicherung', kind: 'expense', labelDe: 'Versicherungen' },
  { id: 'spenden', kind: 'expense', labelDe: 'Spenden' },
] as const;
