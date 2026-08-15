'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PublicLandingShell } from '@/components/growth/public-landing-shell';
import { QuickCheck } from '@/components/growth/quick-check';
import { ReferralInviteCard } from '@/components/growth/referral-invite-card';
import { useI18n } from '@/lib/i18n/provider';
import type { QuickCheckMode } from '@/lib/growth/quick-check';

function RechnerInner() {
  const { t } = useI18n();
  const params = useSearchParams();
  const modeParam = params.get('mode');
  const defaultMode: QuickCheckMode =
    modeParam === 'grenzgaenger' ? 'grenzgaenger' : 'arbeitnehmer';

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
          {t('landing.badge')}
        </p>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          {t('rechnerPage.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('rechnerPage.subtitle')}</p>
      </div>

      <QuickCheck defaultMode={defaultMode} showPostCta />

      <div className="mt-6">
        <ReferralInviteCard />
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/beleg-check" className="text-blue-600 hover:underline dark:text-blue-400">
          {t('landing.ctaChecklist')}
        </Link>
        {' · '}
        <Link href="/grenzgaenger" className="text-blue-600 hover:underline dark:text-blue-400">
          {t('growthNav.grenzgaenger')}
        </Link>
      </p>
    </div>
  );
}

export default function RechnerPage() {
  return (
    <PublicLandingShell>
      <Suspense fallback={<div className="mx-auto max-w-xl animate-pulse h-64 rounded-2xl bg-white/50" />}>
        <RechnerInner />
      </Suspense>
    </PublicLandingShell>
  );
}
