"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Receipt, AlertTriangle, Lightbulb, TrendingDown } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/lib/i18n/provider";
import { taxCountries } from "@/lib/i18n/config";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { CountrySelector, CountrySupportBadge } from "@/components/tax/country-selector";
import {
  type TaxCountryCode,
  type CAProvinceCode,
  type Steuerklasse,
  getCountryConfig,
  normalizeCalculatorCountry,
  PRIMARY_TAX_COUNTRY,
  DE_KINDERFREIBETRAG_MAX_CHILDREN,
  GRENZGAENGER_WORK_COUNTRIES,
} from "@/lib/tax/country-config";
import {
  type TaxCalculationResult,
  type FilingStatus,
  type DEFilingMode,
  type DeductionInput,
  type VorauszahlungInput,
  type CrossBorderInput,
  type RentalIncomeInput,
  createDefaultDeductions,
} from "@/lib/tax/calculator";

function formatMoney(amount: number, symbol: string): string {
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return symbol === "€" || symbol === "$"
    ? `${symbol}${formatted}`
    : `${formatted} ${symbol}`;
}

const emptyVorauszahlungen: VorauszahlungInput = { q1: 0, q2: 0, q3: 0, q4: 0 };

export default function CalculatorPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  const [country, setCountry] = useState<TaxCountryCode>("DE");
  const [caProvince, setCaProvince] = useState<CAProvinceCode>("ON");
  const [showCountryWarning, setShowCountryWarning] = useState(false);
  const [income, setIncome] = useState("");
  const [taxWithheld, setTaxWithheld] = useState("");
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [steuerklasse, setSteuerklasse] = useState<Steuerklasse>("I");
  const [deFilingMode, setDeFilingMode] = useState<DEFilingMode>("einzel");
  const [spouseIncome, setSpouseIncome] = useState("");
  const [spouseTaxWithheld, setSpouseTaxWithheld] = useState("");
  const [spouseWerbungskosten, setSpouseWerbungskosten] = useState("");
  const [deductions, setDeductions] = useState<DeductionInput[]>([]);
  const [vorauszahlungen, setVorauszahlungen] = useState<VorauszahlungInput>(emptyVorauszahlungen);
  const [showVorauszahlungen, setShowVorauszahlungen] = useState(false);
  const [crossBorder, setCrossBorder] = useState<CrossBorderInput>({
    enabled: false,
    workCountry: "AT",
    residenceCountry: "DE",
    foreignTaxPaid: 0,
    foreignIncome: 0,
  });
  const [rental, setRental] = useState<RentalIncomeInput>({
    enabled: false,
    grossRent: 0,
    operatingCosts: 0,
    useFlatExpensePercent: false,
  });
  const [result, setResult] = useState<TaxCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [profileChildren, setProfileChildren] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const countryConfig = useMemo(() => getCountryConfig(country), [country]);
  const isDE = country === "DE";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!settingsLoaded) return;

    const defaults = createDefaultDeductions(country);
    setDeductions(
      defaults.map((d) =>
        d.id === "kinderfreibetrag" && profileChildren > 0
          ? {
              ...d,
              enabled: true,
              amount: Math.min(DE_KINDERFREIBETRAG_MAX_CHILDREN, profileChildren),
            }
          : d
      )
    );
    setResult(null);
  }, [country, settingsLoaded, profileChildren]);

  const persistTaxProfile = useCallback((patch: Record<string, unknown>) => {
    if (profileSyncRef.current) clearTimeout(profileSyncRef.current);
    profileSyncRef.current = setTimeout(() => {
      void fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          toast.error(
            (data as { error?: string }).error || t("settings.saveFailed")
          );
        }
      });
    }, 600);
  }, [t]);

  const persistJointFilingProfile = useCallback(
    (mode: DEFilingMode, spouseIncomeValue: number) => {
      persistTaxProfile({
        deFilingMode: mode,
        spouseIncome: spouseIncomeValue,
      });
    },
    [persistTaxProfile]
  );

  const persistNumberOfChildren = useCallback(
    (count: number) => {
      persistTaxProfile({ numberOfChildren: count });
    },
    [persistTaxProfile]
  );

  useEffect(() => {
    if (status !== "authenticated") return;

    const loadSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (!response.ok) return;
        const data = await response.json();
        const s = data.settings;
        const userCountry = normalizeCalculatorCountry(s?.country);
        setProfileChildren(s?.numberOfChildren ?? 0);
        setCountry(userCountry);
        if (s?.steuerklasse) setSteuerklasse(s.steuerklasse as Steuerklasse);
        if (s?.deFilingMode === "zusammen" || s?.deFilingMode === "einzel") {
          setDeFilingMode(s.deFilingMode);
        }
        if (s?.spouseIncome && s.spouseIncome > 0) {
          setSpouseIncome(String(s.spouseIncome));
        }
        if (s?.isCrossBorder) {
          setCrossBorder((prev) => ({ ...prev, enabled: true }));
        }
        if (s?.hasRentalIncome) {
          setRental((prev) => ({ ...prev, enabled: true }));
        }
        setSettingsLoaded(true);
      } catch {
        // keep defaults
      } finally {
        setSettingsLoaded(true);
        setIsLoadingSettings(false);
      }
    };

    void loadSettings();
  }, [status]);

  const runCalculation = useCallback(async () => {
    const incomeNum = parseFloat(income);
    if (!income || Number.isNaN(incomeNum) || incomeNum < 0) {
      setResult(null);
      return;
    }

    setIsCalculating(true);
    try {
      const payload: Record<string, unknown> = {
        country,
        income: incomeNum,
        taxWithheld: parseFloat(taxWithheld) || 0,
        filingStatus: countryConfig.fields.filingStatus ? filingStatus : undefined,
        steuerklasse: countryConfig.fields.steuerklasse ? steuerklasse : undefined,
        caProvince: countryConfig.fields.caProvince ? caProvince : undefined,
        deductions,
        year: new Date().getFullYear(),
      };

      if (isDE) {
        payload.deFilingMode = deFilingMode;
        if (deFilingMode === "zusammen") {
          const spouseIncomeNum = parseFloat(spouseIncome) || 0;
          payload.spouseIncome = spouseIncomeNum;
          payload.spouseTaxWithheld = parseFloat(spouseTaxWithheld) || 0;
          const spouseW = parseFloat(spouseWerbungskosten) || 0;
          if (spouseW > 0) {
            payload.spouseDeductions = [
              { id: "werbungskosten", enabled: true, amount: spouseW },
            ];
          }
        }
        if (showVorauszahlungen) payload.vorauszahlungen = vorauszahlungen;
        if (crossBorder.enabled) payload.crossBorder = crossBorder;
        if (rental.enabled) payload.rental = rental;
      }

      const response = await fetch("/api/tax/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("calculator.calculationFailed"));
      }

      setResult(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("calculator.calculationFailed")
      );
    } finally {
      setIsCalculating(false);
    }
  }, [
    income,
    taxWithheld,
    country,
    caProvince,
    filingStatus,
    steuerklasse,
    deFilingMode,
    spouseIncome,
    spouseTaxWithheld,
    spouseWerbungskosten,
    deductions,
    countryConfig,
    isDE,
    showVorauszahlungen,
    vorauszahlungen,
    crossBorder,
    rental,
    t,
  ]);

  useEffect(() => {
    if (!income || isLoadingSettings) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runCalculation();
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    income,
    taxWithheld,
    country,
    caProvince,
    filingStatus,
    steuerklasse,
    deFilingMode,
    spouseIncome,
    spouseTaxWithheld,
    spouseWerbungskosten,
    deductions,
    isLoadingSettings,
    runCalculation,
    showVorauszahlungen,
    vorauszahlungen,
    crossBorder,
    rental,
  ]);

  const updateDeduction = (id: string, patch: Partial<DeductionInput>) => {
    setDeductions((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...patch } : d));

      if (id === "kinderfreibetrag") {
        const updated = next.find((d) => d.id === id);
        const nextCount =
          patch.enabled === false
            ? 0
            : patch.amount !== undefined
              ? patch.amount
              : updated?.enabled
                ? updated.amount || 1
                : 0;
        if (typeof nextCount === "number") {
          persistNumberOfChildren(Math.round(nextCount));
        }
      }

      return next;
    });
  };

  const handleCountryChange = (next: string) => {
    const normalized = normalizeCalculatorCountry(next);
    if (normalized !== PRIMARY_TAX_COUNTRY && country === PRIMARY_TAX_COUNTRY) {
      setShowCountryWarning(true);
    } else if (normalized === PRIMARY_TAX_COUNTRY) {
      setShowCountryWarning(false);
    }
    setCountry(normalized);
  };

  const currencyIcon = countryConfig.currencySymbol === "€" ? "€" : "$";

  if (status === "loading" || isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading variant="spinner" size="lg" text={t("calculator.loading")} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                <Calculator className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t("calculator.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t("calculator.subtitle")}
              </p>
            </div>

            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-100">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{t("calculator.disclaimer")}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("calculator.country")}
                    </label>
                    <CountrySupportBadge country={country} />
                  </div>
                  <CountrySelector
                    mode="calculator"
                    value={country}
                    onChange={handleCountryChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t("calculator.countryHint")}
                  </p>
                </div>

                {showCountryWarning && !isDE && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 p-3 text-sm text-amber-900 dark:text-amber-100">
                    {t("calculator.leaveGermanyWarning")}
                  </div>
                )}

                {countryConfig.mode === "stub" && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-800 dark:text-blue-200">
                    {t("calculator.stubNotice")}
                  </div>
                )}

                {countryConfig.fields.caProvince && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("calculator.caProvince")}
                    </label>
                    <select
                      value={caProvince}
                      onChange={(e) => setCaProvince(e.target.value as CAProvinceCode)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                    >
                      <option value="ON">{t("calculator.caProvinceON")}</option>
                      <option value="BC">{t("calculator.caProvinceBC")}</option>
                      <option value="AB">{t("calculator.caProvinceAB")}</option>
                      <option value="OTHER">{t("calculator.caProvinceOther")}</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("calculator.caProvinceHint")}
                    </p>
                  </div>
                )}

                {countryConfig.fields.steuerklasse && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("calculator.deFilingMode")}
                      </label>
                      <select
                        value={deFilingMode}
                        onChange={(e) => {
                          const mode = e.target.value as DEFilingMode;
                          setDeFilingMode(mode);
                          persistJointFilingProfile(
                            mode,
                            parseFloat(spouseIncome) || 0
                          );
                        }}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                      >
                        <option value="einzel">{t("calculator.einzelveranlagung")}</option>
                        <option value="zusammen">{t("calculator.zusammenveranlagung")}</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {deFilingMode === "zusammen"
                          ? t("calculator.zusammenveranlagungHint")
                          : t("calculator.einzelveranlagungHint")}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("calculator.steuerklasse")}
                      </label>
                      <select
                        value={steuerklasse}
                        onChange={(e) => {
                          const value = e.target.value as Steuerklasse;
                          setSteuerklasse(value);
                          persistTaxProfile({ steuerklasse: value });
                        }}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                      >
                        {(["I", "II", "III", "IV", "V", "VI"] as Steuerklasse[]).map(
                          (klasse) => (
                            <option key={klasse} value={klasse}>
                              {t(`calculator.steuerklasse${klasse}`)}
                            </option>
                          )
                        )}
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t(`calculator.steuerklasse${steuerklasse}Desc`)}
                      </p>
                      {deFilingMode === "zusammen" && (
                        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                          {t("calculator.steuerklassenComboHint")}
                        </p>
                      )}
                    </div>

                    {deFilingMode === "zusammen" && (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 space-y-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {t("calculator.spouseSectionTitle")}
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("calculator.spouseIncome")}
                          </label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={spouseIncome}
                            onChange={(e) => {
                              setSpouseIncome(e.target.value);
                              persistJointFilingProfile(
                                deFilingMode,
                                parseFloat(e.target.value) || 0
                              );
                            }}
                            leftIcon={
                              <span className="text-sm font-medium">{currencyIcon}</span>
                            }
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t("calculator.spouseIncomeHint")}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("calculator.spouseTaxWithheld")}
                          </label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={spouseTaxWithheld}
                            onChange={(e) => setSpouseTaxWithheld(e.target.value)}
                            leftIcon={
                              <span className="text-sm font-medium">{currencyIcon}</span>
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("calculator.spouseWerbungskosten")}
                          </label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={spouseWerbungskosten}
                            onChange={(e) => setSpouseWerbungskosten(e.target.value)}
                            leftIcon={<Receipt className="w-4 h-4" />}
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t("calculator.spouseWerbungskostenHint")}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {countryConfig.fields.filingStatus && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("calculator.filingStatus")}
                    </label>
                    <select
                      value={filingStatus}
                      onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                    >
                      <option value="single">{t("calculator.single")}</option>
                      <option value="married">{t("calculator.married")}</option>
                      <option value="headOfHousehold">
                        {t("calculator.headOfHousehold")}
                      </option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isDE && deFilingMode === "zusammen"
                      ? t("calculator.primaryIncome")
                      : t("calculator.income")}
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    leftIcon={
                      <span className="text-sm font-medium">{currencyIcon}</span>
                    }
                  />
                </div>

                {countryConfig.fields.taxWithheld && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("calculator.taxWithheld")}
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={taxWithheld}
                      onChange={(e) => setTaxWithheld(e.target.value)}
                      leftIcon={
                        <span className="text-sm font-medium">{currencyIcon}</span>
                      }
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("calculator.taxWithheldHint")}
                    </p>
                  </div>
                )}

                {isDE && (
                  <>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={crossBorder.enabled}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setCrossBorder((p) => ({ ...p, enabled }));
                            persistTaxProfile({ isCrossBorder: enabled });
                          }}
                          className="h-4 w-4 rounded"
                        />
                        <span className="text-sm font-medium">{t("calculator.crossBorderTitle")}</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">{t("calculator.crossBorderHint")}</p>
                      {crossBorder.enabled && (
                        <div className="mt-3 ml-6 space-y-2">
                          <select
                            value={crossBorder.workCountry}
                            onChange={(e) =>
                              setCrossBorder((p) => ({ ...p, workCountry: e.target.value }))
                            }
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                          >
                            {GRENZGAENGER_WORK_COUNTRIES.map((c) => (
                              <option key={c} value={c}>
                                {taxCountries[c as keyof typeof taxCountries]?.name ?? c}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            placeholder={t("calculator.foreignTaxPaid")}
                            value={crossBorder.foreignTaxPaid || ""}
                            onChange={(e) =>
                              setCrossBorder((p) => ({
                                ...p,
                                foreignTaxPaid: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                          <Input
                            type="number"
                            placeholder={t("calculator.foreignIncome")}
                            value={crossBorder.foreignIncome || ""}
                            onChange={(e) =>
                              setCrossBorder((p) => ({
                                ...p,
                                foreignIncome: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-xs text-blue-800 dark:text-blue-200">
                            {t("calculator.dbaNote")}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rental.enabled}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setRental((p) => ({ ...p, enabled }));
                            persistTaxProfile({ hasRentalIncome: enabled });
                          }}
                          className="h-4 w-4 rounded"
                        />
                        <span className="text-sm font-medium">{t("calculator.rentalTitle")}</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">{t("calculator.rentalHint")}</p>
                      {rental.enabled && (
                        <div className="mt-3 ml-6 space-y-2">
                          <Input
                            type="number"
                            placeholder={t("calculator.grossRent")}
                            value={rental.grossRent || ""}
                            onChange={(e) =>
                              setRental((p) => ({
                                ...p,
                                grossRent: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                          <Input
                            type="number"
                            placeholder={t("calculator.operatingCosts")}
                            value={rental.operatingCosts || ""}
                            onChange={(e) =>
                              setRental((p) => ({
                                ...p,
                                operatingCosts: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={rental.useFlatExpensePercent}
                              onChange={(e) =>
                                setRental((p) => ({
                                  ...p,
                                  useFlatExpensePercent: e.target.checked,
                                }))
                              }
                            />
                            {t("calculator.useFlatExpense")}
                          </label>
                          {!rental.useFlatExpensePercent && (
                            <>
                              <Input
                                type="number"
                                placeholder={t("calculator.buildingValue")}
                                value={rental.buildingValue || ""}
                                onChange={(e) =>
                                  setRental((p) => ({
                                    ...p,
                                    buildingValue: parseFloat(e.target.value) || undefined,
                                  }))
                                }
                              />
                              <Input
                                type="number"
                                placeholder={t("calculator.afaRate")}
                                value={rental.afaRate ?? 2}
                                onChange={(e) =>
                                  setRental((p) => ({
                                    ...p,
                                    afaRate: parseFloat(e.target.value) || 2,
                                  }))
                                }
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVorauszahlungen}
                          onChange={(e) => setShowVorauszahlungen(e.target.checked)}
                          className="h-4 w-4 rounded"
                        />
                        <span className="text-sm font-medium">{t("calculator.vorauszahlungenTitle")}</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">{t("calculator.vorauszahlungenHint")}</p>
                      {showVorauszahlungen && (
                        <div className="mt-3 ml-6 grid grid-cols-2 gap-2">
                          {(["q1", "q2", "q3", "q4"] as const).map((q) => (
                            <Input
                              key={q}
                              type="number"
                              placeholder={t(`calculator.vorauszahlung${q.toUpperCase()}`)}
                              value={vorauszahlungen[q] || ""}
                              onChange={(e) =>
                                setVorauszahlungen((p) => ({
                                  ...p,
                                  [q]: parseFloat(e.target.value) || 0,
                                }))
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {countryConfig.deductions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t("calculator.deductionsTitle")}
                    </label>
                    <div className="space-y-3">
                      {countryConfig.deductions.map((ded) => {
                        const state = deductions.find((d) => d.id === ded.id);
                        if (!state) return null;

                        return (
                          <div
                            key={ded.id}
                            className="rounded-lg border border-gray-200 dark:border-gray-600 p-3"
                          >
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={state.enabled}
                                onChange={(e) =>
                                  updateDeduction(ded.id, {
                                    enabled: e.target.checked,
                                    amount:
                                      e.target.checked
                                        ? ded.type === "children"
                                          ? Math.max(
                                              1,
                                              deductions.find((d) => d.id === ded.id)
                                                ?.amount || ded.defaultAmount || 1
                                            )
                                          : ded.defaultAmount
                                            ? ded.defaultAmount
                                            : state.amount
                                        : state.amount,
                                  })
                                }
                                className="mt-1 h-4 w-4 rounded border-gray-300"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {t(`calculator.deductions.${ded.labelKey}`)}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {t(`calculator.deductions.${ded.descriptionKey}`)}
                                </p>
                              </div>
                            </label>
                            {state.enabled && ded.type === "amount" && (
                              <div className="mt-2 ml-7">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={state.amount || ""}
                                  onChange={(e) =>
                                    updateDeduction(ded.id, {
                                      amount: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  leftIcon={<Receipt className="w-4 h-4" />}
                                />
                              </div>
                            )}
                            {state.enabled && ded.type === "children" && (
                              <div className="mt-2 ml-7">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  {t("calculator.numberOfChildren")}
                                </label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={DE_KINDERFREIBETRAG_MAX_CHILDREN}
                                  placeholder="1"
                                  value={state.amount || ""}
                                  onChange={(e) => {
                                    const raw = parseInt(e.target.value, 10);
                                    const count = Number.isNaN(raw)
                                      ? 1
                                      : Math.min(
                                          DE_KINDERFREIBETRAG_MAX_CHILDREN,
                                          Math.max(1, raw)
                                        );
                                    updateDeduction(ded.id, { amount: count });
                                  }}
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {t("calculator.numberOfChildrenHint", {
                                    amount: "9.540",
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => void runCalculation()}
                  isLoading={isCalculating}
                  leftIcon={<Calculator className="w-5 h-5" />}
                >
                  {t("calculator.calculate")}
                </Button>
              </div>
            </div>

            {result && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {t("calculator.results")}
                  </h2>
                  <div className="space-y-4">
                    {result.savings?.splittingComparison &&
                      result.savings.splittingComparison.savingsFromJointFiling !== 0 && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <TrendingDown className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              {t("calculator.splittingComparisonTitle")}
                            </p>
                            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                              {t("calculator.splittingSeparateTax", {
                                amount: formatMoney(
                                  result.savings.splittingComparison.separateTaxTotal,
                                  result.currencySymbol
                                ),
                              })}
                              {" · "}
                              {t("calculator.splittingJointTax", {
                                amount: formatMoney(
                                  result.savings.splittingComparison.jointTax,
                                  result.currencySymbol
                                ),
                              })}
                            </p>
                            {result.savings.splittingComparison.savingsFromJointFiling > 0 && (
                              <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-1">
                                {t("calculator.splittingSavings", {
                                  amount: formatMoney(
                                    result.savings.splittingComparison.savingsFromJointFiling,
                                    result.currencySymbol
                                  ),
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    {result.savings && result.savings.savingsFromDeductions > 0 && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <TrendingDown className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            {t("calculator.savingsFromDeductions")}
                          </p>
                          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                            ~{formatMoney(result.savings.savingsFromDeductions, result.currencySymbol)}
                          </p>
                        </div>
                      </div>
                    )}

                    {result.appliedDeductions.length > 0 && (
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          {t("calculator.appliedDeductions")}
                        </h3>
                        <div className="space-y-1">
                          {result.appliedDeductions.map((d) => (
                            <div key={d.id} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {t(`calculator.deductions.${d.labelKey}`)}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatMoney(d.amount, result.currencySymbol)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.savings?.incomeBreakdown &&
                      result.savings.incomeBreakdown.rentalGross > 0 && (
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            {t("calculator.incomeBreakdown")}
                          </h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                {t("calculator.incomeEmployment")}
                              </span>
                              <span>
                                {formatMoney(
                                  result.savings.incomeBreakdown.employment,
                                  result.currencySymbol
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                {t("calculator.grossRent")}
                              </span>
                              <span>
                                {formatMoney(
                                  result.savings.incomeBreakdown.rentalGross,
                                  result.currencySymbol
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                {t("calculator.operatingCosts")}
                              </span>
                              <span className="text-red-600">
                                −
                                {formatMoney(
                                  result.savings.incomeBreakdown.rentalExpenses,
                                  result.currencySymbol
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between font-medium pt-1 border-t border-gray-200 dark:border-gray-600">
                              <span>{t("calculator.rentalProfit")}</span>
                              <span>
                                {formatMoney(
                                  result.savings.incomeBreakdown.rentalProfit,
                                  result.currencySymbol
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("calculator.taxableIncome")}
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatMoney(result.taxableIncome, result.currencySymbol)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("calculator.taxOwed")}
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatMoney(result.taxOwed, result.currencySymbol)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("calculator.effectiveRate")}
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.effectiveRate.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("calculator.marginalRate")}
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.marginalRate.toFixed(1)}%
                      </span>
                    </div>

                    {isDE && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                        {t("calculator.marginalRateHint", {
                          rate: result.marginalRate.toFixed(1),
                        })}
                      </p>
                    )}

                    {result.savings?.vorauszahlungen && (
                      <>
                        {result.savings.vorauszahlungen.nachzahlung > 0 && (
                          <div className="flex justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                            <span>{t("calculator.nachzahlung")}</span>
                            <span className="font-bold text-red-600">
                              {formatMoney(result.savings.vorauszahlungen.nachzahlung, result.currencySymbol)}
                            </span>
                          </div>
                        )}
                        {result.savings.vorauszahlungen.erstattung > 0 && (
                          <div className="flex justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <span>{t("calculator.erstattungVorauszahlung")}</span>
                            <span className="font-bold text-green-600">
                              +{formatMoney(result.savings.vorauszahlungen.erstattung, result.currencySymbol)}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {(parseFloat(taxWithheld) || 0) > 0 && (
                      <div
                        className={`flex justify-between items-center p-4 rounded-lg ${
                          result.isRefund
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-red-50 dark:bg-red-900/20"
                        }`}
                      >
                        <span className="text-gray-600 dark:text-gray-400">
                          {result.isRefund ? t("calculator.refund") : t("calculator.owed")}
                        </span>
                        <span
                          className={`text-2xl font-bold ${
                            result.isRefund
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {result.isRefund ? "+" : "-"}
                          {formatMoney(result.refundOrOwed, result.currencySymbol)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isDE && result.savings?.optimizationHints && result.savings.optimizationHints.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-start gap-2 mb-4">
                      <Lightbulb className="w-6 h-6 text-amber-500 shrink-0" />
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {t("calculator.optimizationTitle")}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("calculator.optimizationSubtitle")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {result.savings.optimizationHints.slice(0, 8).map((hint) => (
                        <div
                          key={hint.id}
                          className="flex gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-sm font-bold flex items-center justify-center">
                            {hint.rank}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {t(`calculator.optimization.${hint.labelKey}`)}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                {t(`calculator.optimization.${hint.categoryKey}`)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {t(`calculator.optimization.${hint.descriptionKey}`)}
                            </p>
                            {hint.estimatedSavingsEur !== null && hint.estimatedSavingsEur > 0 && (
                              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                                {t("calculator.estimatedSavings")}{" "}
                                ~{formatMoney(hint.estimatedSavingsEur, "€")}
                              </p>
                            )}
                            {hint.estimatedSavingsEur === null && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                {t("calculator.educationalOnly")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-amber-800 dark:text-amber-200">
                      {t("calculator.disclaimerShort")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
