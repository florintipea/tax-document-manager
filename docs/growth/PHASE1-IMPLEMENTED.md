# Growth Phase 1 — Implemented

**Stand:** 2026-08-07 (Final Marketing & Legal + echte KI-Sortierhilfe — **live / build grün**)  
**Live:** https://taxdoc-beta.onrender.com  
**Build-Fix:** `nodemailer` Dependency + sicherer Magic-Link-Import (Render exit 1 behoben)  
**Aligned with:** [`PATH-TO-1M-DE-12MONTHS.md`](./PATH-TO-1M-DE-12MONTHS.md)

## Positioning (shipped — FINAL copy)

| Element | Copy |
|---------|------|
| Hero | „Steuer-Chaos beenden. Spezialisiert auf Grenzgänger — perfekt für jeden Steuerzahler.“ |
| Sub | „Ganzjährige KI-Belegablage, unverbindlicher Rechner & Vorbereitung für Mein ELSTER.“ |
| Badge | „Transparenter Preis · Kein Abo-Zwang“ |
| Pricing frame | „Einmalpreis statt teurem Abo-Zwang“ (keine WISO/smartsteuer-Namen in Marketing) |
| Rechner-Ergebnis | „Alle Beträge sind unverbindliche Schätzungen und ersetzen keine Steuerberatung.“ |
| Grenzgänger | „Übersicht & Hilfe bei Auslandsbelegen“ + „Vorbereitung“ — **nie** „Doppelbesteuerungs-Schutz“ |
| Trust | Keine Steuerberatung · Keine Auto-Abgabe · Keine Erstattungsversprechen · Kein Fake-ELSTER |

Admin bleibt admin-only.

## Truthful KI sorting claim (CRITICAL)

### What we claim (allowed)
- **„KI hilft beim Sortieren“** / **„KI-gestützte Sortierhilfe“**
- Upload → Kategorie-Vorschlag mit Konfidenz (z. B. Lohnabrechnung, Rechnung, Spende, Fahrt, Versicherung, Kontoauszug, Steuerdokument, Auslandsbeleg, Homeoffice, Fortbildung, Sonstiges)
- Methode sichtbar: `ai` (Server-Keys) oder `rules` (ohne Keys / Fallback)
- Keine Garantie auf perfekte Zuordnung

### What we do **not** claim
- „sortiert alles automatisch perfekt“
- Steuerberatung / verbindliche Zuordnung zu ELSTER-Zeilen ohne Prüfung
- Dauerhafte Speicherung ohne Konto im Guest-Flow

### Implementation (real, not fake)

| Piece | Path |
|-------|------|
| Rules + normalize | `lib/ai/beleg-sort.ts` |
| Analyzer (AI + rules for DE) | `lib/ai/document-analyzer.ts` |
| Guest API (no login, no persist) | `POST /api/guest/classify` |
| UI | `components/growth/guest-beleg-try.tsx` on `/beleg-check` |
| Logged-in upload | existing `POST /api/documents/upload` (same analyzer) |
| Unit tests | `tests/ai/beleg-sort.test.ts` |

Guest flow: Datei → Rate-Limit → Magic-Bytes → PDF-Text wenn möglich → `DocumentAnalyzer` (DE) → JSON mit Kategorie → UI zeigt Vorschlag → CTA Konto speichern. Datei wird **nicht** dauerhaft gespeichert.

## Delivered features

1. **Landing `/`** — FINAL hero/sub/badge, trust, Quick-Check, soft register, referral.
2. **No-signup Schnell-Rechner** — Toggle **Normaler Arbeitnehmer** \| **Grenzgänger (CH/AT)** (`/rechner` + embed).
3. **Keyword landings (tool first)**
   | Route | Tool |
   |-------|------|
   | `/grenze` | GG Quick-Check |
   | `/schweiz` | GG Quick-Check (CH) |
   | `/rechner` | Quick-Check tabs |
   | `/grenzgaenger` | Übersicht & Hilfe + Quick-Check |
   | `/beleg-check` | Checkliste + **echte** Guest-KI-Sortierhilfe |
4. **Onboarding** — Beleg → KI Sortierhilfe → dann Konto zum Speichern (Magic Link MVP bleibt).
5. **Referral MVP** — 3 Freunde → Pro-Rabatt.
6. **Legal honesty** everywhere.

## Test URLs

- https://taxdoc-beta.onrender.com/
- https://taxdoc-beta.onrender.com/rechner
- https://taxdoc-beta.onrender.com/grenze
- https://taxdoc-beta.onrender.com/schweiz
- https://taxdoc-beta.onrender.com/grenzgaenger
- https://taxdoc-beta.onrender.com/beleg-check
- https://taxdoc-beta.onrender.com/pricing
- https://taxdoc-beta.onrender.com/auth/register?from=beleg-try

## Deferred

- OAuth Google/Apple (CTA Register / Magic Link reicht)
- OCR für Bild-Belege ohne Dateiname-Signal (aktuell: Dateiname + PDF-Text + optional KI)
- Referral anti-fraud

## Main files

- `lib/ai/beleg-sort.ts`, `lib/ai/document-analyzer.ts`
- `app/api/guest/classify/route.ts`
- `components/growth/*`, `lib/growth/*`
- `lib/i18n/messages/de.json`, `en.json`
- `docs/growth/PHASE1-IMPLEMENTED.md`
