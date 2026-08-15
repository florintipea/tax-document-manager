'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowRight, Check, Copy, Download, Loader2, Lock, Mail, Shield, User } from 'lucide-react';
import { AppLogo } from '@/components/brand/app-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BetaVisitTracker } from '@/components/beta/beta-visit-tracker';
import { trackMetaLead } from '@/components/tracking/meta-pixel';

interface BetaCredentials {
  testerEmail: string;
  password: string;
  loginUrl: string;
  usageSteps: string[];
  privacyNote: string;
  packetText: string;
  emailDelivery?: { attempted: boolean; delivered: boolean };
}

export default function BetaAnfragePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<BetaCredentials | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/beta/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Anfrage fehlgeschlagen.');
        return;
      }

      setCredentials(data);
      trackMetaLead();
      toast.success('Dein Beta-Zugang ist bereit!');
    } catch {
      toast.error('Netzwerkfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} kopiert`);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const downloadPacket = () => {
    if (!credentials) return;
    const blob = new Blob([credentials.packetText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taxdoc-beta-zugang-${credentials.testerEmail.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Anleitung heruntergeladen');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8 sm:py-10">
      <BetaVisitTracker path="/beta-anfrage" />
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-5 sm:mb-6">
            <AppLogo size="lg" showText={false} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">TaxDoc</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight tracking-tight">
            Beta gratis — KI hilft beim Sortieren.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Hochladen, KI-gestützte Sortierhilfe, Überblick behalten. Name und E-Mail reichen — dein Beta-Login erscheint
            sofort. Keine Steuerberatung, Abgabe bleibt bei dir. Transparenter Preis · Kein Abo-Zwang.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>Beta gratis</span>
            <span className="text-gray-300 dark:text-gray-600" aria-hidden>
              ·
            </span>
            <span>KI hilft beim Sortieren</span>
            <span className="text-gray-300 dark:text-gray-600" aria-hidden>
              ·
            </span>
            <span>Hilfsmittel</span>
          </div>
        </div>

        {credentials ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2 shrink-0">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dein Beta-Zugang ist bereit</h2>
                <p className="text-sm text-gray-500">Speichere diese Daten jetzt. Sie werden nur auf dieser Seite angezeigt.</p>
              </div>
            </div>

            <CredentialRow
              icon={<Mail className="w-4 h-4" />}
              label="Tester-E-Mail"
              value={credentials.testerEmail}
              onCopy={() => void copyText(credentials.testerEmail, 'Tester-E-Mail')}
            />
            <CredentialRow
              icon={<Lock className="w-4 h-4" />}
              label="Gemeinsames Passwort"
              value={credentials.password}
              onCopy={() => void copyText(credentials.password, 'Passwort')}
            />
            <CredentialRow
              icon={<ArrowRight className="w-4 h-4" />}
              label="Login-URL"
              value={credentials.loginUrl}
              onCopy={() => void copyText(credentials.loginUrl, 'Login-URL')}
            />

            <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-900/20 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">So nutzt du TaxDoc in der Beta</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {credentials.usageSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-900/20 p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 text-amber-700 dark:text-amber-300" />
                <p className="text-xs text-amber-900 dark:text-amber-200">{credentials.privacyNote}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg">
                <a href={credentials.loginUrl}>
                  Jetzt einloggen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={downloadPacket}>
                <Download className="w-4 h-4 mr-2" />
                Anleitung herunterladen
              </Button>
            </div>

            {credentials.emailDelivery?.attempted && credentials.emailDelivery.delivered && (
              <p className="text-xs text-center text-green-600 dark:text-green-400">
                Optional wurde auch eine E-Mail mit denselben Zugangsdaten angestoßen.
              </p>
            )}
            {credentials.emailDelivery?.attempted && !credentials.emailDelivery.delivered && (
              <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                Hinweis: E-Mail-Zustellung konnte nicht bestätigt werden. Nutze bitte die Angaben auf dieser Seite.
              </p>
            )}

            <p className="text-xs text-center text-gray-500">
              Empfohlener Test: Login → Dokument hochladen → Steuerrechner oder ELSTER-Assistent öffnen → Feedback senden.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 sm:p-8">
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Dein Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Max Mustermann"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12 text-base"
                    required
                    minLength={2}
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Deine E-Mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="du@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-base"
                    required
                    autoComplete="email"
                    inputMode="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <ul className="space-y-2 rounded-lg bg-gray-50 dark:bg-gray-900/40 px-3.5 py-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
                  <span>Beta gratis — kein Abo-Zwang</span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
                  <span>Belege hochladen &amp; mit KI sortieren</span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
                  <span>Hilfsmittel — keine Steuerberatung</span>
                </li>
              </ul>

              <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Zugang wird erstellt...
                  </>
                ) : (
                  <>
                    Jetzt Beta anfragen
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p>
                  Deine Daten dienen nur der Beta-Zuordnung. Kein Spam, keine Weitergabe. Kostenlos &amp; unverbindlich.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function CredentialRow({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        {icon}
        {label}
      </div>
      <div className="flex items-center justify-between gap-3">
        <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{value}</code>
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
