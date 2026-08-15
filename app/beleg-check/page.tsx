'use client';

import Link from 'next/link';
import { CheckCircle2, ClipboardList, FileText } from 'lucide-react';
import { PublicLandingShell } from '@/components/growth/public-landing-shell';
import { GuestBelegTry } from '@/components/growth/guest-beleg-try';
import { SaveResultsCta } from '@/components/growth/save-results-cta';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';

const BELEG_KEYS = [
  'belegCheck.items.lohnsteuer',
  'belegCheck.items.fahrten',
  'belegCheck.items.homeoffice',
  'belegCheck.items.versicherung',
  'belegCheck.items.spenden',
  'belegCheck.items.krankheit',
  'belegCheck.items.fortbildung',
  'belegCheck.items.konto',
] as const;

export default function BelegCheckPage() {
  const { t } = useI18n();

  return (
    <PublicLandingShell>
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
            <ClipboardList className="h-6 w-6 text-blue-700 dark:text-blue-300" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {t('belegCheck.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('belegCheck.subtitle')}</p>
          <p className="mt-2 text-sm text-gray-500">{t('landing.yearRoundValue')}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
              {t('landing.trustNoAdvice')}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {t('landing.trustNoAutoSubmit')}
            </span>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {t('belegCheck.disclaimer')}
        </div>

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <FileText className="h-5 w-5 text-blue-600" />
            {t('belegCheck.listTitle')}
          </h2>
          <ul className="space-y-2.5">
            {BELEG_KEYS.map((key) => (
              <li
                key={key}
                className="flex gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {t(key)}
              </li>
            ))}
          </ul>
        </section>

        <div className="mb-6">
          <GuestBelegTry />
        </div>

        <SaveResultsCta from="beleg-check" className="mb-6" />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/rechner">{t('growthNav.rechner')}</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/grenze">{t('growthNav.grenze')}</Link>
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          {t('belegCheck.afterValue')}
        </p>
      </div>
    </PublicLandingShell>
  );
}
