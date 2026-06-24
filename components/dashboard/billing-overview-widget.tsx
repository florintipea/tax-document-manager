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

export function BillingOverviewWidget() {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('dashboard.billingWidgetTitle')}
          </h2>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings/billing">
            {t('dashboard.billingManage')}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      ) : (
        <>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('billing.currentPlan')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {t(PLAN_LABEL_KEYS[currentTier] || 'billing.planFree')}
            </p>
            {data?.features?.updatesActive && data.features.updatesUntil && (
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {t('billing.updatesActiveUntil', {
                  date: new Date(data.features.updatesUntil).toLocaleDateString(locale),
                })}
              </p>
            )}
            {currentTier === 'free' && (
              <p className="text-xs text-gray-500 mt-1">{t('dashboard.billingUpgradeHint')}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {tiers.map((plan) => {
              const Icon = TIER_ICONS[plan.tier] || Sparkles;
              const isCurrent = currentTier === plan.tier;
              const tier = plan.tier as PlanTier;
              return (
                <div
                  key={plan.tier}
                  className={`rounded-lg border p-4 flex flex-col ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {t(`billing.tiers.${plan.tier}.name`)}
                    </span>
                    {isCurrent && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {t('billing.currentTier')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-3">
                    <div className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      {formatPrice(plan.license)} {t('billing.oneTimeLicense')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      {formatPrice(plan.updatesYearly)}{t('billing.perYearUpdates')}
                    </div>
                  </div>
                  <div className="space-y-2 mt-auto">
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
