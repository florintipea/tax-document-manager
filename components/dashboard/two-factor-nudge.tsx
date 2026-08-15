'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'taxdoc-2fa-nudge-dismissed';

export function TwoFactorNudge({ enabled }: { enabled: boolean | null }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (enabled !== false) {
      setVisible(false);
      return;
    }
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') {
        setVisible(false);
        return;
      }
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, [enabled]);

  if (!visible) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/40">
      <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-950 dark:text-amber-50">{t('security.nudgeTitle')}</p>
        <p className="mt-1 text-sm text-amber-900 dark:text-amber-100">{t('security.nudgeBody')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/settings">
            <Button size="sm">{t('security.nudgeCta')}</Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              try {
                sessionStorage.setItem(DISMISS_KEY, '1');
              } catch {
                /* ignore */
              }
              setVisible(false);
            }}
          >
            {t('security.nudgeDismiss')}
          </Button>
        </div>
      </div>
      <button
        type="button"
        className="rounded p-1 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/50"
        aria-label={t('security.nudgeDismiss')}
        onClick={() => {
          try {
            sessionStorage.setItem(DISMISS_KEY, '1');
          } catch {
            /* ignore */
          }
          setVisible(false);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
