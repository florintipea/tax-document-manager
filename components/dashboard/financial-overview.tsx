'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, Upload, UserRound, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import type { FinanceOverview } from '@/lib/dashboard/finance-overview';

const COLORS = {
  income: '#2563eb',
  expenses: '#0d9488',
  tax: '#1e40af',
};

function formatEur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  overview: FinanceOverview | null;
  loading: boolean;
  error: boolean;
}

export function FinancialOverview({ overview, loading, error }: Props) {
  const { t, locale } = useI18n();

  const pieData = useMemo(() => {
    if (!overview?.pie.hasData) return [];
    const rows = [
      { key: 'income', name: t('dashboard.charts.income'), value: overview.pie.income },
      { key: 'expenses', name: t('dashboard.charts.expenses'), value: overview.pie.expenses },
    ];
    if (overview.pie.tax !== null && overview.pie.tax > 0) {
      rows.push({ key: 'tax', name: t('dashboard.charts.tax'), value: overview.pie.tax });
    }
    return rows.filter((r) => r.value > 0);
  }, [overview, t]);

  const monthlyData = useMemo(() => {
    if (!overview) return [];
    const monthLabels = [
      t('dashboard.charts.months.m1'),
      t('dashboard.charts.months.m2'),
      t('dashboard.charts.months.m3'),
      t('dashboard.charts.months.m4'),
      t('dashboard.charts.months.m5'),
      t('dashboard.charts.months.m6'),
      t('dashboard.charts.months.m7'),
      t('dashboard.charts.months.m8'),
      t('dashboard.charts.months.m9'),
      t('dashboard.charts.months.m10'),
      t('dashboard.charts.months.m11'),
      t('dashboard.charts.months.m12'),
    ];
    return overview.monthly.map((m) => ({
      label: monthLabels[m.month - 1],
      income: m.income,
      expenses: m.expenses,
      tax: m.tax ?? 0,
      hasData: m.hasData,
    }));
  }, [overview, t]);

  const hasMonthly = monthlyData.some((m) => m.hasData);

  const yearlyData = useMemo(() => {
    if (!overview) return [];
    return overview.yearly
      .filter((y) => y.hasIncomeOrExpenses)
      .map((y) => ({
        year: String(y.year),
        income: y.income,
        expenses: y.expenses,
        tax: y.tax ?? 0,
      }));
  }, [overview]);

  const showYoY = yearlyData.length >= 2;

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {t('dashboard.charts.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboard.charts.subtitle', {
              year: overview?.currentYear ?? new Date().getFullYear(),
            })}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.charts.disclaimer')}</p>
      </div>

      {loading ? (
        <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-white p-6 shadow dark:border-red-900 dark:bg-gray-800">
          <p className="text-sm text-red-700 dark:text-red-300">{t('dashboard.charts.loadError')}</p>
        </div>
      ) : overview?.empty.noFinanceData ? (
        <div className="rounded-lg border border-dashed border-blue-200 bg-white p-6 shadow dark:border-blue-800 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <PieIcon className="h-5 w-5" />
            <p className="font-medium">{t('dashboard.charts.emptyTitle')}</p>
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {t('dashboard.charts.emptyBody')}
          </p>
          <div className="flex flex-wrap gap-2">
            {overview.empty.suggestUpload && (
              <Button size="sm" asChild>
                <Link href="/documents">
                  <Upload className="mr-1 h-4 w-4" />
                  {t('dashboard.charts.ctaUpload')}
                </Link>
              </Button>
            )}
            {overview.empty.suggestProfile && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/settings">
                  <UserRound className="mr-1 h-4 w-4" />
                  {t('dashboard.charts.ctaProfile')}
                </Link>
              </Button>
            )}
            {overview.empty.suggestCalculator && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/calculator">
                  <Calculator className="mr-1 h-4 w-4" />
                  {t('dashboard.charts.ctaCalculator')}
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
              {t('dashboard.charts.pieTitle')}
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              {t('dashboard.charts.pieHint', { year: overview!.currentYear })}
            </p>
            {pieData.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">{t('dashboard.charts.noPie')}</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={84}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={
                            entry.key === 'income'
                              ? COLORS.income
                              : entry.key === 'expenses'
                                ? COLORS.expenses
                                : COLORS.tax
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        formatEur(typeof value === 'number' ? value : Number(value) || 0, locale)
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-gray-500">{t('dashboard.charts.income')}</p>
                <p className="font-semibold text-blue-700 dark:text-blue-300">
                  {formatEur(overview!.pie.income, locale)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">{t('dashboard.charts.expenses')}</p>
                <p className="font-semibold text-teal-700 dark:text-teal-300">
                  {formatEur(overview!.pie.expenses, locale)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">{t('dashboard.charts.tax')}</p>
                <p className="font-semibold text-blue-900 dark:text-blue-200">
                  {overview!.pie.tax !== null
                    ? formatEur(overview!.pie.tax, locale)
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
              {hasMonthly
                ? t('dashboard.charts.lineMonthlyTitle')
                : showYoY
                  ? t('dashboard.charts.lineYearlyTitle')
                  : t('dashboard.charts.lineMonthlyTitle')}
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              {hasMonthly
                ? t('dashboard.charts.lineMonthlyHint')
                : showYoY
                  ? t('dashboard.charts.lineYearlyHint')
                  : t('dashboard.charts.lineEmptyHint')}
            </p>
            {hasMonthly ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={48} />
                    <Tooltip
                      formatter={(value) =>
                        formatEur(typeof value === 'number' ? value : Number(value) || 0, locale)
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name={t('dashboard.charts.income')}
                      stroke={COLORS.income}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name={t('dashboard.charts.expenses')}
                      stroke={COLORS.expenses}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="tax"
                      name={t('dashboard.charts.tax')}
                      stroke={COLORS.tax}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : showYoY ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} width={48} />
                    <Tooltip
                      formatter={(value) =>
                        formatEur(typeof value === 'number' ? value : Number(value) || 0, locale)
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name={t('dashboard.charts.income')}
                      stroke={COLORS.income}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name={t('dashboard.charts.expenses')}
                      stroke={COLORS.expenses}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="tax"
                      name={t('dashboard.charts.tax')}
                      stroke={COLORS.tax}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-gray-500">{t('dashboard.charts.lineEmptyHint')}</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/documents">{t('dashboard.charts.ctaUpload')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
