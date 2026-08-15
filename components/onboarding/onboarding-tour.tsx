'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, SkipForward, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    title: 'Willkommen bei TaxDoc',
    body: 'Kurzer Überblick — so funktioniert die Beta. Du kannst jederzeit überspringen.',
    image: '/onboarding/slide-01-hook.png',
  },
  {
    title: 'Dokumente hochladen',
    body: 'Lade Rechnungen, Belege und PDFs hoch. TaxDoc hilft bei der Zuordnung — bitte immer prüfen.',
    image: '/onboarding/slide-02-upload.png',
  },
  {
    title: 'KI & Überblick',
    body: 'Assistent und Übersicht unterstützen dich. Ergebnisse sind Schätzungen, keine Steuerberatung.',
    image: '/onboarding/slide-03-ki.png',
  },
  {
    title: 'Bereit zum Testen',
    body: 'Probiere den geführten Weg (~20 Min) oder den ELSTER-Assistenten. Bei Fragen: Hilfe-Chat unten rechts.',
    image: '/onboarding/slide-04-ueberblick.png',
    href: '/interview',
  },
] as const;

export function OnboardingTour() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/onboarding');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && !data.completed) setVisible(true);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const complete = useCallback(
    async (nextHref?: string) => {
      setVisible(false);
      try {
        await fetch('/api/user/onboarding', { method: 'POST' });
      } catch {
        /* ignore — local hide still applied */
      }
      if (nextHref) router.push(nextHref);
    },
    [router]
  );

  if (checking || !visible) return null;

  const current = STEPS[step];
  const isLast = step >= STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Einführungstour"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
        <button
          type="button"
          onClick={() => void complete()}
          className="absolute top-3 right-3 z-10 rounded-full p-2 bg-black/40 text-white hover:bg-black/60"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {step === 0 && (
            <video
              className="absolute inset-0 w-full h-full object-cover opacity-90"
              src="/onboarding/how-it-works.mp4"
              autoPlay
              muted
              playsInline
              loop
              aria-hidden
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="text-xs uppercase tracking-wider opacity-80 mb-1">
              TaxDoc · Schritt {step + 1} / {STEPS.length}
            </p>
            <h2 className="text-xl font-bold leading-tight">{current.title}</h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{current.body}</p>
          <p className="text-[11px] text-gray-400">
            Hinweis: TaxDoc ist ein Hilfsmittel — keine Steuerberatung im Sinne des StBerG.
          </p>

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => void complete()}>
              <SkipForward className="w-4 h-4 mr-1.5" />
              Überspringen
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (isLast) {
                  const href = 'href' in current ? current.href : undefined;
                  void complete(href);
                } else setStep((s) => s + 1);
              }}
            >
              {isLast ? 'Interview starten' : 'Weiter'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
