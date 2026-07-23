# ELSTER-Assistent — Phase 1

Guided **Steuererklärung / Mein ELSTER preparation** for TaxDoc users who file themselves.

## Route

- **UI:** `/steuererklaerung`
- **Nav:** „Steuererklärung“ / ELSTER-Assistent (logged-in)

## What it does

1. **Year picker** → tax profile check  
2. **Grenzgänger / Ausland** — live in DE, work in AT/CH/LU/FR/NL/BE/DK/PL/CZ/…  
   - Auslandseinkommen, Quellensteuer, DBA hint (info only), Pendeln, Sozialversicherungsland  
3. **Document / category gap check**  
4. **Capture:** Immobilienkauf, Nebenkostenabrechnung, Vermietung & Verpachtung (AfA stub), structured Einnahmen/Ausgaben (incl. Apotheke/Gesundheit)  
5. **Anlagen overview** (only forms with data: ESt, N, KAP, V, AUS, …)  
6. **Zeilen-Vorschau** — field label, suggested value, linked Belege, confidence/source, **prüfen** flags  
7. **Export** — printable HTML checklist + JSON (how to enter into Mein ELSTER)

## Data models

- `Property`, `NebenkostenAbrechnung`, `RentalYearEntry`, `TaxLineEntry`, `GrenzgaengerYearEntry`  
- Document categories include Immobilienkauf, Nebenkosten, V&V, Gesundheit, Lohnausweis Ausland, Quellensteuer, A1, Ansässigkeit, Grenzgänger-Nachweis  

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/elster/preview?year=` | Mapping preview |
| GET | `/api/elster/export?year=` | Printable checklist (`format=json` optional) |
| CRUD-ish | `/api/elster/properties`, `/nebenkosten`, `/rental`, `/entries` | Structured capture |
| GET/PUT | `/api/elster/grenzgaenger?year=` | Cross-border year entry |

Mapping engine: `lib/tax/elster-preview.ts`

## What it does **NOT** do

- **No** official ELSTER / ERiC XML  
- **No** automatic submission to Finanzamt / Mein ELSTER  
- **No** binding tax advice (StBerG)  
- **No** guaranteed AfA, Zumutbarkeit, or DBA outcomes — those are **prüfen** stubs / info text  
- DBA Freistellung vs Anrechnung is **informational only** and country-specific  

Users must verify every figure and submit electronically via **Mein ELSTER** themselves.

## How to test

1. Log in → open **Steuererklärung** in the nav  
2. Pick a year; confirm profile  
3. Enable **Ich bin Grenzgänger**, set work country + foreign income / Quellensteuer  
4. Upload or note docs (Lohnausweis Ausland, etc.)  
5. Add property / Nebenkosten / V&V / expense lines as needed  
6. Review Anlagen + Zeilen-Vorschau  
7. Open printable checklist / JSON export  

`npm run build` should succeed after `prisma migrate deploy` / generate.
