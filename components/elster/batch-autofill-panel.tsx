'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DragDrop } from '@/components/ui/drag-drop';
import { uploadLimits } from '@/lib/utils/upload-limits';
import type {
  BatchAutofillFileResult,
  BatchAutofillResult,
} from '@/lib/tax/batch-autofill';
import type { ElsterPreviewResult } from '@/lib/tax/elster-preview';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Upload,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CHUNK_SIZE = uploadLimits.uploadChunkSize;

type UploadProgress = {
  done: number;
  total: number;
  phase: 'idle' | 'upload' | 'autofill' | 'done';
};

type Props = {
  year: number;
  onApplied?: (preview: ElsterPreviewResult | null) => void;
  compact?: boolean;
};

function mergeBatchResults(
  prev: BatchAutofillResult | null,
  next: BatchAutofillResult
): BatchAutofillResult {
  if (!prev) return next;
  const prevRows = prev.results.filter((r) => r.documentId);
  const nextRows = next.results.filter(
    (r) => r.documentId || (r.status === 'skipped' && prevRows.length === 0)
  );
  return {
    ...next,
    profileRefreshNotice: next.profileRefreshNotice || prev.profileRefreshNotice,
    profileFieldsUpdated: [
      ...new Set([...(prev.profileFieldsUpdated || []), ...(next.profileFieldsUpdated || [])]),
    ],
    calculatorDraft: next.calculatorDraft || prev.calculatorDraft,
    results: [...prevRows, ...nextRows],
    summary: {
      total: prev.summary.total + next.summary.total,
      ok: prev.summary.ok + next.summary.ok,
      error: prev.summary.error + next.summary.error,
      skipped: prev.summary.skipped + next.summary.skipped,
      taxLinesCreated: prev.summary.taxLinesCreated + next.summary.taxLinesCreated,
      fieldsSuggested: next.summary.fieldsSuggested,
      needsReviewCount: next.summary.needsReviewCount,
      propertiesUpserted:
        prev.summary.propertiesUpserted + next.summary.propertiesUpserted,
      hausgeldApplied: prev.summary.hausgeldApplied + next.summary.hausgeldApplied,
      profileRefreshed: prev.summary.profileRefreshed || next.summary.profileRefreshed,
      calculatorApplied:
        prev.summary.calculatorApplied || next.summary.calculatorApplied,
    },
    preview: next.preview || prev.preview,
  };
}

function statusIcon(status: BatchAutofillFileResult['status']) {
  if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === 'error') return <XCircle className="h-4 w-4 text-red-600" />;
  return <AlertTriangle className="h-4 w-4 text-amber-600" />;
}

function confidenceBadge(level?: string) {
  if (!level) return null;
  const cls =
    level === 'high'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
      : level === 'medium'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
  const label =
    level === 'high' ? 'hoch' : level === 'medium' ? 'mittel' : level === 'low' ? 'niedrig' : level;
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${cls}`}>Konfidenz: {label}</span>
  );
}

export function BatchAutofillPanel({ year, onApplied, compact }: Props) {
  const [progress, setProgress] = useState<UploadProgress>({
    done: 0,
    total: 0,
    phase: 'idle',
  });
  const [batchResult, setBatchResult] = useState<BatchAutofillResult | null>(null);
  const [busy, setBusy] = useState(false);

  const runAutofill = useCallback(
    async (
      mode: 'unsorted' | 'year' | 'ids',
      documentIds?: string[],
      opts?: { applyCalculator?: boolean }
    ) => {
      const res = await fetch('/api/elster/batch-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          mode: documentIds?.length ? 'ids' : mode,
          documentIds,
          reanalyze: true,
          applyTaxLines: true,
          applyCalculator: opts?.applyCalculator ?? true,
          applyProfileRefresh: true,
          applyImmobilien: true,
          applyHausgeld: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Batch-Autofill fehlgeschlagen'
        );
      }
      return data as BatchAutofillResult & { ok?: boolean };
    },
    [year]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || busy) return;
      // Keine künstliche Obergrenze — Upload + Autofill laufen in Paketen.
      const list = files;
      setBusy(true);
      setBatchResult(null);
      setProgress({ done: 0, total: list.length, phase: 'upload' });

      try {
        const skipped: string[] = [];
        const allUploadedIds: string[] = [];
        let merged: BatchAutofillResult | null = null;

        for (let i = 0; i < list.length; i += CHUNK_SIZE) {
          const chunk = list.slice(i, i + CHUNK_SIZE);
          setProgress({
            done: Math.min(i, list.length),
            total: list.length,
            phase: 'upload',
          });

          const formData = new FormData();
          chunk.forEach((f) => formData.append('files', f));
          const res = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json().catch(() => ({}));
          let chunkIds: string[] = [];
          if (!res.ok) {
            skipped.push(
              ...chunk.map(
                (f) =>
                  `${f.name} (${typeof data.error === 'string' ? data.error : 'Upload fehlgeschlagen'})`
              )
            );
          } else {
            const docs = (data.documents || []) as Array<{ id: string }>;
            chunkIds = docs.map((d) => d.id);
            allUploadedIds.push(...chunkIds);
            if (Array.isArray(data.skippedFiles)) {
              skipped.push(...data.skippedFiles);
            }
          }

          setProgress({
            done: Math.min(i + chunk.length, list.length),
            total: list.length,
            phase: chunkIds.length ? 'autofill' : 'upload',
          });

          if (chunkIds.length) {
            const isLastPacket = i + CHUNK_SIZE >= list.length;
            const part = await runAutofill('ids', chunkIds, {
              applyCalculator: isLastPacket,
            });
            merged = mergeBatchResults(merged, part);
            setBatchResult(merged);
          }
        }

        if (skipped.length) {
          toast.error(`${skipped.length} Datei(en) übersprungen`);
        }
        if (allUploadedIds.length === 0) {
          toast.error('Keine Dateien hochgeladen');
          setProgress({ done: 0, total: 0, phase: 'idle' });
          return;
        }

        // Wenn das letzte Upload-Paket leer war: Calculator einmal am Ende nachziehen
        if (merged && !merged.summary.calculatorApplied && allUploadedIds.length > 0) {
          const calcRes = await fetch('/api/tax/autofill-from-belege', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year, runBatchFirst: false, persist: true }),
          });
          const calcData = await calcRes.json().catch(() => ({}));
          if (calcRes.ok && calcData?.draft) {
            merged = {
              ...merged,
              calculatorDraft: calcData.draft,
              summary: { ...merged.summary, calculatorApplied: true },
            };
          }
        }

        if (!merged) {
          toast.error('Batch-Autofill ohne Ergebnis');
          setProgress({ done: 0, total: 0, phase: 'idle' });
          return;
        }

        setBatchResult(merged);
        onApplied?.(merged.preview);
        toast.success(
          `KI-Vorschlag angewendet: ${merged.summary.ok} ok, ${merged.summary.error} Fehler — bitte prüfen`
        );
        setProgress({
          done: list.length,
          total: list.length,
          phase: 'done',
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Batch fehlgeschlagen');
        setProgress({ done: 0, total: 0, phase: 'idle' });
      } finally {
        setBusy(false);
      }
    },
    [busy, onApplied, runAutofill, year]
  );

  const handleProcessUnsorted = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setBatchResult(null);
    setProgress({ done: 0, total: 0, phase: 'autofill' });
    try {
      const listRes = await fetch(`/api/documents?year=${year}`);
      const listData = await listRes.json().catch(() => ({}));
      if (!listRes.ok) {
        throw new Error(
          typeof listData.error === 'string' ? listData.error : 'Dokumente laden fehlgeschlagen'
        );
      }
      const docs = (listData.documents || []) as Array<{
        id: string;
        categoryId?: string | null;
        category?: { name?: string } | null;
        aiConfidence?: number | null;
      }>;
      const unsortedIds = docs
        .filter((d) => {
          if (!d.categoryId || !d.category?.name) return true;
          const name = d.category.name.toLowerCase();
          if (name === 'sonstiges' || name === 'other' || name === 'uncategorized') {
            return true;
          }
          if (d.aiConfidence != null && d.aiConfidence < 0.45) return true;
          return false;
        })
        .map((d) => d.id);

      if (unsortedIds.length === 0) {
        toast.success('Keine unsortierten Belege — nichts zu tun');
        setProgress({ done: 0, total: 0, phase: 'idle' });
        return;
      }

      setProgress({ done: 0, total: unsortedIds.length, phase: 'autofill' });
      let merged: BatchAutofillResult | null = null;
      for (let i = 0; i < unsortedIds.length; i += CHUNK_SIZE) {
        const chunk = unsortedIds.slice(i, i + CHUNK_SIZE);
        const isLast = i + CHUNK_SIZE >= unsortedIds.length;
        const result = await runAutofill('ids', chunk, { applyCalculator: isLast });
        merged = mergeBatchResults(merged, result);
        setProgress({
          done: Math.min(i + chunk.length, unsortedIds.length),
          total: unsortedIds.length,
          phase: 'autofill',
        });
      }

      if (!merged) {
        toast.error('Batch-Autofill ohne Ergebnis');
        setProgress({ done: 0, total: 0, phase: 'idle' });
        return;
      }

      setBatchResult(merged);
      onApplied?.(merged.preview);
      toast.success(
        `Unsortierte Belege verarbeitet: ${merged.summary.ok} ok / ${merged.summary.error} Fehler`
      );
      setProgress({
        done: unsortedIds.length,
        total: unsortedIds.length,
        phase: 'done',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verarbeitung fehlgeschlagen');
      setProgress({ done: 0, total: 0, phase: 'idle' });
    } finally {
      setBusy(false);
    }
  }, [busy, onApplied, runAutofill, year]);

  const handleProcessYear = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setBatchResult(null);
    setProgress({ done: 0, total: 0, phase: 'autofill' });
    try {
      const listRes = await fetch(`/api/documents?year=${year}`);
      const listData = await listRes.json().catch(() => ({}));
      if (!listRes.ok) {
        throw new Error(
          typeof listData.error === 'string' ? listData.error : 'Dokumente laden fehlgeschlagen'
        );
      }
      const ids = ((listData.documents || []) as Array<{ id: string }>).map((d) => d.id);

      if (ids.length === 0) {
        toast.success(`Keine Dokumente für ${year}`);
        setProgress({ done: 0, total: 0, phase: 'idle' });
        return;
      }

      setProgress({ done: 0, total: ids.length, phase: 'autofill' });
      let merged: BatchAutofillResult | null = null;
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const isLast = i + CHUNK_SIZE >= ids.length;
        const result = await runAutofill('ids', chunk, { applyCalculator: isLast });
        merged = mergeBatchResults(merged, result);
        setProgress({
          done: Math.min(i + chunk.length, ids.length),
          total: ids.length,
          phase: 'autofill',
        });
      }

      if (!merged) {
        toast.error('Batch-Autofill ohne Ergebnis');
        setProgress({ done: 0, total: 0, phase: 'idle' });
        return;
      }

      setBatchResult(merged);
      onApplied?.(merged.preview);
      toast.success(
        `Jahr ${year}: ${merged.summary.ok} ok / ${merged.summary.error} Fehler — bitte prüfen`
      );
      setProgress({ done: ids.length, total: ids.length, phase: 'done' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verarbeitung fehlgeschlagen');
      setProgress({ done: 0, total: 0, phase: 'idle' });
    } finally {
      setBusy(false);
    }
  }, [busy, onApplied, runAutofill, year]);

  return (
    <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Batch-Upload → ELSTER-Vorbereitung & Steuerrechner
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Keine künstliche Obergrenze — Verarbeitung in Paketen à {CHUNK_SIZE}.
          Frühere ELSTER-Erklärung / Steuerbescheid zuerst → Steuerprofil, danach
          neuere Belege darüber. KI-Vorschlag / unverbindlich — bitte prüfen. Keine
          Auto-Abgabe an Mein ELSTER.
        </p>
      </div>

      {!compact && (
        <DragDrop
          onFilesSelected={handleFiles}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          maxSize={uploadLimits.maxFileSizeMB}
          inputId="elster-batch-upload"
          disabled={busy}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {compact && (
          <Button
            type="button"
            size="sm"
            leftIcon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            disabled={busy}
            onClick={() => document.getElementById('elster-batch-upload-compact')?.click()}
          >
            Belege hochladen (Batch)
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          leftIcon={
            busy && progress.phase === 'autofill' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )
          }
          disabled={busy}
          onClick={handleProcessUnsorted}
        >
          Alle unsortierten verarbeiten
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={handleProcessYear}
        >
          Alle Belege {year} neu zuordnen
        </Button>
        {batchResult?.preview && (
          <Link
            href={`/steuererklaerung?year=${year}&step=preview`}
            className="inline-flex items-center text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ELSTER-Formularvorschau
          </Link>
        )}
        {(batchResult?.summary.calculatorApplied || batchResult?.calculatorDraft) && (
          <Link
            href={`/calculator?year=${year}&autofill=1`}
            className="inline-flex items-center text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Steuerrechner öffnen (aus Belegen)
          </Link>
        )}
      </div>

      {compact && (
        <input
          id="elster-batch-upload-compact"
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          disabled={busy}
          onChange={(e) => {
            const list = e.target.files;
            if (!list?.length) return;
            void handleFiles(Array.from(list));
            e.target.value = '';
          }}
        />
      )}

      {progress.phase !== 'idle' && progress.phase !== 'done' && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {progress.phase === 'upload' && (
            <p>
              Upload: {progress.done}/{progress.total} (Pakete à {CHUNK_SIZE}) …
            </p>
          )}
          {progress.phase === 'autofill' && (
            <p className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              KI sortiert, aktualisiert Profil/Immobilien und trägt Vorschläge ein …
            </p>
          )}
          {progress.total > 0 && progress.phase === 'upload' && (
            <div className="mt-2 h-2 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{
                  width: `${Math.round((progress.done / progress.total) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {batchResult && (
        <div className="space-y-3">
          {batchResult.profileRefreshNotice && (
            <div className="rounded border border-teal-400 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-950 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-100">
              {batchResult.profileRefreshNotice}
            </div>
          )}
          <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            {batchResult.disclaimerDe}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Ergebnis: {batchResult.summary.ok} ok · {batchResult.summary.error} Fehler ·{' '}
            {batchResult.summary.taxLinesCreated} Steuerzeilen ·{' '}
            {batchResult.summary.propertiesUpserted} Immobilien ·{' '}
            {batchResult.summary.hausgeldApplied} Hausgeld ·{' '}
            {batchResult.summary.calculatorApplied ? 'Steuerrechner aktualisiert · ' : ''}
            {batchResult.summary.needsReviewCount} mit „prüfen“
          </p>
          {batchResult.calculatorDraft && (
            <div className="rounded border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-950 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
              <div className="flex flex-wrap items-center gap-2 font-medium">
                Steuerrechner-Draft
                {confidenceBadge(batchResult.calculatorDraft.confidenceLabel)}
                {batchResult.calculatorDraft.needsReview && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                    prüfen
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs opacity-90">
                {batchResult.calculatorDraft.sourceSummaryDe}
              </p>
              <p className="mt-1 text-xs opacity-80">
                {batchResult.calculatorDraft.disclaimerDe}
              </p>
            </div>
          )}
          <ul className="max-h-56 space-y-1 overflow-y-auto text-sm">
            {batchResult.results
              .filter((r) => r.documentId || r.status === 'skipped')
              .map((r, idx) => (
                <li
                  key={`${r.documentId}-${idx}`}
                  className="flex flex-wrap items-start gap-2 rounded border border-gray-100 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900"
                >
                  {statusIcon(r.status)}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.fileName}</div>
                    <div className="text-xs text-gray-500">
                      {r.messageDe || r.error}
                      {r.elsterFieldLabelDe ? ` · ${r.elsterFieldLabelDe}` : ''}
                      {r.taxAmount != null
                        ? ` · ${r.taxAmount.toLocaleString('de-DE')} €`
                        : ''}
                    </div>
                  </div>
                  {confidenceBadge(r.confidenceLevel)}
                  {r.needsReview && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                      prüfen
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
