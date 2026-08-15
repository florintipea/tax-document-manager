'use client';

/**
 * Filled preview mirroring Mein-ELSTER field layout as closely as practical.
 * Vorbereitung / Hilfsmittel — keine Auto-Abgabe, keine Steuerberatung, kein ERiC.
 */

import Link from 'next/link';
import { ClipboardCopy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import type {
  ElsterAnlage,
  ElsterPreviewField,
  ElsterPreviewResult,
} from '@/lib/tax/elster-preview';

const ANLAGE_ORDER: ElsterAnlage[] = [
  'ESt',
  'N',
  'KAP',
  'V',
  'AUS',
  'Vorsorge',
  'Sonderausgaben',
  'Außergewöhnliche Belastungen',
  'Sonstige',
];

const ANLAGE_TITLES: Record<ElsterAnlage, string> = {
  ESt: 'Mantelbogen / Stammdaten (ESt)',
  N: 'Anlage N — Nichtselbstständige Arbeit',
  KAP: 'Anlage KAP — Kapitalerträge',
  V: 'Anlage V — Vermietung und Verpachtung',
  AUS: 'Anlage AUS / Ausland',
  Vorsorge: 'Vorsorgeaufwendungen',
  Sonderausgaben: 'Sonderausgaben',
  'Außergewöhnliche Belastungen': 'Außergewöhnliche Belastungen',
  Sonstige: 'Sonstige Hinweise / Checkliste',
};

/** Approximate Mein-ELSTER line labels for copy-aid (not official field IDs). */
const FIELD_LINE_HINT: Record<string, string> = {
  'est.vorname': 'Angaben zur Person — Vorname',
  'est.nachname': 'Angaben zur Person — Name',
  'est.idnr': 'Identifikationsnummer',
  'est.steuernummer': 'Steuernummer',
  'est.steuerklasse': 'Steuerklasse (Info)',
  'est.strasse': 'Straße und Hausnummer',
  'est.plz_ort': 'Postleitzahl / Ort',
  'n.brutto': 'Anlage N — Bruttoarbeitslohn',
  'n.werbungskosten': 'Anlage N — Werbungskosten',
  'kap.ertraege': 'Anlage KAP — Kapitalerträge',
  'v.einnahmen': 'Anlage V — Einnahmen',
  'v.nebenkosten': 'Anlage V — Umlagen / Nebenkosten',
  'v.hausgeld': 'Anlage V — Hausgeld / umlagefähige Kosten',
  'v.mietvertrag': 'Anlage V — Mietvertrag / Objektnachweis',
  'v.kauf': 'Anlage V — Anschaffungskosten / AfA-Basis',
  'sa.spenden': 'Sonderausgaben — Spenden',
  'sa.sonstige': 'Sonderausgaben — Sonstige',
  'vorsorge.beitraege': 'Vorsorgeaufwendungen — Beiträge',
  'agb.gesundheit': 'AgB — Krankheitskosten',
  'aus.lohnausweis': 'Ausland — Lohnausweis / Einkünfte',
  'aus.quellensteuer': 'Ausland — Quellensteuer',
};

type Props = {
  preview: ElsterPreviewResult;
};

function confidenceClass(c: string) {
  if (c === 'high') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
  if (c === 'medium')
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  if (c === 'manual')
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
}

const SOURCE_LABEL_DE: Record<string, string> = {
  profil: 'Steuerprofil',
  dokumente: 'Beleg',
  manuell: 'Manuell / Steuerzeile',
  mietvertrag: 'Mietvertrag',
  immobilie: 'Immobilie',
  hausgeld: 'Hausgeldabrechnung',
  nebenkosten: 'Nebenkosten',
  vermietung: 'V&V / Vermietung',
  grenzgaenger: 'Grenzgänger',
};

function copyText(value: string, fieldLabel?: string) {
  const payload = fieldLabel ? `${fieldLabel}: ${value}` : value;
  void navigator.clipboard.writeText(payload).then(
    () => toast.success('Kopiert — in Mein ELSTER einfügen und prüfen'),
    () => toast.error('Kopieren fehlgeschlagen')
  );
}

function groupByAnlage(fields: ElsterPreviewField[]) {
  const map = new Map<ElsterAnlage, ElsterPreviewField[]>();
  for (const a of ANLAGE_ORDER) map.set(a, []);
  for (const f of fields) {
    const list = map.get(f.anlage) || map.get('Sonstige')!;
    list.push(f);
  }
  return ANLAGE_ORDER.map((a) => ({
    anlage: a,
    fields: map.get(a) || [],
  })).filter((g) => g.fields.length > 0);
}

export function MeinElsterFormPreview({ preview }: Props) {
  const groups = groupByAnlage(preview.fields);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-50">
        <p className="font-semibold">
          Vorbereitung / Hilfsmittel — keine Auto-Abgabe · keine Steuerberatung
        </p>
        <p className="mt-1 text-xs leading-relaxed">
          Dieses Formular spiegelt die Feldstruktur von Mein ELSTER so weit wie
          praktisch möglich. Werte sind KI-/Regel-Vorschläge mit Konfidenz und
          Quell-Beleg. Sie sind selbst verantwortlich, jeden Wert vor dem
          Abtippen in Mein ELSTER zu prüfen. TaxDoc übermittelt nichts an das
          Finanzamt (kein ERiC).
        </p>
        <p className="mt-2 text-xs opacity-90">{preview.disclaimerDe}</p>
      </div>

      {groups.map((group) => (
        <section
          key={group.anlage}
          className="overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950"
        >
          <header className="border-b border-slate-300 bg-slate-100 px-3 py-2 dark:border-slate-600 dark:bg-slate-900">
            <h3 className="text-sm font-bold tracking-wide text-slate-900 dark:text-white">
              {ANLAGE_TITLES[group.anlage]}
            </h3>
            <p className="text-[11px] text-slate-500">
              Entsprechung Mein ELSTER — nur zum Abtippen, keine offizielle XML
            </p>
          </header>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {group.fields.map((f) => {
              const display =
                f.valueFormatted ?? (f.value != null ? String(f.value) : '');
              const lineHint = FIELD_LINE_HINT[f.fieldKey] || f.elsterHintDe;
              return (
                <div
                  key={`${f.anlage}-${f.fieldKey}-${f.fieldLabelDe}`}
                  className="grid gap-2 px-3 py-3 sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Feld / Zeile
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {f.fieldLabelDe}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{lineHint}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${confidenceClass(f.confidence)}`}
                      >
                        Konfidenz: {f.confidence}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Quelle: {SOURCE_LABEL_DE[f.source] || f.source}
                      </span>
                      {f.needsReview && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
                          prüfen
                        </span>
                      )}
                    </div>
                    {f.documents.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-blue-700 dark:text-blue-300">
                        {f.documents.map((d) => (
                          <li key={d.id}>
                            <Link
                              href={`/documents?focus=${encodeURIComponent(d.id)}`}
                              className="hover:underline"
                            >
                              Beleg: {d.name}
                              {d.taxAmount != null
                                ? ` (${d.taxAmount.toLocaleString('de-DE')} €)`
                                : ''}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    {f.notes && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {f.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-stretch justify-start gap-1 sm:items-end">
                    <div className="min-w-[8rem] rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-right font-mono text-sm dark:border-slate-600 dark:bg-slate-900">
                      {display || '—'}
                    </div>
                    {display && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<ClipboardCopy className="h-3.5 w-3.5" />}
                        onClick={() => copyText(display, f.fieldLabelDe)}
                      >
                        Kopieren
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {preview.checklist.length > 0 && (
        <section className="rounded-lg border border-slate-300 p-3 dark:border-slate-600">
          <h3 className="text-sm font-semibold">Checkliste vor Mein ELSTER</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-400">
            {preview.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
