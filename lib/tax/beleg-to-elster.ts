/**
 * Beleg → ELSTER Zeile mapping (KI-Vorschlag, unverbindlich).
 * Does NOT submit to Mein ELSTER / ERiC.
 */

import {
  normalizeDeBelegCategory,
  type DeBelegCategory,
} from '@/lib/ai/beleg-sort';
import type { ElsterAnlage, ElsterConfidence } from '@/lib/tax/elster-preview';

export type TaxLineCategoryId =
  | 'gehalt'
  | 'kapital'
  | 'sonstige_einnahmen'
  | 'werbungskosten'
  | 'sonderausgaben'
  | 'agb'
  | 'gesundheit'
  | 'versicherung'
  | 'spenden';

export interface BelegElsterMapping {
  /** Prefer existing DE DocumentCategory names when storing */
  storageCategory: string;
  anlage: ElsterAnlage;
  fieldKey: string;
  fieldLabelDe: string;
  elsterHintDe: string;
  taxLineCategory: TaxLineCategoryId | null;
  taxLineKind: 'income' | 'expense' | null;
  /** Always show „prüfen“ for these mappings */
  needsReviewAlways: boolean;
  /** Confidence floor when amount is missing */
  confidenceWhenNoAmount: ElsterConfidence;
}

const BELEG_TO_ELSTER: Record<DeBelegCategory, BelegElsterMapping> = {
  Lohnabrechnung: {
    storageCategory: 'Gehaltsabrechnungen',
    anlage: 'N',
    fieldKey: 'n.brutto',
    fieldLabelDe: 'Bruttoarbeitslohn / Einkünfte aus nichtselbstständiger Arbeit',
    elsterHintDe: 'Anlage N — Zeile Bruttoarbeitslohn (laut Lohnsteuerbescheinigung prüfen)',
    taxLineCategory: 'gehalt',
    taxLineKind: 'income',
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'medium',
  },
  Rechnung: {
    storageCategory: 'Rechnungen',
    anlage: 'N',
    fieldKey: 'n.werbungskosten',
    fieldLabelDe: 'Werbungskosten (Rechnung / Quittung)',
    elsterHintDe: 'Anlage N — Werbungskosten oder passende Anlage prüfen (KI-Vorschlag)',
    taxLineCategory: 'werbungskosten',
    taxLineKind: 'expense',
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'low',
  },
  Spende: {
    storageCategory: 'Spenden',
    anlage: 'Sonderausgaben',
    fieldKey: 'sa.spenden',
    fieldLabelDe: 'Spenden / Zuwendungen',
    elsterHintDe: 'Sonderausgaben — Spenden (Zuwendungsbestätigung beilegen)',
    taxLineCategory: 'spenden',
    taxLineKind: 'expense',
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'medium',
  },
  Fahrt: {
    storageCategory: 'Werbungskosten',
    anlage: 'N',
    fieldKey: 'n.werbungskosten',
    fieldLabelDe: 'Werbungskosten (Fahrt / Pendeln)',
    elsterHintDe: 'Anlage N — Entfernungspauschale / Fahrkosten prüfen',
    taxLineCategory: 'werbungskosten',
    taxLineKind: 'expense',
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'low',
  },
  Versicherung: {
    storageCategory: 'Versicherungen',
    anlage: 'Vorsorge',
    fieldKey: 'vorsorge.beitraege',
    fieldLabelDe: 'Versicherungs- / Vorsorgebeiträge',
    elsterHintDe: 'Vorsorgeaufwendungen — Beiträge laut Bescheinigung prüfen',
    taxLineCategory: 'versicherung',
    taxLineKind: 'expense',
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'medium',
  },
  Kontoauszug: {
    storageCategory: 'Kontoauszüge',
    anlage: 'Sonstige',
    fieldKey: 'sonst.konto',
    fieldLabelDe: 'Kontoauszug (Zuordnung prüfen)',
    elsterHintDe: 'Kein festes ELSTER-Feld — relevante Buchungen manuell zuordnen',
    taxLineCategory: null,
    taxLineKind: null,
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'low',
  },
  Steuerdokument: {
    storageCategory: 'Steuerdokumente',
    anlage: 'Sonstige',
    fieldKey: 'sonst.steuerdok',
    fieldLabelDe: 'Steuerdokument (Hinweis)',
    elsterHintDe: 'Als Nachweis / Abgleich in Mein ELSTER nutzen — Beträge nicht doppelt eintragen',
    taxLineCategory: null,
    taxLineKind: null,
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'low',
  },
  Auslandsbeleg: {
    storageCategory: 'Lohnausweis Ausland',
    anlage: 'AUS',
    fieldKey: 'aus.lohnausweis',
    fieldLabelDe: 'Auslandsbeleg / ausländische Einkünfte',
    elsterHintDe: 'Anlage AUS / N — ausländische Einkünfte in Mein ELSTER prüfen',
    taxLineCategory: 'gehalt',
    taxLineKind: 'income',
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'low',
  },
  Homeoffice: {
    storageCategory: 'Werbungskosten',
    anlage: 'N',
    fieldKey: 'n.werbungskosten',
    fieldLabelDe: 'Werbungskosten (Homeoffice)',
    elsterHintDe: 'Anlage N — Homeoffice-Pauschale vs. Einzelnachweis prüfen',
    taxLineCategory: 'werbungskosten',
    taxLineKind: 'expense',
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'low',
  },
  Fortbildung: {
    storageCategory: 'Werbungskosten',
    anlage: 'N',
    fieldKey: 'n.werbungskosten',
    fieldLabelDe: 'Werbungskosten (Fortbildung)',
    elsterHintDe: 'Anlage N — Fortbildungskosten prüfen',
    taxLineCategory: 'werbungskosten',
    taxLineKind: 'expense',
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'medium',
  },
  Mietvertrag: {
    storageCategory: 'Mietverträge',
    anlage: 'V',
    fieldKey: 'v.mietvertrag',
    fieldLabelDe: 'Mietvertrag (Vermietung & Verpachtung)',
    elsterHintDe:
      'Anlage V — Mietvertrag als Nachweis; Rolle Vermieter/Mieter und Beträge prüfen',
    taxLineCategory: null,
    taxLineKind: null,
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'medium',
  },
  Hausgeldabrechnung: {
    storageCategory: 'Nebenkostenabrechnung',
    anlage: 'V',
    fieldKey: 'v.hausgeld',
    fieldLabelDe: 'Hausgeld- / Nebenkostenabrechnung',
    elsterHintDe:
      'Anlage V — umlagefähige Kosten als Werbungskosten prüfen; Einnahmen zuordnen',
    taxLineCategory: null,
    taxLineKind: null,
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'medium',
  },
  Sonstiges: {
    storageCategory: 'Sonstiges',
    anlage: 'Sonstige',
    fieldKey: 'sonst.uncategorized',
    fieldLabelDe: 'Unkategorisierte Belege',
    elsterHintDe: 'Passende Anlage in Mein ELSTER manuell wählen — bitte prüfen',
    taxLineCategory: 'sonstige_einnahmen',
    taxLineKind: 'expense',
    needsReviewAlways: true,
    confidenceWhenNoAmount: 'low',
  },
};

/** Refine Auslandsbeleg storage when filename/text is more specific. */
export function refineAuslandStorageCategory(
  fileName: string,
  content?: string
): string {
  const t = `${fileName} ${content || ''}`.toLowerCase();
  if (/quellensteuer/.test(t)) return 'Quellensteuer-Bescheinigung';
  if (/\ba1\b|a1-bescheinigung/.test(t)) return 'A1-Bescheinigung';
  if (/ansässigkeit|ansaessigkeit|ansassigkeit/.test(t)) {
    return 'Ansässigkeitsbescheinigung';
  }
  if (/grenzgänger|grenzgaenger|grenzganger/.test(t)) return 'Grenzgänger-Nachweis';
  if (/apotheke|arzt|gesundheit|medizin/.test(t)) return 'Apotheke/Gesundheit';
  return 'Lohnausweis Ausland';
}

export function mapBelegToElster(
  categoryRaw: string | null | undefined,
  opts?: { fileName?: string; content?: string }
): BelegElsterMapping {
  const category = normalizeDeBelegCategory(categoryRaw);
  const base = { ...BELEG_TO_ELSTER[category] };

  if (category === 'Auslandsbeleg' && (opts?.fileName || opts?.content)) {
    base.storageCategory = refineAuslandStorageCategory(
      opts.fileName || '',
      opts.content
    );
    if (base.storageCategory === 'Quellensteuer-Bescheinigung') {
      base.fieldKey = 'aus.quellensteuer';
      base.fieldLabelDe = 'Quellensteuer-Bescheinigung';
      base.taxLineCategory = null;
      base.taxLineKind = null;
    } else if (base.storageCategory === 'A1-Bescheinigung') {
      base.fieldKey = 'aus.a1';
      base.fieldLabelDe = 'A1-Bescheinigung (Sozialversicherung)';
      base.taxLineCategory = null;
      base.taxLineKind = null;
    } else if (base.storageCategory === 'Ansässigkeitsbescheinigung') {
      base.fieldKey = 'aus.ansaessigkeit';
      base.fieldLabelDe = 'Ansässigkeitsbescheinigung';
      base.taxLineCategory = null;
      base.taxLineKind = null;
    } else if (base.storageCategory === 'Grenzgänger-Nachweis') {
      base.fieldKey = 'aus.grenzgaenger';
      base.fieldLabelDe = 'Grenzgänger-Nachweis';
      base.taxLineCategory = null;
      base.taxLineKind = null;
    }
  }

  // Health receipts often land as „Rechnung“
  if (category === 'Rechnung' && opts) {
    const t = `${opts.fileName || ''} ${opts.content || ''}`.toLowerCase();
    if (/apotheke|arzt|gesundheit|medizin|krankenhaustage/.test(t)) {
      return {
        storageCategory: 'Apotheke/Gesundheit',
        anlage: 'Außergewöhnliche Belastungen',
        fieldKey: 'agb.gesundheit',
        fieldLabelDe: 'Gesundheits- / Apothekenkosten',
        elsterHintDe:
          'Außergewöhnliche Belastungen — Zumutbarkeitsgrenze prüfen; Beträge nur nach Prüfung eintragen',
        taxLineCategory: 'gesundheit',
        taxLineKind: 'expense',
        needsReviewAlways: true,
        confidenceWhenNoAmount: 'low',
      };
    }
  }

  return base;
}

export function confidenceLevelFromScore(
  score: number | null | undefined,
  hasAmount: boolean,
  mapping: BelegElsterMapping
): ElsterConfidence {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return hasAmount ? 'medium' : mapping.confidenceWhenNoAmount;
  }
  if (!hasAmount) {
    return mapping.confidenceWhenNoAmount;
  }
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

/** Extract a plausible EUR amount from filename/text (fictional QA / rules path). */
export function extractEuroAmountHint(
  fileName: string,
  content?: string
): number | undefined {
  const text = `${fileName} ${content || ''}`;
  const patterns = [
    /(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/,
    /€\s*(\d{1,3}(?:\.\d{3})*,\d{2})/,
    /(\d{1,3}(?:\.\d{3})*,\d{2})\s*EUR/i,
    /(\d+[.,]\d{2})\s*(?:EUR|Euro|€)/i,
    /(?:Betrag|Summe|Total|Amount)[:\s]+(\d+[.,]\d{2})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const normalized = m[1].includes(',')
      ? m[1].replace(/\./g, '').replace(',', '.')
      : m[1];
    const n = parseFloat(normalized);
    if (Number.isFinite(n) && n > 0 && n < 10_000_000) return Math.round(n * 100) / 100;
  }
  return undefined;
}

export const BATCH_AUTOFILL_DISCLAIMER_DE =
  'KI-Vorschlag / unverbindlich — bitte prüfen. Keine Steuerberatung, keine Auto-Abgabe an Mein ELSTER.';
