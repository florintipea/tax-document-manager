'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import toast from 'react-hot-toast';

interface SurveyResponse {
  id: string;
  priceRange: string;
  willingToPay: number | null;
  planInterest: string | null;
  comment: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null } | null;
}

interface StatRow {
  priceRange: string;
  _count: { priceRange: number };
  _avg: { willingToPay: number | null };
}

export default function AdminPricingSurveyPage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [total, setTotal] = useState(0);
  const [invitesPending, setInvitesPending] = useState(0);
  const [loading, setLoading] = useState(true);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pricing-survey');
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setResponses(data.responses || []);
      setStats(data.stats || []);
      setTotal(data.total || 0);
      setInvitesPending(data.invitesPending || 0);
    } catch {
      toast.error(t('pricingSurvey.admin.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (status === 'loading') return null;

  if (!isAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-12 text-center text-gray-600 dark:text-gray-400">
          {t('pricingSurvey.admin.noAccess')}
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('adminReports.nav')}
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-7 h-7" />
                {t('pricingSurvey.admin.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('pricingSurvey.admin.subtitle')}
              </p>
            </div>
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('adminReports.refresh')}
            </Button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">{t('pricingSurvey.admin.totalResponses')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">{t('pricingSurvey.admin.pendingInvites')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{invitesPending}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">{t('pricingSurvey.admin.avgWillingness')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(() => {
                  const withAmount = responses.filter((r) => r.willingToPay != null);
                  if (!withAmount.length) return '—';
                  const avg =
                    withAmount.reduce((s, r) => s + (r.willingToPay || 0), 0) / withAmount.length;
                  return `€${avg.toFixed(0)}`;
                })()}
              </p>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-8">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                {t('pricingSurvey.admin.distribution')}
              </h2>
              <div className="space-y-2">
                {stats.map((row) => (
                  <div key={row.priceRange} className="flex justify-between text-sm">
                    <span>{t(`pricingSurvey.ranges.${row.priceRange}`)}</span>
                    <span className="font-medium">{row._count.priceRange}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
            ) : responses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t('pricingSurvey.admin.empty')}</div>
            ) : (
              responses.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {r.user?.email || t('adminReports.anonymous')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t(`pricingSurvey.ranges.${r.priceRange}`)}
                        {r.willingToPay != null && ` · €${r.willingToPay}`}
                        {r.planInterest && ` · ${t(`pricingSurvey.plans.${r.planInterest}`)}`}
                      </p>
                      {r.comment && (
                        <p className="text-sm text-gray-500 mt-1 italic">&ldquo;{r.comment}&rdquo;</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
