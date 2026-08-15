'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Percent, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import toast from 'react-hot-toast';

type Campaign = {
  id: string;
  name: string;
  percentOff: number | null;
  amountOff: number | null;
  code: string | null;
  startsAt: string;
  endsAt: string;
  active: boolean;
  note: string | null;
};

type UserDiscountRow = {
  id: string;
  percentOff: number | null;
  amountOff: number | null;
  expiresAt: string | null;
  reason: string | null;
  active: boolean;
  user: { id: string; email: string; name: string | null };
};

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPreisePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [discounts, setDiscounts] = useState<UserDiscountRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [campName, setCampName] = useState('');
  const [campPercent, setCampPercent] = useState('20');
  const [campAmount, setCampAmount] = useState('');
  const [campCode, setCampCode] = useState('');
  const [campStart, setCampStart] = useState(() => toLocalInput(new Date()));
  const [campEnd, setCampEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return toLocalInput(d);
  });

  const [discEmail, setDiscEmail] = useState('');
  const [discPercent, setDiscPercent] = useState('15');
  const [discAmount, setDiscAmount] = useState('');
  const [discReason, setDiscReason] = useState('Betatester-Rabatt');
  const [discExpires, setDiscExpires] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        fetch('/api/admin/promos'),
        fetch('/api/admin/user-discounts'),
      ]);
      if (!cRes.ok || !dRes.ok) throw new Error('fail');
      const cData = await cRes.json();
      const dData = await dRes.json();
      setCampaigns(cData.campaigns || []);
      setDiscounts(dData.discounts || []);
    } catch {
      toast.error('Laden fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) void load();
  }, [status, isAdmin, load]);

  const createCampaign = async () => {
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campName,
          percentOff: campPercent ? Number(campPercent) : null,
          amountOff: campAmount ? Number(campAmount) : null,
          code: campCode || null,
          startsAt: new Date(campStart).toISOString(),
          endsAt: new Date(campEnd).toISOString(),
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      toast.success('Aktion angelegt');
      setCampName('');
      setCampCode('');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler');
    }
  };

  const toggleCampaign = async (c: Campaign) => {
    const res = await fetch(`/api/admin/promos/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    });
    if (!res.ok) toast.error('Toggle fehlgeschlagen');
    else void load();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Aktion wirklich löschen?')) return;
    const res = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
    if (!res.ok) toast.error('Löschen fehlgeschlagen');
    else void load();
  };

  const createUserDiscount = async () => {
    try {
      const res = await fetch('/api/admin/user-discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: discEmail,
          percentOff: discPercent ? Number(discPercent) : null,
          amountOff: discAmount ? Number(discAmount) : null,
          reason: discReason || null,
          expiresAt: discExpires ? new Date(discExpires).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      toast.success('Nutzer-Rabatt gesetzt');
      setDiscEmail('');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler');
    }
  };

  const deactivateDiscount = async (id: string) => {
    const res = await fetch(`/api/admin/user-discounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    });
    if (!res.ok) toast.error('Deaktivieren fehlgeschlagen');
    else void load();
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading variant="spinner" size="lg" text="Laden…" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AuthenticatedLayout>
        <p className="p-8 text-red-600">Kein Admin-Zugriff.</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Admin-Hub
        </Link>
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Percent className="h-6 w-6" />
          Preise & Rabatte
        </h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Globale Aktionen und persönliche Nutzer-Rabatte. Greifen in der Preisanzeige (
          <Link href="/pricing" className="text-blue-600 hover:underline">
            /pricing
          </Link>
          ). Beta bleibt kostenlos.
        </p>

        <section className="mb-10 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
            Neue Rabatt-Aktion (global)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Name (z. B. Launch 20%)"
              value={campName}
              onChange={(e) => setCampName(e.target.value)}
            />
            <Input
              placeholder="Code (optional, z. B. BETA20)"
              value={campCode}
              onChange={(e) => setCampCode(e.target.value)}
            />
            <Input
              placeholder="% Rabatt"
              value={campPercent}
              onChange={(e) => setCampPercent(e.target.value)}
            />
            <Input
              placeholder="Festbetrag € (optional)"
              value={campAmount}
              onChange={(e) => setCampAmount(e.target.value)}
            />
            <div>
              <label className="text-xs text-gray-500">Start</label>
              <Input
                type="datetime-local"
                value={campStart}
                onChange={(e) => setCampStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Ende</label>
              <Input
                type="datetime-local"
                value={campEnd}
                onChange={(e) => setCampEnd(e.target.value)}
              />
            </div>
          </div>
          <Button className="mt-3" onClick={() => void createCampaign()} disabled={!campName}>
            Aktion anlegen
          </Button>

          <h3 className="mb-2 mt-6 text-sm font-semibold">Bestehende Aktionen</h3>
          {loading ? (
            <Loading variant="spinner" size="sm" text="…" />
          ) : (
            <ul className="space-y-2">
              {campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-700"
                >
                  <div>
                    <p className="font-medium">
                      {c.name}{' '}
                      {!c.active && (
                        <span className="text-xs text-gray-400">(inaktiv)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.percentOff != null ? `${c.percentOff}%` : ''}
                      {c.amountOff != null ? ` ${c.amountOff}€` : ''}
                      {c.code ? ` · Code ${c.code}` : ' · automatisch'}
                      {' · '}
                      {new Date(c.startsAt).toLocaleString('de-DE')} –{' '}
                      {new Date(c.endsAt).toLocaleString('de-DE')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => void toggleCampaign(c)}>
                      {c.active ? (
                        <ToggleRight className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void deleteCampaign(c.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
              {campaigns.length === 0 && (
                <p className="text-sm text-gray-500">Noch keine Aktionen.</p>
              )}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
            Rabatt für bestimmten Nutzer
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="E-Mail des Nutzers"
              value={discEmail}
              onChange={(e) => setDiscEmail(e.target.value)}
            />
            <Input
              placeholder="Grund"
              value={discReason}
              onChange={(e) => setDiscReason(e.target.value)}
            />
            <Input
              placeholder="% Rabatt"
              value={discPercent}
              onChange={(e) => setDiscPercent(e.target.value)}
            />
            <Input
              placeholder="Festbetrag € (optional)"
              value={discAmount}
              onChange={(e) => setDiscAmount(e.target.value)}
            />
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500">Ablauf (optional)</label>
              <Input
                type="datetime-local"
                value={discExpires}
                onChange={(e) => setDiscExpires(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-3"
            onClick={() => void createUserDiscount()}
            disabled={!discEmail}
          >
            Nutzer-Rabatt setzen
          </Button>

          <h3 className="mb-2 mt-6 text-sm font-semibold">Aktive / letzte Rabatte</h3>
          <ul className="space-y-2">
            {discounts.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-700"
              >
                <div>
                  <p className="font-medium">
                    {d.user.email}{' '}
                    {!d.active && <span className="text-xs text-gray-400">(inaktiv)</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {d.percentOff != null ? `${d.percentOff}%` : ''}
                    {d.amountOff != null ? ` ${d.amountOff}€` : ''}
                    {d.reason ? ` · ${d.reason}` : ''}
                    {d.expiresAt
                      ? ` · bis ${new Date(d.expiresAt).toLocaleString('de-DE')}`
                      : ''}
                  </p>
                </div>
                {d.active && (
                  <Button size="sm" variant="outline" onClick={() => void deactivateDiscount(d.id)}>
                    Deaktivieren
                  </Button>
                )}
              </li>
            ))}
            {discounts.length === 0 && (
              <p className="text-sm text-gray-500">Noch keine Nutzer-Rabatte.</p>
            )}
          </ul>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
