'use client';

import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText } from 'lucide-react';

const DOC_KEYS = [
  'grenzgaengerCheck.docs.lohnausweis',
  'grenzgaengerCheck.docs.quellensteuer',
  'grenzgaengerCheck.docs.a1',
  'grenzgaengerCheck.docs.ansaessigkeit',
  'grenzgaengerCheck.docs.nachweis',
  'grenzgaengerCheck.docs.pendeln',
] as const;

export default function GrenzgaengerChecklistPage() {
  const { t } = useI18n();

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            {t('grenzgaengerCheck.disclaimer')}
          </div>

          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            {t('grenzgaengerCheck.title')}
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">{t('grenzgaengerCheck.subtitle')}</p>

          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t('grenzgaengerCheck.scenarioTitle')}
            </h2>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {t('grenzgaengerCheck.scenarioResidence')}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {t('grenzgaengerCheck.scenarioWork')}
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                {t('grenzgaengerCheck.scenarioDba')}
              </li>
            </ul>
          </section>

          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <FileText className="h-5 w-5 text-blue-600" />
              {t('grenzgaengerCheck.docsTitle')}
            </h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
              {DOC_KEYS.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ol>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button asChild leftIcon={<ClipboardCheck className="h-4 w-4" />}>
              <Link href="/steuererklaerung">{t('grenzgaengerCheck.openAssistent')}</Link>
            </Button>
            <Button asChild variant="outline" leftIcon={<FileText className="h-4 w-4" />}>
              <Link href="/documents">{t('grenzgaengerCheck.uploadDocs')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
