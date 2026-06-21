'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import toast from 'react-hot-toast';

interface ReportUser {
  id: string;
  email: string;
  name: string | null;
}

interface TestReportItem {
  id: string;
  type: string;
  status: string;
  severity: string;
  title: string | null;
  message: string;
  pageUrl: string | null;
  userAgent: string | null;
  stackTrace: string | null;
  platform: string | null;
  adminNotes: string | null;
  createdAt: string;
  user: ReportUser | null;
}

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [reports, setReports] = useState<TestReportItem[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'error' | 'feedback' | 'bug'>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'open') params.set('status', 'open');
      if (filter === 'error' || filter === 'feedback' || filter === 'bug') {
        params.set('type', filter);
      }

      const response = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setReports(data.reports || []);
      setOpenCount(data.openCount || 0);
    } catch {
      toast.error(t('adminReports.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    if (isAdmin) void loadReports();
  }, [isAdmin, loadReports]);

  const selected = reports.find((r) => r.id === selectedId) || reports[0] || null;

  useEffect(() => {
    if (selected) {
      setSelectedId(selected.id);
      setAdminNotes(selected.adminNotes || '');
    }
  }, [selected?.id]);

  const updateReport = async (updates: {
    status?: string;
    adminNotes?: string;
  }) => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/reports/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Update failed');
      toast.success(t('adminReports.updated'));
      await loadReports();
    } catch {
      toast.error(t('adminReports.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-xl font-semibold">{t('adminReports.noAccess')}</h1>
        </div>
      </AuthenticatedLayout>
    );
  }

  const typeIcon = (type: string) => {
    if (type === 'error') return AlertCircle;
    if (type === 'bug') return Bug;
    return MessageSquare;
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-blue-600" />
              {t('adminReports.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('adminReports.subtitle')} · {openCount} {t('adminReports.open')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/pricing-survey">{t('pricingSurvey.admin.title')}</Link>
            </Button>
            <Button variant="outline" onClick={() => void loadReports()}>
              {t('adminReports.refresh')}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(['open', 'all', 'error', 'feedback', 'bug'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {t(`adminReports.filter.${f}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-gray-500">{t('adminReports.empty')}</div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto">
              {reports.map((report) => {
                const Icon = typeIcon(report.type);
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(report.id);
                      setAdminNotes(report.adminNotes || '');
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selected?.id === report.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[report.status] || statusColors.open}`}>
                            {report.status}
                          </span>
                          <span className="text-xs text-gray-500">{report.type}</span>
                        </div>
                        <p className="font-medium text-sm truncate mt-1">
                          {report.title || report.message.slice(0, 60)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {report.user?.email || t('adminReports.anonymous')}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selected && (
              <div className="lg:col-span-3 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[selected.status]}`}>
                    {selected.status}
                  </span>
                  <span className="text-xs text-gray-500">{selected.severity}</span>
                  <span className="text-xs text-gray-500">{selected.platform}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(selected.createdAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  <h2 className="font-semibold text-lg">
                    {selected.title || t(`adminReports.type.${selected.type}`)}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                    {selected.message}
                  </p>
                </div>

                {selected.user && (
                  <p className="text-sm">
                    <strong>{t('adminReports.user')}:</strong> {selected.user.email}
                    {selected.user.name ? ` (${selected.user.name})` : ''}
                  </p>
                )}

                {selected.pageUrl && (
                  <p className="text-sm break-all">
                    <strong>{t('adminReports.page')}:</strong>{' '}
                    <Link href={selected.pageUrl} className="text-blue-600 underline" target="_blank">
                      {selected.pageUrl}
                    </Link>
                  </p>
                )}

                {selected.stackTrace && (
                  <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto max-h-40">
                    {selected.stackTrace}
                  </pre>
                )}

                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={t('adminReports.notesPlaceholder')}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => void updateReport({ adminNotes })}
                  >
                    {t('adminReports.saveNotes')}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={saving}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() =>
                      void updateReport({ status: 'resolved', adminNotes })
                    }
                  >
                    {t('adminReports.markResolved')}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={saving}
                    onClick={() =>
                      void updateReport({ status: 'in_progress', adminNotes })
                    }
                  >
                    {t('adminReports.markInProgress')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
