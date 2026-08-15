/**
 * Hausgeldabrechnung → umlagefähige Kosten (Ausgaben) + Einnahmen (V&V).
 * Heuristic only — confidence + review required.
 */

import {
  extractEuroAmounts,
  extractLabeledAmount,
  parseGermanAmount,
} from '@/lib/tax/extract-euro';

export interface HausgeldExtract {
  detected: boolean;
  isHausgeld: boolean;
  confidence: number;
  year?: number | null;
  objectLabel?: string | null;
  /** Umlagefähige / umgelegte Kosten → Ausgaben */
  umlagefaehigAmount?: number | null;
  /** Einnahmen / Guthaben / Erstattungen */
  incomeAmount?: number | null;
  settlementAmount?: number | null;
  isNachzahlung?: boolean | null;
  notesDe: string;
  shouldApplyToRental: boolean;
}

function detectHausgeld(fileName: string, content: string): boolean {
  const t = `${fileName} ${content}`.toLowerCase();
  return /hausgeld|hausgeldabrechnung|wohnungseigentümer|wohnungseigentuemer|weg-abrechnung|weg\s+abrechnung|instandhaltungsrücklage|instandhaltungsruecklage|umlagefähig|umlagefaehig|heizkostenabrechnung/.test(
    t
  );
}

function extractYearHint(text: string): number | null {
  const m = text.match(
    /(?:Abrechnungsjahr|Wirtschaftsjahr|Jahr)[:\s]*(20\d{2})|\b(20\d{2})\b/
  );
  if (!m) return null;
  const y = parseInt(m[1] || m[2], 10);
  return y >= 2000 && y <= 2100 ? y : null;
}

export function extractHausgeld(
  fileName: string,
  content?: string,
  fallbackYear?: number
): HausgeldExtract {
  const text = `${fileName}\n${content || ''}`;
  const isHausgeld = detectHausgeld(fileName, content || '');
  if (!isHausgeld) {
    // Also accept Nebenkostenabrechnung as related (weaker)
    const isNeben =
      /nebenkostenabrechnung|betriebskostenabrechnung/i.test(text);
    if (!isNeben) {
      return {
        detected: false,
        isHausgeld: false,
        confidence: 0,
        notesDe: 'Keine Hausgeld-/Nebenkostenabrechnung erkannt.',
        shouldApplyToRental: false,
      };
    }
  }

  const year = extractYearHint(text) || fallbackYear || null;

  const umlagefaehigAmount =
    extractLabeledAmount(
      text,
      /umlagefähige\s+Kosten|umlagefaehige\s+Kosten|umlagefähiger\s+Anteil|umlegbare\s+Kosten|Betriebskosten\s+gesamt|Hausgeld\s+gesamt/
    ) ||
    extractLabeledAmount(text, /Umlagen?\s*(?:gesamt|Summe)?/) ||
    null;

  const incomeAmount =
    extractLabeledAmount(
      text,
      /Einnahmen(?:\s*\/\s*Vorauszahlungen?)?|Guthaben|Erstattung|Gutschrift|Vorauszahlungen?/
    ) || null;

  let settlementAmount =
    extractLabeledAmount(
      text,
      /Nachzahlung|Nachforderungsbetrag|Abschlussbetrag|Saldo|Zahllast/
    ) || null;
  let isNachzahlung: boolean | null = null;
  if (settlementAmount != null) {
    isNachzahlung = !/Guthaben|Erstattung|zugunsten/i.test(
      text.slice(Math.max(0, text.search(/Nachzahlung|Guthaben|Saldo/i)), Math.max(0, text.search(/Nachzahlung|Guthaben|Saldo/i)) + 80)
    );
    if (/Guthaben|Erstattung|zugunsten\s+des\s+Eigentümers/i.test(text)) {
      isNachzahlung = false;
    }
    if (/Nachzahlung|Nachforderung|Nachzahlungsbetrag/i.test(text)) {
      isNachzahlung = true;
    }
  }

  if (settlementAmount == null) {
    const amounts = extractEuroAmounts(text);
    if (amounts.length) settlementAmount = amounts[0];
  }

  // If only umlage known, use as settlement proxy for Vermieter Ausgaben
  if (umlagefaehigAmount == null && settlementAmount != null && isHausgeld) {
    // keep settlement; umlage stays null
  }

  const objectLabel =
    text.match(
      /(?:Objekt|Wohnung|Einheit|WE)[:\s]+([^\n]{5,80})/i
    )?.[1]?.trim() || null;

  let confidence = isHausgeld ? 0.58 : 0.45;
  if (umlagefaehigAmount != null) confidence += 0.15;
  if (incomeAmount != null) confidence += 0.1;
  if (settlementAmount != null) confidence += 0.1;
  if (year) confidence += 0.05;
  confidence = Math.min(0.9, confidence);

  const shouldApplyToRental =
    umlagefaehigAmount != null ||
    incomeAmount != null ||
    settlementAmount != null;

  return {
    detected: true,
    isHausgeld,
    confidence,
    year,
    objectLabel,
    umlagefaehigAmount,
    incomeAmount,
    settlementAmount,
    isNachzahlung: isNachzahlung ?? true,
    notesDe: isHausgeld
      ? 'KI-Vorschlag Hausgeldabrechnung: umlagefähige Kosten → Ausgaben, Einnahmen → V&V. Bitte prüfen.'
      : 'KI-Vorschlag Nebenkostenabrechnung — Rolle Vermieter/Mieter und Zuordnung prüfen.',
    shouldApplyToRental,
  };
}

/** Sum helper for tests */
export function sumUmlageFromLines(lines: string[]): number {
  let sum = 0;
  for (const line of lines) {
    const m = line.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/);
    if (!m) continue;
    const n = parseGermanAmount(m[1]);
    if (n != null) sum += n;
  }
  return Math.round(sum * 100) / 100;
}
