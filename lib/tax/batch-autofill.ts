/**
 * Batch: re-analyze docs → map to ELSTER prep / Immobilien / Hausgeld /
 * Steuerprofil-Refresh / optional Steuerrechner.
 * Per-file errors never abort the whole batch.
 */

import { analyzeAndUpdateDocument } from '@/lib/documents/analyze-and-update';
import { db } from '@/lib/db/client';
import {
  BATCH_AUTOFILL_DISCLAIMER_DE,
  confidenceLevelFromScore,
  mapBelegToElster,
  extractEuroAmountHint,
  type BelegElsterMapping,
} from '@/lib/tax/beleg-to-elster';
import { loadElsterPreviewForUser } from '@/lib/tax/elster-data';
import {
  serializeDocumentIds,
  parseDocumentIdList,
  type ElsterConfidence,
  type ElsterPreviewResult,
} from '@/lib/tax/elster-preview';
import { normalizeDeBelegCategory } from '@/lib/ai/beleg-sort';
import {
  applyPriorElsterProfileRefresh,
  applyMietvertragProperty,
  applyHausgeldToRental,
  applyCalculatorFromBelege,
} from '@/lib/tax/autofill-apply';
import type { CalculatorAutofillDraft } from '@/lib/tax/beleg-to-calculator';
import { PROFILE_REFRESH_NOTICE_DE } from '@/lib/tax/prior-elster-extract';
import { uploadLimits } from '@/lib/utils/upload-limits';

export type BatchFileStatus = 'ok' | 'error' | 'skipped';

export interface BatchAutofillFileResult {
  documentId: string;
  fileName: string;
  status: BatchFileStatus;
  category?: string | null;
  storageCategory?: string;
  taxAmount?: number | null;
  aiConfidence?: number | null;
  confidenceLevel?: ElsterConfidence;
  elsterAnlage?: string;
  elsterFieldKey?: string;
  elsterFieldLabelDe?: string;
  taxLineId?: string | null;
  needsReview?: boolean;
  error?: string;
  messageDe?: string;
  extras?: string[];
}

export interface BatchAutofillResult {
  year: number;
  disclaimerDe: string;
  profileRefreshNotice?: string | null;
  /** Steuerprofil fields touched by prior-ELSTER extract (for UI) */
  profileFieldsUpdated?: string[];
  calculatorDraft?: CalculatorAutofillDraft | null;
  summary: {
    total: number;
    ok: number;
    error: number;
    skipped: number;
    taxLinesCreated: number;
    fieldsSuggested: number;
    needsReviewCount: number;
    propertiesUpserted: number;
    hausgeldApplied: number;
    profileRefreshed: boolean;
    calculatorApplied: boolean;
  };
  results: BatchAutofillFileResult[];
  preview: ElsterPreviewResult | null;
}

function isUnsortedDoc(doc: {
  categoryId: string | null;
  aiConfidence: number | null;
  category?: { name: string } | null;
}): boolean {
  if (!doc.categoryId || !doc.category?.name) return true;
  const name = doc.category.name.toLowerCase();
  if (name === 'sonstiges' || name === 'other' || name === 'uncategorized') {
    return true;
  }
  if (doc.aiConfidence != null && doc.aiConfidence < 0.45) return true;
  return false;
}

type TaxLineCacheRow = {
  id: string;
  documentIds: string | null;
  category: string;
  amount: number;
  notes: string | null;
};

async function ensureTaxLineForDoc(opts: {
  userId: string;
  year: number;
  documentId: string;
  fileName: string;
  amount: number;
  mapping: BelegElsterMapping;
  confidence: number | null;
  /** Shared per-batch cache — avoids N findMany calls on Starter RAM. */
  existingLines: TaxLineCacheRow[];
}): Promise<{ id: string; created: boolean } | null> {
  const { mapping, existingLines } = opts;
  if (!mapping.taxLineCategory || !mapping.taxLineKind) return null;
  if (!(opts.amount > 0)) return null;

  for (const line of existingLines) {
    const ids = parseDocumentIdList(line.documentIds);
    if (ids.includes(opts.documentId)) {
      return { id: line.id, created: false };
    }
  }

  const dup = existingLines.find(
    (l) =>
      l.category === mapping.taxLineCategory &&
      Math.abs(l.amount - opts.amount) < 0.01
  );
  if (dup) {
    const ids = parseDocumentIdList(dup.documentIds);
    if (!ids.includes(opts.documentId)) {
      const nextIds = [...ids, opts.documentId];
      await db.taxLineEntry.update({
        where: { id: dup.id },
        data: {
          documentIds: serializeDocumentIds(nextIds),
          needsReview: true,
          notes:
            dup.notes ||
            'KI-Vorschlag verknüpft — bitte prüfen. Keine Auto-Abgabe.',
        },
      });
      dup.documentIds = serializeDocumentIds(nextIds);
    }
    return { id: dup.id, created: false };
  }

  const confLabel =
    opts.confidence != null
      ? `Konfidenz ${(opts.confidence * 100).toFixed(0)}%`
      : 'Konfidenz unbekannt';

  const created = await db.taxLineEntry.create({
    data: {
      userId: opts.userId,
      year: opts.year,
      kind: mapping.taxLineKind,
      category: mapping.taxLineCategory,
      label: `${mapping.fieldLabelDe} — ${opts.fileName}`.slice(0, 200),
      amount: opts.amount,
      notes: `KI-Vorschlag / unverbindlich — ${confLabel}. Bitte prüfen. Keine Auto-Abgabe.`,
      documentIds: serializeDocumentIds([opts.documentId]),
      needsReview: true,
    },
  });
  existingLines.push({
    id: created.id,
    documentIds: serializeDocumentIds([opts.documentId]),
    category: mapping.taxLineCategory,
    amount: opts.amount,
    notes: created.notes,
  });
  return { id: created.id, created: true };
}

export async function runBatchAutofill(opts: {
  userId: string;
  year: number;
  mode: 'unsorted' | 'year' | 'ids';
  documentIds?: string[];
  reanalyze?: boolean;
  applyTaxLines?: boolean;
  applyCalculator?: boolean;
  applyProfileRefresh?: boolean;
  applyImmobilien?: boolean;
  applyHausgeld?: boolean;
}): Promise<BatchAutofillResult> {
  const {
    userId,
    year,
    mode,
    documentIds,
    reanalyze = true,
    applyTaxLines = true,
    applyCalculator = true,
    applyProfileRefresh = true,
    applyImmobilien = true,
    applyHausgeld = true,
  } = opts;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { country: true, language: true },
  });
  const country = user?.country || 'DE';
  const language = user?.language || 'de';

  let candidates = await db.document.findMany({
    where: {
      userId,
      ...(mode === 'ids' && documentIds?.length
        ? { id: { in: documentIds } }
        : { year }),
    },
    select: {
      id: true,
      userId: true,
      name: true,
      originalName: true,
      mimeType: true,
      fileUrl: true,
      // Do not preload extractedText for the whole batch — fetch per doc below.
      taxAmount: true,
      taxCategory: true,
      aiConfidence: true,
      categoryId: true,
      year: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (mode === 'unsorted') {
    candidates = candidates.filter(isUnsortedDoc);
  }

  // Hard cap per request — large year/unsorted runs must be chunked by the client.
  const capped = candidates.length > uploadLimits.batchAutofillRequestMax;
  if (capped) {
    candidates = candidates.slice(0, uploadLimits.batchAutofillRequestMax);
  }

  // Process prior ELSTER / Steuerdokumente first so newer Belege layer on top.
  // Filename heuristics only — avoids loading every extractedText for sort.
  candidates = [...candidates].sort((a, b) => {
    const score = (d: typeof a) => {
      const n = `${d.originalName} ${d.name}`.toLowerCase();
      if (/elster|steuerbescheid|einkommensteuererklärung|einkommensteuererklaerung/.test(n))
        return 0;
      if (/mietvertrag/.test(n)) return 1;
      if (/hausgeld|nebenkosten/.test(n)) return 2;
      return 3;
    };
    return score(a) - score(b);
  });

  const existingTaxLines: TaxLineCacheRow[] = await db.taxLineEntry.findMany({
    where: { userId, year },
    select: { id: true, documentIds: true, category: true, amount: true, notes: true },
  });

  const results: BatchAutofillFileResult[] = [];
  let taxLinesCreated = 0;
  let propertiesUpserted = 0;
  let hausgeldApplied = 0;
  let profileRefreshed = false;
  let employmentIncomeHint: number | null = null;
  let taxWithheldHint: number | null = null;
  let profileRefreshNotice: string | null = null;
  const profileFieldsUpdated: string[] = [];

  if (capped) {
    results.push({
      documentId: '',
      fileName: '—',
      status: 'skipped',
      messageDe: `Batch begrenzt auf ${uploadLimits.batchAutofillRequestMax} Dateien pro Anfrage (Speicher). Bitte erneut starten für den Rest.`,
    });
  }

  // Strictly sequential — concurrency 1 keeps peak RAM to one PDF/AI pass.
  for (const doc of candidates) {
    try {
      let current: typeof doc & { extractedText?: string | null } = doc;
      let content: string | undefined;

      if (reanalyze) {
        try {
          const textRow = await db.document.findUnique({
            where: { id: doc.id },
            select: { extractedText: true },
          });
          await analyzeAndUpdateDocument(
            {
              id: doc.id,
              userId: doc.userId,
              name: doc.name,
              originalName: doc.originalName,
              mimeType: doc.mimeType,
              fileUrl: doc.fileUrl,
              extractedText: textRow?.extractedText ?? null,
            },
            country,
            language
          );
          const reloaded = await db.document.findUnique({
            where: { id: doc.id },
            select: {
              id: true,
              userId: true,
              name: true,
              originalName: true,
              mimeType: true,
              fileUrl: true,
              extractedText: true,
              taxAmount: true,
              taxCategory: true,
              aiConfidence: true,
              categoryId: true,
              year: true,
              category: { select: { id: true, name: true } },
            },
          });
          if (reloaded) {
            content = reloaded.extractedText || undefined;
            current = {
              id: reloaded.id,
              userId: reloaded.userId,
              name: reloaded.name,
              originalName: reloaded.originalName,
              mimeType: reloaded.mimeType,
              fileUrl: reloaded.fileUrl,
              taxAmount: reloaded.taxAmount,
              taxCategory: reloaded.taxCategory,
              aiConfidence: reloaded.aiConfidence,
              categoryId: reloaded.categoryId,
              year: reloaded.year,
              category: reloaded.category,
            };
          }
        } catch (analyzeErr) {
          results.push({
            documentId: doc.id,
            fileName: doc.name,
            status: 'error',
            error:
              analyzeErr instanceof Error
                ? analyzeErr.message
                : 'Analyse fehlgeschlagen',
            messageDe:
              'Analyse fehlgeschlagen — Datei übersprungen, Batch läuft weiter.',
          });
          continue;
        }
      } else {
        const textRow = await db.document.findUnique({
          where: { id: doc.id },
          select: { extractedText: true },
        });
        content = textRow?.extractedText || undefined;
      }

      const extras: string[] = [];
      const fileName = current.originalName || current.name;

      if (applyProfileRefresh) {
        const profileResult = await applyPriorElsterProfileRefresh({
          userId,
          fileName,
          content,
          documentId: current.id,
        });
        if (profileResult.applied) {
          profileRefreshed = true;
          profileRefreshNotice = profileResult.notice || PROFILE_REFRESH_NOTICE_DE;
          extras.push('Profil-Refresh');
          for (const f of profileResult.fieldsUpdated) {
            if (!profileFieldsUpdated.includes(f)) profileFieldsUpdated.push(f);
          }
          if (profileResult.employmentIncomeHint) {
            employmentIncomeHint = profileResult.employmentIncomeHint;
          }
          if (profileResult.taxWithheldHint) {
            taxWithheldHint = profileResult.taxWithheldHint;
          }
        }
      }

      if (applyImmobilien) {
        const miet = await applyMietvertragProperty({
          userId,
          year: current.year || year,
          documentId: current.id,
          fileName,
          content,
        });
        if (miet.applied) {
          propertiesUpserted += 1;
          extras.push('Immobilie');
        } else if (miet.roleHint === 'mieter') {
          extras.push('Mietvertrag (Mieter)');
        }
      }

      if (applyHausgeld) {
        const hg = await applyHausgeldToRental({
          userId,
          year: current.year || year,
          documentId: current.id,
          fileName,
          content,
        });
        if (hg.applied) {
          hausgeldApplied += 1;
          extras.push('Hausgeld/V&V');
        }
      }

      const categoryName =
        current.category?.name ||
        normalizeDeBelegCategory(current.taxCategory || current.name);

      const mapping = mapBelegToElster(categoryName, {
        fileName,
        content,
      });

      let taxAmount = current.taxAmount;
      if (taxAmount == null || taxAmount <= 0) {
        const hint = extractEuroAmountHint(fileName, content);
        if (hint != null) {
          taxAmount = hint;
          await db.document.update({
            where: { id: current.id },
            data: { taxAmount: hint },
          });
        }
      }

      let resolvedCategoryName = current.category?.name || mapping.storageCategory;
      if (
        !current.categoryId ||
        isUnsortedDoc(current) ||
        current.category?.name !== mapping.storageCategory
      ) {
        const { findOrCreateCategory, ensureDefaultCategories } = await import(
          '@/lib/tax/default-categories'
        );
        await ensureDefaultCategories(db, country);
        const categoryId = await findOrCreateCategory(
          db,
          mapping.storageCategory,
          country
        );
        await db.document.update({
          where: { id: current.id },
          data: {
            categoryId,
            taxCategory: current.taxCategory || mapping.taxLineCategory,
            isTaxRelevant: true,
          },
        });
        resolvedCategoryName = mapping.storageCategory;
      }

      const hasAmount = typeof taxAmount === 'number' && taxAmount > 0;
      const confidenceLevel = confidenceLevelFromScore(
        current.aiConfidence,
        hasAmount,
        mapping
      );

      let taxLineId: string | null = null;
      if (applyTaxLines && hasAmount && mapping.taxLineCategory) {
        const lineResult = await ensureTaxLineForDoc({
          userId,
          year: current.year || year,
          documentId: current.id,
          fileName: current.name,
          amount: taxAmount!,
          mapping,
          confidence: current.aiConfidence,
          existingLines: existingTaxLines,
        });
        if (lineResult) {
          taxLineId = lineResult.id;
          if (lineResult.created) taxLinesCreated += 1;
        }
      }

      results.push({
        documentId: current.id,
        fileName: current.name,
        status: 'ok',
        category: resolvedCategoryName,
        storageCategory: mapping.storageCategory,
        taxAmount: taxAmount ?? null,
        aiConfidence: current.aiConfidence,
        confidenceLevel,
        elsterAnlage: mapping.anlage,
        elsterFieldKey: mapping.fieldKey,
        elsterFieldLabelDe: mapping.fieldLabelDe,
        taxLineId,
        needsReview: mapping.needsReviewAlways || confidenceLevel !== 'high',
        messageDe: hasAmount
          ? `KI-Vorschlag: ${mapping.fieldLabelDe} — bitte prüfen`
          : extras.length
            ? extras.join(' · ')
            : `Kategorie gesetzt (${mapping.storageCategory}), Betrag fehlt — bitte ergänzen`,
        extras,
      });
      // Drop per-doc text before next iteration (GC-friendly on Starter).
      content = undefined;
    } catch (err) {
      results.push({
        documentId: doc.id,
        fileName: doc.name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unbekannter Fehler',
        messageDe: 'Datei fehlgeschlagen — restlicher Batch läuft weiter.',
      });
    }
  }

  if (candidates.length === 0) {
    results.push({
      documentId: '',
      fileName: '—',
      status: 'skipped',
      messageDe:
        mode === 'unsorted'
          ? 'Keine unsortierten Dokumente für dieses Jahr gefunden.'
          : 'Keine Dokumente für dieses Jahr gefunden.',
    });
  }

  // After prior ELSTER + all Belege: refresh calculator from aggregated lines
  let calculatorDraft: CalculatorAutofillDraft | null = null;
  let calculatorApplied = false;
  if (applyCalculator && (results.some((r) => r.status === 'ok') || profileRefreshed)) {
    try {
      calculatorDraft = await applyCalculatorFromBelege({
        userId,
        year,
        employmentIncomeHint,
        taxWithheldHint,
        persist: true,
      });
      calculatorApplied = true;
    } catch (calcErr) {
      console.error('Calculator autofill after batch failed:', calcErr);
    }
  }

  if (profileRefreshed && !profileRefreshNotice) {
    profileRefreshNotice = PROFILE_REFRESH_NOTICE_DE;
  }

  const preview = await loadElsterPreviewForUser(userId, year);
  const ok = results.filter((r) => r.status === 'ok').length;
  const error = results.filter((r) => r.status === 'error').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  return {
    year,
    disclaimerDe: BATCH_AUTOFILL_DISCLAIMER_DE,
    profileRefreshNotice,
    profileFieldsUpdated,
    calculatorDraft,
    summary: {
      total: results.filter((r) => r.documentId).length || results.length,
      ok,
      error,
      skipped,
      taxLinesCreated,
      fieldsSuggested:
        preview?.fields.filter(
          (f) => f.source === 'dokumente' || f.source === 'manuell'
        ).length ?? 0,
      needsReviewCount: preview?.validation.reviewCount ?? 0,
      propertiesUpserted,
      hausgeldApplied,
      profileRefreshed,
      calculatorApplied,
    },
    results,
    preview,
  };
}
