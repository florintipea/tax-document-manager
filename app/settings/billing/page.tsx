'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  ArrowLeft,
  Check,
  Trash2,
  AlertCircle,
  Sparkles,
  Users,
  Crown,
  Info,
} from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { useI18n } from '@/lib/i18n/provider';
import toast from 'react-hot-toast';
import { startCheckout } from '@/lib/billing/checkout-client';

type PaymentType = 'paypal' | 'google_pay' | 'apple_pay' | 'bank_account' | 'card';
type PlanTier = 'standard' | 'advisor';
type PurchaseType = 'license' | 'updates';

interface PaymentMethod {
  id: string;
  type: string;
  isDefault: boolean;
  label: string | null;
  status: string;
}

interface Subscription {
  planId: string;
  status: string;
  billingInterval: string | null;
  currentPeriodEnd: string;
}

interface TierFeatures {
  tier: string;
  maxDocuments: number | null;
  prioritySupport: boolean;
  multiClient: boolean;
  exportEnabled: boolean;
  hasLicense: boolean;
  updatesActive: boolean;
  updatesUntil: string | null;
}

interface PlanPricing {
  tier: PlanTier;
  license: number;
  updatesYearly: number;
}

const TIER_ORDER: PlanTier[] = ['standard', 'advisor'];

const TIER_ICONS: Record<PlanTier, typeof Sparkles> = {
  standard: Sparkles,
  advisor: Users,
};

const TIER_FEATURE_KEYS: Record<PlanTier, string[]> = {
  standard: [
    'billing.features.docsUnlimited',
    'billing.features.calcDeFull',
    'billing.features.allCountries',
    'billing.features.aiUnlimited',
    'billing.features.updatesFull',
  ],
  advisor: [
    'billing.features.allStandard',
    'billing.features.multiClient',
    'billing.features.export',
    'billing.features.priority',
    'billing.features.updatesFull',
  ],
};

const METHOD_CONFIG: Record<
  PaymentType,
  { icon: typeof CreditCard; labelKey: string; descKey: string; connectKey: string }
> = {
  paypal: {
    icon: Wallet,
    labelKey: 'billing.paypal',
    descKey: 'billing.paypalDesc',
    connectKey: 'billing.connectPayPal',
  },
  google_pay: {
    icon: Smartphone,
    labelKey: 'billing.googlePay',
    descKey: 'billing.googlePayDesc',
    connectKey: 'billing.connectStripe',
  },
  apple_pay: {
    icon: Smartphone,
    labelKey: 'billing.applePay',
    descKey: 'billing.applePayDesc',
    connectKey: 'billing.connectStripe',
  },
  bank_account: {
    icon: Building2,
    labelKey: 'billing.bankAccount',
    descKey: 'billing.bankAccountDesc',
    connectKey: 'billing.setupBank',
  },
  card: {
    icon: CreditCard,
    labelKey: 'billing.card',
    descKey: 'billing.cardDesc',
    connectKey: 'billing.connectStripe',
  },
};

const PLAN_LABELS: Record<string, string> = {
  free: 'billing.planFree',
  trial: 'billing.planTrial',
  standard: 'billing.tiers.standard.name',
  advisor: 'billing.tiers.advisor.name',
  basic: 'billing.tiers.standard.name',
  professional: 'billing.tiers.standard.name',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'billing.statusActive',
  canceled: 'billing.statusCanceled',
  past_due: 'billing.statusPastDue',
  expired: 'billing.statusExpired',
};

function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export default function BillingPage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loading variant="spinner" size="lg" text={t('common.loading')} />
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}

function BillingPageContent() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [features, setFeatures] = useState<TierFeatures | null>(null);
  const [pricing, setPricing] = useState<PlanPricing[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [providers, setProviders] = useState({
    stripe: false,
    stripeCheckout: false,
    paypal: false,
  });
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<PaymentType | null>(null);
  const [saving, setSaving] = useState(false);

  const loadBilling = async () => {
    try {
      const res = await fetch('/api/billing');
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setSubscription(data.subscription);
      setFeatures(data.features);
      setPricing(data.pricing?.tiers || []);
      setPaymentMethods(data.paymentMethods || []);
      setProviders(data.providers || { stripe: false, stripeCheckout: false, paypal: false });
    } catch {
      toast.error(t('billing.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBilling();
  }, []);

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      toast.success(t('billing.checkoutSuccess'));
      void loadBilling();
    }
    if (searchParams.get('canceled') === '1') {
      toast.error(t('billing.checkoutCanceled'));
    }
  }, [searchParams]);

  const handlePurchase = async (tier: PlanTier, purchaseType: PurchaseType) => {
    const key = `${tier}-${purchaseType}`;
    setCheckoutKey(key);
    setSaving(true);
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
      setSaving(false);
      setCheckoutKey(null);
    }
  };

  const handleAddMethod = async (type: PaymentType) => {
    setSaving(true);
    setSelectedType(type);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType: type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('billing.saveFailed'));
      if (data.mode === 'live' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      toast.success(t('billing.saved'));
      await loadBilling();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('billing.saveFailed'));
    } finally {
      setSaving(false);
      setSelectedType(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/billing/payment-methods/${id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      toast.success(t('billing.saved'));
      await loadBilling();
    } catch {
      toast.error(t('billing.saveFailed'));
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/billing/payment-methods/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await loadBilling();
    } catch {
      toast.error(t('billing.saveFailed'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading variant="spinner" size="lg" text={t('common.loading')} />
      </div>
    );
  }

  const currentPlanId = features?.tier || subscription?.planId || 'free';
  const stripeConfigured = providers.stripe;

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.settings')}
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('billing.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{t('billing.pricingSubtitle')}</p>
          </div>

          {/* Market comparison note */}
          <div className="mb-6 p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="flex gap-3">
              <Info className="w-6 h-6 text-slate-600 dark:text-slate-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {t('billing.marketComparisonTitle')}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                  {t('billing.marketComparisonBody')}
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200 mt-2">
                  {t('billing.noAdviceBanner')}
                </p>
              </div>
            </div>
          </div>

          {/* Current plan */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('billing.currentPlan')}
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {t(PLAN_LABELS[currentPlanId] || 'billing.planFree')}
                </p>
                {subscription && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t(STATUS_LABELS[subscription.status] || 'billing.statusActive')}
                    {features?.updatesActive && features.updatesUntil && (
                      <>
                        {' · '}
                        {t('billing.updatesActiveUntil', {
                          date: new Date(features.updatesUntil).toLocaleDateString(locale),
                        })}
                      </>
                    )}
                    {!features?.updatesActive && subscription.billingInterval === 'license' && (
                      <>
                        {' · '}
                        {t('billing.licenseOwned')}
                      </>
                    )}
                  </p>
                )}
                {features?.prioritySupport && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Crown className="w-3 h-3" />
                    {t('billing.priorityBadge')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t('billing.licenseModelNote')}
          </p>

          {/* Pricing tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {TIER_ORDER.map((tier) => {
              const plan = pricing.find((p) => p.tier === tier);
              const Icon = TIER_ICONS[tier];
              const isCurrent = currentPlanId === tier;
              const isPopular = tier === 'standard';

              return (
                <div
                  key={tier}
                  className={`relative flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 sm:p-6 border-2 ${
                    isPopular
                      ? 'border-blue-500 dark:border-blue-400'
                      : 'border-transparent'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                      {t('billing.mostPopular')}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {t(`billing.tiers.${tier}.name`)}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 min-h-[2.5rem]">
                    {t(`billing.tiers.${tier}.description`)}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">{t('billing.licenseLabel')}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(plan?.license ?? 0, locale)}
                      </p>
                      <p className="text-xs text-gray-500">{t('billing.oneTime')}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">{t('billing.updatesLabel')}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(plan?.updatesYearly ?? 0, locale)}
                      </p>
                      <p className="text-xs text-gray-500">{t('billing.perYear')}</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {TIER_FEATURE_KEYS[tier].map((key) => (
                      <li key={key} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {t(key)}
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2">
                    <Button
                      onClick={() => handlePurchase(tier, 'license')}
                      disabled={saving || (isCurrent && features?.hasLicense)}
                      variant={isPopular ? 'primary' : 'outline'}
                      className="w-full"
                    >
                      {saving && checkoutKey === `${tier}-license`
                        ? t('common.loading')
                        : t('billing.buyLicense')}
                    </Button>
                    <Button
                      onClick={() => handlePurchase(tier, 'updates')}
                      disabled={saving}
                      variant="outline"
                      className="w-full"
                    >
                      {saving && checkoutKey === `${tier}-updates`
                        ? t('common.loading')
                        : t('billing.buyUpdates')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {!stripeConfigured && (
            <div className="flex gap-3 p-4 mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {t('billing.notConfigured')}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {t('billing.notConfiguredHint')}
                </p>
              </div>
            </div>
          )}

          {/* Payment methods */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('billing.paymentMethods')}
            </h2>

            {paymentMethods.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('billing.noMethods')}</p>
            ) : (
              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => {
                  const config = METHOD_CONFIG[method.type as PaymentType];
                  const Icon = config?.icon || CreditCard;
                  return (
                    <div
                      key={method.id}
                      className="flex items-center justify-between gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-5 h-5 text-gray-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {config ? t(config.labelKey) : method.label || method.type}
                          </p>
                          {method.isDefault && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {t('billing.default')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!method.isDefault && (
                          <button
                            onClick={() => handleSetDefault(method.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {t('billing.setDefault')}
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(method.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          aria-label={t('billing.remove')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('billing.selectMethod')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(METHOD_CONFIG) as PaymentType[]).map((type) => {
                const config = METHOD_CONFIG[type];
                const Icon = config.icon;
                const isSaving = saving && selectedType === type;

                return (
                  <button
                    key={type}
                    onClick={() => handleAddMethod(type)}
                    disabled={saving}
                    className="flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-left hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:opacity-50"
                  >
                    <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {t(config.labelKey)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t(config.descKey)}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                        {isSaving ? (
                          t('common.loading')
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            {t(config.connectKey)}
                          </>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
