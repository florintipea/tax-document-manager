import Link from "next/link";

const BETA_URL =
  process.env.TAXDOC_BETA_URL || "https://taxdoc-beta.onrender.com";

const weeks = [
  {
    week: "Woche 1",
    title: "Onboarding & Beleg-Chaos sortieren",
    body: "Teilnehmer anlegen, Mietobjekte erfassen, erste Belege (Mieteinnahmen, Hausgeld, Reparaturen) hochladen. Feedback zur Klarheit der Labels.",
  },
  {
    week: "Woche 2",
    title: "Anlage-V-relevante Zuordnung",
    body: "Kategorien für Einnahmen/Werbungskosten prüfen. Heuristik Vermieter vs. Mieter. Keine Auto-Abgabe — nur Vorbereitungshilfen.",
  },
  {
    week: "Woche 3",
    title: "Haus-und-Grund Feedback-Runde",
    body: "Strukturiertes Interview mit Pilot-Partnern. Pain Points dokumentieren. FounderBlocks-Status abstimmen (siehe Delay-Mail).",
  },
  {
    week: "Woche 4",
    title: "Retrospektive & Go/No-Go",
    body: "Erfolgsmetriken: Aktivierung, Beleg-Upload, NPS-light. Entscheidung: Pilot verlängern, Features priorisieren, Deploy-URL festziehen.",
  },
];

export default function PilotPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-[var(--pine-deep)] text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="font-display text-lg font-semibold">
            TaxDoc-Vermieter
          </Link>
          <a href={BETA_URL} className="text-sm text-white/85 hover:text-white">
            TaxDoc Beta →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--moss)]">
          4-Wochen-Pilot
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--pine)] sm:text-4xl">
          Privatvermieter / Haus-und-Grund
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--ink)]/80">
          Kompakter Pilot-Plan für den parallelen Track. Product bleibt TaxDoc Beta;
          diese Seite steuert Erwartung und Ablauf für den Vermieter-Fokus.
        </p>

        <ol className="mt-10 space-y-8">
          {weeks.map((w) => (
            <li key={w.week} className="border-l-2 border-[var(--moss)] pl-5">
              <p className="text-sm font-semibold text-[var(--moss)]">{w.week}</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-[var(--ink)]">
                {w.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]/75">{w.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 border border-[var(--line)] bg-white px-5 py-5 text-sm leading-relaxed text-[var(--ink)]/80">
          <p className="font-semibold text-[var(--pine)]">Dokumente</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Ausführlich: <code className="text-xs">docs/PILOT-4-WEEKS.md</code>
            </li>
            <li>
              FounderBlocks Delay:{" "}
              <code className="text-xs">docs/FOUNDERBLOCKS-DELAY-EMAIL.md</code>
            </li>
            <li>
              Legal: <Link href="/legal" className="underline">/legal</Link>
            </li>
          </ul>
        </div>

        <p className="mt-8 text-xs text-[var(--ink)]/55">
          Hilfsmittel — keine Steuerberatung. Keine automatische ELSTER-Abgabe.
        </p>
      </main>
    </div>
  );
}
