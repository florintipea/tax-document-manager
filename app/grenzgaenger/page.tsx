'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText } from 'lucide-react';
import { PublicLandingShell } from '@/components/growth/public-landing-shell';
import { QuickCheck } from '@/components/growth/quick-check';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';

const DOC_KEYS = [
  'grenzgaengerCheck.docs.lohnausweis',
  'grenzgaengerCheck.docs.quellensteuer',
  'grenzgaengerCheck.docs.a1',
  'grenzgaengerCheck.docs.ansaessigkeit',
  'grenzgaengerCheck.docs.nachweis',
  'grenzgaengerCheck.docs.pendeln',
] as const;

export default function GrenzgaengerPublicPage() {
  const { t } = useI18n();

  return (
    <PublicLandingShell>
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {t('grenzgaengerPublic.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('grenzgaengerPublic.subtitle')}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('grenzgaengerPublic.alsoArbeitnehmer')}{' '}
            <Link href="/rechner" className="text-blue-600 hover:underline dark:text-blue-400">
              {t('growthNav.rechner')}
            </Link>
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          {t('grenzgaengerCheck.disclaimer')}
        </div>

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

        <div className="mb-8">
          <QuickCheck defaultMode="grenzgaenger" showPostCta />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild leftIcon={<ClipboardCheck className="h-4 w-4" />}>
            <Link href="/auth/register?from=grenzgaenger">
              {t('grenzgaengerPublic.ctaRegister')}
            </Link>
          </Button>
          <Button asChild variant="outline" leftIcon={<FileText className="h-4 w-4" />}>
            <Link href="/beleg-check">{t('landing.ctaChecklist')}</Link>
          </Button>
        </div>
      </div>
    </PublicLandingShell>
  );
}
