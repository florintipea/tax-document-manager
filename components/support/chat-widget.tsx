'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Bot, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface SupportMessage {
  id: string;
  senderType: string;
  body: string;
  createdAt: string;
}

interface SupportThread {
  id: string;
  status: string;
  messages: SupportMessage[];
}

export function SupportChatWidget({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/support/unread');
      if (!res.ok) return;
      const data = await res.json();
      setUnread(Boolean(data.unread));
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/thread');
      if (!res.ok) return;
      const data = await res.json();
      setThread(data.thread);
      setUnread(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => void load(), 12000);
    return () => clearInterval(id);
  }, [open, load]);

  // Poll unread badge while closed
  useEffect(() => {
    if (open) return;
    void loadUnread();
    const id = setInterval(() => void loadUnread(), 15000);
    return () => clearInterval(id);
  }, [open, loadUnread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length, open]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    try {
      const res = await fetch('/api/support/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const data = await res.json();
        setThread(data.thread);
      }
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors',
          compact ? 'p-3' : 'px-4 py-3'
        )}
        aria-label={unread ? 'Hilfe öffnen — neue Nachricht' : 'Hilfe öffnen'}
      >
        <span className="relative">
          <MessageCircle className="w-5 h-5" />
          {unread && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-blue-600" />
          )}
        </span>
        {!compact && <span className="text-sm font-medium">Hilfe</span>}
        {unread && !compact && (
          <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-blue-950">
            Neu
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[min(100vw-1.5rem,22rem)] h-[min(70vh,28rem)] flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div>
          <div className="font-semibold text-sm">TaxDoc Hilfe</div>
          <div className="text-[11px] opacity-90">Bot + Admin-Chat</div>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Schließen">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50 dark:bg-gray-950">
        {loading && !thread && (
          <p className="text-xs text-center text-gray-500 py-6">Lade Chat…</p>
        )}
        {thread?.messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'flex gap-2',
              m.senderType === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {m.senderType !== 'user' && (
              <div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {m.senderType === 'bot' ? (
                  <Bot className="w-3.5 h-3.5" />
                ) : (
                  <Shield className="w-3.5 h-3.5" />
                )}
              </div>
            )}
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
                m.senderType === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : m.senderType === 'admin'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-gray-900 dark:text-gray-100 rounded-bl-md'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
              )}
            >
              {m.body}
            </div>
            {m.senderType === 'user' && (
              <div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-2 py-1.5 text-[10px] text-center text-gray-500 border-t border-gray-100 dark:border-gray-800">
        Hilfsmittel, keine Steuerberatung (StBerG)
      </div>

      <div className="flex items-end gap-2 p-2 border-t border-gray-200 dark:border-gray-700">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder="Nachricht… (Hilfe bei Problemen)"
          className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          type="button"
          size="sm"
          disabled={sending || !text.trim()}
          onClick={() => void send()}
          className="shrink-0 h-10 w-10 p-0"
          aria-label="Senden"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
