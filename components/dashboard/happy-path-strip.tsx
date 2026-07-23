'use client';

import Link from 'next/link';
import { ClipboardCheck, FileText, UserRound, ExternalLink } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';

const STEPS = [
  { n: 1, href: '/documents', labelKey: 'happyPath.step1', icon: FileText },
  { n: 2, href: '/settings', labelKey: 'happyPath.step2', icon: UserRound },
  { n: 3, href: '/steuererklaerung', labelKey: 'happyPath.step3', icon: ClipboardCheck },
  {
    n: 4,
    href: 'https://www.elster.de/eportal/start',
    labelKey: 'happyPath.step4',
    icon: ExternalLink,
    external: true,
  },
] as const;

export function HappyPathStrip() {
  const { t } = useI18n();

  return (
    <div className="mb-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5 dark:border-blue-800 dark:from-blue-950/40 dark:to-indigo-950/30">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('happyPath.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('happyPath.subtitle')}</p>
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-200">{t('happyPath.disclaimer')}</p>
      </div>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const className =
            'flex items-center gap-3 rounded-lg border border-white/80 bg-white/80 px-3 py-3 text-left transition hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-blue-600';
          const inner = (
            <>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {step.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  {t(step.labelKey)}
                </span>
              </span>
              <Icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            </>
          );
          if ('external' in step && step.external) {
            return (
              <li key={step.n}>
                <a
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {inner}
                </a>
              </li>
            );
          }
          return (
            <li key={step.n}>
              <Link href={step.href} className={className}>
                {inner}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
