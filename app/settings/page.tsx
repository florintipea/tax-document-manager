"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, User, Shield, Bell, Moon, Sun, Monitor, Plug, CreditCard, Sparkles, Receipt } from "lucide-react";
import Link from "next/link";
import { supportedLocales } from "@/lib/i18n/config";
import { getSuggestedLanguageForCountry } from "@/lib/tax/default-categories";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/config";
import type { Steuerklasse } from "@/lib/tax/country-config";
import { DE_BUNDESLAENDER } from "@/lib/tax/country-config";
import { CountrySelector, CountrySupportBadge } from "@/components/tax/country-selector";
import { useTheme } from "@/components/providers/theme-provider";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { TwoFactorSettings } from "@/components/settings/two-factor-settings";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, setLocale } = useI18n();
  const { setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "DE",
    language: "de",
    theme: "system",
    steuerklasse: "I" as Steuerklasse,
    bundesland: "" as string,
    numberOfChildren: 0,
    deFilingMode: "einzel" as "einzel" | "zusammen",
    spouseIncome: 0,
    isCrossBorder: false,
    hasRentalIncome: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const loadSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (!response.ok) throw new Error("Failed to load settings");

        const data = await response.json();
        setFormData({
          name: data.settings.name || session?.user?.name || "",
          email: data.settings.email || session?.user?.email || "",
          country: data.settings.country || "DE",
          language: data.settings.language || "de",
          theme: data.settings.theme || "system",
          steuerklasse: (data.settings.steuerklasse || "I") as Steuerklasse,
          bundesland: data.settings.bundesland || "",
          numberOfChildren: data.settings.numberOfChildren ?? 0,
          deFilingMode:
            data.settings.deFilingMode === "zusammen" ? "zusammen" : "einzel",
          spouseIncome: data.settings.spouseIncome ?? 0,
          isCrossBorder: data.settings.isCrossBorder ?? false,
          hasRentalIncome: data.settings.hasRentalIncome ?? false,
        });
        setTwoFactorEnabled(Boolean(data.settings.twoFactorEnabled));

        if (data.settings.language) {
          setLocale(data.settings.language as Locale);
        }
        if (data.settings.theme) {
          setTheme(data.settings.theme);
        }
      } catch {
        toast.error(t("settings.loadFailed"));
      } finally {
        setIsLoadingSettings(false);
      }
    };

    void loadSettings();
  }, [status, session, setLocale]);

  const applyTaxProfileSettings = (settings: Record<string, unknown>) => {
    setFormData((current) => ({
      ...current,
      steuerklasse: (settings.steuerklasse || "I") as Steuerklasse,
      bundesland: (settings.bundesland as string) || "",
      numberOfChildren: (settings.numberOfChildren as number) ?? 0,
      deFilingMode:
        settings.deFilingMode === "zusammen" ? "zusammen" : "einzel",
      spouseIncome: (settings.spouseIncome as number) ?? 0,
      isCrossBorder: (settings.isCrossBorder as boolean) ?? false,
      hasRentalIncome: (settings.hasRentalIncome as boolean) ?? false,
    }));
  };

  const handleSaveTaxProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steuerklasse: formData.steuerklasse,
          bundesland: formData.bundesland || null,
          numberOfChildren: formData.numberOfChildren,
          deFilingMode: formData.deFilingMode,
          spouseIncome: formData.spouseIncome,
          isCrossBorder: formData.isCrossBorder,
          hasRentalIncome: formData.hasRentalIncome,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (data as { error?: string }).error || t("settings.saveFailed")
        );
      }
      if ((data as { settings?: Record<string, unknown> }).settings) {
        applyTaxProfileSettings(
          (data as { settings: Record<string, unknown> }).settings
        );
      }
      toast.success(t("settings.saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          country: formData.country,
          language: formData.language,
          theme: formData.theme,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setFormData((current) => ({
        ...current,
        ...data.settings,
      }));
      setLocale(data.settings.language as Locale);
      if (data.settings.theme) {
        setTheme(data.settings.theme);
      }
      toast.success(t("settings.saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountryChange = (country: string) => {
    const suggestedLanguage = getSuggestedLanguageForCountry(country);
    setFormData((current) => ({
      ...current,
      country,
      language: suggestedLanguage,
    }));
  };

  if (status === "loading" || isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading variant="spinner" size="lg" text={t("common.loading")} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const tabs = [
    { id: "profile", label: t("settings.profile"), icon: User },
    { id: "security", label: t("settings.security"), icon: Shield },
    { id: "notifications", label: t("settings.notifications"), icon: Bell },
    { id: "taxProfile", label: t("settings.taxProfile"), icon: Receipt },
    { id: "preferences", label: t("settings.preferences"), icon: Settings },
    { id: "integrations", label: t("settings.integrations"), icon: Plug },
    { id: "ai", label: t("settings.aiProviders"), icon: Sparkles },
    { id: "billing", label: t("settings.billing"), icon: CreditCard },
  ];

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t("settings.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t("settings.subtitle")}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6">
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("settings.fullName")}
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("common.email")}
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-gray-50 dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t("settings.taxCountry")}
                        </label>
                        <CountrySupportBadge country={formData.country} />
                      </div>
                      <CountrySelector
                        id="country"
                        mode="profile"
                        value={formData.country}
                        onChange={handleCountryChange}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {t("settings.taxCountryHint")}
                      </p>
                    </div>
                    <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                      {t("common.save")}
                    </Button>
                  </div>
                )}

                {activeTab === "taxProfile" && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("settings.taxProfileHint")}
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("settings.steuerklasse")}
                      </label>
                      <select
                        value={formData.steuerklasse}
                        onChange={(e) =>
                          setFormData({ ...formData, steuerklasse: e.target.value as Steuerklasse })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        {(["I", "II", "III", "IV", "V", "VI"] as Steuerklasse[]).map((k) => (
                          <option key={k} value={k}>
                            {t(`calculator.steuerklasse${k}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("settings.bundesland")}
                      </label>
                      <select
                        value={formData.bundesland}
                        onChange={(e) =>
                          setFormData({ ...formData, bundesland: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        <option value="">{t("settings.bundeslandNone")}</option>
                        {DE_BUNDESLAENDER.map((bl) => (
                          <option key={bl.code} value={bl.code}>
                            {bl.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("settings.deFilingMode")}
                      </label>
                      <select
                        value={formData.deFilingMode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deFilingMode: e.target.value as "einzel" | "zusammen",
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        <option value="einzel">{t("settings.einzelveranlagung")}</option>
                        <option value="zusammen">{t("settings.zusammenveranlagung")}</option>
                      </select>
                    </div>
                    {formData.deFilingMode === "zusammen" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("settings.spouseIncome")}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.spouseIncome}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              spouseIncome: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("settings.numberOfChildren")}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={formData.numberOfChildren}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numberOfChildren: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isCrossBorder}
                        onChange={(e) =>
                          setFormData({ ...formData, isCrossBorder: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{t("settings.isCrossBorder")}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasRentalIncome}
                        onChange={(e) =>
                          setFormData({ ...formData, hasRentalIncome: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{t("settings.hasRentalIncome")}</span>
                    </label>
                    <Button variant="primary" onClick={handleSaveTaxProfile} isLoading={isSaving}>
                      {t("settings.saveTaxProfile")}
                    </Button>
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("settings.theme")}
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "light", label: t("common.light"), icon: Sun },
                          { value: "dark", label: t("common.dark"), icon: Moon },
                          { value: "system", label: t("common.system"), icon: Monitor },
                        ].map((theme) => {
                          const Icon = theme.icon;
                          return (
                            <button
                              key={theme.value}
                              onClick={() => {
                                setFormData({ ...formData, theme: theme.value });
                                setTheme(theme.value as "light" | "dark" | "system");
                              }}
                              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                                formData.theme === theme.value
                                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {theme.label}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("settings.language")}
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) =>
                          setFormData({ ...formData, language: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {supportedLocales.map((lang) => (
                          <option key={lang} value={lang}>
                            {t(`languages.${lang}`)}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {t("settings.languageHint")}
                      </p>
                    </div>
                    <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                      {t("settings.savePreferences")}
                    </Button>
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="space-y-8">
                    <TwoFactorSettings initialEnabled={twoFactorEnabled} />
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("settings.passwordHelp")}
                      </p>
                      <Link href="/auth/forgot-password">
                        <Button variant="outline">{t("settings.resetPassword")}</Button>
                      </Link>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {t("settings.emailNotifications")}
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {activeTab === "integrations" && (
                  <div className="space-y-6">
                    <Link href="/settings/integrations">
                      <Button variant="primary" className="w-full" leftIcon={<Plug className="w-4 h-4" />}>
                        {t("settings.openIntegrations")}
                      </Button>
                    </Link>
                  </div>
                )}

                {activeTab === "ai" && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("aiProviders.settingsTabHint")}
                    </p>
                    <Link href="/settings/ai">
                      <Button variant="primary" className="w-full" leftIcon={<Sparkles className="w-4 h-4" />}>
                        {t("aiProviders.openSettings")}
                      </Button>
                    </Link>
                  </div>
                )}

                {activeTab === "billing" && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("billing.subtitle")}
                    </p>
                    <Link href="/settings/billing">
                      <Button variant="primary" className="w-full" leftIcon={<CreditCard className="w-4 h-4" />}>
                        {t("billing.manageSubscription")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
