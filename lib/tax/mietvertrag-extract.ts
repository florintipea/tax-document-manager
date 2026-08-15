/**
 * Mietvertrag → Immobilien-Vorschlag (Vermieter).
 * Heuristic / KI-Vorschlag — user must edit and verify.
 */

import {
  extractDateHint,
  extractEuroAmounts,
  extractLabeledAmount,
} from '@/lib/tax/extract-euro';

export type MietRoleHint = 'vermieter' | 'mieter' | 'unknown';

export interface MietvertragExtract {
  detected: boolean;
  isMietvertrag: boolean;
  roleHint: MietRoleHint;
  confidence: number;
  address?: string | null;
  monthlyRent?: number | null;
  contractStart?: string | null;
  contractEnd?: string | null;
  landlordName?: string | null;
  tenantName?: string | null;
  label?: string | null;
  notesDe: string;
  /** Only auto-create/update Property when Vermieter */
  shouldUpsertProperty: boolean;
}

function detectMietvertrag(fileName: string, content: string): boolean {
  const t = `${fileName} ${content}`.toLowerCase();
  return /mietvertrag|wohnraummietvertrag|untermietvertrag|mietverhältnis|mietverhaeltnis/.test(
    t
  );
}

function detectRole(text: string): MietRoleHint {
  const t = text.toLowerCase();
  // Explicit self-role beats party labels (Mieter uploading their own contract)
  if (/\bals mieter(?:in)?\b/.test(t) && !/\bals vermieter(?:in)?\b/.test(t)) {
    return 'mieter';
  }
  if (/\bals vermieter(?:in)?\b/.test(t)) {
    return 'vermieter';
  }
  const vermieterSignals =
    (t.match(/vermieter|vermieterin|verpächter|verpaechter/g) || []).length;
  const mieterSignals = (
    t.match(/\bmieter\b|\bmieterin\b|mieterpartei/g) || []
  ).length;

  // If user appears as landlord party label near "Vermieter:"
  if (/Vermieter(?:in)?[:\s]+[A-ZÄÖÜ]/m.test(text) && vermieterSignals >= mieterSignals) {
    return 'vermieter';
  }
  if (vermieterSignals > mieterSignals + 1) return 'vermieter';
  if (mieterSignals > vermieterSignals + 1) return 'mieter';
  if (/vermietung|verpachtung|kaltmiete.*einnahme/i.test(text)) return 'vermieter';
  if (vermieterSignals > 0 && mieterSignals > 0) return 'unknown';
  if (vermieterSignals > 0) return 'vermieter';
  if (mieterSignals > 0) return 'mieter';
  return 'unknown';
}

function extractParty(text: string, role: 'Vermieter' | 'Mieter'): string | null {
  const re = new RegExp(
    `${role}(?:in)?[:\\s]+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß\\- ]{2,60})`,
    'm'
  );
  const m = text.match(re);
  return m?.[1]?.trim().slice(0, 80) || null;
}

function extractAddress(text: string): string | null {
  const m =
    text.match(
      /(?:Mietsache|Wohnung|Objekt|Anschrift|gelegen in)[:\s]+([^\n]{8,120})/i
    ) ||
    text.match(
      /([A-ZÄÖÜ][A-Za-zÄÖÜäöüß\- ]+\s+\d+[a-zA-Z]?),\s*(\d{5})\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß\- ]+)/
    );
  if (!m) return null;
  if (m[2] && m[3]) return `${m[1]}, ${m[2]} ${m[3]}`.trim();
  return m[1].trim().slice(0, 200);
}

export function extractMietvertrag(
  fileName: string,
  content?: string
): MietvertragExtract {
  const text = `${fileName}\n${content || ''}`;
  const isMietvertrag = detectMietvertrag(fileName, content || '');
  if (!isMietvertrag) {
    return {
      detected: false,
      isMietvertrag: false,
      roleHint: 'unknown',
      confidence: 0,
      notesDe: 'Kein Mietvertrag erkannt.',
      shouldUpsertProperty: false,
    };
  }

  const roleHint = detectRole(text);
  const monthlyRent =
    extractLabeledAmount(
      text,
      /Kaltmiete|Nettokaltmiete|Monatsmiete|Miete\s*(?:mtl\.|monatlich)?/
    ) ||
    extractEuroAmounts(text)[0] ||
    null;

  const landlordName = extractParty(text, 'Vermieter');
  const tenantName = extractParty(text, 'Mieter');
  const address = extractAddress(text);
  const startSlice =
    text.match(
      /(?:Beginn|Mietbeginn|ab dem|Vertragsbeginn)[:\s]*([^\n]{6,30})/i
    )?.[1] || text;
  const endSlice =
    text.match(
      /(?:Ende|Mietende|bis zum|Vertragsende)[:\s]*([^\n]{6,30})/i
    )?.[1] || '';
  const contractStart = extractDateHint(startSlice);
  const contractEnd = endSlice ? extractDateHint(endSlice) : null;

  let confidence = 0.55;
  if (address) confidence += 0.12;
  if (monthlyRent) confidence += 0.12;
  if (landlordName || tenantName) confidence += 0.08;
  if (roleHint !== 'unknown') confidence += 0.08;
  confidence = Math.min(0.92, confidence);

  const shouldUpsert =
    roleHint !== 'mieter' &&
    (roleHint === 'vermieter' ||
      (roleHint === 'unknown' && Boolean(address || monthlyRent)));

  return {
    detected: true,
    isMietvertrag: true,
    roleHint,
    confidence,
    address: address || (monthlyRent ? 'Adresse bitte ergänzen' : null),
    monthlyRent,
    contractStart: contractStart || null,
    contractEnd: contractEnd || null,
    landlordName,
    tenantName,
    label: address ? `Miete: ${address.slice(0, 40)}` : 'Mietobjekt (Vorschlag)',
    notesDe:
      roleHint === 'vermieter'
        ? 'KI-Vorschlag: Sie erscheinen als Vermieter — Immobilien-Datensatz vorgeschlagen. Bitte prüfen und bearbeiten.'
        : roleHint === 'mieter'
          ? 'KI-Vorschlag: Rolle eher Mieter — kein automatischer Vermieter-Immobilien-Datensatz. Bitte prüfen.'
          : 'Mietvertrag erkannt, Rolle unklar — Vorschlag nur bei Adresse/Miete. Bitte prüfen.',
    shouldUpsertProperty: shouldUpsert,
  };
}
