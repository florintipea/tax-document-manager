'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Globe2,
  ListChecks,
  UserRound,
  ArrowRight,
} from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { useI18n } from '@/lib/i18n/provider';

type Progress = {
  hasDocuments: boolean;
  hasProfile: boolean;
  hasGrenzChecked: boolean;
  isCrossBorder: boolean;
  hasPreviewFields: boolean;
  reviewCount: number;
  readyForChecklist: boolean;
  year: number;
};

const STEPS = [
  {
    id: 'docs',
    href: '/documents/upload',
    labelKey: 'interview.stepDocs',
    hintKey: 'interview.hintDocs',
    icon: FileText,
    done: (p: Progress) => p.hasDocuments,
  },
  {
    id: 'profile',
    href: '/settings',
    labelKey: 'interview.stepProfile',
    hintKey: 'interview.hintProfile',
    icon: UserRound,
    done: (p: Progress) => p.hasProfile,
  },
  {
    id: 'grenz',
    href: '/grenzgaenger',
    labelKey: 'interview.stepGrenz',
    hintKey: 'interview.hintGrenz',
    icon: Globe2,
    done: (p: Progress) => p.hasGrenzChecked || !p.isCrossBorder,
    optional: true,
  },
  {
    id: 'lines',
    href: (y: number) => `/steuererklaerung?year=${y}&step=lines`,
    labelKey: 'interview.stepLines',
    hintKey: 'interview.hintLines',
    icon: ListChecks,
    done: (p: Progress) => p.hasPreviewFields,
  },
  {
    id: 'preview',
    href: (y: number) => `/steuererklaerung?year=${y}&step=preview`,
    labelKey: 'interview.stepPreview',
    hintKey: 'interview.hintPreview',
    icon: ClipboardCheck,
    done: (p: Progress) => p.reviewCount === 0 && p.hasPreviewFields,
  },
  {
    id: 'export',
    href: (y: number) => `/steuererklaerung?year=${y}&step=export`,
    labelKey: 'interview.stepExport',
    hintKey: 'interview.hintExport',
    icon: ExternalLink,
    done: (p: Progress) => p.readyForChecklist,
  },
] as const;

function resolveHref(
  href: string | ((y: number) => string),
  year: number
): string {
  return typeof href === 'function' ? href(year) : href;
}

export default function InterviewPage() {
  const { t } = useI18n();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const year = new Date().getFullYear() - 1;
      const [settingsRes, docsRes, previewRes, ggRes] = await Promise.all([
        fetch('/api/user/settings'),
        fetch(`/api/documents?year=${year}&limit=5`),
        fetch(`/api/elster/preview?year=${year}`),
        fetch(`/api/elster/grenzgaenger?year=${year}`),
      ]);

      const settings = settingsRes.ok ? await settingsRes.json() : {};
      const docsData = docsRes.ok ? await docsRes.json() : {};
      const previewData = previewRes.ok ? await previewRes.json() : {};
      const ggData = ggRes.ok ? await ggRes.json() : {};

      const s = settings.settings || settings;
      const docs = docsData.documents || docsData.items || [];
      const preview = previewData.preview;
      const gg = ggData.entry || ggData.grenzgaenger || null;
      const isCrossBorder = Boolean(s.isCrossBorder || gg?.enabled);

      setProgress({
        year,
        hasDocuments: Array.isArray(docs) ? docs.length > 0 : Boolean(docsData.total),
        hasProfile: Boolean(s.steuerklasse || s.vorname || s.name),
        hasGrenzChecked: Boolean(gg) || !isCrossBorder,
        isCrossBorder,
        hasPreviewFields: Boolean(preview?.fields?.length),
        reviewCount: preview?.validation?.reviewCount ?? 0,
        readyForChecklist: Boolean(preview?.validation?.readyForChecklist),
      });
    } catch {
      setProgress({
        year: new Date().getFullYear() - 1,
        hasDocuments: false,
        hasProfile: false,
        hasGrenzChecked: true,
        isCrossBorder: false,
        hasPreviewFields: false,
        reviewCount: 0,
        readyForChecklist: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !progress) {
    return (
      <AuthenticatedLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loading variant="spinner" size="lg" text={t('common.loading')} />
        </div>
      </AuthenticatedLayout>
    );
  }

  const doneCount = STEPS.filter((s) => s.done(progress)).length;
  const nextStep = STEPS.find((s) => !s.done(progress));

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('interview.title')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('interview.subtitle')}</p>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{t('interview.disclaimer')}</p>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
          {t('interview.progress', { done: doneCount, total: STEPS.length, year: progress.year })}
        </div>

        <ol className="mt-6 space-y-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const done = step.done(progress);
            const href = resolveHref(step.href, progress.year);
            return (
              <li key={step.id}>
                <Link
                  href={href}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-4 transition hover:shadow-sm ${
                    done
                      ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/20'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                  }`}
                >
                  <span className="mt-0.5">
                    {done ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {t(step.labelKey)}
                      </span>
                      {'optional' in step && step.optional && !progress.isCrossBorder && (
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">
                          {t('interview.optional')}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm text-gray-600 dark:text-gray-400">
                      {t(step.hintKey)}
                    </span>
                  </span>
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          {nextStep ? (
            <Link href={resolveHref(nextStep.href, progress.year)}>
              <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                {t('interview.continueNext')}
              </Button>
            </Link>
          ) : (
            <a
              href="https://www.elster.de/eportal/start"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button rightIcon={<ExternalLink className="h-4 w-4" />}>
                {t('interview.openMeinElster')}
              </Button>
            </a>
          )}
          <Button type="button" variant="outline" onClick={() => void load()}>
            {t('interview.refresh')}
          </Button>
          <Link
            href={`/steuererklaerung?year=${progress.year}`}
            className="inline-flex items-center text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {t('interview.openFullWizard')}
          </Link>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
