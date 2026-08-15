'use client';

import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { ClipboardCheck, FileText } from 'lucide-react';

/** Soft-hidden competitor stubs: no fake WISO / NotebookLM connect UI in product path. */
export default function IntegrationsPage() {
  const { t } = useI18n();

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
          {t('integrations.title')}
        </h1>

        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="mr-2 inline-block rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-800 dark:text-amber-100">
            {t('integrations.previewBadge')}
          </span>
          {t('integrations.previewNote')}
        </div>

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          {t('integrations.widgetHiddenHint')}
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild leftIcon={<FileText className="h-4 w-4" />}>
            <Link href="/documents">{t('common.documents')}</Link>
          </Button>
          <Button asChild variant="outline" leftIcon={<ClipboardCheck className="h-4 w-4" />}>
            <Link href="/steuererklaerung">{t('common.steuererklaerung')}</Link>
          </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
