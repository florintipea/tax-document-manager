'use client';

import Link from 'next/link';
import { Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';
import type { DashboardTip } from '@/lib/dashboard/finance-overview';

function formatEur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

const FALLBACK_TIPS: DashboardTip[] = [
  {
    id: 'werbungskosten',
    labelKey: 'dashboard.tips.werbungskostenTitle',
    descriptionKey: 'dashboard.tips.werbungskostenDesc',
    href: '/calculator',
    estimatedSavingsEur: null,
    source: 'static',
  },
  {
    id: 'documents',
    labelKey: 'dashboard.tips.documentsTitle',
    descriptionKey: 'dashboard.tips.documentsDesc',
    href: '/documents',
    estimatedSavingsEur: null,
    source: 'static',
  },
  {
    id: 'steuererklaerung',
    labelKey: 'dashboard.tips.steuererklaerungTitle',
    descriptionKey: 'dashboard.tips.steuererklaerungDesc',
    href: '/steuererklaerung',
    estimatedSavingsEur: null,
    source: 'static',
  },
  {
    id: 'grenzgaenger',
    labelKey: 'dashboard.tips.grenzgaengerTitle',
    descriptionKey: 'dashboard.tips.grenzgaengerDesc',
    href: '/grenzgaenger',
    estimatedSavingsEur: null,
    source: 'static',
  },
];

interface Props {
  tips?: DashboardTip[] | null;
}

export function OptimizationTipsPanel({ tips }: Props) {
  const { t, locale } = useI18n();
  const list = tips?.length ? tips : FALLBACK_TIPS;

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
          <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {t('dashboard.tips.title')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.tips.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((tip) => (
          <Link
            key={tip.id}
            href={tip.href}
            className="group rounded-lg border border-blue-100 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow dark:border-blue-900 dark:bg-gray-800 dark:hover:border-blue-700"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="font-medium text-gray-900 dark:text-white">{t(tip.labelKey)}</p>
              {tip.source === 'optimizer' ? (
                <Sparkles className="h-4 w-4 shrink-0 text-blue-500" />
              ) : (
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-blue-600" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t(tip.descriptionKey)}</p>
            {tip.estimatedSavingsEur != null && tip.estimatedSavingsEur > 0 && (
              <p className="mt-2 text-xs font-medium text-teal-700 dark:text-teal-300">
                {t('dashboard.tips.estimatedSavings', {
                  amount: formatEur(tip.estimatedSavingsEur, locale),
                })}
              </p>
            )}
          </Link>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('dashboard.tips.disclaimer')}</p>
    </section>
  );
}
