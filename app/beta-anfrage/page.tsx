'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLogo } from '@/components/brand/app-logo';
import {
  ArrowRight,
  Check,
  Copy,
  Loader2,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BetaCredentials {
  testerEmail: string;
  password: string;
  loginUrl: string;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <AppLogo size="lg" showText={false} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              TaxDoc
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            TaxDoc Beta testen
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Trage Name und E-Mail ein — du bekommst sofort deinen persönlichen
            Test-Zugang.
          </p>
        </div>

        {credentials ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Dein Beta-Zugang
                </h2>
                <p className="text-sm text-gray-500">
                  Speichere diese Daten jetzt — sie werden nur einmal angezeigt.
                </p>
              </div>
            </div>

            <CredentialRow
              icon={<Mail className="w-4 h-4" />}
              label="Login-E-Mail"
              value={credentials.testerEmail}
              onCopy={() => void copyText(credentials.testerEmail, 'E-Mail')}
            />
            <CredentialRow
              icon={<Lock className="w-4 h-4" />}
              label="Passwort"
              value={credentials.password}
              onCopy={() => void copyText(credentials.password, 'Passwort')}
            />

            <div className="pt-2 space-y-3">
              <Button asChild className="w-full" size="lg">
                <a href={credentials.loginUrl}>
                  Jetzt einloggen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <p className="text-xs text-center text-gray-500">
                Teste: Login → Dokument hochladen → Steuerrechner. Feedback über
                den Button in der App.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
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
                    className="pl-10"
                    required
                    minLength={2}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
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
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Nur zur Zuordnung — wir senden keine E-Mail.
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Zugang wird erstellt…
                  </>
                ) : (
                  <>
                    Beta-Zugang anfordern
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-center text-gray-500 mt-6">
              Kostenlos · 90 Tage Vollzugang · Made in Germany
            </p>
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
        <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
          {value}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
