'use client';

/**
 * Steuerprofil form section — primary + partner (Zusammenveranlagung).
 * Hilfsmittel, keine Steuerberatung.
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import type { Steuerklasse } from '@/lib/tax/country-config';
import { DE_BUNDESLAENDER } from '@/lib/tax/country-config';
import {
  ANREDE_OPTIONS,
  RELIGION_OPTIONS,
  STEUERKLASSE_OPTIONS,
} from '@/lib/tax/steuerprofil-fields';

export type TaxProfileFormData = {
  steuerklasse: Steuerklasse;
  bundesland: string;
  numberOfChildren: number;
  deFilingMode: 'einzel' | 'zusammen';
  spouseIncome: number;
  isCrossBorder: boolean;
  hasRentalIncome: boolean;
  anrede: string;
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  steuernummer: string;
  idNr: string;
  religion: string;
  street: string;
  zip: string;
  city: string;
  hasEmploymentIncome: boolean;
  hasSelfEmployment: boolean;
  hasCapitalIncome: boolean;
  partnerAnrede: string;
  partnerVorname: string;
  partnerNachname: string;
  partnerGeburtsdatum: string;
  partnerSteuernummer: string;
  partnerIdNr: string;
  partnerDifferentAddress: boolean;
  partnerStreet: string;
  partnerZip: string;
  partnerCity: string;
  partnerReligion: string;
  partnerSteuerklasse: string;
  partnerHasEmployment: boolean;
  partnerHasSelfEmployment: boolean;
  partnerHasCapitalIncome: boolean;
  partnerHasRentalIncome: boolean;
  partnerIsCrossBorder: boolean;
};

export const EMPTY_TAX_PROFILE: TaxProfileFormData = {
  steuerklasse: 'I',
  bundesland: '',
  numberOfChildren: 0,
  deFilingMode: 'einzel',
  spouseIncome: 0,
  isCrossBorder: false,
  hasRentalIncome: false,
  anrede: '',
  vorname: '',
  nachname: '',
  geburtsdatum: '',
  steuernummer: '',
  idNr: '',
  religion: '',
  street: '',
  zip: '',
  city: '',
  hasEmploymentIncome: true,
  hasSelfEmployment: false,
  hasCapitalIncome: false,
  partnerAnrede: '',
  partnerVorname: '',
  partnerNachname: '',
  partnerGeburtsdatum: '',
  partnerSteuernummer: '',
  partnerIdNr: '',
  partnerDifferentAddress: false,
  partnerStreet: '',
  partnerZip: '',
  partnerCity: '',
  partnerReligion: '',
  partnerSteuerklasse: '',
  partnerHasEmployment: false,
  partnerHasSelfEmployment: false,
  partnerHasCapitalIncome: false,
  partnerHasRentalIncome: false,
  partnerIsCrossBorder: false,
};

export function taxProfileFromSettings(
  settings: Record<string, unknown>
): TaxProfileFormData {
  return {
    steuerklasse: (settings.steuerklasse || 'I') as Steuerklasse,
    bundesland: (settings.bundesland as string) || '',
    numberOfChildren: (settings.numberOfChildren as number) ?? 0,
    deFilingMode:
      settings.deFilingMode === 'zusammen' ? 'zusammen' : 'einzel',
    spouseIncome: (settings.spouseIncome as number) ?? 0,
    isCrossBorder: Boolean(settings.isCrossBorder),
    hasRentalIncome: Boolean(settings.hasRentalIncome),
    anrede: (settings.anrede as string) || '',
    vorname: (settings.vorname as string) || '',
    nachname: (settings.nachname as string) || '',
    geburtsdatum: (settings.geburtsdatum as string) || '',
    steuernummer: (settings.steuernummer as string) || '',
    idNr: (settings.idNr as string) || '',
    religion: (settings.religion as string) || '',
    street: (settings.street as string) || '',
    zip: (settings.zip as string) || '',
    city: (settings.city as string) || '',
    hasEmploymentIncome:
      settings.hasEmploymentIncome === undefined
        ? true
        : Boolean(settings.hasEmploymentIncome),
    hasSelfEmployment: Boolean(settings.hasSelfEmployment),
    hasCapitalIncome: Boolean(settings.hasCapitalIncome),
    partnerAnrede: (settings.partnerAnrede as string) || '',
    partnerVorname: (settings.partnerVorname as string) || '',
    partnerNachname: (settings.partnerNachname as string) || '',
    partnerGeburtsdatum: (settings.partnerGeburtsdatum as string) || '',
    partnerSteuernummer: (settings.partnerSteuernummer as string) || '',
    partnerIdNr: (settings.partnerIdNr as string) || '',
    partnerDifferentAddress: Boolean(settings.partnerDifferentAddress),
    partnerStreet: (settings.partnerStreet as string) || '',
    partnerZip: (settings.partnerZip as string) || '',
    partnerCity: (settings.partnerCity as string) || '',
    partnerReligion: (settings.partnerReligion as string) || '',
    partnerSteuerklasse: (settings.partnerSteuerklasse as string) || '',
    partnerHasEmployment: Boolean(settings.partnerHasEmployment),
    partnerHasSelfEmployment: Boolean(settings.partnerHasSelfEmployment),
    partnerHasCapitalIncome: Boolean(settings.partnerHasCapitalIncome),
    partnerHasRentalIncome: Boolean(settings.partnerHasRentalIncome),
    partnerIsCrossBorder: Boolean(settings.partnerIsCrossBorder),
  };
}

export function taxProfileToPatch(form: TaxProfileFormData): Record<string, unknown> {
  return {
    steuerklasse: form.steuerklasse,
    bundesland: form.bundesland || null,
    numberOfChildren: form.numberOfChildren,
    deFilingMode: form.deFilingMode,
    spouseIncome: form.spouseIncome,
    isCrossBorder: form.isCrossBorder,
    hasRentalIncome: form.hasRentalIncome,
    anrede: form.anrede || null,
    vorname: form.vorname || null,
    nachname: form.nachname || null,
    geburtsdatum: form.geburtsdatum || null,
    steuernummer: form.steuernummer || null,
    idNr: form.idNr || null,
    religion: form.religion || null,
    street: form.street || null,
    zip: form.zip || null,
    city: form.city || null,
    hasEmploymentIncome: form.hasEmploymentIncome,
    hasSelfEmployment: form.hasSelfEmployment,
    hasCapitalIncome: form.hasCapitalIncome,
    partnerAnrede: form.partnerAnrede || null,
    partnerVorname: form.partnerVorname || null,
    partnerNachname: form.partnerNachname || null,
    partnerGeburtsdatum: form.partnerGeburtsdatum || null,
    partnerSteuernummer: form.partnerSteuernummer || null,
    partnerIdNr: form.partnerIdNr || null,
    partnerDifferentAddress: form.partnerDifferentAddress,
    partnerStreet: form.partnerStreet || null,
    partnerZip: form.partnerZip || null,
    partnerCity: form.partnerCity || null,
    partnerReligion: form.partnerReligion || null,
    partnerSteuerklasse: form.partnerSteuerklasse || null,
    partnerHasEmployment: form.partnerHasEmployment,
    partnerHasSelfEmployment: form.partnerHasSelfEmployment,
    partnerHasCapitalIncome: form.partnerHasCapitalIncome,
    partnerHasRentalIncome: form.partnerHasRentalIncome,
    partnerIsCrossBorder: form.partnerIsCrossBorder,
  };
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
      >
        {children}
      </select>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      <span className="text-sm text-gray-800 dark:text-gray-200">{label}</span>
    </label>
  );
}

interface Props {
  formData: TaxProfileFormData;
  setFormData: (
    updater: (current: TaxProfileFormData & Record<string, unknown>) => TaxProfileFormData & Record<string, unknown>
  ) => void;
  onSave: () => void;
  isSaving: boolean;
  savedAt: string | null;
}

export function SteuerprofilForm({
  formData,
  setFormData,
  onSave,
  isSaving,
  savedAt,
}: Props) {
  const { t } = useI18n();
  const patch = <K extends keyof TaxProfileFormData>(
    key: K,
    value: TaxProfileFormData[K]
  ) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const isJoint = formData.deFilingMode === 'zusammen';

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('settings.taxProfileHint')}
      </p>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        {t('settings.taxProfileDisclaimer')}
      </p>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {t('settings.sectionFiling')}
        </h3>
        <SelectField
          label={t('settings.deFilingMode')}
          value={formData.deFilingMode}
          onChange={(v) => patch('deFilingMode', v as 'einzel' | 'zusammen')}
        >
          <option value="einzel">{t('settings.einzelveranlagung')}</option>
          <option value="zusammen">{t('settings.zusammenveranlagung')}</option>
        </SelectField>
        <TextField
          label={t('settings.numberOfChildren')}
          type="number"
          value={formData.numberOfChildren}
          onChange={(v) => patch('numberOfChildren', parseInt(v, 10) || 0)}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {t('settings.sectionPrimary')}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={t('settings.anrede')}
            value={formData.anrede}
            onChange={(v) => patch('anrede', v)}
          >
            <option value="">{t('settings.anredeNone')}</option>
            {ANREDE_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {t(`settings.anrede_${a}`)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t('settings.steuerklasse')}
            value={formData.steuerklasse}
            onChange={(v) => patch('steuerklasse', v as Steuerklasse)}
          >
            {STEUERKLASSE_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {t(`calculator.steuerklasse${k}`)}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t('settings.vorname')}
            value={formData.vorname}
            onChange={(v) => patch('vorname', v)}
          />
          <TextField
            label={t('settings.nachname')}
            value={formData.nachname}
            onChange={(v) => patch('nachname', v)}
          />
          <TextField
            label={t('settings.geburtsdatum')}
            type="date"
            value={formData.geburtsdatum}
            onChange={(v) => patch('geburtsdatum', v)}
          />
          <SelectField
            label={t('settings.bundesland')}
            value={formData.bundesland}
            onChange={(v) => patch('bundesland', v)}
          >
            <option value="">{t('settings.bundeslandNone')}</option>
            {DE_BUNDESLAENDER.map((bl) => (
              <option key={bl.code} value={bl.code}>
                {bl.code} — {t(`settings.${bl.nameKey}`)}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t('settings.steuernummer')}
            value={formData.steuernummer}
            onChange={(v) => patch('steuernummer', v)}
            hint={t('settings.steuernummerHint')}
          />
          <TextField
            label={t('settings.idNr')}
            value={formData.idNr}
            onChange={(v) => patch('idNr', v)}
            placeholder="11 Ziffern"
            hint={t('settings.idNrHint')}
          />
          <SelectField
            label={t('settings.religion')}
            value={formData.religion}
            onChange={(v) => patch('religion', v)}
          >
            <option value="">{t('settings.religionNone')}</option>
            {RELIGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {t(`settings.religion_${r}`)}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label={t('settings.street')}
            value={formData.street}
            onChange={(v) => patch('street', v)}
          />
          <TextField
            label={t('settings.zip')}
            value={formData.zip}
            onChange={(v) => patch('zip', v)}
          />
          <TextField
            label={t('settings.city')}
            value={formData.city}
            onChange={(v) => patch('city', v)}
          />
        </div>
        <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-600">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {t('settings.incomeTypes')}
          </p>
          <CheckboxField
            label={t('settings.hasEmploymentIncome')}
            checked={formData.hasEmploymentIncome}
            onChange={(v) => patch('hasEmploymentIncome', v)}
          />
          <CheckboxField
            label={t('settings.hasSelfEmployment')}
            checked={formData.hasSelfEmployment}
            onChange={(v) => patch('hasSelfEmployment', v)}
          />
          <CheckboxField
            label={t('settings.hasCapitalIncome')}
            checked={formData.hasCapitalIncome}
            onChange={(v) => patch('hasCapitalIncome', v)}
          />
          <CheckboxField
            label={t('settings.hasRentalIncome')}
            checked={formData.hasRentalIncome}
            onChange={(v) => patch('hasRentalIncome', v)}
          />
          <CheckboxField
            label={t('settings.isCrossBorder')}
            checked={formData.isCrossBorder}
            onChange={(v) => patch('isCrossBorder', v)}
          />
        </div>
      </section>

      {isJoint && (
        <section className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {t('settings.sectionPartner')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.sectionPartnerHint')}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={t('settings.anrede')}
              value={formData.partnerAnrede}
              onChange={(v) => patch('partnerAnrede', v)}
            >
              <option value="">{t('settings.anredeNone')}</option>
              {ANREDE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {t(`settings.anrede_${a}`)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label={t('settings.partnerSteuerklasse')}
              value={formData.partnerSteuerklasse}
              onChange={(v) => patch('partnerSteuerklasse', v)}
            >
              <option value="">{t('settings.bundeslandNone')}</option>
              {STEUERKLASSE_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {t(`calculator.steuerklasse${k}`)}
                </option>
              ))}
            </SelectField>
            <TextField
              label={t('settings.vorname')}
              value={formData.partnerVorname}
              onChange={(v) => patch('partnerVorname', v)}
            />
            <TextField
              label={t('settings.nachname')}
              value={formData.partnerNachname}
              onChange={(v) => patch('partnerNachname', v)}
            />
            <TextField
              label={t('settings.geburtsdatum')}
              type="date"
              value={formData.partnerGeburtsdatum}
              onChange={(v) => patch('partnerGeburtsdatum', v)}
            />
            <TextField
              label={t('settings.spouseIncome')}
              type="number"
              value={formData.spouseIncome}
              onChange={(v) => patch('spouseIncome', parseFloat(v) || 0)}
            />
            <TextField
              label={t('settings.partnerSteuernummer')}
              value={formData.partnerSteuernummer}
              onChange={(v) => patch('partnerSteuernummer', v)}
              hint={t('settings.partnerSteuernummerHint')}
            />
            <TextField
              label={t('settings.partnerIdNr')}
              value={formData.partnerIdNr}
              onChange={(v) => patch('partnerIdNr', v)}
              placeholder="11 Ziffern"
              hint={t('settings.idNrHint')}
            />
            <SelectField
              label={t('settings.religion')}
              value={formData.partnerReligion}
              onChange={(v) => patch('partnerReligion', v)}
            >
              <option value="">{t('settings.religionNone')}</option>
              {RELIGION_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {t(`settings.religion_${r}`)}
                </option>
              ))}
            </SelectField>
          </div>
          <CheckboxField
            label={t('settings.partnerDifferentAddress')}
            checked={formData.partnerDifferentAddress}
            onChange={(v) => patch('partnerDifferentAddress', v)}
          />
          {formData.partnerDifferentAddress && (
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label={t('settings.street')}
                value={formData.partnerStreet}
                onChange={(v) => patch('partnerStreet', v)}
              />
              <TextField
                label={t('settings.zip')}
                value={formData.partnerZip}
                onChange={(v) => patch('partnerZip', v)}
              />
              <TextField
                label={t('settings.city')}
                value={formData.partnerCity}
                onChange={(v) => patch('partnerCity', v)}
              />
            </div>
          )}
          <div className="space-y-2 rounded-lg border border-gray-200 bg-white/60 p-4 dark:border-gray-600 dark:bg-gray-900/40">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {t('settings.partnerIncomeTypes')}
            </p>
            <CheckboxField
              label={t('settings.hasEmploymentIncome')}
              checked={formData.partnerHasEmployment}
              onChange={(v) => patch('partnerHasEmployment', v)}
            />
            <CheckboxField
              label={t('settings.hasSelfEmployment')}
              checked={formData.partnerHasSelfEmployment}
              onChange={(v) => patch('partnerHasSelfEmployment', v)}
            />
            <CheckboxField
              label={t('settings.hasCapitalIncome')}
              checked={formData.partnerHasCapitalIncome}
              onChange={(v) => patch('partnerHasCapitalIncome', v)}
            />
            <CheckboxField
              label={t('settings.hasRentalIncome')}
              checked={formData.partnerHasRentalIncome}
              onChange={(v) => patch('partnerHasRentalIncome', v)}
            />
            <CheckboxField
              label={t('settings.isCrossBorder')}
              checked={formData.partnerIsCrossBorder}
              onChange={(v) => patch('partnerIsCrossBorder', v)}
            />
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={onSave} isLoading={isSaving}>
          {t('settings.saveTaxProfile')}
        </Button>
        {savedAt && (
          <span className="text-xs text-green-700 dark:text-green-400">
            {t('settings.taxProfileAutosaved')} {savedAt}
          </span>
        )}
      </div>
    </div>
  );
}
