# ELSTER Batch-Autofill (Beleg → Zeile)

Kurzbeschreibung der **Batch-Upload → ELSTER-Vorbereitung**-Funktion.

## Was es tut

1. Beliebig viele Belege hochladen (keine künstliche Obergrenze; Verarbeitung in Paketen à 5) **oder** „Alle unsortierten verarbeiten“
2. KI / Regeln sortieren und extrahieren (Kategorie, optional Betrag, Konfidenz)
3. Optional: frühere ELSTER-Erklärung → Steuerprofil-Refresh; Mietvertrag → Immobilien; Hausgeld → V&V
4. Vorschläge → **ELSTER-Vorbereitung** + **Steuerrechner**-Draft
5. Unsichere Felder sind mit **prüfen** und Konfidenz (hoch/mittel/niedrig) markiert

Siehe auch: [OPEN-BACKLOG-TAX-AUTOFILL.md](./OPEN-BACKLOG-TAX-AUTOFILL.md)

## Was es **nicht** tut

- Keine Auto-Abgabe an Mein ELSTER / ERiC
- Kein offizielles ELSTER-XML
- Keine Steuerberatung (StBerG)
- Keine Garantie für Beträge oder Zuordnung

Wahrheitsgemäße Copy: **„KI-Vorschlag / unverbindlich / bitte prüfen / keine Auto-Abgabe“**

## Einstiege (UI)

| Ort | Aktion |
|-----|--------|
| `/settings?tab=taxProfile` | **Frühere ELSTER-Erklärung** hochladen → Steuerprofil + „Neuere Belege erneut anwenden“ |
| `/steuererklaerung?step=profile` | Gleiches Prior-ELSTER-Panel + Profilübersicht |
| `/steuererklaerung?step=documents` | Batch-Panel: Multi-Upload, Unsortierte verarbeiten, Jahr neu zuordnen (ELSTER zuerst) |
| `/documents` | Prior-ELSTER-Panel + Drag&Drop (Chunks) + kompaktes Batch-Panel |
| `/steuererklaerung?step=preview` | Mein-ELSTER-Formularvorschau (Kopierhilfe) |
| `/calculator` | „Aus Belegen/Profil übernehmen“ |

## API

`POST /api/elster/batch-autofill`

```json
{
  "year": 2025,
  "mode": "unsorted",
  "reanalyze": true,
  "applyTaxLines": true
}
```

| `mode` | Bedeutung |
|--------|-----------|
| `unsorted` | Nur ohne/schwache Kategorie für das Jahr |
| `year` | Alle Dokumente des Jahres |
| `ids` | Explizite `documentIds` (nach Upload) |

Antwort enthält pro Datei `status` (`ok` / `error` / `skipped`), Mapping-Hinweis, Konfidenz und aktualisierte `preview`.

## Mapping-Engine

- `lib/tax/beleg-to-elster.ts` — Beleg-Kategorie → Anlage/Feld/Steuerzeile
- `lib/tax/batch-autofill.ts` — Batch-Orchestrierung (Fehler pro Datei isoliert)
- `lib/tax/elster-preview.ts` — Vorschau / Validierung

## Fehlerbehandlung

- Eine kaputte Datei bricht den Batch **nicht** ab
- Upload + Batch-Autofill laufen clientseitig in Paketen à 5 (Stabilität / Rate-Limit); API-Payload-Schutz ist kein Produkt-Limit
- Reanalyze (`POST /api/documents/reanalyze`) meldet `errors[]` pro Datei

## Manueller Test (fiktive Daten)

1. Login (z. B. Tester-Account)
2. `/steuererklaerung` → Jahr wählen → Schritt **Dokumente**
3. Mehrere fiktive PDFs/Dateien hochladen, z. B.:
   - `Gehaltsabrechnung_2025_03.pdf`
   - `Spendenquittung_50,00EUR.pdf`
   - `Apotheke_Rechnung_12,90EUR.pdf`
   - eine absichtlich ungültige Datei (sollte nur diese überspringen)
4. Ergebnis: Kategorien + Vorschläge, danach **Zeilen-Vorschau** prüfen
5. Alternativ: Belege ohne Kategorie → „Alle unsortierten verarbeiten“
6. Export-Checkliste öffnen — **kein** Submit an ELSTER

## Deploy-Hinweis

Nach Merge: `render:deploy` bzw. Git-Push auf die Render-Production-Branch. Live: https://taxdoc-beta.onrender.com

## Verwandt

- [ELSTER-ASSISTENT-PHASE1.md](./ELSTER-ASSISTENT-PHASE1.md)
- Guest-Sortierhilfe: `/beleg-check` (ohne Persistenz)
