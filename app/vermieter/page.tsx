"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/brand/app-logo";
import { AppFooter } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

/**
 * Soft door for Privatvermieter / Haus-und-Grund.
 * Keeps TaxDoc main positioning intact — side entrance, not a rebrand.
 */
const VERMIETER_APP_URL =
  process.env.NEXT_PUBLIC_TAXDOC_VERMIETER_URL || "";

export default function VermieterSoftDoorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-emerald-50/40 to-sky-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="container mx-auto flex-1 px-4 py-12 sm:py-16 max-w-2xl">
        <Link href="/" className="inline-flex mb-8">
          <AppLogo size="md" />
        </Link>

        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
          Soft door · Privatvermieter
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          TaxDoc für Vermieter — Pilot-Eingang
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          Du bist im Hauptprodukt TaxDoc. Für den parallelen Track{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            TaxDoc-Vermieter
          </span>{" "}
          (Privatvermieter / Haus-und-Grund) gibt es eine eigene Landing und einen
          4-Wochen-Pilot — ohne die TaxDoc-Hauptpositionierung zu ersetzen.
        </p>

        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 mb-8">
          Hilfsmittel — keine Steuerberatung. Keine automatische ELSTER-Abgabe.
          Verantwortung bleibt bei dir bzw. deinem Berater.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button
            variant="primary"
            size="lg"
            className="shadow-md"
            onClick={() => router.push("/auth/register")}
          >
            TaxDoc Beta starten
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/steuererklaerung")}
          >
            Zur Steuererklärung / Anlage V
          </Button>
        </div>

        {VERMIETER_APP_URL ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dedizierte Pilot-Landing:{" "}
            <a
              href={VERMIETER_APP_URL}
              className="text-blue-600 dark:text-blue-400 underline"
              rel="noopener noreferrer"
            >
              TaxDoc-Vermieter öffnen
            </a>
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dedizierte App-Landing liegt unter{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
              apps/TaxDoc-Vermieter
            </code>{" "}
            (Deploy folgt). Product/Beta bleibt{" "}
            <a
              href="https://taxdoc-beta.onrender.com"
              className="underline hover:text-blue-600"
            >
              taxdoc-beta.onrender.com
            </a>
            .
          </p>
        )}

        <p className="mt-10 text-sm">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Zurück zur TaxDoc-Startseite
          </Link>
        </p>
      </main>
      <AppFooter />
    </div>
  );
}
