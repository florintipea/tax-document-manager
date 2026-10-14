import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-5 sm:px-8">
          <Link href="/" className="font-display text-lg font-semibold text-[var(--pine)]">
            TaxDoc-Vermieter
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 prose-like">
        <h1 className="font-display text-3xl font-semibold text-[var(--pine)]">
          Rechtliche Hinweise
        </h1>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-[var(--ink)]/80">
          <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
            Hilfsmittel — keine Steuerberatung
          </h2>
          <p>
            TaxDoc-Vermieter und TaxDoc sind digitale Hilfsmittel zur Organisation von
            Belegen und zur Vorbereitung steuerrelevanter Unterlagen. Sie ersetzen keine
            Steuerberatung im Sinne des Steuerberatungsgesetzes (StBerG). Verbindliche
            Auskünfte erteilen nur zugelassene Steuerberaterinnen und Steuerberater bzw.
            die Finanzverwaltung.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-[var(--ink)]/80">
          <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
            Keine automatische ELSTER-Abgabe
          </h2>
          <p>
            Es findet keine automatische Übermittlung an das Finanzamt statt. Eine
            etwaige Abgabe erfolgt ausschließlich durch Sie selbst über Mein ELSTER
            oder durch Ihren Steuerberater. Vorschau- und Zuordnungshilfen sind
            unverbindlich und müssen geprüft werden.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-[var(--ink)]/80">
          <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
            Verantwortung
          </h2>
          <p>
            Sie bleiben für Vollständigkeit, Richtigkeit und fristgerechte Abgabe
            verantwortlich. Schätzungen, KI-Vorschläge und Checklisten sind
            Orientierungshilfen — keine Zusicherung eines bestimmten steuerlichen
            Ergebnisses.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-[var(--ink)]/80">
          <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
            Impressum / Datenschutz
          </h2>
          <p>
            Betreiber und Datenschutzhinweise folgen dem Hauptprodukt TaxDoc
            (florintipea / tax-document-manager). Bis zur eigenen Domain gelten die
            Angaben unter der TaxDoc-Beta-Instanz.
          </p>
        </section>

        <Link
          href="/"
          className="mt-10 inline-block text-sm font-medium text-[var(--moss)] hover:underline"
        >
          ← Zurück zur Landing
        </Link>
      </main>
    </div>
  );
}
