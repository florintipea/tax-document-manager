'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/provider';

export function PrivacyDataControls() {
  const { t } = useI18n();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/user/export');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || t('settings.privacyExportFailed')
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taxdoc-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t('settings.privacyExportSuccess'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('settings.privacyExportFailed')
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error(t('settings.privacyDeleteConfirmHint'));
      return;
    }
    if (!password) {
      toast.error(t('settings.privacyDeletePasswordRequired'));
      return;
    }
    if (!window.confirm(t('settings.privacyDeleteConfirm'))) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm: 'DELETE' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || t('settings.privacyDeleteFailed')
        );
      }
      toast.success(t('settings.privacyDeleteSuccess'));
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('settings.privacyDeleteFailed')
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('settings.privacyTitle')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('settings.privacyIntro')}{' '}
          <Link
            href="/legal/datenschutz"
            className="text-blue-600 underline dark:text-blue-400"
          >
            {t('legal.datenschutz')}
          </Link>
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          {t('settings.privacyExportTitle')}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('settings.privacyExportHint')}
        </p>
        <Button
          variant="primary"
          onClick={() => void handleExport()}
          isLoading={exporting}
          leftIcon={<Download className="w-4 h-4" />}
        >
          {t('settings.privacyExportButton')}
        </Button>
      </div>

      <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 space-y-3">
        <h4 className="font-medium text-red-800 dark:text-red-200">
          {t('settings.privacyDeleteTitle')}
        </h4>
        <p className="text-sm text-red-700/90 dark:text-red-200/80">
          {t('settings.privacyDeleteHint')}
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('settings.privacyDeletePassword')}
          </label>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('settings.privacyDeleteTypeDelete')}
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => void handleDelete()}
          isLoading={deleting}
          leftIcon={<Trash2 className="w-4 h-4" />}
          className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
        >
          {t('settings.privacyDeleteButton')}
        </Button>
      </div>
    </div>
  );
}
