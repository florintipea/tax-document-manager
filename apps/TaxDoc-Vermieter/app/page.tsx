import Link from "next/link";

const BETA_URL =
  process.env.TAXDOC_BETA_URL || "https://taxdoc-beta.onrender.com";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
            TaxDoc-Vermieter
          </Link>
          <nav className="flex items-center gap-5 text-sm text-white/85">
            <Link href="/pilot" className="hover:text-white transition-colors">
              4-Wochen-Pilot
            </Link>
            <Link href="/legal" className="hover:text-white transition-colors">
              Rechtliches
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden">
        <div
          className="hero-media absolute inset-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(105deg, rgba(15,46,38,0.88) 0%, rgba(15,46,38,0.62) 48%, rgba(12,26,23,0.35) 100%), url('/hero-facade.svg')",
          }}
          role="img"
          aria-label="Wohnfassade — Atmosphäre Privatvermietung"
        />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20">
          <p className="animate-rise font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl md:text-7xl">
            TaxDoc-Vermieter
          </p>
          <div className="accent-line mt-4 h-1 w-24 bg-[var(--sand)]" />
          <h1 className="animate-rise-delay mt-6 max-w-2xl font-display text-2xl font-medium leading-snug text-white sm:text-3xl md:text-4xl">
            Belege &amp; Anlage&nbsp;V für Privatvermieter — klar sortiert.
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Separater Pilot für Haus-und-Grund und Privatvermieter. Parallel zu TaxDoc —
            kein Rewrite der Haupt-App.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <a
              href={BETA_URL}
              className="inline-flex items-center justify-center bg-[var(--sand)] px-6 py-3 text-sm font-semibold text-[var(--pine-deep)] transition hover:bg-white"
            >
              Zum TaxDoc Beta
            </a>
            <Link
              href="/pilot"
              className="inline-flex items-center justify-center border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Pilot-Plan ansehen
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--fog)] px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-[var(--pine)] sm:text-3xl">
            Was dieser Track ist
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--ink)]/80">
            TaxDoc-Vermieter ist die zweite App im „2&nbsp;in&nbsp;1“-Setup: eigene Landing,
            eigener Pilot, gleiche GitHub-Account-Logik — aber nicht die Hauptpositionierung
            von TaxDoc. Product/Beta bleibt unter{" "}
            <a className="underline decoration-[var(--moss)] underline-offset-2" href={BETA_URL}>
              taxdoc-beta.onrender.com
            </a>
            .
          </p>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-sm border border-[var(--line)] bg-white px-5 py-6 sm:px-8">
          <h2 className="font-display text-xl font-semibold text-[var(--pine)]">
            Rechtlicher Rahmen
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--ink)]/80">
            <li>Hilfsmittel zur Organisation und Vorbereitung — keine Steuerberatung (§&nbsp;5 StBerG).</li>
            <li>Keine automatische Abgabe an das Finanzamt / kein ELSTER-Auto-Submit.</li>
            <li>Verantwortung für Prüfung und Abgabe bleibt bei Ihnen bzw. Ihrem Berater.</li>
          </ul>
          <Link href="/legal" className="mt-4 inline-block text-sm font-medium text-[var(--moss)] underline-offset-2 hover:underline">
            Ausführliche Hinweise
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] px-5 py-8 text-sm text-[var(--ink)]/60 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display font-semibold text-[var(--pine)]">TaxDoc-Vermieter</span>
          <p>Parallel-Track · Privatvermieter-Pilot · keine Steuerberatung</p>
        </div>
      </footer>
    </div>
  );
}
