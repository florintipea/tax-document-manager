'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShareButtons } from '@/components/growth/share-buttons';
import { SaveResultsCta } from '@/components/growth/save-results-cta';
import { useI18n } from '@/lib/i18n/provider';
import {
  buildShareUrl,
  estimateArbeitnehmer,
  estimateGrenzgaenger,
  type QuickCheckMode,
  type WorkCountry,
} from '@/lib/growth/quick-check';

function formatEur(n: number): string {
  return n.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

interface QuickCheckProps {
  /** Prefill mode from landing */
  defaultMode?: QuickCheckMode;
  defaultWorkCountry?: WorkCountry;
  compact?: boolean;
  showPostCta?: boolean;
}

export function QuickCheck({
  defaultMode = 'arbeitnehmer',
  defaultWorkCountry = 'CH',
  compact = false,
  showPostCta = true,
}: QuickCheckProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<QuickCheckMode>(defaultMode);
  const [income, setIncome] = useState('');
  const [km, setKm] = useState('30');
  const [days, setDays] = useState('230');
  const [extra, setExtra] = useState('');
  const [workCountry, setWorkCountry] = useState<WorkCountry>(defaultWorkCountry);
  const [foreignIncome, setForeignIncome] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!submitted) return null;
    if (mode === 'arbeitnehmer') {
      const annual = parseFloat(income);
      if (!income || Number.isNaN(annual) || annual < 0) return null;
      return estimateArbeitnehmer({
        annualIncome: annual,
        commuteKmOneWay: parseFloat(km) || 0,
        workDays: parseFloat(days) || 230,
        extraWerbungskosten: parseFloat(extra) || 0,
      });
    }
    const fi = parseFloat(foreignIncome);
    if (!foreignIncome || Number.isNaN(fi) || fi < 0) return null;
    return estimateGrenzgaenger({
      workCountry,
      foreignIncome: fi,
      commuteKmOneWay: parseFloat(km) || 0,
      workDays: parseFloat(days) || 230,
    });
  }, [submitted, mode, income, km, days, extra, workCountry, foreignIncome]);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://taxdoc-beta.onrender.com';
  const shareUrl = buildShareUrl(origin, mode);

  const onCalculate = () => {
    setSubmitted(true);
  };

  return (
    <div
      className={`rounded-2xl border border-blue-200 bg-white/95 shadow-lg dark:border-blue-900 dark:bg-gray-800/95 ${
        compact ? 'p-4' : 'p-5 sm:p-6'
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
          <Calculator className="h-5 w-5 text-blue-700 dark:text-blue-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('quickCheck.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('quickCheck.subtitle')}</p>
        </div>
      </div>

      <div className="mb-4 flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-600 dark:bg-gray-900/50">
        <button
          type="button"
          onClick={() => {
            setMode('arbeitnehmer');
            setSubmitted(false);
          }}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            mode === 'arbeitnehmer'
              ? 'bg-white text-blue-700 shadow dark:bg-gray-800 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {t('quickCheck.modeArbeitnehmer')}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('grenzgaenger');
            setSubmitted(false);
          }}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            mode === 'grenzgaenger'
              ? 'bg-white text-blue-700 shadow dark:bg-gray-800 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {t('quickCheck.modeGrenzgaenger')}
        </button>
      </div>

      <div className="space-y-3">
        {mode === 'arbeitnehmer' ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('quickCheck.annualIncome')}
              </label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="45000"
                value={income}
                onChange={(e) => {
                  setIncome(e.target.value);
                  setSubmitted(false);
                }}
                leftIcon={<span className="text-sm font-medium">€</span>}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('quickCheck.commuteKm')}
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={km}
                  onChange={(e) => {
                    setKm(e.target.value);
                    setSubmitted(false);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('quickCheck.workDays')}
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={days}
                  onChange={(e) => {
                    setDays(e.target.value);
                    setSubmitted(false);
                  }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('quickCheck.extraWk')}
              </label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={extra}
                onChange={(e) => {
                  setExtra(e.target.value);
                  setSubmitted(false);
                }}
                leftIcon={<span className="text-sm font-medium">€</span>}
              />
              <p className="mt-1 text-xs text-gray-500">{t('quickCheck.extraWkHint')}</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('quickCheck.workCountry')}
              </label>
              <select
                value={workCountry}
                onChange={(e) => {
                  setWorkCountry(e.target.value as WorkCountry);
                  setSubmitted(false);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
              >
                <option value="CH">{t('quickCheck.workCH')}</option>
                <option value="AT">{t('quickCheck.workAT')}</option>
                <option value="OTHER">{t('quickCheck.workOther')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('quickCheck.foreignIncome')}
              </label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="70000"
                value={foreignIncome}
                onChange={(e) => {
                  setForeignIncome(e.target.value);
                  setSubmitted(false);
                }}
                leftIcon={<span className="text-sm font-medium">€</span>}
              />
              <p className="mt-1 text-xs text-gray-500">{t('quickCheck.foreignIncomeHint')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('quickCheck.commuteKm')}
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={km}
                  onChange={(e) => {
                    setKm(e.target.value);
                    setSubmitted(false);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('quickCheck.workDays')}
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={days}
                  onChange={(e) => {
                    setDays(e.target.value);
                    setSubmitted(false);
                  }}
                />
              </div>
            </div>
          </>
        )}

        <Button type="button" variant="primary" className="w-full" onClick={onCalculate}>
          {t('quickCheck.calculate')}
        </Button>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t('quickCheck.disclaimer')}</p>
      </div>

      {submitted && result && (
        <div className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            {t(result.summaryKey)}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-white/80 p-3 dark:bg-gray-900/50">
              <p className="text-xs text-gray-500">{t('quickCheck.deductionLabel')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ~{formatEur(result.estimatedDeductionEur)}
              </p>
            </div>
            <div className="rounded-lg bg-white/80 p-3 dark:bg-gray-900/50">
              <p className="text-xs text-gray-500">{t('quickCheck.taxEffectLabel')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ~{formatEur(result.estimatedTaxEffectEur)}
              </p>
              <p className="text-xs text-gray-500">
                {t('quickCheck.marginalHint', {
                  rate: (result.marginalRateUsed * 100).toFixed(0),
                })}
              </p>
            </div>
          </div>
          <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
            {t('quickCheck.resultDisclaimer')}
          </p>
          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {result.detailKeys.map((key) => (
              <li key={key}>· {t(key)}</li>
            ))}
          </ul>

          <ShareButtons text={result.shareSnippetDe} url={shareUrl} />

          {showPostCta && (
            <div className="space-y-3 border-t border-emerald-200 pt-3 dark:border-emerald-800">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href="/beleg-check">{t('quickCheck.ctaChecklist')}</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href="/auth/register?from=quickcheck">{t('quickCheck.ctaRegister')}</Link>
                </Button>
              </div>
              <SaveResultsCta from="quickcheck" />
            </div>
          )}
        </div>
      )}

      {submitted && !result && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{t('quickCheck.needIncome')}</p>
      )}
    </div>
  );
}
