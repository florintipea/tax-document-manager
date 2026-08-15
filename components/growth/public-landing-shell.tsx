'use client';

import Link from 'next/link';
import { AppLogo } from '@/components/brand/app-logo';
import { AppFooter } from '@/components/layout/footer';
import { useI18n } from '@/lib/i18n/provider';

interface PublicLandingShellProps {
  children: React.ReactNode;
  /** Compact top nav links */
  showGrowthNav?: boolean;
}

export function PublicLandingShell({
  children,
  showGrowthNav = true,
}: PublicLandingShellProps) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      <header className="border-b border-blue-100/80 bg-white/70 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo size="sm" />
          </Link>
          {showGrowthNav && (
            <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Link href="/rechner" className="hover:text-blue-700 dark:hover:text-blue-400">
                {t('growthNav.rechner')}
              </Link>
              <Link href="/grenze" className="hover:text-blue-700 dark:hover:text-blue-400">
                {t('growthNav.grenze')}
              </Link>
              <Link href="/schweiz" className="hover:text-blue-700 dark:hover:text-blue-400">
                {t('growthNav.schweiz')}
              </Link>
              <Link href="/beleg-check" className="hover:text-blue-700 dark:hover:text-blue-400">
                {t('growthNav.belegCheck')}
              </Link>
              <Link href="/pricing" className="hover:text-blue-700 dark:hover:text-blue-400">
                {t('pricing.nav')}
              </Link>
              <Link
                href="/auth/login"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                {t('landing.signIn')}
              </Link>
            </nav>
          )}
        </div>
      </header>
      <main className="container mx-auto flex-1 px-4 py-8 sm:py-10">{children}</main>
      <AppFooter />
    </div>
  );
}
