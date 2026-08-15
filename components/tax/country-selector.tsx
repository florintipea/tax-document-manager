"use client";

import { taxCountries } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import {
  type TaxCountryCode,
  type CountrySupportLevel,
  PRIMARY_TAX_COUNTRY,
  OTHER_CALCULATOR_COUNTRIES,
  SUPPORTED_CALCULATOR_COUNTRIES,
  getCountrySupportLevel,
  isCalculatorCountry,
  normalizeCalculatorCountry,
} from "@/lib/tax/country-config";

type CountrySelectorMode = "calculator" | "profile";

interface CountrySelectorProps {
  value: string;
  onChange: (country: string) => void;
  mode?: CountrySelectorMode;
  className?: string;
  id?: string;
  disabled?: boolean;
}

function supportBadgeKey(level: CountrySupportLevel): string {
  return level === "full" ? "country.fullSupport" : "country.basicEstimate";
}

function formatOptionLabel(
  code: string,
  t: (key: string) => string,
  showBadge: boolean
): string {
  const name = taxCountries[code as keyof typeof taxCountries]?.name ?? code;
  if (!showBadge || !isCalculatorCountry(code)) {
    return `${name} (${code})`;
  }
  const level = getCountrySupportLevel(code);
  const badge = t(supportBadgeKey(level));
  return `${name} (${code}) — ${badge}`;
}

export function CountrySelector({
  value,
  onChange,
  mode = "profile",
  className = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
  id,
  disabled,
}: CountrySelectorProps) {
  const { t } = useI18n();
  const showBadge = mode === "calculator" || mode === "profile";

  if (mode === "calculator") {
    return (
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(normalizeCalculatorCountry(e.target.value))}
        className={className}
      >
        <optgroup label={t("country.groupGermany")}>
          <option value={PRIMARY_TAX_COUNTRY}>
            {formatOptionLabel(PRIMARY_TAX_COUNTRY, t, showBadge)}
          </option>
        </optgroup>
        <optgroup label={t("country.groupOther")}>
          {OTHER_CALCULATOR_COUNTRIES.map((code) => (
            <option key={code} value={code}>
              {formatOptionLabel(code, t, showBadge)}
            </option>
          ))}
        </optgroup>
      </select>
    );
  }

  const calculatorSet = new Set<string>(SUPPORTED_CALCULATOR_COUNTRIES);
  const otherProfileCountries = Object.keys(taxCountries).filter(
    (code) => !calculatorSet.has(code)
  );

  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <optgroup label={t("country.groupGermanyRecommended")}>
        <option value={PRIMARY_TAX_COUNTRY}>
          {formatOptionLabel(PRIMARY_TAX_COUNTRY, t, showBadge)} — {t("country.recommended")}
        </option>
      </optgroup>
      <optgroup label={t("country.groupCalculatorCountries")}>
        {OTHER_CALCULATOR_COUNTRIES.map((code) => (
          <option key={code} value={code}>
            {formatOptionLabel(code, t, showBadge)}
          </option>
        ))}
      </optgroup>
      <optgroup label={t("country.groupDocumentOnly")}>
        {otherProfileCountries.map((code) => (
          <option key={code} value={code}>
            {formatOptionLabel(code, t, false)}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

export function CountrySupportBadge({ country }: { country: TaxCountryCode | string }) {
  const { t } = useI18n();
  if (!isCalculatorCountry(country)) return null;
  const level = getCountrySupportLevel(country);
  const isFull = level === "full";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isFull
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
      }`}
    >
      {t(supportBadgeKey(level))}
    </span>
  );
}
