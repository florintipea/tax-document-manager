'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/provider';

const STORAGE_KEY = 'taxdoc-cookie-notice-ack';

/**
 * Informational notice for necessary session cookies only.
 * No marketing/analytics cookies — acknowledge, not multi-purpose consent.
 */
export function CookieNotice() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== '1') {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={t('legal.cookieTitle')}
      className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t('legal.cookieBody')}{' '}
          <Link
            href="/legal/datenschutz"
            className="text-blue-600 underline dark:text-blue-400"
          >
            {t('legal.datenschutz')}
          </Link>
        </p>
        <button
          type="button"
          onClick={acknowledge}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('legal.cookieAccept')}
        </button>
      </div>
    </div>
  );
}
