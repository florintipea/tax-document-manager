'use client';

import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

type Props = {
  userId: string;
  label: string;
  /** Existing thread → open chat; otherwise create + optional first message */
  threadId?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Compact link-style button for tables */
  variant?: 'button' | 'link';
};

/**
 * Admin-only: open support chat with a tester or send a proactive first message.
 */
export function AdminMessageTesterButton({
  userId,
  label,
  threadId,
  className,
  size = 'sm',
  variant = 'button',
}: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const openExisting = () => {
    setOpen(true);
  };

  const goToThread = (id: string) => {
    window.location.href = `/admin/support?thread=${id}`;
  };

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Senden fehlgeschlagen');
      toast.success('Nachricht gesendet');
      setOpen(false);
      setBody('');
      const id = data.thread?.id;
      if (id) goToThread(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setSending(false);
    }
  };

  const openChatOnly = async () => {
    if (threadId) {
      goToThread(threadId);
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thread konnte nicht geöffnet werden');
      const id = data.thread?.id;
      if (id) goToThread(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {variant === 'link' ? (
        <button
          type="button"
          onClick={openExisting}
          className={cn(
            'text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300',
            className
          )}
        >
          Nachricht senden
        </button>
      ) : (
        <Button
          type="button"
          size={size}
          variant="outline"
          className={className}
          leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
          onClick={openExisting}
        >
          Nachricht senden
        </Button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-msg-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2
                  id="admin-msg-title"
                  className="text-sm font-semibold text-slate-900 dark:text-white"
                >
                  Nachricht an Tester
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 truncate max-w-[16rem]">
                  {label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Hallo! Wie läuft der Test? Melde dich bei Fragen…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Der Tester sieht die Nachricht im Hilfe-Chat und erhält ein Unread-Badge.
            </p>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={sending}
                onClick={() => void openChatOnly()}
              >
                Nur Chat öffnen
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={sending || !body.trim()}
                leftIcon={<Send className="h-3.5 w-3.5" />}
                onClick={() => void send()}
              >
                Senden
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
