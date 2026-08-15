'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/provider';
import { taxCountries } from '@/lib/i18n/config';
import { GRENZGAENGER_WORK_COUNTRIES } from '@/lib/tax/country-config';
import {
  TAX_LINE_CATEGORIES,
  type ElsterPreviewResult,
} from '@/lib/tax/elster-preview';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  ExternalLink,
  FileText,
  Globe2,
  Home,
  Printer,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BatchAutofillPanel } from '@/components/elster/batch-autofill-panel';
import { PriorElsterUploadPanel } from '@/components/elster/prior-elster-upload-panel';
import { MeinElsterFormPreview } from '@/components/elster/mein-elster-form-preview';

type Profile = {
  name?: string | null;
  email?: string | null;
  country?: string;
  steuerklasse?: string;
  bundesland?: string | null;
  deFilingMode?: string;
  numberOfChildren?: number;
  spouseIncome?: number;
  hasRentalIncome?: boolean;
  isCrossBorder?: boolean;
  profileRefreshNotice?: string | null;
};

type PropertyBrief = {
  id: string;
  address: string;
  label?: string | null;
  monthlyRent?: number | null;
  landlordName?: string | null;
  tenantName?: string | null;
  roleHint?: string | null;
  needsReview?: boolean;
  sourceHint?: string | null;
  notes?: string | null;
};

type NebenkostenBrief = {
  id: string;
  year: number;
  settlementAmount: number;
  isNachzahlung: boolean;
  objectLabel?: string | null;
  umlagefaehigAmount?: number | null;
  incomeAmount?: number | null;
  sourceKind?: string | null;
  needsReview?: boolean;
  notes?: string | null;
};

type RentalBrief = {
  id: string;
  year: number;
  objectLabel?: string | null;
  grossRent: number;
  operatingCosts: number;
  werbungskosten?: number;
  needsReview?: boolean;
  notes?: string | null;
};

type DocBrief = {
  id: string;
  name: string;
  year: number;
  category?: { name?: string } | null;
  taxAmount?: number | null;
};

const STEPS = [
  'year',
  'profile',
  'grenzgaenger',
  'documents',
  'property',
  'lines',
  'anlagen',
  'preview',
  'export',
] as const;

type StepId = (typeof STEPS)[number];

function DisclaimerBanner({ text }: { text: string }) {
  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
      {text}
    </div>
  );
}

async function copyText(value: string, successMsg: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMsg);
  } catch {
    toast.error('Clipboard');
  }
}

function SteuererklaerungPageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const defaultYear = new Date().getFullYear() - 1;
  const yearParam = searchParams.get('year');
  const stepParam = searchParams.get('step');
  const parsedYear = yearParam ? parseInt(yearParam, 10) : defaultYear;
  const stepFromUrl = stepParam && STEPS.includes(stepParam as StepId)
    ? STEPS.indexOf(stepParam as StepId)
    : 0;

  const [step, setStep] = useState(stepFromUrl);
  const [year, setYear] = useState(Number.isFinite(parsedYear) ? parsedYear : defaultYear);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preview, setPreview] = useState<ElsterPreviewResult | null>(null);
  const [docs, setDocs] = useState<DocBrief[]>([]);
  const [loading, setLoading] = useState(false);

  // Grenzgänger form
  const [ggEnabled, setGgEnabled] = useState(false);
  const [ggWorkCountry, setGgWorkCountry] = useState('AT');
  const [ggIncome, setGgIncome] = useState('');
  const [ggWithholding, setGgWithholding] = useState('');
  const [ggKm, setGgKm] = useState('');
  const [ggDays, setGgDays] = useState('');
  const [ggSvCountry, setGgSvCountry] = useState('DE');
  const [ggDba, setGgDba] = useState<'freistellung' | 'anrechnung' | 'unbekannt'>('unbekannt');
  const [ggNotes, setGgNotes] = useState('');

  // Property / NK / Rental forms
  const [properties, setProperties] = useState<PropertyBrief[]>([]);
  const [nebenkostenList, setNebenkostenList] = useState<NebenkostenBrief[]>([]);
  const [rentalsList, setRentalsList] = useState<RentalBrief[]>([]);
  const [propAddress, setPropAddress] = useState('');
  const [propPrice, setPropPrice] = useState('');
  const [propCosts, setPropCosts] = useState('');
  const [propBuilding, setPropBuilding] = useState('');
  const [nkAmount, setNkAmount] = useState('');
  const [nkNachzahlung, setNkNachzahlung] = useState(true);
  const [nkLabel, setNkLabel] = useState('');
  const [rentLabel, setRentLabel] = useState('');
  const [rentGross, setRentGross] = useState('');
  const [rentOp, setRentOp] = useState('');
  const [rentWk, setRentWk] = useState('');
  const [rentAfa, setRentAfa] = useState('');

  // Tax lines
  const [lineCategory, setLineCategory] = useState<(typeof TAX_LINE_CATEGORIES)[number]['id']>('gehalt');
  const [lineAmount, setLineAmount] = useState('');
  const [lineLabel, setLineLabel] = useState('');
  const [savedLines, setSavedLines] = useState<
    Array<{ id: string; category: string; kind: string; amount: number; label: string | null }>
  >([]);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'review'>('all');
  const [exportAck, setExportAck] = useState(false);

  const stepId: StepId = STEPS[step];
  const disclaimer = t('elsterAssistent.disclaimer');

  useEffect(() => {
    if (yearParam) {
      const y = parseInt(yearParam, 10);
      if (Number.isFinite(y)) setYear(y);
    }
    if (stepParam && STEPS.includes(stepParam as StepId)) {
      setStep(STEPS.indexOf(stepParam as StepId));
    }
  }, [yearParam, stepParam]);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/elster/preview?year=${year}`);
      let data: {
        preview?: ElsterPreviewResult | null;
        error?: string;
        code?: string;
      } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        const serverMsg =
          typeof data.error === 'string' && data.error.trim() ? data.error.trim() : null;
        if (res.status === 401) {
          toast.error(serverMsg || t('elsterAssistent.loadErrorUnauthorized'));
        } else if (res.status === 503) {
          toast.error(serverMsg || t('elsterAssistent.loadErrorSchema'));
        } else {
          toast.error(serverMsg || t('elsterAssistent.loadError'));
        }
        return;
      }

      if (!data.preview) {
        toast.error(t('elsterAssistent.loadErrorEmpty'));
        return;
      }

      setPreview(data.preview);
    } catch {
      toast.error(t('elsterAssistent.loadError'));
    } finally {
      setLoading(false);
    }
  }, [year, t]);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/settings');
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data.settings);
      if (data.settings?.isCrossBorder) setGgEnabled(true);
    } catch {
      /* ignore */
    }
  }, []);

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?year=${year}`);
      if (!res.ok) return;
      const data = await res.json();
      setDocs(data.documents || []);
    } catch {
      /* ignore */
    }
  }, [year]);

  const loadGrenzgaenger = useCallback(async () => {
    try {
      const res = await fetch(`/api/elster/grenzgaenger?year=${year}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.isCrossBorder) setGgEnabled(true);
      const e = data.entry;
      if (!e) return;
      setGgEnabled(e.enabled);
      setGgWorkCountry(e.workCountry || 'AT');
      setGgIncome(e.foreignEmploymentIncome ? String(e.foreignEmploymentIncome) : '');
      setGgWithholding(e.foreignWithholdingTax ? String(e.foreignWithholdingTax) : '');
      setGgKm(e.commutingKmOneWay != null ? String(e.commutingKmOneWay) : '');
      setGgDays(e.commutingDays != null ? String(e.commutingDays) : '');
      setGgSvCountry(e.socialInsuranceCountry || 'DE');
      setGgDba(
        (e.dbaMethodHint as 'freistellung' | 'anrechnung' | 'unbekannt') || 'unbekannt'
      );
      setGgNotes(e.notes || '');
    } catch {
      /* ignore */
    }
  }, [year]);

  const loadSavedLines = useCallback(async () => {
    try {
      const res = await fetch(`/api/elster/entries?year=${year}`);
      if (!res.ok) return;
      const data = await res.json();
      setSavedLines(
        (data.entries || []).map(
          (e: {
            id: string;
            category: string;
            kind: string;
            amount: number;
            label: string | null;
          }) => ({
            id: e.id,
            category: e.category,
            kind: e.kind,
            amount: e.amount,
            label: e.label,
          })
        )
      );
    } catch {
      /* ignore */
    }
  }, [year]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const loadProperties = useCallback(async () => {
    try {
      const res = await fetch('/api/elster/properties');
      if (!res.ok) return;
      const data = await res.json();
      setProperties((data.properties || []) as PropertyBrief[]);
    } catch {
      /* ignore */
    }
  }, []);

  const loadNebenkostenAndRentals = useCallback(async () => {
    try {
      const [nkRes, rentRes] = await Promise.all([
        fetch(`/api/elster/nebenkosten?year=${year}`),
        fetch(`/api/elster/rental?year=${year}`),
      ]);
      if (nkRes.ok) {
        const nkData = await nkRes.json();
        setNebenkostenList((nkData.nebenkosten || []) as NebenkostenBrief[]);
      }
      if (rentRes.ok) {
        const rentData = await rentRes.json();
        setRentalsList((rentData.rentals || []) as RentalBrief[]);
      }
    } catch {
      /* ignore */
    }
  }, [year]);

  useEffect(() => {
    loadDocs();
    loadGrenzgaenger();
    loadSavedLines();
    if (stepId === 'property' || stepId === 'documents') {
      void loadProperties();
      void loadNebenkostenAndRentals();
    }
    if (stepId === 'anlagen' || stepId === 'preview' || stepId === 'export' || stepId === 'documents') {
      loadPreview();
    }
  }, [
    year,
    stepId,
    loadDocs,
    loadGrenzgaenger,
    loadSavedLines,
    loadPreview,
    loadProperties,
    loadNebenkostenAndRentals,
  ]);

  const stepLabels = useMemo(
    () => STEPS.map((id) => t(`elsterAssistent.steps.${id}`)),
    [t]
  );

  const saveGrenzgaenger = async () => {
    try {
      const res = await fetch('/api/elster/grenzgaenger', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          enabled: ggEnabled,
          workCountry: ggWorkCountry,
          residenceCountry: 'DE',
          foreignEmploymentIncome: parseFloat(ggIncome) || 0,
          foreignWithholdingTax: parseFloat(ggWithholding) || 0,
          commutingKmOneWay: ggKm ? parseFloat(ggKm) : null,
          commutingDays: ggDays ? parseInt(ggDays, 10) : null,
          socialInsuranceCountry: ggSvCountry || null,
          dbaMethodHint: ggDba,
          notes: ggNotes || null,
          needsReview: true,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('elsterAssistent.saved'));
      setProfile((p) => (p ? { ...p, isCrossBorder: ggEnabled } : p));
    } catch {
      toast.error(t('elsterAssistent.saveError'));
    }
  };

  const saveProperty = async () => {
    if (!propAddress.trim()) {
      toast.error(t('elsterAssistent.addressRequired'));
      return;
    }
    try {
      const res = await fetch('/api/elster/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: propAddress,
          purchasePrice: propPrice ? parseFloat(propPrice) : null,
          purchaseCosts: propCosts ? parseFloat(propCosts) : null,
          buildingValue: propBuilding ? parseFloat(propBuilding) : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('elsterAssistent.saved'));
      setPropAddress('');
      setPropPrice('');
      setPropCosts('');
      setPropBuilding('');
      void loadProperties();
    } catch {
      toast.error(t('elsterAssistent.saveError'));
    }
  };

  const saveNebenkosten = async () => {
    if (!nkAmount) {
      toast.error(t('elsterAssistent.amountRequired'));
      return;
    }
    try {
      const res = await fetch('/api/elster/nebenkosten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          settlementAmount: parseFloat(nkAmount),
          isNachzahlung: nkNachzahlung,
          objectLabel: nkLabel || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('elsterAssistent.saved'));
      setNkAmount('');
      setNkLabel('');
      void loadNebenkostenAndRentals();
    } catch {
      toast.error(t('elsterAssistent.saveError'));
    }
  };

  const saveRental = async () => {
    try {
      const res = await fetch('/api/elster/rental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          objectLabel: rentLabel || null,
          grossRent: parseFloat(rentGross) || 0,
          operatingCosts: parseFloat(rentOp) || 0,
          werbungskosten: parseFloat(rentWk) || 0,
          afaAmount: rentAfa ? parseFloat(rentAfa) : null,
          needsReview: true,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('elsterAssistent.saved'));
      setRentLabel('');
      setRentGross('');
      setRentOp('');
      setRentWk('');
      setRentAfa('');
      void loadNebenkostenAndRentals();
    } catch {
      toast.error(t('elsterAssistent.saveError'));
    }
  };

  const saveLine = async () => {
    const cat = TAX_LINE_CATEGORIES.find((c) => c.id === lineCategory);
    if (!lineAmount) {
      toast.error(t('elsterAssistent.amountRequired'));
      return;
    }
    try {
      const res = await fetch('/api/elster/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          kind: cat?.kind || 'expense',
          category: lineCategory,
          label: lineLabel || cat?.labelDe,
          amount: parseFloat(lineAmount),
          needsReview: true,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('elsterAssistent.saved'));
      setLineAmount('');
      setLineLabel('');
      void loadSavedLines();
      loadPreview();
    } catch {
      toast.error(t('elsterAssistent.saveError'));
    }
  };

  const goNext = async () => {
    if (stepId === 'grenzgaenger') await saveGrenzgaenger();
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {t('elsterAssistent.title')}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{t('elsterAssistent.subtitle')}</p>
        </div>

        <DisclaimerBanner text={disclaimer} />
        {profile?.profileRefreshNotice && (
          <div className="mb-4 rounded-lg border border-teal-400 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-950 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-100">
            {profile.profileRefreshNotice}
          </div>
        )}
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          {t('elsterAssistent.pricingReminder')}
        </p>
        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-1">
            {stepLabels.map((label, i) => (
              <button
                key={STEPS[i]}
                type="button"
                onClick={() => setStep(i)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  i === step
                    ? 'bg-blue-600 text-white'
                    : i < step
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {i + 1}. {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          {stepId === 'year' && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">{t('elsterAssistent.steps.year')}</h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t('elsterAssistent.yearHint')}
              </p>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10) || defaultYear)}
                min={2000}
                max={2100}
              />
            </section>
          )}

          {stepId === 'profile' && (
            <section className="space-y-6">
              <div>
                <h2 className="mb-2 text-lg font-semibold">{t('elsterAssistent.steps.profile')}</h2>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {t('elsterAssistent.profileHint')}
                </p>
              </div>
              <PriorElsterUploadPanel
                year={year}
                onProfileUpdated={() => {
                  void loadProfile();
                  void loadPreview();
                }}
              />
              {profile ? (
                <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-gray-500">{t('common.profile')}</dt>
                    <dd className="font-medium">{profile.name || profile.email}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">{t('elsterAssistent.steuerklasse')}</dt>
                    <dd className="font-medium">{profile.steuerklasse || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">{t('elsterAssistent.filingMode')}</dt>
                    <dd className="font-medium">
                      {profile.deFilingMode === 'zusammen'
                        ? t('elsterAssistent.zusammen')
                        : t('elsterAssistent.einzel')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">{t('elsterAssistent.children')}</dt>
                    <dd className="font-medium">{profile.numberOfChildren ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">{t('settings.isCrossBorder')}</dt>
                    <dd className="font-medium">
                      {profile.isCrossBorder ? t('elsterAssistent.yes') : t('elsterAssistent.no')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">{t('settings.hasRentalIncome')}</dt>
                    <dd className="font-medium">
                      {profile.hasRentalIncome ? t('elsterAssistent.yes') : t('elsterAssistent.no')}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">{t('common.loading')}</p>
              )}
              <Link
                href="/settings?tab=taxProfile"
                className="inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {t('elsterAssistent.editProfile')}
              </Link>
            </section>
          )}

          {stepId === 'grenzgaenger' && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">{t('elsterAssistent.steps.grenzgaenger')}</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('elsterAssistent.grenzgaengerHint')}
              </p>
              <Link
                href="/grenzgaenger"
                className="inline-flex text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {t('elsterAssistent.grenzgaengerChecklistLink')}
              </Link>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
                {t('elsterAssistent.dbaDisclaimer')}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  checked={ggEnabled}
                  onChange={(e) => setGgEnabled(e.target.checked)}
                />
                <span className="text-sm font-medium">{t('elsterAssistent.iamGrenzgaenger')}</span>
              </label>

              {ggEnabled && (
                <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-600">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      {t('elsterAssistent.residenceCountry')}
                    </label>
                    <Input value="DE — Deutschland" disabled />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      {t('elsterAssistent.workCountry')}
                    </label>
                    <select
                      value={ggWorkCountry}
                      onChange={(e) => setGgWorkCountry(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                    >
                      {GRENZGAENGER_WORK_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {taxCountries[c as keyof typeof taxCountries]?.name ?? c} ({c})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        {t('elsterAssistent.foreignIncome')}
                      </label>
                      <Input
                        type="number"
                        value={ggIncome}
                        onChange={(e) => setGgIncome(e.target.value)}
                        placeholder="0"
                      />
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {t('elsterAssistent.pruefenNote')}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        {t('elsterAssistent.foreignWithholding')}
                      </label>
                      <Input
                        type="number"
                        value={ggWithholding}
                        onChange={(e) => setGgWithholding(e.target.value)}
                        placeholder="0"
                      />
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {t('elsterAssistent.pruefenNote')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      {t('elsterAssistent.dbaMethod')}
                    </label>
                    <select
                      value={ggDba}
                      onChange={(e) =>
                        setGgDba(e.target.value as 'freistellung' | 'anrechnung' | 'unbekannt')
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                    >
                      <option value="unbekannt">{t('elsterAssistent.dbaUnknown')}</option>
                      <option value="freistellung">{t('elsterAssistent.dbaFreistellung')}</option>
                      <option value="anrechnung">{t('elsterAssistent.dbaAnrechnung')}</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">{t('elsterAssistent.dbaInfoOnly')}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        {t('elsterAssistent.commutingKm')}
                      </label>
                      <Input
                        type="number"
                        value={ggKm}
                        onChange={(e) => setGgKm(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        {t('elsterAssistent.commutingDays')}
                      </label>
                      <Input
                        type="number"
                        value={ggDays}
                        onChange={(e) => setGgDays(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      {t('elsterAssistent.socialInsurance')}
                    </label>
                    <select
                      value={ggSvCountry}
                      onChange={(e) => setGgSvCountry(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                    >
                      <option value="DE">DE</option>
                      {GRENZGAENGER_WORK_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t('elsterAssistent.notes')}</label>
                    <Input value={ggNotes} onChange={(e) => setGgNotes(e.target.value)} />
                  </div>
                  <p className="text-xs text-gray-500">{t('elsterAssistent.ggDocCategories')}</p>
                </div>
              )}
              <Button type="button" variant="secondary" size="sm" onClick={saveGrenzgaenger}>
                {t('common.save')}
              </Button>
            </section>
          )}

          {stepId === 'documents' && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">{t('elsterAssistent.steps.documents')}</h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t('elsterAssistent.documentsHint')}
              </p>

              <div className="mb-6">
                <BatchAutofillPanel
                  year={year}
                  onApplied={(p) => {
                    if (p) setPreview(p);
                    void loadDocs();
                    void loadPreview();
                  }}
                />
              </div>

              <p className="mb-3 text-sm">
                {t('elsterAssistent.docsForYear', { count: docs.length, year })}
              </p>
              {preview?.gaps && preview.gaps.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {preview.gaps.map((g) => (
                    <li
                      key={g.id}
                      className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${
                        g.severity === 'warn'
                          ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100'
                          : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100'
                      }`}
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{g.messageDe}</span>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded border border-gray-100 px-2 py-1.5 dark:border-gray-700"
                  >
                    <span className="truncate">
                      <FileText className="mr-1 inline h-3.5 w-3.5" />
                      {d.name}
                      {d.category?.name ? (
                        <span className="ml-2 text-xs text-gray-500">{d.category.name}</span>
                      ) : null}
                    </span>
                    {d.taxAmount != null ? (
                      <span className="text-xs text-gray-500">
                        {d.taxAmount.toLocaleString('de-DE')} €
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Link
                href="/documents"
                className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {t('elsterAssistent.uploadDocs')}
              </Link>
            </section>
          )}

          {stepId === 'property' && (
            <section className="space-y-8">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">{t('elsterAssistent.propertyTitle')}</h2>
                </div>
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  {t('elsterAssistent.propertyHint')}
                </p>
                {properties.length > 0 && (
                  <ul className="mb-4 space-y-2">
                    {properties.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div className="flex flex-wrap items-center gap-2 font-medium">
                          <span>{p.label || p.address}</span>
                          {p.needsReview && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                              prüfen
                            </span>
                          )}
                          {p.sourceHint === 'mietvertrag' && (
                            <span className="rounded bg-teal-100 px-1.5 py-0.5 text-xs text-teal-900 dark:bg-teal-900/40 dark:text-teal-100">
                              aus Mietvertrag
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {p.address}
                          {p.monthlyRent != null
                            ? ` · Kaltmiete ${p.monthlyRent.toLocaleString('de-DE')} €/Monat`
                            : ''}
                          {p.roleHint ? ` · Rolle: ${p.roleHint}` : ''}
                          {p.landlordName ? ` · Vermieter: ${p.landlordName}` : ''}
                          {p.tenantName ? ` · Mieter: ${p.tenantName}` : ''}
                        </p>
                        {p.notes && (
                          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                            {p.notes}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder={t('elsterAssistent.address')}
                    value={propAddress}
                    onChange={(e) => setPropAddress(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={t('elsterAssistent.purchasePrice')}
                    value={propPrice}
                    onChange={(e) => setPropPrice(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={t('elsterAssistent.purchaseCosts')}
                    value={propCosts}
                    onChange={(e) => setPropCosts(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={t('elsterAssistent.buildingValue')}
                    value={propBuilding}
                    onChange={(e) => setPropBuilding(e.target.value)}
                  />
                </div>
                <Button type="button" size="sm" className="mt-3" onClick={saveProperty}>
                  {t('elsterAssistent.addProperty')}
                </Button>
              </div>

              <div className="border-t border-gray-200 pt-6 dark:border-gray-600">
                <h3 className="mb-2 font-semibold">{t('elsterAssistent.nebenkostenTitle')}</h3>
                <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                  Hausgeldabrechnungen aus Batch erscheinen hier als Vorschlag (umlagefähige Kosten /
                  Einnahmen) — bitte prüfen.
                </p>
                {nebenkostenList.length > 0 && (
                  <ul className="mb-3 space-y-2">
                    {nebenkostenList.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div className="flex flex-wrap items-center gap-2 font-medium">
                          <span>{n.objectLabel || `Nebenkosten ${n.year}`}</span>
                          {n.needsReview && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                              prüfen
                            </span>
                          )}
                          {n.sourceKind === 'hausgeld' && (
                            <span className="rounded bg-teal-100 px-1.5 py-0.5 text-xs text-teal-900 dark:bg-teal-900/40 dark:text-teal-100">
                              Hausgeld
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Abschluss {n.settlementAmount.toLocaleString('de-DE')} €
                          {n.isNachzahlung ? ' (Nachzahlung)' : ' (Guthaben)'}
                          {n.umlagefaehigAmount != null
                            ? ` · Umlage ${n.umlagefaehigAmount.toLocaleString('de-DE')} €`
                            : ''}
                          {n.incomeAmount != null
                            ? ` · Einnahmen ${n.incomeAmount.toLocaleString('de-DE')} €`
                            : ''}
                        </p>
                        {n.notes && (
                          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                            {n.notes}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="number"
                    placeholder={t('elsterAssistent.settlementAmount')}
                    value={nkAmount}
                    onChange={(e) => setNkAmount(e.target.value)}
                  />
                  <Input
                    placeholder={t('elsterAssistent.objectLabel')}
                    value={nkLabel}
                    onChange={(e) => setNkLabel(e.target.value)}
                  />
                </div>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={nkNachzahlung}
                    onChange={(e) => setNkNachzahlung(e.target.checked)}
                  />
                  {t('elsterAssistent.isNachzahlung')}
                </label>
                <Button type="button" size="sm" className="mt-3" onClick={saveNebenkosten}>
                  {t('elsterAssistent.addNebenkosten')}
                </Button>
              </div>

              <div className="border-t border-gray-200 pt-6 dark:border-gray-600">
                <h3 className="mb-2 font-semibold">{t('elsterAssistent.rentalTitle')}</h3>
                <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">
                  {t('elsterAssistent.afaStubNote')}
                </p>
                {rentalsList.length > 0 && (
                  <ul className="mb-3 space-y-2">
                    {rentalsList.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div className="flex flex-wrap items-center gap-2 font-medium">
                          <span>{r.objectLabel || `V&V ${r.year}`}</span>
                          {r.needsReview && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                              prüfen
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Mieteinnahmen {r.grossRent.toLocaleString('de-DE')} € · Ausgaben{' '}
                          {r.operatingCosts.toLocaleString('de-DE')} €
                          {r.werbungskosten
                            ? ` · WK ${r.werbungskosten.toLocaleString('de-DE')} €`
                            : ''}
                        </p>
                        {r.notes && (
                          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                            {r.notes}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder={t('elsterAssistent.objectLabel')}
                    value={rentLabel}
                    onChange={(e) => setRentLabel(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={t('elsterAssistent.grossRent')}
                    value={rentGross}
                    onChange={(e) => setRentGross(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={t('elsterAssistent.operatingCosts')}
                    value={rentOp}
                    onChange={(e) => setRentOp(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={t('elsterAssistent.werbungskosten')}
                    value={rentWk}
                    onChange={(e) => setRentWk(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={t('elsterAssistent.afaAmount')}
                    value={rentAfa}
                    onChange={(e) => setRentAfa(e.target.value)}
                  />
                </div>
                <Button type="button" size="sm" className="mt-3" onClick={saveRental}>
                  {t('elsterAssistent.addRental')}
                </Button>
              </div>
            </section>
          )}

          {stepId === 'lines' && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">{t('elsterAssistent.steps.lines')}</h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t('elsterAssistent.linesHint')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={lineCategory}
                  onChange={(e) =>
                    setLineCategory(e.target.value as (typeof TAX_LINE_CATEGORIES)[number]['id'])
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                >
                  {TAX_LINE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.labelDe} ({c.kind === 'income' ? 'Einnahme' : 'Ausgabe'})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder={t('elsterAssistent.amount')}
                  value={lineAmount}
                  onChange={(e) => setLineAmount(e.target.value)}
                />
                <Input
                  placeholder={t('elsterAssistent.optionalLabel')}
                  value={lineLabel}
                  onChange={(e) => setLineLabel(e.target.value)}
                  className="sm:col-span-2"
                />
              </div>
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                {t('elsterAssistent.healthPruefen')}
              </p>
              <Button type="button" size="sm" className="mt-3" onClick={saveLine}>
                {t('elsterAssistent.addLine')}
              </Button>
              {savedLines.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {savedLines.map((line) => {
                    const cat = TAX_LINE_CATEGORIES.find((c) => c.id === line.category);
                    return (
                      <li
                        key={line.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600"
                      >
                        <span>
                          {line.label || cat?.labelDe || line.category}
                          <span className="ml-2 text-xs text-gray-500">
                            ({line.kind === 'income' ? 'Einnahme' : 'Ausgabe'})
                          </span>
                        </span>
                        <span className="font-medium tabular-nums">
                          {line.amount.toLocaleString('de-DE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          €
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {stepId === 'anlagen' && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('elsterAssistent.steps.anlagen')}</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadPreview}
                  isLoading={loading}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  {t('elsterAssistent.refresh')}
                </Button>
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t('elsterAssistent.anlagenHint')}
              </p>
              {preview?.anlagen.length ? (
                <ul className="space-y-2">
                  {preview.anlagen.map((a) => (
                    <li
                      key={a.anlage}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600"
                    >
                      <span className="text-sm font-medium">{a.labelDe}</span>
                      <span className="text-xs text-gray-500">
                        {a.fieldCount} {t('elsterAssistent.fields')}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">{t('elsterAssistent.noAnlagen')}</p>
              )}
            </section>
          )}

          {stepId === 'preview' && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('elsterAssistent.steps.preview')}</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadPreview}
                  isLoading={loading}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  {t('elsterAssistent.refresh')}
                </Button>
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t('elsterAssistent.previewHint')}
              </p>

              {preview?.validation && (
                <div
                  className={`mb-4 rounded-lg border p-3 text-sm ${
                    preview.validation.readyForChecklist
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100'
                      : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'
                  }`}
                >
                  <p className="font-semibold">
                    {preview.validation.readyForChecklist
                      ? t('elsterAssistent.validationReady')
                      : t('elsterAssistent.validationPending')}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>
                      {t('elsterAssistent.validationReviewCount', {
                        count: preview.validation.reviewCount,
                      })}
                    </li>
                    <li>
                      {t('elsterAssistent.validationLowConf', {
                        count: preview.validation.lowConfidenceCount,
                      })}
                    </li>
                    <li>
                      {t('elsterAssistent.validationWarns', {
                        count: preview.validation.warnGapCount,
                      })}
                    </li>
                    {preview.validation.sumMismatchCount > 0 && (
                      <li>
                        {t('elsterAssistent.validationSumMismatch', {
                          count: preview.validation.sumMismatchCount,
                        })}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="mb-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={previewFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setPreviewFilter('all')}
                >
                  {t('elsterAssistent.filterAll')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewFilter === 'review' ? 'primary' : 'outline'}
                  onClick={() => setPreviewFilter('review')}
                >
                  {t('elsterAssistent.filterReview')} (
                  {preview?.validation?.reviewCount ??
                    (preview?.fields || []).filter((f) => f.needsReview).length}
                  )
                </Button>
                <Link
                  href={`/calculator?year=${year}&autofill=1`}
                  className="inline-flex items-center text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Steuerrechner aus Belegen
                </Link>
              </div>

              {preview ? (
                <MeinElsterFormPreview
                  preview={{
                    ...preview,
                    fields:
                      previewFilter === 'review'
                        ? preview.fields.filter((f) => f.needsReview)
                        : preview.fields,
                  }}
                />
              ) : (
                <p className="text-sm text-gray-500">{t('elsterAssistent.noAnlagen')}</p>
              )}
              {previewFilter === 'review' &&
                (preview?.fields || []).filter((f) => f.needsReview).length === 0 && (
                  <p className="mt-3 text-sm text-gray-500">
                    {t('elsterAssistent.filterReviewEmpty')}
                  </p>
                )}
            </section>
          )}

          {stepId === 'export' && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">{t('elsterAssistent.steps.export')}</h2>
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                {t('elsterAssistent.exportHint')}
              </p>
              <p className="mb-4 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                {t('elsterAssistent.exportTimeEstimate')}
              </p>

              {preview?.validation && !preview.validation.readyForChecklist && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/40">
                  <h3 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {t('elsterAssistent.exportValidationTitle')}
                  </h3>
                  <ul className="mb-3 space-y-1 text-sm text-amber-900 dark:text-amber-100">
                    {(preview.validation.blockersDe || []).map((b, i) => (
                      <li key={i}>• {b}</li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewFilter('review');
                      setStep(STEPS.indexOf('preview'));
                    }}
                  >
                    {t('elsterAssistent.openReviewQueue')}
                  </Button>
                  <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-amber-950 dark:text-amber-50">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={exportAck}
                      onChange={(e) => setExportAck(e.target.checked)}
                    />
                    <span>{t('elsterAssistent.exportAck')}</span>
                  </label>
                </div>
              )}

              {(preview?.gaps || []).filter((g) => g.severity === 'warn').length > 0 && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    {t('elsterAssistent.exportMissingDocs')}
                  </h3>
                  <ul className="space-y-1 text-sm text-red-700 dark:text-red-200">
                    {preview!.gaps
                      .filter((g) => g.severity === 'warn')
                      .map((g) => (
                        <li key={g.id}>• {g.messageDe}</li>
                      ))}
                  </ul>
                </div>
              )}

              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                {t('elsterAssistent.exportFieldByField')}
              </h3>
              <ol className="mb-6 list-decimal space-y-3 pl-5 text-sm">
                {(preview?.fields || []).map((f, i) => {
                  const display =
                    f.valueFormatted ?? (f.value != null ? String(f.value) : '');
                  return (
                    <li key={f.fieldKey || i} className="pl-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="font-medium">
                            {f.anlage} — {f.fieldLabelDe}
                          </span>
                          <span className="ml-2 font-semibold">{display || '—'}</span>
                          {f.needsReview && (
                            <span className="ml-2 text-xs font-semibold text-amber-600">
                              {t('elsterAssistent.pruefen')}
                            </span>
                          )}
                          <p className="text-xs text-gray-500">{f.elsterHintDe}</p>
                        </div>
                        {display && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<ClipboardCopy className="h-3.5 w-3.5" />}
                            onClick={() =>
                              copyText(display, t('elsterAssistent.copied'))
                            }
                          >
                            {t('elsterAssistent.copyValue')}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                {t('elsterAssistent.exportChecklistTitle')}
              </h3>
              <ol className="mb-6 list-decimal space-y-2 pl-5 text-sm">
                {(preview?.checklist || []).map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ol>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  leftIcon={<ExternalLink className="h-4 w-4" />}
                  disabled={
                    Boolean(preview?.validation && !preview.validation.readyForChecklist) &&
                    !exportAck
                  }
                  onClick={() =>
                    window.open('https://www.elster.de/eportal/start', '_blank')
                  }
                >
                  {t('elsterAssistent.exportOpenMeinElster')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={<Printer className="h-4 w-4" />}
                  disabled={
                    Boolean(preview?.validation && !preview.validation.readyForChecklist) &&
                    !exportAck
                  }
                  onClick={() => window.open(`/api/elster/export?year=${year}`, '_blank')}
                >
                  {t('elsterAssistent.printChecklist')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    Boolean(preview?.validation && !preview.validation.readyForChecklist) &&
                    !exportAck
                  }
                  onClick={() =>
                    window.open(`/api/elster/export?year=${year}&format=json`, '_blank')
                  }
                >
                  {t('elsterAssistent.downloadJson')}
                </Button>
              </div>
              <div className="mt-6 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950/30 dark:text-green-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{t('elsterAssistent.noAutoSubmit')}</span>
              </div>
            </section>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={step === 0}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              {t('common.back')}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={goNext}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                {t('elsterAssistent.next')}
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => setStep(0)}>
                {t('elsterAssistent.startOver')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function SteuererklaerungPage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loading variant="spinner" size="lg" text={t('common.loading')} />
        </div>
      }
    >
      <SteuererklaerungPageContent />
    </Suspense>
  );
}
