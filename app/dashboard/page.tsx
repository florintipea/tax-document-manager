"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { Loading } from "@/components/ui/loading";
import { FileText, Calculator, Shield, TrendingUp, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BillingOverviewWidget } from "@/components/dashboard/billing-overview-widget";
import { HappyPathStrip } from "@/components/dashboard/happy-path-strip";
import { FinancialOverview } from "@/components/dashboard/financial-overview";
import { OptimizationTipsPanel } from "@/components/dashboard/optimization-tips";
import { useFinanceOverview } from "@/components/dashboard/use-finance-overview";
import { useI18n } from "@/lib/i18n/provider";

interface DashboardDocument {
  isTaxRelevant?: boolean;
  taxAmount?: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const finance = useFinanceOverview();
  const [stats, setStats] = useState({
    documents: 0,
    taxRelevant: 0,
    totalValue: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/documents");
        if (response.ok) {
          const data = await response.json();
          const documents: DashboardDocument[] = data.documents || [];
          setStats({
            documents: documents.length,
            taxRelevant: documents.filter((d) => d.isTaxRelevant).length,
            totalValue: documents.reduce((sum, d) => sum + (d.taxAmount || 0), 0),
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading variant="spinner" size="lg" text={t("common.loading")} />
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
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {t("dashboard.welcomeBack")}, {session?.user?.name || t("common.welcome")}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{t("dashboard.welcomeHint")}</p>
          </div>

          <HappyPathStrip />

          <FinancialOverview
            overview={finance.overview}
            loading={finance.loading}
            error={finance.error}
          />

          <OptimizationTipsPanel tips={finance.overview?.tips} />

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("dashboard.totalDocuments")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.documents}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("dashboard.taxRelevant")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.taxRelevant}
                  </p>
                </div>
                <div className="rounded-lg bg-teal-100 p-3 dark:bg-teal-900/30">
                  <TrendingUp className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("dashboard.totalValue")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    €{stats.totalValue.toLocaleString("de-DE")}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/documents">
              <div className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                      {t("documents.title")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("documents.upload")}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/steuererklaerung">
              <div className="cursor-pointer rounded-lg border border-blue-100 bg-white p-6 shadow transition-shadow hover:shadow-lg dark:border-blue-900 dark:bg-gray-800">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                    <ClipboardCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                      {t("common.steuererklaerung")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("happyPath.step3")}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/ai-assistant">
              <div className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-teal-100 p-3 dark:bg-teal-900/30">
                    <Shield className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                      {t("common.aiAssistant")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("dashboard.askAI")}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                {t("dashboard.recentActivity")}
              </h2>
              <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                {t("integrations.widgetHiddenHint")}
              </p>
              <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("happyPath.title")}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t("dashboard.welcomeHint")}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/documents">{t("dashboard.startUpload")}</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                {t("grenzgaengerCheck.title")}
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t("grenzgaengerCheck.settingsBlurb")}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/grenzgaenger">{t("grenzgaengerCheck.title")}</Link>
              </Button>
            </div>
          </div>

          <footer className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <BillingOverviewWidget compact />
          </footer>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
