'use client';

import { useEffect, useState } from 'react';
import { X, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import toast from 'react-hot-toast';

const PRICE_RANGES = ['under_20', '20_40', '40_60', '60_100', 'over_100', 'custom'] as const;
const PLAN_OPTIONS = ['standard', 'advisor', 'unsure'] as const;

export function PricingSurveyBanner() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [priceRange, setPriceRange] = useState<string>('40_60');
  const [willingToPay, setWillingToPay] = useState('');
  const [planInterest, setPlanInterest] = useState<string>('standard');
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetch('/api/pricing-survey/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.shouldShow) setOpen(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dismiss = async () => {
    setOpen(false);
    await fetch('/api/pricing-survey/dismiss', { method: 'PATCH' }).catch(() => {});
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        priceRange,
        planInterest,
        comment: comment.trim() || undefined,
      };
      if (priceRange === 'custom') {
        const amount = parseFloat(willingToPay);
        if (Number.isNaN(amount) || amount < 0) {
          toast.error(t('pricingSurvey.customAmountRequired'));
          return;
        }
        body.willingToPay = amount;
      }

      const res = await fetch('/api/pricing-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'submit failed');
      }

      toast.success(t('pricingSurvey.thankYou'));
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('pricingSurvey.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-labelledby="pricing-survey-title"
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Euro className="w-6 h-6 text-blue-600" />
            <h2 id="pricing-survey-title" className="text-lg font-bold text-gray-900 dark:text-white">
              {t('pricingSurvey.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void dismiss()}
            className="text-gray-400 hover:text-gray-600"
            aria-label={t('common.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('pricingSurvey.description')}</p>

        <fieldset className="mb-4">
          <legend className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {t('pricingSurvey.question')}
          </legend>
          <div className="space-y-2">
            {PRICE_RANGES.map((range) => (
              <label key={range} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="priceRange"
                  value={range}
                  checked={priceRange === range}
                  onChange={() => setPriceRange(range)}
                  className="text-blue-600"
                />
                {t(`pricingSurvey.ranges.${range}`)}
              </label>
            ))}
          </div>
        </fieldset>

        {priceRange === 'custom' && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1">
              {t('pricingSurvey.customAmount')}
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={willingToPay}
              onChange={(e) => setWillingToPay(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="39"
            />
          </div>
        )}

        <fieldset className="mb-4">
          <legend className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {t('pricingSurvey.planQuestion')}
          </legend>
          <div className="flex flex-wrap gap-3">
            {PLAN_OPTIONS.map((plan) => (
              <label key={plan} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="planInterest"
                  value={plan}
                  checked={planInterest === plan}
                  onChange={() => setPlanInterest(plan)}
                  className="text-blue-600"
                />
                {t(`pricingSurvey.plans.${plan}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mb-6">
          <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1">
            {t('pricingSurvey.commentOptional')}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            placeholder={t('pricingSurvey.commentPlaceholder')}
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={() => void submit()} disabled={submitting} className="flex-1">
            {submitting ? t('common.loading') : t('pricingSurvey.submit')}
          </Button>
          <Button variant="outline" onClick={() => void dismiss()} disabled={submitting}>
            {t('pricingSurvey.later')}
          </Button>
        </div>
      </div>
    </div>
  );
}
