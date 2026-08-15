'use client';

/**
 * Clear UI: upload a prior ELSTER / Steuerbescheid PDF → Steuerprofil refresh,
 * then optionally re-run newer Belege on top. Hilfsmittel only — no auto-submit.
 */

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DragDrop } from '@/components/ui/drag-drop';
import { uploadLimits } from '@/lib/utils/upload-limits';
import { PROFILE_REFRESH_NOTICE_DE } from '@/lib/tax/prior-elster-extract';
import type { BatchAutofillResult } from '@/lib/tax/batch-autofill';
import { FileText, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = {
  /** Tax year for prior return tagging / batch ids context */
  year: number;
  /** Year whose newer Belege are re-applied after profile refresh (defaults to current calendar year) */
  belegeYear?: number;
  /** Called after profile fields may have changed (reload settings / preview). */
  onProfileUpdated?: () => void;
  compact?: boolean;
};

export function PriorElsterUploadPanel({
  year,
  belegeYear,
  onProfileUpdated,
  compact = false,
}: Props) {
  const overlayYear = belegeYear ?? new Date().getFullYear();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'upload' | 'extract' | 'done'>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldsUpdated, setFieldsUpdated] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<BatchAutofillResult | null>(null);

  const runBatch = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch('/api/elster/batch-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Verarbeitung fehlgeschlagen'
        );
      }
      return data as BatchAutofillResult;
    },
    []
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length || busy) return;
      setBusy(true);
      setNotice(null);
      setFieldsUpdated([]);
      setLastResult(null);
      setPhase('upload');

      try {
        const formData = new FormData();
        files.slice(0, 5).forEach((f) => formData.append('files', f));
        const up = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok) {
          throw new Error(
            typeof upData.error === 'string' ? upData.error : 'Upload fehlgeschlagen'
          );
        }
        const ids = ((upData.documents || []) as Array<{ id: string }>).map(
          (d) => d.id
        );
        if (!ids.length) {
          throw new Error('Keine Datei hochgeladen');
        }

        setPhase('extract');
        // Profile first from prior return; skip Beleg-Zeilen for this pass
        const result = await runBatch({
          year,
          mode: 'ids',
          documentIds: ids,
          reanalyze: true,
          applyProfileRefresh: true,
          applyTaxLines: false,
          applyCalculator: false,
          applyImmobilien: false,
          applyHausgeld: false,
        });
        setLastResult(result);

        const refreshed = Boolean(result.summary?.profileRefreshed);
        const noticeText =
          result.profileRefreshNotice ||
          (refreshed ? PROFILE_REFRESH_NOTICE_DE : null);
        setNotice(
          noticeText ||
            'Keine zuverlässigen Profilfelder erkannt — bitte manuell prüfen oder anderes PDF versuchen.'
        );
        setFieldsUpdated(result.profileFieldsUpdated || []);

        if (refreshed) {
          toast.success(PROFILE_REFRESH_NOTICE_DE);
          onProfileUpdated?.();
        } else {
          toast.error(
            'Erklärung hochgeladen — Profil kaum aktualisiert. Bitte prüfen oder anderes PDF versuchen.'
          );
        }
        setPhase('done');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
        setPhase('idle');
      } finally {
        setBusy(false);
      }
    },
    [busy, onProfileUpdated, runBatch, year]
  );

  const rerunBelege = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setPhase('extract');
    try {
      const result = await runBatch({
        year: overlayYear,
        mode: 'year',
        reanalyze: true,
        applyProfileRefresh: true,
        applyTaxLines: true,
        applyCalculator: true,
        applyImmobilien: true,
        applyHausgeld: true,
      });
      setLastResult(result);
      if (result.profileRefreshNotice) {
        setNotice(result.profileRefreshNotice);
      }
      toast.success(
        `Belege ${overlayYear} erneut angewendet: ${result.summary.ok} ok / ${result.summary.error} Fehler — bitte prüfen`
      );
      onProfileUpdated?.();
      setPhase('done');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Belege-Overlay fehlgeschlagen');
      setPhase('idle');
    } finally {
      setBusy(false);
    }
  }, [busy, onProfileUpdated, overlayYear, runBatch]);

  return (
    <div className="space-y-3 rounded-lg border border-teal-300 bg-teal-50/60 p-4 dark:border-teal-800 dark:bg-teal-950/25">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-300" />
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Frühere ELSTER-Erklärung / Steuerbescheid
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            PDF einer früheren Abgabe hochladen. TaxDoc übernimmt nur zuverlässig lesbare
            Felder ins Steuerprofil (Vorschlag). Hilfsmittel — bitte prüfen. Keine
            Steuerberatung, keine Auto-Abgabe.
          </p>
        </div>
      </div>

      {!compact && (
        <DragDrop
          onFilesSelected={handleFiles}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          maxSize={uploadLimits.maxFileSizeMB}
          inputId="prior-elster-upload"
          disabled={busy}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {compact && (
          <>
            <input
              id="prior-elster-upload-compact"
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              disabled={busy}
              onChange={(e) => {
                const list = e.target.files;
                if (!list?.length) return;
                void handleFiles(Array.from(list));
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={busy}
              leftIcon={
                busy && phase !== 'done' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )
              }
              onClick={() =>
                document.getElementById('prior-elster-upload-compact')?.click()
              }
            >
              Frühere Erklärung hochladen
            </Button>
          </>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          leftIcon={
            busy && phase === 'extract' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )
          }
          onClick={() => void rerunBelege()}
        >
          Neuere Belege {overlayYear} erneut anwenden
        </Button>
        <Link
          href={`/steuererklaerung?year=${overlayYear}&step=documents`}
          className="inline-flex items-center text-sm text-teal-800 underline dark:text-teal-200"
        >
          Zu Belegen / Batch
        </Link>
      </div>

      {busy && phase !== 'done' && (
        <p className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          {phase === 'upload'
            ? 'Upload …'
            : 'Profil aus Erklärung extrahieren …'}
        </p>
      )}

      {notice && (
        <div className="rounded border border-teal-400 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-950 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-100">
          {notice}
          {fieldsUpdated.length > 0 && (
            <p className="mt-1 text-xs font-normal opacity-90">
              Felder: {fieldsUpdated.join(', ')}
            </p>
          )}
        </div>
      )}

      {lastResult?.summary?.profileRefreshed && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Tipp: Danach „Neuere Belege erneut anwenden“, damit aktuelle Belege das Profil
          und die ELSTER-Vorbereitung darüberlegen. Unverbindlich — bitte prüfen.
        </p>
      )}
    </div>
  );
}
