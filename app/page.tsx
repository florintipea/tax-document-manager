"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calculator, FileText, Bot, Shield, Sparkles } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { CloudInstanceBanner } from "@/components/cloud/cloud-instance-banner";
import { AppFooter } from "@/components/layout/footer";
import { useI18n } from "@/lib/i18n/provider";

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="max-w-3xl mx-auto mb-8">
          <CloudInstanceBanner />
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <AppLogo size="xl" textClassName="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {t("landing.badge")}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl text-gray-900 dark:text-white mb-4 font-bold max-w-3xl mx-auto">
            {t("landing.headline")}
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            {t("landing.subheadline")}
          </p>

          <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 max-w-2xl mx-auto mb-10">
            {t("landing.disclaimer")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              variant="primary"
              size="lg"
              className="shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => router.push("/auth/register")}
            >
              {t("landing.getStarted")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/auth/login")}
            >
              {t("landing.signIn")}
            </Button>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <Calculator className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              {t("landing.featureCalculatorTitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("landing.featureCalculatorDesc")}
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              {t("landing.featureDocumentsTitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("landing.featureDocumentsDesc")}
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <Bot className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              {t("landing.featureAITitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("landing.featureAIDesc")}
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              {t("landing.featureSecurityTitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("landing.featureSecurityDesc")}
            </p>
          </div>
        </div>

        <div className="mt-10 text-center max-w-2xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("landing.otherCountriesNote")}
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/legal/impressum" className="hover:underline mx-2">
            {t("legal.impressum")}
          </Link>
          <span>·</span>
          <Link href="/legal/datenschutz" className="hover:underline mx-2">
            {t("legal.datenschutz")}
          </Link>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
