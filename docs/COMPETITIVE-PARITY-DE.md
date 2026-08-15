# Wettbewerbs-Parität (DE) — Strategie

Kurzstrategie für TaxDoc: **ähnlich wo Wettbewerber stärker wirken**, **besser wo TaxDoc echt Mehrwert hat**, **nie über rechtliche Grenzen**.

## 1. Parität (legal) — UX/Wert angleichen

Wettbewerber (WISO, SteuerGo & Co.) gewinnen oft durch:

| Bereich | Was Nutzer erwarten | TaxDoc-Richtung |
|--------|----------------------|-----------------|
| Geführter Flow | Ein klarer Happy Path | Belege → Profil → Steuererklärung → Mein ELSTER |
| Import-Gefühl | Bank/Lohn „einfach rein“ | Später: echte Imports; jetzt: Beleg-Upload + Zuordnung |
| Ergebnis-Klarheit | „Fragen → Ergebnis“ | Zeilen-Vorschau + Checkliste Feld-für-Feld |
| Vertrauen | Impressum, Datenschutz, ehrliche Grenzen | Trust-Seiten + Disclaimers überall |
| Abgabe-UX | Polierte ELSTER-Hilfe | „Mein ELSTER in ~20 Min“ — Nutzer gibt selbst ab |

## 2. TaxDoc MORE — Qualität + fairer Preis

Behalten und schärfen:

- **BYO AI** — eigene KI-Keys, keine Vendor-Lock-in-Illusion
- **Grenzgänger-Tiefe** — Wohnsitz DE + Arbeit AT/CH/… inkl. Beleg-Checkliste
- **Belege das ganze Jahr** — nicht nur Steuerjahres-Endspurt
- **€39 Einmallizenz** (+ optionale Updates) statt teurem Jahresabo-Zwang
- Bessere **Beleg → Zeile**-Zuordnung und **Mein-ELSTER-Checkliste**

**Preisbotschaft:** Faire Alternative zu WISO-Abo — Einmallizenz, Belege ganzjährig, Vorbereitung für Mein ELSTER. Keine Steuerberatung, keine Auto-Abgabe.

## 3. Rechtliche No-Gos — NIE behaupten / NIE faken

| Verbot | Begründung |
|--------|------------|
| Als Steuerberater auftreten / Steuerberatung ersetzen | StBerG |
| Fake-ELSTER-Auto-Submit / „offizielle Finanzamt-Verbindung“ ohne echtes ERiC | Irreführung |
| Mein ELSTER scrapen | Rechtlich/technisch unzulässig |
| Unklare Disclaimer | Nutzer müssen Grenzen verstehen |

**Erlaubt und erwünscht:** Hilfsmittel, Schätzungen, Checklisten, Kopierhilfen für manuelle Eintragung in Mein ELSTER — mit klarer Eigenprüfung und Selbstabgabe.

## 4. Umsetzungs-Priorität

1. Happy Path sichtbar machen  
2. Beleg → Zeile + Confidence/Copy  
3. Mein-ELSTER-Checkliste (Feld-für-Feld, ehrlich)  
4. Grenzgänger-Checkliste  
5. Trust (Impressum/Datenschutz-Struktur) + Preisbotschaft  
6. Halbfertige Paritäts-Stubs (WISO-Import etc.) soft-hide / klar als nicht produktiv kennzeichnen  

**Später (nicht fake):** echtes ERiC, Bank-/Lohn-Import, echte Refund-Schätzung mit belastbaren Daten.

## 5. Status (Stand 2026-07)

| # | Feature | Status | Ort |
|---|---------|--------|-----|
| 1 | Happy Path | ✅ live | `/dashboard` (`HappyPathStrip`) |
| 2 | Beleg → Zeile + Confidence/Copy | ✅ live | `/steuererklaerung` |
| 3 | Mein-ELSTER-Checkliste | ✅ live | `/steuererklaerung` (Feldliste + Copy) |
| 4 | Grenzgänger-Checkliste | ✅ live | `/grenzgaenger` |
| 5 | Fairer Preis auf Landing | ✅ live | `/` (`landing.pricingFair*`) |
| 6 | Impressum / Datenschutz | ✅ Struktur + ehrliche TODOs | `/legal/impressum`, `/legal/datenschutz` |
| 7 | WISO / Integrations-Stubs soft-hide | ✅ | Nav ohne tax-forms; Settings ohne Integrations-Tab; `/settings/integrations` nur Hinweis; `/tax-forms` Stub-Banner |

**Nicht in dieser Runde:** ERiC-Anbindung, Bank-/Lohn-Import, ladungsfähige Impressum-Adresse (TODO bleibt sichtbar).
