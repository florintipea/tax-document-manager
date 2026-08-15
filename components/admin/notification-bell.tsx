'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AdminNotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastBrowserNotify = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    const poll = setInterval(() => void load(), 20000);
    return () => clearInterval(poll);
  }, [load]);

  // Optional SSE for near-realtime badge updates
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/admin/notifications/stream');
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as { unreadCount?: number };
          if (typeof data.unreadCount === 'number') {
            setUnreadCount((prev) => {
              if (data.unreadCount! > prev && data.unreadCount! > 0) {
                maybeBrowserNotify(data.unreadCount!);
              }
              return data.unreadCount!;
            });
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* EventSource unavailable */
    }
    return () => es?.close();
  }, []);

  function maybeBrowserNotify(count: number) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const now = Date.now();
    if (now - lastBrowserNotify.current < 15000) return;
    lastBrowserNotify.current = now;
    try {
      new Notification('TaxDoc Admin', {
        body: `${count} ungelesene Benachrichtigung${count === 1 ? '' : 'en'}`,
        tag: 'taxdoc-admin-notif',
      });
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      // Soft request once per session for admins
      const key = 'taxdoc_admin_notif_asked';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        void Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
  };

  const markOne = async (id: string) => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt || new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
        className={cn(
          'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          open
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        )}
        aria-label="Benachrichtigungen"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              Benachrichtigungen
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/support"
                className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1"
                onClick={() => setOpen(false)}
              >
                <MessageCircle className="w-3 h-3" />
                Support
              </Link>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Alle gelesen
                </button>
              )}
            </div>
          </div>
          <ul className="overflow-y-auto max-h-[55vh] divide-y divide-gray-100 dark:divide-gray-700">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-gray-500">Keine Benachrichtigungen</li>
            )}
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.link || '/admin/support'}
                  onClick={() => {
                    if (!item.readAt) void markOne(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                    !item.readAt && 'bg-blue-50/60 dark:bg-blue-900/20'
                  )}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</div>
                  {item.body && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {item.body}
                    </div>
                  )}
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(item.createdAt).toLocaleString('de-DE')}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
