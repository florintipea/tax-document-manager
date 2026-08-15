'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Sparkles, Users, Gift, Leaf } from 'lucide-react';
import { AppLogo } from '@/components/brand/app-logo';
import { AppFooter } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/provider';
import {
  MARKET_CODES,
  MARKET_PRICING,
  formatMoney,
  resolveMarket,
  type MarketCode,
  type ProductTier,
} from '@/lib/billing/market-pricing';

const INCLUDED = [
  'pricing.included.docs',
  'pricing.included.elsterPrep',
  'pricing.included.mapping',
  'pricing.included.byoAi',
  'pricing.included.grenzgaenger',
  'pricing.included.export',
  'pricing.included.gdpr',
] as const;

const NOT_INCLUDED = [
  'pricing.notIncluded.elsterSubmit',
  'pricing.notIncluded.advice',
  'pricing.notIncluded.vast',
  'pricing.notIncluded.eric',
  'pricing.notIncluded.guarantee',
] as const;

type EffectiveTier = {
  tier: string;
  currency: string;
  original: number;
  final: number;
  saved: number;
};

function PricingPageInner() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [market, setMarket] = useState<MarketCode>('DE');
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [effective, setEffective] = useState<EffectiveTier[]>([]);
  const config = MARKET_PRICING[market];
  const localeTag = locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-US' : locale;

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams({ market });
    if (appliedCode) q.set('code', appliedCode);
    fetch(`/api/pricing/effective?${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setEffective(data.tiers || []);
        setSummary(data.summary || null);
      })
      .catch(() => {
        if (!cancelled) {
          setEffective([]);
          setSummary(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [market, appliedCode]);

  const priceFor = (id: ProductTier) => {
    const base = config.tiers[id];
    if (id === 'free') return { amount: 0, original: 0, saved: 0, currency: base.currency };
    const row = effective.find((e) => e.tier === id);
    if (row) {
      return {
        amount: row.final,
        original: row.original,
        saved: row.saved,
        currency: (row.currency as typeof base.currency) || base.currency,
      };
    }
    return { amount: base.amount, original: base.amount, saved: 0, currency: base.currency };
  };

  const tiers = useMemo(
    () => [
      {
        id: 'free' as const,
        icon: Gift,
        nameKey: 'pricing.tiers.free.name',
        descKey: 'pricing.tiers.free.desc',
        highlight: false,
      },
      {
        id: 'starter' as const,
        icon: Leaf,
        nameKey: 'pricing.tiers.starter.name',
        descKey: 'pricing.tiers.starter.desc',
        highlight: false,
      },
      {
        id: 'pro' as const,
        icon: Sparkles,
        nameKey: 'pricing.tiers.pro.name',
        descKey: 'pricing.tiers.pro.desc',
        highlight: true,
      },
      {
        id: 'advisor' as const,
        icon: Users,
        nameKey: 'pricing.tiers.advisor.name',
        descKey: 'pricing.tiers.advisor.desc',
        highlight: false,
      },
    ],
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-5xl flex-1">
        <Link href="/" className="inline-flex mb-8">
          <AppLogo size="md" />
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('pricing.title')}</h1>
        <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">{t('pricing.subtitle')}</p>

        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {t('pricing.noUpsellBanner')}
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('pricing.marketLabel')}
            </label>
            <select
              value={market}
              onChange={(e) => setMarket(resolveMarket(e.target.value))}
              className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {MARKET_CODES.map((code) => (
                <option key={code} value={code}>
                  {MARKET_PRICING[code].labelDe} ({code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Promo-Code
            </label>
            <div className="flex gap-2">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="z. B. BETA20"
                className="max-w-[10rem]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAppliedCode(promoCode.trim().toUpperCase())}
              >
                Anwenden
              </Button>
            </div>
          </div>
        </div>

        {summary && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
            {summary}
          </p>
        )}

        {!config.filingLive && (
          <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
            {config.deFirstNoteDe}
          </p>
        )}

        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="font-semibold text-gray-900 dark:text-white">
            {t('pricing.compareTitle')} — {config.competitor.name}
          </p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t('pricing.compareLine', {
              ours: config.competitor.ourPriceLabel,
              theirs: config.competitor.theirPriceLabel,
            })}
          </p>
          <p className="mt-2 text-xs text-gray-500">{config.competitor.noteDe}</p>
          <p className="mt-1 text-xs text-gray-400">{t('pricing.compareDisclaimer')}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const p = priceFor(tier.id);
            const amountLabel = formatMoney(p.amount, p.currency, localeTag);
            const showStrike = p.saved > 0 && p.original > p.amount;
            return (
              <div
                key={tier.id}
                className={`rounded-xl border bg-white p-5 dark:bg-gray-800 ${
                  tier.highlight
                    ? 'border-2 border-blue-500 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {t(tier.nameKey)}
                  </h2>
                </div>
                <p className="min-h-[2.5rem] text-xs text-gray-600 dark:text-gray-400">
                  {t(tier.descKey)}
                </p>
                {showStrike && (
                  <p className="mt-2 text-sm text-gray-400 line-through">
                    {formatMoney(p.original, p.currency, localeTag)}
                  </p>
                )}
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {tier.id === 'free' || p.amount === 0 ? t('pricing.free') : amountLabel}
                </p>
                {config.tiers[tier.id].updatesYearly != null &&
                  (config.tiers[tier.id].updatesYearly || 0) > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      +{' '}
                      {formatMoney(
                        config.tiers[tier.id].updatesYearly!,
                        config.tiers[tier.id].currency,
                        localeTag
                      )}{' '}
                      {t('billing.perYearUpdates')}
                    </p>
                  )}
                {tier.highlight && (
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    {t('billing.mostPopular')}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-white p-5 dark:border-emerald-900 dark:bg-gray-800">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
              <Check className="h-5 w-5" />
              {t('pricing.includedTitle')}
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {INCLUDED.map((key) => (
                <li key={key} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-red-200 bg-white p-5 dark:border-red-900 dark:bg-gray-800">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-800 dark:text-red-200">
              <X className="h-5 w-5" />
              {t('pricing.notIncludedTitle')}
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {NOT_INCLUDED.map((key) => (
                <li key={key} className="flex gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">{t('pricing.profitNote')}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary" size="lg" onClick={() => router.push('/auth/register')}>
            {t('landing.getStarted')}
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.push('/beta-anfrage')}>
            {t('pricing.betaCta')}
          </Button>
          <Link
            href="/trust"
            className="inline-flex items-center text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {t('trust.nav')}
          </Link>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
      <PricingPageInner />
    </Suspense>
  );
}
