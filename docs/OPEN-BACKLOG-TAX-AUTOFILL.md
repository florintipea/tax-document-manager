# Open Backlog — Tax Autofill (A–F)

Priorisierte Checkliste. Status: **live** · **done** · **partial** · **missing**.

**Wahrheitspflicht:** KI-Vorschlag / unverbindlich / bitte prüfen · keine Steuerberatung · keine Auto-Abgabe / kein ERiC.

Live: https://taxdoc-beta.onrender.com

---

## Statusübersicht A–F

| ID | Thema | Status | Kurzbefund |
|----|--------|--------|------------|
| **A** | Batch Belege → Steuerrechner autofill | **live** | `applyCalculator`, Draft+Konfidenz im Batch, Calculator-UI |
| **B** | Frühere ELSTER → Profil-Refresh | **live** | Settings-Banner+Dismiss; Belege-Overlay aktuelles Jahr |
| **C** | Kein hartes Upload-Limit | **live** | Copy ohne „30“; Soft-Cap 500; Chunks à 5 |
| **D** | Immobilien aus Mietvertrag | **live** | Property-Liste; Mieter-Rolle ohne Upsert |
| **E** | Hausgeldabrechnung → V&V | **live** | Nebenkosten-/V&V-Listen mit Review |
| **F** | 1:1 ELSTER-Vorschauformular | **live** | Anlagen-Layout, Quelle DE, Konfidenz, Kopieren; kein ERiC |

**Alle A–F funktional und deployed.**

---

## P0 Details

### A) Batch → Steuerrechner — **live**
- [x] Aggregator, API, UI, Confidence, Deploy

### B) ELSTER → Profil — **live**
- [x] Extract, Banner, Belege-Overlay Jahr-Fix, Deploy

### C) Upload-Limit — **live**
- [x] Soft-Cap, Chunks, i18n ohne Hard-30, Deploy

### D) Mietvertrag → Immobilie — **live**
- [x] Heuristik Vermieter/Mieter, Property-UI, Deploy

### E) Hausgeld → V&V — **live**
- [x] Parse/Apply, UI-Listen, Deploy

### F) ELSTER-Vorschau — **live**
- [x] Formular nach Anlagen, Quelle-Beleg, Konfidenz, Kopieren
- [x] Label: Vorbereitung / keine Auto-Abgabe / kein ERiC
- [x] Deploy

---

## Bekannte Grenzen

- PDF-OCR begrenzt Extraktion
- Keine offizielle ELSTER-XML / kein ERiC
