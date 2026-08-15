/**
 * Country-/region-aware display pricing for TaxDoc.
 * Checkout (Stripe) stays on EUR plan IDs in plans.ts — display adapts by market.
 * Non-DE markets: honest stubs — no fake local e-file.
 */

export type MarketCode = 'DE' | 'AT' | 'CH' | 'US' | 'CA' | 'UK' | 'FR';

export type DisplayCurrency = 'EUR' | 'CHF' | 'USD' | 'CAD' | 'GBP';

export type ProductTier = 'free' | 'starter' | 'pro' | 'advisor';

export interface MarketTierPrice {
  amount: number;
  updatesYearly?: number;
  currency: DisplayCurrency;
}

export interface MarketCompetitorSnippet {
  name: string;
  theirPriceLabel: string;
  ourPriceLabel: string;
  noteDe: string;
}

export interface MarketPricingConfig {
  code: MarketCode;
  labelDe: string;
  /** Product filing live? */
  filingLive: boolean;
  currency: DisplayCurrency;
  tiers: Record<ProductTier, MarketTierPrice>;
  competitor: MarketCompetitorSnippet;
  deFirstNoteDe: string;
}

/** Canonical EUR amounts used for Stripe / DE checkout (Aug 2026 strategy). */
export const EUR_CANONICAL = {
  free: 0,
  starter: 24.99,
  pro: 29.99,
  proUpdates: 14.99,
  advisor: 249,
  advisorUpdates: 99,
} as const;

export const MARKET_PRICING: Record<MarketCode, MarketPricingConfig> = {
  DE: {
    code: 'DE',
    labelDe: 'Deutschland',
    filingLive: true,
    currency: 'EUR',
    tiers: {
      free: { amount: 0, currency: 'EUR' },
      starter: { amount: EUR_CANONICAL.starter, currency: 'EUR' },
      pro: {
        amount: EUR_CANONICAL.pro,
        updatesYearly: EUR_CANONICAL.proUpdates,
        currency: 'EUR',
      },
      advisor: {
        amount: EUR_CANONICAL.advisor,
        updatesYearly: EUR_CANONICAL.advisorUpdates,
        currency: 'EUR',
      },
    },
    competitor: {
      name: 'WISO Steuer / smartsteuer',
      theirPriceLabel: 'ca. 35,99–45,99 €',
      ourPriceLabel: 'Pro 29,99 €',
      noteDe:
        'Unter typischem DE-Saisonpreis (~36–46 €). Mein ELSTER bleibt 0 € — wir ersetzen das Portal nicht.',
    },
    deFirstNoteDe: 'Volle Vorbereitung für Mein ELSTER (kein Auto-Submit).',
  },
  AT: {
    code: 'AT',
    labelDe: 'Österreich',
    filingLive: false,
    currency: 'EUR',
    tiers: {
      free: { amount: 0, currency: 'EUR' },
      starter: { amount: EUR_CANONICAL.starter, currency: 'EUR' },
      pro: {
        amount: EUR_CANONICAL.pro,
        updatesYearly: EUR_CANONICAL.proUpdates,
        currency: 'EUR',
      },
      advisor: {
        amount: EUR_CANONICAL.advisor,
        updatesYearly: EUR_CANONICAL.advisorUpdates,
        currency: 'EUR',
      },
    },
    competitor: {
      name: 'FinanzOnline (Staat)',
      theirPriceLabel: '0 €',
      ourPriceLabel: 'Starter 24,99 €',
      noteDe:
        'FinanzOnline ist kostenlos. TaxDoc ist Beleg-/Grenzgänger-Hilfsmittel — kein AT-Filing-Ersatz.',
    },
    deFirstNoteDe: 'AT-Filing nicht live — DE-first Produkt mit AT als Stub/Grenzgänger.',
  },
  CH: {
    code: 'CH',
    labelDe: 'Schweiz',
    filingLive: false,
    currency: 'CHF',
    tiers: {
      free: { amount: 0, currency: 'CHF' },
      starter: { amount: 24, currency: 'CHF' },
      pro: { amount: 29, updatesYearly: 15, currency: 'CHF' },
      advisor: { amount: 249, updatesYearly: 99, currency: 'CHF' },
    },
    competitor: {
      name: 'Kantonale Portale / KI-Helfer',
      theirPriceLabel: '0 CHF Portal · KI ca. 29–99 CHF',
      ourPriceLabel: 'Pro 29 CHF',
      noteDe:
        'Kantonale Abgabe oft kostenlos. TaxDoc: DE↔CH Grenzgänger-Vorbereitung, kein Kantons-Filing.',
    },
    deFirstNoteDe: 'Kein CH-Kantons-Filing — Preise nur Orientierung für Prep-Tools.',
  },
  US: {
    code: 'US',
    labelDe: 'USA',
    filingLive: false,
    currency: 'USD',
    tiers: {
      free: { amount: 0, currency: 'USD' },
      starter: { amount: 19, currency: 'USD' },
      pro: { amount: 29, updatesYearly: 15, currency: 'USD' },
      advisor: { amount: 249, updatesYearly: 99, currency: 'USD' },
    },
    competitor: {
      name: 'TurboTax Deluxe / FreeTaxUSA',
      theirPriceLabel: 'TurboTax ~$79+ · FreeTaxUSA $0 fed',
      ourPriceLabel: 'Anzeige $19–29',
      noteDe:
        'Kein IRS e-File. FreeTaxUSA/Cash App sind $0 Filing — wir verkaufen das nicht. Nur Doc-Prep-Stub.',
    },
    deFirstNoteDe: 'US-Filing Coming soon / nicht live — DE-first.',
  },
  CA: {
    code: 'CA',
    labelDe: 'Kanada',
    filingLive: false,
    currency: 'CAD',
    tiers: {
      free: { amount: 0, currency: 'CAD' },
      starter: { amount: 19, currency: 'CAD' },
      pro: { amount: 29, updatesYearly: 15, currency: 'CAD' },
      advisor: { amount: 249, updatesYearly: 99, currency: 'CAD' },
    },
    competitor: {
      name: 'Wealthsimple Tax',
      theirPriceLabel: 'Basic PWYW $0 · Plus ~$40 CAD',
      ourPriceLabel: 'Anzeige CAD $19–29',
      noteDe:
        'Wealthsimple Basic kann $0 NETFILE. TaxDoc bietet kein NETFILE — ehrlich als Stub.',
    },
    deFirstNoteDe: 'Kein CRA NETFILE — DE-first Stub.',
  },
  UK: {
    code: 'UK',
    labelDe: 'Vereinigtes Königreich',
    filingLive: false,
    currency: 'GBP',
    tiers: {
      free: { amount: 0, currency: 'GBP' },
      starter: { amount: 19, currency: 'GBP' },
      pro: { amount: 29, updatesYearly: 15, currency: 'GBP' },
      advisor: { amount: 199, updatesYearly: 79, currency: 'GBP' },
    },
    competitor: {
      name: 'HMRC Self Assessment',
      theirPriceLabel: '0 £ (Portal)',
      ourPriceLabel: 'Anzeige £19–29',
      noteDe: 'HMRC ist kostenlos. TaxDoc kein UK-Filing — Coming soon / Stub.',
    },
    deFirstNoteDe: 'Kein HMRC-Filing — DE-first.',
  },
  FR: {
    code: 'FR',
    labelDe: 'Frankreich',
    filingLive: false,
    currency: 'EUR',
    tiers: {
      free: { amount: 0, currency: 'EUR' },
      starter: { amount: EUR_CANONICAL.starter, currency: 'EUR' },
      pro: {
        amount: EUR_CANONICAL.pro,
        updatesYearly: EUR_CANONICAL.proUpdates,
        currency: 'EUR',
      },
      advisor: {
        amount: EUR_CANONICAL.advisor,
        updatesYearly: EUR_CANONICAL.advisorUpdates,
        currency: 'EUR',
      },
    },
    competitor: {
      name: 'Impots.gouv',
      theirPriceLabel: '0 €',
      ourPriceLabel: 'Starter 24,99 €',
      noteDe: 'Staatliches Portal kostenlos. TaxDoc kein FR-Filing.',
    },
    deFirstNoteDe: 'Kein FR-Filing — DE-first Stub.',
  },
};

export const MARKET_CODES: MarketCode[] = ['DE', 'AT', 'CH', 'US', 'CA', 'UK', 'FR'];

export function resolveMarket(country?: string | null): MarketCode {
  const c = (country || 'DE').toUpperCase();
  if ((MARKET_CODES as string[]).includes(c)) return c as MarketCode;
  return 'DE';
}

export function formatMoney(
  amount: number,
  currency: DisplayCurrency,
  locale = 'de-DE'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
