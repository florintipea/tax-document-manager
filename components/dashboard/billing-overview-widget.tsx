'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Crown, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { PLAN_PRICING, PLAN_TIERS, type PlanTier, type PurchaseType } from '@/lib/billing/plans';
import { startCheckout } from '@/lib/billing/checkout-client';
import toast from 'react-hot-toast';

interface BillingSummary {
  subscription: {
    planId: string;
    status: string;
    billingInterval: string | null;
    currentPeriodEnd: string;
  } | null;
  features: {
    tier: string;
    updatesActive: boolean;
    updatesUntil: string | null;
  };
  pricing: {
    tiers: Array<{
      tier: string;
      license: number;
      updatesYearly: number;
    }>;
  };
}

const TIER_ICONS: Record<string, typeof Sparkles> = {
  standard: Sparkles,
  advisor: Crown,
};

const PLAN_LABEL_KEYS: Record<string, string> = {
  free: 'billing.planFree',
  trial: 'billing.planTrial',
  standard: 'billing.tiers.standard.name',
  advisor: 'billing.tiers.advisor.name',
  basic: 'billing.tiers.standard.name',
  professional: 'billing.tiers.standard.name',
};

interface Props {
  /** Compact footer card — plan summary + manage link, no large pricing grid */
  compact?: boolean;
}

export function BillingOverviewWidget({ compact = false }: Props) {
  const { t, locale } = useI18n();
  const [data, setData] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/billing')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (tier: PlanTier, purchaseType: PurchaseType) => {
    const key = `${tier}-${purchaseType}`;
    setCheckoutKey(key);
    try {
      const result = await startCheckout(tier, purchaseType);
      if (!result.ok) {
        throw new Error(result.error || t('billing.checkoutFailed'));
      }
      if (result.redirecting) {
        toast.success(t('billing.checkoutStarted'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('billing.checkoutFailed'));
    } finally {
      setCheckoutKey(null);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);

  const currentTier = data?.features?.tier || data?.subscription?.planId || 'free';
  const tiers =
    data?.pricing?.tiers?.length
      ? data.pricing.tiers
      : PLAN_TIERS.map((tier) => PLAN_PRICING[tier]);

  if (compact) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-md bg-blue-50 p-2 dark:bg-blue-900/30">
              <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('dashboard.billingWidgetTitle')}
              </p>
              {loading ? (
                <p className="text-xs text-gray-500">{t('common.loading')}</p>
              ) : (
                <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                  {t('billing.currentPlan')}:{' '}
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {t(PLAN_LABEL_KEYS[currentTier] || 'billing.planFree')}
                  </span>
                  {data?.features?.updatesActive && data.features.updatesUntil
                    ? ` · ${t('billing.updatesActiveUntil', {
                        date: new Date(data.features.updatesUntil).toLocaleDateString(locale),
                      })}`
                    : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {currentTier === 'free' && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/settings/billing">{t('dashboard.billingCompactUpgrade')}</Link>
              </Button>
            )}
            <Button size="sm" variant="outline" asChild>
              <Link href="/settings/billing">
                {t('dashboard.billingManage')}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('dashboard.billingWidgetTitle')}
          </h2>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings/billing">
            {t('dashboard.billingManage')}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      ) : (
        <>
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('billing.currentPlan')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {t(PLAN_LABEL_KEYS[currentTier] || 'billing.planFree')}
            </p>
            {data?.features?.updatesActive && data.features.updatesUntil && (
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                {t('billing.updatesActiveUntil', {
                  date: new Date(data.features.updatesUntil).toLocaleDateString(locale),
                })}
              </p>
            )}
            {currentTier === 'free' && (
              <p className="mt-1 text-xs text-gray-500">{t('dashboard.billingUpgradeHint')}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tiers.map((plan) => {
              const Icon = TIER_ICONS[plan.tier] || Sparkles;
              const isCurrent = currentTier === plan.tier;
              const tier = plan.tier as PlanTier;
              return (
                <div
                  key={plan.tier}
                  className={`flex flex-col rounded-lg border p-4 ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {t(`billing.tiers.${plan.tier}.name`)}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                        {t('billing.currentTier')}
                      </span>
                    )}
                  </div>
                  <div className="mb-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-500" />
                      {formatPrice(plan.license)} {t('billing.oneTimeLicense')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-500" />
                      {formatPrice(plan.updatesYearly)}
                      {t('billing.perYearUpdates')}
                    </div>
                  </div>
                  <div className="mt-auto space-y-2">
                    <Button
                      size="sm"
                      variant={plan.tier === 'standard' ? 'primary' : 'outline'}
                      className="w-full"
                      disabled={checkoutKey !== null}
                      onClick={() => handlePurchase(tier, 'license')}
                    >
                      {checkoutKey === `${tier}-license`
                        ? t('common.loading')
                        : t('billing.buyLicense')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={checkoutKey !== null}
                      onClick={() => handlePurchase(tier, 'updates')}
                    >
                      {checkoutKey === `${tier}-updates`
                        ? t('common.loading')
                        : t('billing.buyUpdates')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
