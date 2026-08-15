'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Eye,
  LifeBuoy,
  Percent,
  Users,
  FileText,
  Megaphone,
  BarChart3,
  ClipboardList,
  Shield,
  Sparkles,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { useAdminCustomerView } from '@/lib/admin/use-admin-customer-view';
import { AdminMessageTesterButton } from '@/components/admin/message-tester-button';
import toast from 'react-hot-toast';

type Kpis = {
  usersTotal: number;
  usersWeek: number;
  loginsDay: number;
  docsTotal: number;
  betaVisitsWeek: number;
  betaRequestsWeek: number;
  openThreads: number;
  escalatedThreads: number;
  openReports: number;
  activePromos: number;
  activeUserDiscounts: number;
  pricingSurveys: number;
  subscriptionsActive: number;
};

type WeeklyReportRow = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  trigger: string;
  payload?: { highlights?: string[] } | null;
};

type RecentTester = {
  id: string;
  email: string;
  name: string | null;
  lastLoginAt: string | null;
  displayName: string;
  supportThreadId: string | null;
  supportStatus: string | null;
};

const LINKS = [
  {
    href: '/admin/preise',
    title: 'Preise & Rabatte',
    desc: 'Aktionen, Codes, Nutzer-Rabatte',
    icon: Percent,
  },
  {
    href: '/admin/beta-funnel',
    title: 'Beta-Funnel',
    desc: 'Klicks → Anfragen → Aktivierung',
    icon: Megaphone,
  },
  {
    href: '/admin/tester-activity',
    title: 'Tester-Aktivität',
    desc: 'Wer nutzt welche Features',
    icon: Activity,
  },
  {
    href: '/admin/support',
    title: 'Live-Support',
    desc: 'Chats & Eskalationen',
    icon: LifeBuoy,
  },
  {
    href: '/admin/reports',
    title: 'Reports / Bugs',
    desc: 'Feedback & Fehler',
    icon: ClipboardList,
  },
  {
    href: '/admin/pricing-survey',
    title: 'Preis-Umfrage',
    desc: 'Survey-Ergebnisse',
    icon: BarChart3,
  },
];

export default function AdminHubPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';
  const { active: customerView, enter, exit } = useAdminCustomerView();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [recentTesters, setRecentTesters] = useState<RecentTester[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState<WeeklyReportRow | null>(null);
  const [generating, setGenerating] = useState(false);

  // Leaving Admin Hub while in customer mode is fine; entering hub should exit customer mode
  useEffect(() => {
    if (customerView) exit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [insightsRes, weeklyRes] = await Promise.all([
        fetch('/api/admin/insights'),
        fetch('/api/admin/weekly-report'),
      ]);
      if (!insightsRes.ok) throw new Error('fail');
      const data = await insightsRes.json();
      setKpis(data.kpis);
      setRecentTesters(Array.isArray(data.recentTesters) ? data.recentTesters : []);
      if (weeklyRes.ok) {
        const w = await weeklyRes.json();
        setWeekly(w.report || null);
      }
    } catch {
      if (!silent) {
        setKpis(null);
        setRecentTesters([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const generateWeekly = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/weekly-report', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      toast.success('Wochenbericht erzeugt — auch in der Glocke');
      await load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) void load();
  }, [status, isAdmin, load]);

  // Live refresh every 60s while hub is open
  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;
    const id = setInterval(() => void load(true), 60_000);
    return () => clearInterval(id);
  }, [status, isAdmin, load]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading variant="spinner" size="lg" text="Laden…" />
      </div>
    );
  }

  if (status === 'authenticated' && !isAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-12">
          <p className="text-red-600">Kein Admin-Zugriff.</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  const cards = kpis
    ? [
        { label: 'Nutzer (gesamt)', value: kpis.usersTotal, icon: Users },
        { label: 'Neu (7 Tage)', value: kpis.usersWeek, icon: Users },
        { label: 'Logins (24h)', value: kpis.loginsDay, icon: Activity },
        { label: 'Dokumente', value: kpis.docsTotal, icon: FileText },
        { label: 'Beta-Besuche (7T)', value: kpis.betaVisitsWeek, icon: Megaphone },
        { label: 'Beta-Anfragen (7T)', value: kpis.betaRequestsWeek, icon: Megaphone },
        { label: 'Support offen', value: kpis.openThreads, icon: LifeBuoy },
        { label: 'Eskaliert', value: kpis.escalatedThreads, icon: LifeBuoy },
        { label: 'Offene Reports', value: kpis.openReports, icon: ClipboardList },
        { label: 'Aktive Promos', value: kpis.activePromos, icon: Percent },
        { label: 'Nutzer-Rabatte', value: kpis.activeUserDiscounts, icon: Percent },
        { label: 'Aktive Lizenzen', value: kpis.subscriptionsActive, icon: BarChart3 },
      ]
    : [];

  const signals: string[] = [];
  if (kpis) {
    if (kpis.escalatedThreads > 0) {
      signals.push(`${kpis.escalatedThreads} eskalierte Support-Threads — Priorität prüfen.`);
    }
    if (kpis.openReports > 0) {
      signals.push(`${kpis.openReports} offene Reports — Bugs/Feedback triageen.`);
    }
    if (kpis.betaVisitsWeek > 0 && kpis.betaRequestsWeek === 0) {
      signals.push('Beta-Besuche ohne Anfragen (7T) — Funnel / CTA prüfen.');
    }
    if (kpis.usersWeek === 0 && kpis.betaVisitsWeek > 3) {
      signals.push('Besuche ohne neue Nutzer — Onboarding/Registrierung prüfen.');
    }
    if (kpis.loginsDay === 0 && kpis.usersTotal > 0) {
      signals.push('Keine Logins in 24h — Retention / Wake-up der Instanz prüfen.');
    }
    if (signals.length === 0) {
      signals.push('Keine kritischen Signale aus den aktuellen KPIs — weiter Funnel & Support beobachten.');
    }
  }

  return (
    <AuthenticatedLayout hideSupportWidget>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <div className="border-b border-slate-300 bg-slate-900 text-white dark:border-slate-700">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-7 w-7 text-amber-400" />
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Admin-Abteilung</p>
                <h1 className="text-xl font-bold">Admin-Zentrale</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-amber-400/60 bg-transparent text-amber-100 hover:bg-amber-900/40"
                leftIcon={<Eye className="h-4 w-4" />}
                onClick={() => {
                  enter();
                  router.push('/dashboard');
                }}
              >
                Kundenansicht
              </Button>
              <Button
                variant="ghost"
                className="text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={() => void load()}
              >
                KPIs aktualisieren
              </Button>
              <Button
                variant="ghost"
                className="text-slate-300 hover:bg-slate-800 hover:text-white"
                leftIcon={<CalendarClock className="h-4 w-4" />}
                isLoading={generating}
                onClick={() => void generateWeekly()}
              >
                Report jetzt erzeugen
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4 py-8">
          {weekly && (
            <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
              <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                <CalendarClock className="h-4 w-4" />
                Letzter Wochenbericht
                <span className="font-normal text-xs opacity-80">
                  ({weekly.trigger === 'cron' ? 'Cron' : 'manuell'} ·{' '}
                  {new Date(weekly.createdAt).toLocaleString('de-DE')})
                </span>
              </p>
              <p className="mt-1 text-sm font-medium text-indigo-950 dark:text-indigo-50">
                {weekly.title}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-indigo-900/90 dark:text-indigo-100/90">
                {(weekly.payload?.highlights || weekly.summary.split('\n')).map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-indigo-800/70 dark:text-indigo-200/70">
                Automatisch: Mo ~09:00 Europe/Berlin via Render Cron (CRON_SECRET). Live-KPIs unten
                aktualisieren sich beim Öffnen / jede Minute.
              </p>
            </div>
          )}

          {!weekly && (
            <div className="mb-6 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm dark:border-slate-600 dark:bg-slate-900">
              <p className="font-medium text-slate-900 dark:text-white">Noch kein Wochenbericht</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Erzeuge den ersten Snapshot mit „Report jetzt erzeugen“ (Glocke + Speicherung). Cron:
                Montag 07:00 UTC.
              </p>
              <Button
                size="sm"
                className="mt-3"
                isLoading={generating}
                onClick={() => void generateWeekly()}
              >
                Report jetzt erzeugen
              </Button>
            </div>
          )}

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/40">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                <Eye className="h-4 w-4" /> Modus A — Kundenansicht
              </p>
              <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
                Produkt wie ein Kunde: Landing, Pricing, Dashboard, Belege, ELSTER, Hilfe-Chat.
                Nur eine kleine Leiste „Kundenansicht aktiv“.
              </p>
              <Button
                size="sm"
                className="mt-3"
                leftIcon={<Eye className="h-3.5 w-3.5" />}
                onClick={() => {
                  enter();
                  router.push('/dashboard');
                }}
              >
                Jetzt als Kunde browsen
              </Button>
            </div>
            <div className="rounded-lg border-2 border-slate-700 bg-white p-4 dark:bg-slate-900">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Shield className="h-4 w-4" /> Modus B — Admin-Ansicht (hier)
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Dichte Ops-UI: KPIs, Rabatte, Funnel, Support, Reports — für Weiterentwicklung und
                Eingriff.
              </p>
            </div>
          </div>

          {kpis && (
            <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-900 dark:text-orange-100">
                <Sparkles className="h-4 w-4" />
                Verbesserungssignale (MVP)
              </p>
              <ul className="space-y-1 text-sm text-orange-950 dark:text-orange-50">
                {signals.map((s) => (
                  <li key={s} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loading && <Loading variant="spinner" size="sm" text="KPIs laden…" />}

          {!loading && kpis && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cards.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.label}
                    className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                      <Icon className="h-3.5 w-3.5" />
                      {c.label}
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{c.value}</p>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && (
            <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Kürzlich aktive Tester
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Login oder Upload (7 Tage) — proaktiv per Support-Chat schreiben
                  </p>
                </div>
                <Link
                  href="/admin/tester-activity"
                  className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Alle Tester →
                </Link>
              </div>
              {recentTesters.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  Keine kürzlichen Logins — siehe Tester-Aktivität für alle Slots.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentTesters.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {t.displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {t.email}
                          {t.lastLoginAt
                            ? ` · Login ${new Date(t.lastLoginAt).toLocaleString('de-DE', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}`
                            : ' · Aktivität ohne Login-Zeit'}
                        </p>
                      </div>
                      <AdminMessageTesterButton
                        userId={t.id}
                        label={t.displayName}
                        threadId={t.supportThreadId}
                        size="sm"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Werkzeuge</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <Icon className="mt-0.5 h-5 w-5 text-slate-700 dark:text-slate-300" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900 dark:text-white">
                      {link.title}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{link.desc}</span>
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 text-slate-400" />
                </Link>
              );
            })}
          </div>

          <p className="mt-8 text-xs text-slate-500">
            Doku: docs/ADMIN-DUAL-VIEW.md · docs/ADMIN-WEEKLY-REPORT.md · Preise:
            docs/ADMIN-INSIGHTS-DISCOUNTS.md — Admin-only; Tester sehen diese Abteilung nicht.
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
