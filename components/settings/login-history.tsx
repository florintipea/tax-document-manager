'use client';

import { useEffect, useState } from 'react';
import { History, ShieldAlert } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';
import { Loading } from '@/components/ui/loading';

type SecurityEventRow = {
  id: string;
  type: string;
  severity: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
};

function shortenUa(ua: string): string {
  if (!ua || ua === 'unknown') return '—';
  if (ua.length <= 48) return ua;
  return `${ua.slice(0, 45)}…`;
}

export function LoginHistory() {
  const { t, locale } = useI18n();
  const [events, setEvents] = useState<SecurityEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/security-events');
        if (!res.ok) throw new Error('fail');
        const data = await res.json();
        if (!cancelled) setEvents(data.events || []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('security.loginHistoryTitle')}
        </h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('security.loginHistoryHint')}</p>

      {loading && <Loading variant="spinner" size="sm" text={t('common.loading')} />}
      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <ShieldAlert className="h-4 w-4" />
          {t('security.loginHistoryError')}
        </p>
      )}
      {!loading && !error && events.length === 0 && (
        <p className="text-sm text-gray-500">{t('security.loginHistoryEmpty')}</p>
      )}
      {!loading && events.length > 0 && (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="bg-white px-3 py-3 text-sm dark:bg-gray-800/80"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t(`security.eventType.${ev.type}`) !== `security.eventType.${ev.type}`
                      ? t(`security.eventType.${ev.type}`)
                      : ev.type}
                  </p>
                  <p className="text-xs text-gray-500">{ev.description}</p>
                </div>
                <time className="text-xs text-gray-500">
                  {new Date(ev.timestamp).toLocaleString(locale === 'de' ? 'de-DE' : locale)}
                </time>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                IP: {ev.ipAddress || '—'} · {shortenUa(ev.userAgent)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
