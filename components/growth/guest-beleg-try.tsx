'use client';

import { useCallback, useEffect, useState } from 'react';
import { FilePlus2, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SaveResultsCta } from '@/components/growth/save-results-cta';
import { useI18n } from '@/lib/i18n/provider';

const STORAGE_KEY = 'taxdoc.guestBelege';

interface GuestSortResult {
  id: string;
  name: string;
  size: number;
  addedAt: string;
  category?: string;
  categoryLabelDe?: string;
  confidence?: number;
  method?: string;
  isTaxRelevant?: boolean;
  year?: number;
  suggestions?: string[];
  claimDe?: string;
  error?: string;
  sorting?: boolean;
}

/**
 * Guest Beleg try: upload → real KI/rules Sortierhilfe → then suggest free account to save.
 */
export function GuestBelegTry() {
  const { t } = useI18n();
  const [files, setFiles] = useState<GuestSortResult[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GuestSortResult[];
        setFiles(parsed.map((f) => ({ ...f, sorting: false })));
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((next: GuestSortResult[]) => {
    setFiles(next);
    try {
      const toStore = next.map(({ sorting: _s, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // ignore quota
    }
  }, []);

  const classifyOne = async (file: File, id: string) => {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/guest/classify', {
      method: 'POST',
      body: form,
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      return {
        error: typeof data.error === 'string' ? data.error : t('guestBeleg.sortFailed'),
      };
    }

    return {
      category: String(data.category || ''),
      categoryLabelDe: String(data.categoryLabelDe || data.category || ''),
      confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
      method: typeof data.method === 'string' ? data.method : undefined,
      isTaxRelevant: Boolean(data.isTaxRelevant),
      year: typeof data.year === 'number' ? data.year : undefined,
      suggestions: Array.isArray(data.suggestions)
        ? (data.suggestions as string[])
        : [],
      claimDe: typeof data.claimDe === 'string' ? data.claimDe : undefined,
    };
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;

    const picked = Array.from(list).slice(0, 5);
    setBusy(true);

    for (const file of picked) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const placeholder: GuestSortResult = {
        id,
        name: file.name,
        size: file.size,
        addedAt: new Date().toISOString(),
        sorting: true,
      };

      setFiles((prev) => {
        const next = [placeholder, ...prev].slice(0, 20);
        return next;
      });

      try {
        const result = await classifyOne(file, id);
        setFiles((prev) => {
          const next = prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  sorting: false,
                  ...result,
                }
              : f
          );
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(next.map(({ sorting: _s, ...rest }) => rest))
            );
          } catch {
            // ignore
          }
          return next;
        });
      } catch {
        setFiles((prev) => {
          const next = prev.map((f) =>
            f.id === id
              ? { ...f, sorting: false, error: t('guestBeleg.sortFailed') }
              : f
          );
          return next;
        });
      }
    }

    setBusy(false);
    e.target.value = '';
  };

  const remove = (id: string) => {
    persist(files.filter((f) => f.id !== id));
  };

  const sortedOk = files.filter((f) => f.category && !f.error && !f.sorting);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Sparkles className="h-5 w-5 text-blue-600" />
          {t('guestBeleg.title')}
        </h2>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{t('guestBeleg.body')}</p>
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 px-4 py-3 text-sm font-medium text-blue-800 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-200 ${
            busy ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FilePlus2 className="h-4 w-4" />
          )}
          {busy ? t('guestBeleg.sorting') : t('guestBeleg.pick')}
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            disabled={busy}
            onChange={onPick}
          />
        </label>
        <p className="mt-2 text-xs text-gray-500">{t('guestBeleg.truthClaim')}</p>

        {files.length > 0 && (
          <ul className="mt-4 space-y-3">
            {files.map((f) => (
              <li
                key={f.id}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-sm dark:border-gray-700 dark:bg-gray-900/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800 dark:text-gray-200">
                      {f.name}{' '}
                      <span className="text-xs font-normal text-gray-500">
                        ({Math.round(f.size / 1024)} KB)
                      </span>
                    </p>
                    {f.sorting && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t('guestBeleg.sorting')}
                      </p>
                    )}
                    {f.error && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{f.error}</p>
                    )}
                    {f.category && !f.sorting && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-emerald-800 dark:text-emerald-200">
                          <span className="font-semibold">{t('guestBeleg.suggested')}:</span>{' '}
                          {f.categoryLabelDe || f.category}
                          {typeof f.confidence === 'number' && (
                            <span className="ml-1 text-xs text-gray-500">
                              (~{Math.round(f.confidence * 100)} %)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {f.method === 'ai'
                            ? t('guestBeleg.methodAi')
                            : t('guestBeleg.methodRules')}
                          {f.year ? ` · ${f.year}` : ''}
                          {f.isTaxRelevant ? ` · ${t('guestBeleg.taxRelevant')}` : ''}
                        </p>
                        {f.suggestions && f.suggestions.length > 0 && (
                          <ul className="text-xs text-gray-600 dark:text-gray-400">
                            {f.suggestions.slice(0, 2).map((s) => (
                              <li key={s}>· {s}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(f.id)}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  >
                    {t('guestBeleg.remove')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sortedOk.length > 0 && <SaveResultsCta from="beleg-try" />}
    </div>
  );
}
