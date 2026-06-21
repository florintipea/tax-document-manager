'use client';

import { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { WISOLikeTaxSystem } from '@/lib/tax/wiso-features';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Calculator, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/lib/i18n/provider';

export default function TaxFormsPage() {
  const { t } = useI18n();
  const [year] = useState(new Date().getFullYear());
  const [filingStatus, setFilingStatus] = useState<'single' | 'married' | 'headOfHousehold'>('single');
  const [country, setCountry] = useState('DE');
  const [forms, setForms] = useState(WISOLikeTaxSystem.getGermanTaxForms(year));
  const [calculation, setCalculation] = useState<any>(null);

  const handleFormChange = (formId: string, fieldId: string, value: any) => {
    setForms(forms.map(form => {
      if (form.id === formId) {
        return {
          ...form,
          fields: form.fields.map(field => 
            field.id === fieldId ? { ...field, value } : field
          ),
        };
      }
      return form;
    }));
  };

  const calculateTax = () => {
    // Sum up all income
    let totalIncome = 0;
    let totalDeductions = 0;

    forms.forEach(form => {
      if (form.type === 'income') {
        form.fields.forEach(field => {
          if (field.type === 'number') {
            totalIncome += Number(field.value) || 0;
          }
        });
      } else if (form.type === 'deduction') {
        form.fields.forEach(field => {
          if (field.type === 'number') {
            totalDeductions += Number(field.value) || 0;
          }
        });
      }
    });

    const result = WISOLikeTaxSystem.calculateMultiCountry(
      country,
      totalIncome,
      totalDeductions,
      filingStatus,
      year
    );

    setCalculation(result);
    toast.success(t('taxForms.calculationComplete'));
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">{t('taxForms.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('taxForms.subtitle')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('taxForms.taxYear')}</label>
              <Input type="number" value={year} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('taxForms.filingStatus')}</label>
              <select
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="single">{t('taxForms.single')}</option>
                <option value="married">{t('taxForms.married')}</option>
                <option value="headOfHousehold">{t('taxForms.headOfHousehold')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('taxForms.country')}</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="DE">Germany</option>
                <option value="US">United States</option>
                <option value="FR">France</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tax Forms */}
        <div className="space-y-6 mb-6">
          {forms.map((form) => (
            <div key={form.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">{form.name}</h3>
                {form.required && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                    Required
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'number' ? (
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(e) => handleFormChange(form.id, field.id, e.target.value)}
                        placeholder="0"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={field.value}
                        onChange={(e) => handleFormChange(form.id, field.id, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => handleFormChange(form.id, field.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Calculate Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <Button
            onClick={calculateTax}
            className="w-full"
            size="lg"
            leftIcon={<Calculator className="w-5 h-5" />}
          >
            {t('taxForms.calculate')}
          </Button>
        </div>

        {/* Results */}
        {calculation && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              {t('taxForms.results')}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
                <p className="text-2xl font-bold">
                  {calculation.totalIncome.toLocaleString()} {country === 'DE' ? '€' : '$'}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Deductions</p>
                <p className="text-2xl font-bold">
                  {calculation.totalDeductions.toLocaleString()} {country === 'DE' ? '€' : '$'}
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('taxForms.taxOwed')}</p>
                <p className="text-2xl font-bold">
                  {calculation.taxOwed.toLocaleString()} {country === 'DE' ? '€' : '$'}
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('taxForms.effectiveRate')}</p>
                <p className="text-2xl font-bold">{calculation.effectiveRate}%</p>
              </div>
            </div>

            {calculation.breakdown && calculation.breakdown.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Tax Breakdown</h3>
                <div className="space-y-2">
                  {calculation.breakdown.map((bracket: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <span className="text-sm">{bracket.bracket}</span>
                      <span className="font-medium">
                        {bracket.tax.toLocaleString()} {country === 'DE' ? '€' : '$'} ({bracket.rate}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}


