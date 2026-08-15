/**
 * Extract Steuerprofil hints from a prior ELSTER return / Steuerbescheid PDF text.
 * Heuristic only — never claims completeness. No ERiC / no auto-submit.
 */

import { normalizeIdNr, emptyToNull } from '@/lib/tax/steuerprofil-fields';
import { extractLabeledAmount } from '@/lib/tax/extract-euro';

export const PROFILE_REFRESH_NOTICE_DE =
  'Profil aus früherer Erklärung aktualisiert (bitte prüfen)';

export interface PriorElsterProfileExtract {
  detected: boolean;
  confidence: number;
  vorname?: string | null;
  nachname?: string | null;
  idNr?: string | null;
  steuernummer?: string | null;
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  steuerklasse?: string | null;
  numberOfChildren?: number | null;
  deFilingMode?: 'einzel' | 'zusammen' | null;
  employmentIncome?: number | null;
  taxWithheld?: number | null;
  hasRentalIncome?: boolean | null;
  hasCapitalIncome?: boolean | null;
  fieldsUpdated: string[];
  notesDe: string;
}

function looksLikePriorElster(fileName: string, content: string): boolean {
  const t = `${fileName} ${content}`.toLowerCase();
  return /elster|einkommensteuererklärung|einkommensteuererklaerung|einkommensteuerbescheid|steuerbescheid|festsetzungsbescheid|feststellung|festsetzung|mein\s*elster|anlage\s*n|veranlagung|identifikationsnummer|idnr|steuerliche\s+identifikationsnummer/.test(
    t
  );
}

function extractIdNr(text: string): string | null {
  const patterns = [
    /(?:Identifikationsnummer|IdNr\.?|steuerliche\s+Identifikationsnummer)[:\s]*([0-9\s]{11,14})/i,
    /\b(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const id = normalizeIdNr(m[1]);
    if (id && id.length === 11) return id;
  }
  return null;
}

function extractSteuernummer(text: string): string | null {
  const m = text.match(
    /(?:Steuernummer|StNr\.?)[:\s]*([0-9/\s-]{8,20})/i
  );
  return emptyToNull(m?.[1]?.replace(/\s+/g, ' '));
}

function extractName(text: string): { vorname?: string; nachname?: string } {
  const m =
    text.match(
      /(?:Name\s*\/\s*Vorname|Name,\s*Vorname|Steuerpflichtige[r]?)[:\s]+([A-ZÄÖÜ][a-zäöüß\-]+)\s*,\s*([A-ZÄÖÜ][a-zäöüß\-]+)/i
    ) ||
    text.match(
      /(?:Nachname|Familienname)[:\s]+([A-ZÄÖÜ][a-zäöüß\-]+)[\s\S]*?(?:Vorname)[:\s]+([A-ZÄÖÜ][a-zäöüß\-]+)/i
    ) ||
    text.match(
      /(?:Vorname)[:\s]+([A-ZÄÖÜ][a-zäöüß\-]+)[\s\S]*?(?:Nachname|Familienname)[:\s]+([A-ZÄÖÜ][a-zäöüß\-]+)/i
    );
  if (m) {
    if (/nachname|familienname/i.test(m[0]) && !/^Vorname/i.test(m[0].trim())) {
      return { nachname: m[1], vorname: m[2] };
    }
    if (/^Vorname/i.test(m[0].trim()) || /Vorname[\s\S]*Nachname|Familienname/i.test(m[0])) {
      return { vorname: m[1], nachname: m[2] };
    }
    return { nachname: m[1], vorname: m[2] };
  }
  const m2 = text.match(
    /\b([A-ZÄÖÜ][a-zäöüß\-]+)\s+([A-ZÄÖÜ][a-zäöüß\-]+)\s+(?:Steuerklasse|IdNr)/
  );
  if (m2) return { vorname: m2[1], nachname: m2[2] };
  return {};
}

function extractAddress(text: string): {
  street?: string;
  zip?: string;
  city?: string;
} {
  const m = text.match(
    /(?:Anschrift|Wohnsitz|Straße|Strasse)[:\s]+([^\n,]{5,80})[,\n\s]+(\d{5})\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß\- ]{2,40})/i
  );
  if (!m) {
    const m2 = text.match(/\b(\d{5})\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß\- ]{2,40})\b/);
    if (m2) return { zip: m2[1], city: m2[2].trim() };
    return {};
  }
  return {
    street: emptyToNull(m[1]) ?? undefined,
    zip: m[2],
    city: emptyToNull(m[3]) ?? undefined,
  };
}

export function extractPriorElsterProfile(
  fileName: string,
  content?: string
): PriorElsterProfileExtract {
  const text = `${fileName}\n${content || ''}`;
  const detected = looksLikePriorElster(fileName, content || '');
  if (!detected) {
    return {
      detected: false,
      confidence: 0,
      fieldsUpdated: [],
      notesDe: 'Kein Hinweis auf frühere ELSTER-Erklärung / Steuerbescheid.',
    };
  }

  const fieldsUpdated: string[] = [];
  const idNr = extractIdNr(text);
  const steuernummer = extractSteuernummer(text);
  const name = extractName(text);
  const addr = extractAddress(text);

  let steuerklasse: string | null = null;
  const sk = text.match(/Steuerklasse[:\s]*([IViv]{1,3}|[1-6])/i);
  if (sk?.[1]) {
    const map: Record<string, string> = {
      '1': 'I',
      '2': 'II',
      '3': 'III',
      '4': 'IV',
      '5': 'V',
      '6': 'VI',
    };
    const raw = sk[1].toUpperCase();
    steuerklasse = map[raw] || raw;
  }

  let numberOfChildren: number | null = null;
  const kids = text.match(
    /(?:Anzahl\s+der\s+Kinder|Anzahl\s+Kinder|Kinderfreibetr[aä]ge?|Kindergeld|Kinder)[:\s]*(\d{1,2})/i
  );
  if (kids?.[1]) numberOfChildren = Math.min(20, parseInt(kids[1], 10));

  let deFilingMode: 'einzel' | 'zusammen' | null = null;
  if (
    /Zusammenveranlagung|zusammen\s+veranlagt|Ehegatten|gemeinsame\s+Veranlagung/i.test(
      text
    )
  ) {
    deFilingMode = 'zusammen';
  } else if (/Einzelveranlagung|einzeln\s+veranlagt/i.test(text)) {
    deFilingMode = 'einzel';
  }

  const employmentIncome =
    extractLabeledAmount(
      text,
      /Bruttoarbeitslohn|Einkünfte\s+aus\s+nichtselbständiger\s+Arbeit|Arbeitslohn/
    ) || null;
  const taxWithheld =
    extractLabeledAmount(
      text,
      /Lohnsteuer|einbehaltene\s+Lohnsteuer|anrechenbare\s+Lohnsteuer/
    ) || null;

  const hasRentalIncome = /Vermietung\s+und\s+Verpachtung|Anlage\s+V\b/i.test(
    text
  )
    ? true
    : null;
  const hasCapitalIncome = /Kapitalerträge|Anlage\s+KAP\b/i.test(text)
    ? true
    : null;

  if (idNr) fieldsUpdated.push('idNr');
  if (steuernummer) fieldsUpdated.push('steuernummer');
  if (name.vorname) fieldsUpdated.push('vorname');
  if (name.nachname) fieldsUpdated.push('nachname');
  if (addr.street) fieldsUpdated.push('street');
  if (addr.zip) fieldsUpdated.push('zip');
  if (addr.city) fieldsUpdated.push('city');
  if (steuerklasse) fieldsUpdated.push('steuerklasse');
  if (numberOfChildren != null) fieldsUpdated.push('numberOfChildren');
  if (deFilingMode) fieldsUpdated.push('deFilingMode');
  if (hasRentalIncome) fieldsUpdated.push('hasRentalIncome');
  if (hasCapitalIncome) fieldsUpdated.push('hasCapitalIncome');
  if (employmentIncome != null) fieldsUpdated.push('employmentIncomeHint');
  if (taxWithheld != null) fieldsUpdated.push('taxWithheldHint');

  const hitCount = fieldsUpdated.length;
  const confidence = Math.min(0.9, 0.35 + hitCount * 0.08);

  return {
    detected: true,
    confidence,
    vorname: name.vorname ?? null,
    nachname: name.nachname ?? null,
    idNr,
    steuernummer,
    street: addr.street ?? null,
    zip: addr.zip ?? null,
    city: addr.city ?? null,
    steuerklasse,
    numberOfChildren,
    deFilingMode,
    employmentIncome,
    taxWithheld,
    hasRentalIncome,
    hasCapitalIncome,
    fieldsUpdated,
    notesDe:
      hitCount > 0
        ? `${PROFILE_REFRESH_NOTICE_DE}. Extrahierte Felder: ${fieldsUpdated.join(', ')}. Unverbindlich.`
        : 'Frühere Erklärung erkannt, aber kaum Felder lesbar — bitte manuell prüfen.',
  };
}
