'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Activity, AlertCircle, ArrowLeft, BarChart3, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';

type RangePreset = 1 | 7 | 30;

interface FunnelResponse {
  range: { start: string; end: string };
  totals: {
    clicks: number;
    requests: number;
    assigned: number;
    firstLogins: number;
    active: number;
  };
  conversion: {
    clickToRequest: number | null;
    requestToAssigned: number | null;
    assignedToActive: number | null;
  };
  daily: Array<{
    dateKey: string;
    clicks: number;
    requests: number;
    assigned: number;
    firstLogins: number;
    active: number;
  }>;
}

function formatPercent(value: number | null): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}%`;
}

function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default function AdminBetaFunnelPage() {
  const { data: session, status } = useSession();
  const [range, setRange] = useState<RangePreset>(7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [dateKey, setDateKey] = useState(todayKey());
  const [clicks, setClicks] = useState('0');

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const load = useCallback(async (nextRange: RangePreset) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/beta-funnel?range=${nextRange}`);
      if (!res.ok) throw new Error('load failed');
      const json = (await res.json()) as FunnelResponse;
      setData(json);
    } catch {
      toast.error('Funnel-Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load(range);
  }, [isAdmin, load, range]);

  const saveClicks = useCallback(async () => {
    const parsed = Number.parseInt(clicks, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast.error('Bitte eine gueltige Klickzahl eingeben (>= 0).');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/beta-funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateKey, clicks: parsed }),
      });
      if (!res.ok) throw new Error('save failed');
      toast.success('Ad-Klicks gespeichert.');
      await load(range);
    } catch {
      toast.error('Ad-Klicks konnten nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  }, [clicks, dateKey, load, range]);

  const totalCards = useMemo(
    () => [
      { label: 'Ad-Klicks', value: data?.totals.clicks ?? 0 },
      { label: 'Beta-Anfragen', value: data?.totals.requests ?? 0 },
      { label: 'Konten zugewiesen', value: data?.totals.assigned ?? 0 },
      { label: 'Erst-Logins', value: data?.totals.firstLogins ?? 0 },
      { label: 'Aktive Tester', value: data?.totals.active ?? 0 },
    ],
    [data]
  );

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-semibold">Kein Admin-Zugriff.</h1>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <Link
            href="/admin/tester-activity"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Tester-Aktivitaet
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-blue-600" />
                Beta Funnel KPI
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Tracking fuer Klick → Anfrage → Zuweisung → Aktivierung
              </p>
            </div>
            <div className="flex gap-2">
              {[1, 7, 30].map((days) => (
                <Button
                  key={days}
                  variant={range === days ? 'primary' : 'outline'}
                  onClick={() => setRange(days as RangePreset)}
                >
                  {days === 1 ? 'Heute' : `${days} Tage`}
                </Button>
              ))}
              <Button variant="outline" onClick={() => void load(range)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aktualisieren'}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:col-span-2">
              <p className="text-sm text-gray-500 mb-3">Manuelle Ad-Klicks pro Tag</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={clicks}
                  onChange={(e) => setClicks(e.target.value)}
                  className="h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
                  placeholder="Klicks"
                />
                <Button onClick={() => void saveClicks()} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Speichern
                </Button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 mb-1">Zeitraum</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white">
                {data ? `${data.range.start} bis ${data.range.end}` : '—'}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {totalCards.map((card) => (
              <div key={card.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Conversion Klick → Anfrage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercent(data?.conversion.clickToRequest ?? null)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Conversion Anfrage → Zuweisung</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercent(data?.conversion.requestToAssigned ?? null)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Conversion Zuweisung → Aktiv</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercent(data?.conversion.assignedToActive ?? null)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Tageswerte
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-4 py-3">Datum</th>
                    <th className="text-right px-4 py-3">Klicks</th>
                    <th className="text-right px-4 py-3">Anfragen</th>
                    <th className="text-right px-4 py-3">Zugewiesen</th>
                    <th className="text-right px-4 py-3">Erst-Logins</th>
                    <th className="text-right px-4 py-3">Aktiv</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                        <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                        Lade...
                      </td>
                    </tr>
                  ) : (data?.daily.length ?? 0) === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                        Keine Daten im gewaehlten Zeitraum.
                      </td>
                    </tr>
                  ) : (
                    data?.daily.map((row) => (
                      <tr key={row.dateKey} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="px-4 py-3 font-mono">{row.dateKey}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.clicks}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.requests}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.assigned}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.firstLogins}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.active}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
