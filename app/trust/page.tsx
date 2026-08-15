'use client';

import Link from 'next/link';
import {
  Shield,
  KeyRound,
  Server,
  Ban,
  Download,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { AppLogo } from '@/components/brand/app-logo';
import { AppFooter } from '@/components/layout/footer';
import { useI18n } from '@/lib/i18n/provider';

const COLLECT_KEYS = [
  'trust.collect.account',
  'trust.collect.documents',
  'trust.collect.profile',
  'trust.collect.security',
  'trust.collect.billing',
] as const;

const NOT_COLLECT_KEYS = [
  'trust.notCollect.sell',
  'trust.notCollect.ads',
  'trust.notCollect.train',
  'trust.notCollect.elsterCreds',
  'trust.notCollect.zeroAccessLie',
] as const;

const SUBPROCESSORS = [
  { nameKey: 'trust.sub.renderName', purposeKey: 'trust.sub.renderPurpose' },
  { nameKey: 'trust.sub.stripeName', purposeKey: 'trust.sub.stripePurpose' },
  { nameKey: 'trust.sub.aiName', purposeKey: 'trust.sub.aiPurpose' },
] as const;

export default function TrustCenterPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-3xl flex-1">
        <Link href="/" className="inline-flex mb-8">
          <AppLogo size="md" />
        </Link>

        <div className="mb-8 flex items-start gap-3">
          <Shield className="h-8 w-8 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('trust.title')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('trust.subtitle')}</p>
          </div>
        </div>

        <p className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {t('trust.honestBanner')}
        </p>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            {t('trust.labelsTitle')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {t('trust.collectTitle')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {COLLECT_KEYS.map((key) => (
                  <li key={key}>• {t(key)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <XCircle className="h-4 w-4 text-red-500" />
                {t('trust.notCollectTitle')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {NOT_COLLECT_KEYS.map((key) => (
                  <li key={key}>• {t(key)}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-10 rounded-lg border border-blue-200 bg-white p-5 dark:border-blue-800 dark:bg-gray-800">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <KeyRound className="h-5 w-5 text-blue-600" />
            {t('trust.byoTitle')}
          </h2>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{t('trust.byoBody')}</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
            <li>{t('trust.byoStep1')}</li>
            <li>{t('trust.byoStep2')}</li>
            <li>{t('trust.byoStep3')}</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Server className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            {t('trust.subTitle')}
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 font-medium">{t('trust.subColName')}</th>
                  <th className="px-4 py-2 font-medium">{t('trust.subColPurpose')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {SUBPROCESSORS.map((row) => (
                  <tr
                    key={row.nameKey}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                      {t(row.nameKey)}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      {t(row.purposeKey)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-500">{t('trust.subNote')}</p>
        </section>

        <section className="mb-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <Lock className="mb-2 h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('trust.securityTitle')}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('trust.securityBody')}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <Ban className="mb-2 h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('trust.limitsTitle')}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('trust.limitsBody')}</p>
          </div>
        </section>

        <section className="mb-10 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            {t('trust.rightsTitle')}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
            >
              <Download className="h-4 w-4" />
              {t('trust.exportLink')}
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            >
              <Trash2 className="h-4 w-4" />
              {t('trust.deleteLink')}
            </Link>
            <Link
              href="/legal/datenschutz"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {t('legal.datenschutz')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <p className="text-xs text-gray-500">{t('trust.footerNote')}</p>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/pricing" className="text-blue-600 hover:underline dark:text-blue-400">
            {t('pricing.nav')}
          </Link>
          <Link href="/legal/impressum" className="text-blue-600 hover:underline dark:text-blue-400">
            {t('legal.impressum')}
          </Link>
          <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
            {t('common.back')}
          </Link>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
