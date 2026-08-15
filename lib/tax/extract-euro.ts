/** Shared EUR amount parsing for DE Beleg heuristics (unverbindlich). */

export function parseGermanAmount(raw: string): number | null {
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;
  const n = parseFloat(normalized);
  if (!Number.isFinite(n) || n <= 0 || n >= 10_000_000) return null;
  return Math.round(n * 100) / 100;
}

export function extractEuroAmounts(text: string): number[] {
  const amounts: number[] = [];
  const patterns = [
    /(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:€|EUR|Euro)/gi,
    /(?:€|EUR|Euro)\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
    /(\d+[.,]\d{2})\s*(?:€|EUR|Euro)/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      const n = parseGermanAmount(m[1]);
      if (n != null) amounts.push(n);
    }
  }
  return amounts;
}

export function extractLabeledAmount(
  text: string,
  labelPattern: RegExp
): number | null {
  // Wrap alternations so the amount capture applies to all label variants
  const re = new RegExp(
    `(?:${labelPattern.source})[^\\d]{0,60}(\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+[.,]\\d{2})`,
    'i'
  );
  const m = text.match(re);
  if (!m?.[1]) return null;
  return parseGermanAmount(m[1]);
}

export function extractDateHint(text: string): string | null {
  const m = text.match(
    /\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b|\b(20\d{2})-(\d{2})-(\d{2})\b/
  );
  if (!m) return null;
  if (m[4]) return `${m[4]}-${m[5]}-${m[6]}`;
  const d = m[1].padStart(2, '0');
  const mo = m[2].padStart(2, '0');
  return `${m[3]}-${mo}-${d}`;
}
