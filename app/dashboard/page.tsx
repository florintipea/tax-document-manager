"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { Loading } from "@/components/ui/loading";
import { FileText, Calculator, Shield, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IntegrationsWidget } from "@/components/dashboard/integrations-widget";
import { BillingOverviewWidget } from "@/components/dashboard/billing-overview-widget";
import { useI18n } from "@/lib/i18n/provider";

interface DashboardDocument {
  isTaxRelevant?: boolean;
  taxAmount?: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [stats, setStats] = useState({
    documents: 0,
    taxRelevant: 0,
    totalValue: 0,
    upcomingDeadlines: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Fetch dashboard stats
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
            upcomingDeadlines: 0, // TODO: Calculate from deadlines
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.welcomeBack')}, {session?.user?.name || t('common.welcome')}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.recentActivity')}
          </p>
        </div>

        <BillingOverviewWidget />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {t('dashboard.totalDocuments')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.documents}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {t('dashboard.taxRelevant')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.taxRelevant}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Value
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Upcoming Deadlines
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.upcomingDeadlines}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/documents">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {t('documents.title')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('documents.upload')}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/calculator">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {t('common.calculator')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('dashboard.calculateTax')}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/ai-assistant">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {t('common.aiAssistant')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('dashboard.askAI')}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Integrations & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IntegrationsWidget />
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('dashboard.recentActivity')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Welcome to TaxDoc!
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Start by uploading your first tax document
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/documents">Upload</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

