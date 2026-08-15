'use client';

import { useEffect } from 'react';

const SESSION_KEY = 'taxdoc_beta_sid';

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

function readUtm(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
  };
}

/** Fire-and-forget beta page visit signal for admin notifications. */
export function BetaVisitTracker({ path }: { path: string }) {
  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    const utm = readUtm();
    void fetch('/api/beta/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, sessionId, ...utm }),
      keepalive: true,
    }).catch(() => {});
  }, [path]);

  return null;
}
