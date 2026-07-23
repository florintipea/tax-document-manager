'use client';

import { useEffect } from 'react';
import { submitReport } from '@/lib/reports/submit-client';

const reported = new Set<string>();

function reportKey(message: string, source?: string) {
  return `${source || 'unknown'}:${message.slice(0, 120)}`;
}

async function reportClientError(
  message: string,
  options?: {
    stack?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const key = reportKey(message, options?.source);
  if (reported.has(key)) return;
  reported.add(key);

  await submitReport({
    type: 'error',
    title: options?.source || 'Client error',
    message,
    stackTrace: options?.stack,
    severity: 'high',
    metadata: options?.metadata,
  });
}

export function GlobalErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void reportClientError(event.message || 'Unknown error', {
        stack: event.error?.stack,
        source: `${event.filename}:${event.lineno}`,
        metadata: {
          colno: event.colno,
        },
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'Unhandled promise rejection';

      void reportClientError(message, {
        stack: reason instanceof Error ? reason.stack : undefined,
        source: 'unhandledrejection',
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}

export { reportClientError };
