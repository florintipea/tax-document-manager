/**
 * Steuerprofil field helpers — Hilfsmittel, keine Steuerberatung.
 */

export const ANREDE_OPTIONS = ['herr', 'frau', 'divers', 'keine'] as const;
export type Anrede = (typeof ANREDE_OPTIONS)[number];

export const RELIGION_OPTIONS = ['keine', 'ev', 'rk', 'sonstige'] as const;
export type ReligionCode = (typeof RELIGION_OPTIONS)[number];

export const STEUERKLASSE_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;

/** Normalize optional text; empty → null */
export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** German IdNr is 11 digits (basic check; no Finanzamt validation). */
export function normalizeIdNr(value: string | null | undefined): string | null {
  const raw = emptyToNull(value);
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

export function isPlausibleIdNr(value: string | null | undefined): boolean {
  if (!value) return true;
  const digits = value.replace(/\D/g, '');
  return digits.length === 11;
}
