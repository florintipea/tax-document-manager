/**
 * Internationalization Configuration
 * Supports all countries where tax declaration is required
 */

export const locales = [
  // European Union
  'en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ro', 'hu', 'cs', 'el', 'sv', 'da', 'fi',
  'sk', 'bg', 'hr', 'lt', 'sl', 'et', 'lv', 'mt', 'ga', 'lv',
  
  // Americas
  'en-US', 'en-CA', 'es-MX', 'es-AR', 'es-BR', 'pt-BR', 'fr-CA',
  
  // Asia Pacific
  'ja', 'zh-CN', 'zh-TW', 'ko', 'hi', 'th', 'vi', 'id', 'ms', 'fil',
  
  // Middle East & Africa
  'ar', 'he', 'tr', 'af', 'sw',
  
  // Other
  'ru', 'uk', 'no', 'is'
] as const;

export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'de';

/** Resolve initial locale: German browser → de; else saved default */
export function detectInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'de';
  const saved = localStorage.getItem('locale');
  if (saved && (supportedLocales as readonly string[]).includes(saved)) {
    return saved as SupportedLocale;
  }
  const browser = navigator.language?.toLowerCase() ?? '';
  if (browser.startsWith('de')) return 'de';
  if (browser.startsWith('es')) return 'es';
  if (browser.startsWith('ro')) return 'ro';
  if (browser.startsWith('el')) return 'el';
  return 'de';
}

/** Locales with full translation files */
export const supportedLocales = ['en', 'de', 'es', 'ro', 'el'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

// Countries requiring tax declaration
export const taxCountries = {
  // European Union (27 countries)
  'AT': { name: 'Austria', locale: 'de', currency: 'EUR', taxSystem: 'EU' },
  'BE': { name: 'Belgium', locale: 'nl', currency: 'EUR', taxSystem: 'EU' },
  'BG': { name: 'Bulgaria', locale: 'bg', currency: 'BGN', taxSystem: 'EU' },
  'HR': { name: 'Croatia', locale: 'hr', currency: 'EUR', taxSystem: 'EU' },
  'CY': { name: 'Cyprus', locale: 'el', currency: 'EUR', taxSystem: 'EU' },
  'CZ': { name: 'Czech Republic', locale: 'cs', currency: 'CZK', taxSystem: 'EU' },
  'DK': { name: 'Denmark', locale: 'da', currency: 'DKK', taxSystem: 'EU' },
  'EE': { name: 'Estonia', locale: 'et', currency: 'EUR', taxSystem: 'EU' },
  'FI': { name: 'Finland', locale: 'fi', currency: 'EUR', taxSystem: 'EU' },
  'FR': { name: 'France', locale: 'fr', currency: 'EUR', taxSystem: 'EU' },
  'DE': { name: 'Germany', locale: 'de', currency: 'EUR', taxSystem: 'WISO', special: 'WISO Steuer' },
  'GR': { name: 'Greece', locale: 'el', currency: 'EUR', taxSystem: 'EU' },
  'HU': { name: 'Hungary', locale: 'hu', currency: 'HUF', taxSystem: 'EU' },
  'IE': { name: 'Ireland', locale: 'en', currency: 'EUR', taxSystem: 'EU' },
  'IT': { name: 'Italy', locale: 'it', currency: 'EUR', taxSystem: 'EU' },
  'LV': { name: 'Latvia', locale: 'lv', currency: 'EUR', taxSystem: 'EU' },
  'LT': { name: 'Lithuania', locale: 'lt', currency: 'EUR', taxSystem: 'EU' },
  'LU': { name: 'Luxembourg', locale: 'fr', currency: 'EUR', taxSystem: 'EU' },
  'MT': { name: 'Malta', locale: 'mt', currency: 'EUR', taxSystem: 'EU' },
  'NL': { name: 'Netherlands', locale: 'nl', currency: 'EUR', taxSystem: 'EU' },
  'PL': { name: 'Poland', locale: 'pl', currency: 'PLN', taxSystem: 'EU' },
  'PT': { name: 'Portugal', locale: 'pt', currency: 'EUR', taxSystem: 'EU' },
  'RO': { name: 'Romania', locale: 'ro', currency: 'RON', taxSystem: 'EU' },
  'SK': { name: 'Slovakia', locale: 'sk', currency: 'EUR', taxSystem: 'EU' },
  'SI': { name: 'Slovenia', locale: 'sl', currency: 'EUR', taxSystem: 'EU' },
  'ES': { name: 'Spain', locale: 'es', currency: 'EUR', taxSystem: 'EU' },
  'SE': { name: 'Sweden', locale: 'sv', currency: 'SEK', taxSystem: 'EU' },
  
  // Americas
  'US': { name: 'United States', locale: 'en-US', currency: 'USD', taxSystem: 'US' },
  'CA': { name: 'Canada', locale: 'en-CA', currency: 'CAD', taxSystem: 'CA' },
  'MX': { name: 'Mexico', locale: 'es-MX', currency: 'MXN', taxSystem: 'MX' },
  'BR': { name: 'Brazil', locale: 'pt-BR', currency: 'BRL', taxSystem: 'BR' },
  'AR': { name: 'Argentina', locale: 'es-AR', currency: 'ARS', taxSystem: 'AR' },
  
  // Asia Pacific
  'JP': { name: 'Japan', locale: 'ja', currency: 'JPY', taxSystem: 'JP' },
  'CN': { name: 'China', locale: 'zh-CN', currency: 'CNY', taxSystem: 'CN' },
  'TW': { name: 'Taiwan', locale: 'zh-TW', currency: 'TWD', taxSystem: 'TW' },
  'KR': { name: 'South Korea', locale: 'ko', currency: 'KRW', taxSystem: 'KR' },
  'IN': { name: 'India', locale: 'hi', currency: 'INR', taxSystem: 'IN' },
  'AU': { name: 'Australia', locale: 'en', currency: 'AUD', taxSystem: 'AU' },
  'NZ': { name: 'New Zealand', locale: 'en', currency: 'NZD', taxSystem: 'NZ' },
  'SG': { name: 'Singapore', locale: 'en', currency: 'SGD', taxSystem: 'SG' },
  'TH': { name: 'Thailand', locale: 'th', currency: 'THB', taxSystem: 'TH' },
  'VN': { name: 'Vietnam', locale: 'vi', currency: 'VND', taxSystem: 'VN' },
  'ID': { name: 'Indonesia', locale: 'id', currency: 'IDR', taxSystem: 'ID' },
  'MY': { name: 'Malaysia', locale: 'ms', currency: 'MYR', taxSystem: 'MY' },
  'PH': { name: 'Philippines', locale: 'fil', currency: 'PHP', taxSystem: 'PH' },
  
  // Middle East & Africa
  'AE': { name: 'United Arab Emirates', locale: 'ar', currency: 'AED', taxSystem: 'AE' },
  'SA': { name: 'Saudi Arabia', locale: 'ar', currency: 'SAR', taxSystem: 'SA' },
  'IL': { name: 'Israel', locale: 'he', currency: 'ILS', taxSystem: 'IL' },
  'TR': { name: 'Turkey', locale: 'tr', currency: 'TRY', taxSystem: 'TR' },
  'ZA': { name: 'South Africa', locale: 'en', currency: 'ZAR', taxSystem: 'ZA' },
  
  // Other
  'GB': { name: 'United Kingdom', locale: 'en', currency: 'GBP', taxSystem: 'GB' },
  'CH': { name: 'Switzerland', locale: 'de', currency: 'CHF', taxSystem: 'CH' },
  'NO': { name: 'Norway', locale: 'no', currency: 'NOK', taxSystem: 'NO' },
  'RU': { name: 'Russia', locale: 'ru', currency: 'RUB', taxSystem: 'RU' },
  'UA': { name: 'Ukraine', locale: 'uk', currency: 'UAH', taxSystem: 'UA' },
} as const;

export type TaxCountry = keyof typeof taxCountries;

export function getCountryByLocale(locale: string): TaxCountry | null {
  for (const [code, data] of Object.entries(taxCountries)) {
    if (data.locale === locale || data.locale.startsWith(locale)) {
      return code as TaxCountry;
    }
  }
  return null;
}

export function getLocaleByCountry(country: TaxCountry): Locale {
  return taxCountries[country].locale as Locale;
}


