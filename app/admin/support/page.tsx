'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ThreadListItem {
  id: string;
  status: string;
  guestEmail: string | null;
  subject: string | null;
  lastMessageAt: string;
  escalatedAt: string | null;
  user: { id: string; email: string; name: string | null } | null;
  messages: { body: string; senderType: string; createdAt: string }[];
}

interface ThreadDetail {
  id: string;
  status: string;
  guestEmail: string | null;
  subject: string | null;
  user: { id: string; email: string; name: string | null } | null;
  messages: {
    id: string;
    senderType: string;
    body: string;
    createdAt: string;
  }[];
}

function AdminSupportInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    const q = filter === 'all' ? '' : `?status=${filter}`;
    const res = await fetch(`/api/admin/support${q}`);
    if (!res.ok) return;
    const data = await res.json();
    setThreads(data.threads || []);
  }, [filter]);

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/support/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setDetail(data.thread);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    void loadList().finally(() => setLoading(false));
    const t = setInterval(() => void loadList(), 15000);
    return () => clearInterval(t);
  }, [isAdmin, loadList]);

  useEffect(() => {
    const fromUrl = searchParams.get('thread');
    if (fromUrl) {
      setSelectedId(fromUrl);
      return;
    }
    const userId = searchParams.get('userId');
    if (!userId || !isAdmin) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (data.thread?.id && !cancelled) {
        setSelectedId(data.thread.id);
        void loadList();
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only when URL userId / admin gate changes — not on every loadList identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isAdmin]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
    const t = setInterval(() => void loadDetail(selectedId), 10000);
    return () => clearInterval(t);
  }, [selectedId, loadDetail]);

  const labelFor = useMemo(
    () => (t: ThreadListItem | ThreadDetail) =>
      t.user?.name || t.guestEmail || t.user?.email || 'Unbekannt',
    []
  );

  const sendReply = async (resolve = false) => {
    if (!selectedId || !reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: selectedId,
          body: reply.trim(),
          resolve,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDetail(data.thread);
        setReply('');
        void loadList();
      }
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loading variant="spinner" size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-gray-600">
        Kein Admin-Zugriff.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Live-Support
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Threads mit Beta-Testern. Proaktiv schreiben oder auf Eskalationen antworten —
            auch über Admin-Zentrale → „Nachricht senden“.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'escalated', 'waiting_admin', 'open', 'resolved'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
                filter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
              )}
            >
              {s === 'all'
                ? 'Alle'
                : s === 'escalated'
                  ? 'Eskaliert'
                  : s === 'waiting_admin'
                    ? 'Wartet'
                    : s === 'open'
                      ? 'Offen'
                      : 'Erledigt'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[minmax(0,18rem)_1fr] gap-4 min-h-[28rem]">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[70vh] overflow-y-auto">
            {threads.length === 0 && (
              <li className="p-6 text-sm text-center text-gray-500">Keine Threads</li>
            )}
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    'w-full text-left px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                    selectedId === t.id && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {labelFor(t)}
                    </span>
                    {t.status === 'escalated' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {t.messages[0]?.body || t.subject || '—'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(t.lastMessageAt).toLocaleString('de-DE')} · {t.status}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col min-h-[28rem]">
          {!detail ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
              Thread auswählen
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {labelFor(detail)}
                </div>
                <div className="text-xs text-gray-500">
                  {detail.user?.email}
                  {detail.guestEmail ? ` · Anfrage: ${detail.guestEmail}` : ''} · {detail.status}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[50vh]">
                {detail.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
                      m.senderType === 'admin'
                        ? 'ml-auto bg-blue-600 text-white'
                        : m.senderType === 'user'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          : 'bg-amber-50 dark:bg-amber-900/20 text-gray-800 dark:text-gray-100 border border-amber-100 dark:border-amber-900/40'
                    )}
                  >
                    <div className="text-[10px] opacity-70 mb-0.5 uppercase">
                      {m.senderType === 'bot'
                        ? 'Bot'
                        : m.senderType === 'admin'
                          ? 'Du'
                          : 'Nutzer'}
                    </div>
                    {m.body}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  placeholder="Antwort an den Tester…"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sending || !reply.trim()}
                    onClick={() => void sendReply(true)}
                  >
                    Senden & erledigen
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={sending || !reply.trim()}
                    onClick={() => void sendReply(false)}
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    Antworten
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <AuthenticatedLayout hideSupportWidget>
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loading variant="spinner" size="lg" />
          </div>
        }
      >
        <AdminSupportInner />
      </Suspense>
    </AuthenticatedLayout>
  );
}
