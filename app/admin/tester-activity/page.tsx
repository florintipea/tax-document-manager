'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Users,
} from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import toast from 'react-hot-toast';

interface TesterRow {
  slot: number;
  email: string;
  name: string | null;
  lastLoginAt: string | null;
  documentCount: number;
  lastDocumentAt: string | null;
  aiInteractionCount: number;
  testReportCount: number;
  active: boolean;
  assigned: boolean;
  assignedToEmail: string | null;
  assignedToName: string | null;
  assignedAt: string | null;
}

interface Summary {
  totalSlots: number;
  loggedInCount: number;
  totalUploads: number;
  totalReports: number;
  activeCount: number;
  accountsCreated: number;
  assignedCount: number;
  freeSlots: number;
}

function formatDate(value: string | null, locale: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function AdminTesterActivityPage() {
  const { data: session, status } = useSession();
  const { t, locale } = useI18n();
  const [testers, setTesters] = useState<TesterRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tester-activity');
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setTesters(data.testers || []);
      setSummary(data.summary || null);
    } catch {
      toast.error(t('testerActivity.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-semibold">{t('testerActivity.noAccess')}</h1>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('adminReports.nav')}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-7 h-7 text-blue-600" />
                {t('testerActivity.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('testerActivity.subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/reports">{t('adminReports.title')}</Link>
              </Button>
              <Button variant="outline" onClick={() => void load()} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('adminReports.refresh')}
              </Button>
            </div>
          </div>

          {summary && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">{t('testerActivity.summary.assigned')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('testerActivity.summary.assignedValue', {
                    assigned: summary.assignedCount,
                    total: summary.accountsCreated,
                  })}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">{t('testerActivity.summary.freeSlots')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.freeSlots}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">{t('testerActivity.summary.loggedIn')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('testerActivity.summary.loggedInValue', {
                    count: summary.loggedInCount,
                    total: summary.totalSlots,
                  })}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">{t('testerActivity.summary.uploads')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.totalUploads}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">{t('testerActivity.summary.reports')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.totalReports}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">{t('testerActivity.summary.active')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.activeCount}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    / {summary.accountsCreated} {t('testerActivity.summary.accounts')}
                  </span>
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : testers.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              {t('testerActivity.empty')}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                        {t('testerActivity.columns.tester')}
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                        {t('testerActivity.columns.assignedTo')}
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                        {t('testerActivity.columns.lastLogin')}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                        {t('testerActivity.columns.documents')}
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                        {t('testerActivity.columns.lastUpload')}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                        {t('testerActivity.columns.ai')}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                        {t('testerActivity.columns.reports')}
                      </th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                        {t('testerActivity.columns.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {testers.map((tester) => (
                      <tr
                        key={tester.email}
                        className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-900/30"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {tester.email}
                          </div>
                          {tester.name && (
                            <div className="text-xs text-gray-500">{tester.name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {tester.assigned ? (
                            <div>
                              <div className="text-sm">{tester.assignedToEmail}</div>
                              {tester.assignedToName && (
                                <div className="text-xs text-gray-500">
                                  {tester.assignedToName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              {t('testerActivity.unassigned')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(tester.lastLoginAt, locale)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {tester.documentCount}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(tester.lastDocumentAt, locale)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {tester.aiInteractionCount}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {tester.testReportCount}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tester.active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              {t('testerActivity.active')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              {t('testerActivity.inactive')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
