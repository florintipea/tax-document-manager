'use client';

import Link from 'next/link';
import { PublicLandingShell } from '@/components/growth/public-landing-shell';
import { QuickCheck } from '@/components/growth/quick-check';
import { useI18n } from '@/lib/i18n/provider';
import type { QuickCheckMode, WorkCountry } from '@/lib/growth/quick-check';

export interface KeywordLandingProps {
  /** i18n title key */
  titleKey: string;
  subtitleKey: string;
  /** Social trigger label shown as badge */
  triggerLabel: string;
  defaultMode?: QuickCheckMode;
  defaultWorkCountry?: WorkCountry;
  /** Extra note under subtitle */
  alsoKey?: string;
  alsoHref?: string;
}

/**
 * Social keyword landing: promised tool first, no signup wall.
 */
export function KeywordLanding({
  titleKey,
  subtitleKey,
  triggerLabel,
  defaultMode = 'grenzgaenger',
  defaultWorkCountry = 'CH',
  alsoKey,
  alsoHref = '/rechner',
}: KeywordLandingProps) {
  const { t } = useI18n();

  return (
    <PublicLandingShell>
      <div className="mx-auto max-w-xl">
        <div className="mb-5 text-center">
          <span className="mb-3 inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
            {triggerLabel}
          </span>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {t(titleKey)}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t(subtitleKey)}</p>
          <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            {t('landing.headline')}
          </p>
          <p className="mt-1 text-xs text-gray-500">{t('landing.yearRoundValue')}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
              {t('landing.trustNoAdvice')}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {t('landing.trustNoAutoSubmit')}
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
              {t('landing.badge')}
            </span>
          </div>
          {alsoKey ? (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {t(alsoKey)}{' '}
              <Link href={alsoHref} className="text-blue-600 hover:underline dark:text-blue-400">
                {t('growthNav.rechner')}
              </Link>
            </p>
          ) : null}
        </div>

        <QuickCheck
          defaultMode={defaultMode}
          defaultWorkCountry={defaultWorkCountry}
          showPostCta
        />

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/beleg-check" className="text-blue-600 hover:underline dark:text-blue-400">
            {t('landing.ctaChecklist')}
          </Link>
          {' · '}
          <Link href="/grenzgaenger" className="text-blue-600 hover:underline dark:text-blue-400">
            {t('growthNav.grenzgaenger')}
          </Link>
          {' · '}
          <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
            TaxDoc
          </Link>
        </p>
      </div>
    </PublicLandingShell>
  );
}
