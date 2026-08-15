# TaxDoc — Wettbewerbs-Roadmap (weltweiter Qualitätsmaßstab)

**Stand:** 2026-08-01  
**Scope:** Globaler Vergleich (US / UK / CA / FR / DE + Privacy-/UX-Benchmarks). Produkt bleibt **DE-first**, Qualitätsanspruch ist **world-class**.  
**Keine Rechtsberatung.** Keine Fake-Claims. Siehe §7 NO-GO.

Verwandt: [`COMPETITIVE-PARITY-DE.md`](./COMPETITIVE-PARITY-DE.md), [`DATENSCHUTZ-COMPLIANCE.md`](./DATENSCHUTZ-COMPLIANCE.md), [`ELSTER-ASSISTENT-PHASE1.md`](./ELSTER-ASSISTENT-PHASE1.md), [`SECURITY-MONTHLY.md`](./SECURITY-MONTHLY.md), [`PRICING-STRATEGY-WORLDWIDE-DE.md`](./PRICING-STRATEGY-WORLDWIDE-DE.md), [`P0-SHIPPED.md`](./P0-SHIPPED.md).

---

## P0 shipped (2026-08-01)

| ID | Status | Wo |
|----|--------|-----|
| P0-1 Validierung Beleg→Zeile | ✅ | `/steuererklaerung` prüfen-Queue, Summen/Doppelbelege, Export-Ack |
| P0-2 Interview Happy-Path v2 | ✅ | `/interview` + Dashboard-CTA |
| P0-3 Trust Center | ✅ | `/trust` |
| P0-4 Security UX | ✅ | 2FA-Nudge Dashboard, Login-Historie Settings |
| P0-5 Rechner Präzision | ⏸ deferred | nächste Runde |
| P0-6 Preisseite Klarheit + weltweite Positionierung | ✅ | `/pricing` country-aware; Strategie-Doc |
| P0-7 Lawyer-Pack | ⏸ extern | DPA/final Texte |

Details: [`P0-SHIPPED.md`](./P0-SHIPPED.md).

---

## 2-Minuten-Kurzliste (Executive)

| # | Muss | Warum (Benchmark) | Wirkung |
|---|------|-------------------|---------|
| 1 | **Beleg→Zeile Confidence + Validierung härten** | TurboTax „check before submit“; WISO Fehler-Check | Vertrauen + weniger Fehlübertragung in Mein ELSTER |
| 2 | **Geführter Interview-Happy-Path** (1 Flow, 20 Min) | TurboTax Guided Interview; Taxfix Chat | Conversion / Abschlussrate |
| 3 | **Privacy-Story wie Proton** (BYO-Keys, Retention, „wir verkaufen nichts“) | Proton Lumo; Wealthsimple „never sell data“; Apple Privacy Labels | Differenzierung vs. Intuit/Buhl-Datenökonomie |
| 4 | **Security sichtbar machen** (2FA Default-Push, Audit-Log UI, Headers-Badge) | 1Password; N26/Trade Republic Trust-UX | Trust bei sensiblen Belegen |
| 5 | **Preistransparenz FreeTaxUSA-Style** | FreeTaxUSA / Cash App Taxes Klarheit | Weniger Misstrauen vs. TurboTax Upsell |
| 6 | **Grenzgänger als Killer-Feature** | Taxback/Sprintax = Service; Borderpay = Tracker | Niche, die DE-Giganten schwach abdecken |
| 7 | **UX-Geschwindigkeit Linear-Niveau** | Linear / Notion | „fühlt sich teuer an“ ohne teures Marketing |
| 8 | **Support-Chat + FAQ skalieren** (bereits MVP) | H&R Block Live Help; Wealthsimple Pro | Solo-Founder-Hebel |
| 9 | **Offline/Export-Belege** (PDF-Paket, JSON, Druck) | Xero/QBO Docs; FreeAgent | Nützlichkeit ganzjährig, nicht nur März–Juli |
| 10 | **Lawyer + DPA + ehrliche Limits** | Wealthsimple NETFILE-Zertifizierung = Vorbild für *echte* Zert; wir: ehrlich *ohne* Fake-ERiC | Rechtssicherheit + Marketing-Glaubwürdigkeit |

**Positionierung in einem Satz:** TaxDoc ist kein WISO-Klon und kein TurboTax-DE — sondern **ganzjähriges Beleg-OS + ehrliche Mein-ELSTER-Vorbereitung** mit **Privacy-first KI (BYO)** und **Grenzgänger-Tiefe**, gemessen am **globalen** Qualitätsmaßstab.

---

## 1. Executive Summary

Weltweit gewinnen Steuerprodukte durch drei Hebel: **Präzision** (richtige Zahlen, Plausibilität, Import), **Abgabe** (offizielle e-File: IRS / CRA NETFILE / HMRC / ELSTER-ERiC), und **Führung** (Interview, Tipps, Live-Help). TaxDoc kann und darf (heute) **keine** amtliche ELSTER-Übermittlung vortäuschen und **keine** Steuerberatung ersetzen (§ 5 StBerG).

Trotzdem kann TaxDoc **eindrucksvoll** sein — wenn Qualität und Ehrlichkeit zusammenpassen:

| Dimension | World-class Ziel | TaxDoc-Hebel (legal) |
|-----------|------------------|----------------------|
| **Qualität / Präzision** | TurboTax-Check, WISO-Plausi, TaxCalc Review | Beleg→Zeile mit Confidence, „prüfen“-Flags, Rechner mit Quellenangabe, Testfälle |
| **Privacy / Security** | Proton, Apple Privacy, 1Password, Wealthsimple | BYO-AI-Keys, AES-GCM, Export/Löschen, 2FA, Audit, Retention-Klarheit, DPA |
| **Nützlichkeit** | Xero/QBO Docs ganzjährig; FreeAgent Self-Employed | Belege 12 Monate, Grenzgänger-Checklisten, ELSTER-Kopierhilfe, Support-Chat |
| **UX** | Linear Speed, Notion Clarity, Taxfix Mobile | Happy Path, leere Zustände, a11y, Mobile/Capacitor, <2s Kernflows |

**Ehrliche Marketing-Linie (erlaubt):**  
„Vorbereiten, prüfen, selbst in Mein ELSTER abgeben — Belege und KI unter deiner Kontrolle.“  
**Verboten:** „Offizielle Finanzamt-Anbindung“, „wir reichen ein“, „Steuerberater-KI“, „garantierte Erstattung“.

---

## 2. TaxDoc heute (Ist, Stand Beta 2026)

| Bereich | Status | Ort / Hinweis |
|---------|--------|---------------|
| Dokumente Upload/Suche/Bulk | ✅ | `/documents` |
| KI-Assistent multi-Provider | ✅ | BYO-Keys, AES-256-GCM |
| ELSTER-Assistent Phase 1 | ✅ Preview/Checkliste, **kein** ERiC | `/steuererklaerung` |
| Beleg → Zeile + Confidence | ✅ | Mapping-Engine |
| Grenzgänger | ✅ Checkliste / Jahr-Eintrag | `/grenzgaenger` |
| Rechner | ✅ Basis (weiter schärfen) | `/calculator` |
| 2FA, Lockout, Rate-Limit, Security-Logs | ✅ | Settings / Auth |
| DSGVO Export + Löschen | ✅ | Settings |
| Security-Header, Compliance-CI, monatlicher Review | ✅ | Docs + Actions |
| Beta-Funnel + Admin Live-Support | ✅ MVP | `/beta`, `/support`, `/admin` |
| Happy Path Strip | ✅ | Dashboard |
| Fair-Preis-Messaging (€39 Einmallizenz-Richtung) | ✅ Landing | vs. Jahresabo-Zwang |
| Mobile (Capacitor) | 🟡 Scaffold | nicht Product-ready |
| Offizielle Abgabe (ERiC / IRS / NETFILE) | ❌ | bewusst NO-GO bis echte Zertifizierung |
| Bank-/Lohn-Auto-Import (VaSt/Plaid-Level) | ❌ | Paritäts-Lücke |
| Local-first / Zero-access Belege | 🟡 Keys ja; Docs noch Server | Privacy-Roadmap |

---

## 3. Competitor Capability Matrix

Legende: **●** stark · **◐** teilweise · **○** schwach/fehlt · **—** nicht Zielmarkt  
TaxDoc-Spalte = **heute** (Beta), nicht Aspiration.

### 3.1 Nach Capability-Thema (globaler Bar)

| Thema | TaxDoc | DE-Cluster (WISO/taxfix/Smartsteuer/TaxFix/LSt kompakt) | US (TurboTax/H&R/TaxAct/FreeTaxUSA) | CA (Wealthsimple Tax) | UK (TaxCalc/FreeAgent/QBO SE) | Privacy-UX (Proton/1Pw/Apple) | Docs/Accounting (Xero/QBO/FreshBooks) |
|-------|--------|----------------------------------------------------------|--------------------------------------|------------------------|-------------------------------|-------------------------------|----------------------------------------|
| **Präzision Rechenkern** | ◐ | ● | ● | ● | ● | — | ◐ (Buchhaltung ≠ ESt) |
| **Beleg→Feld Mapping + Confidence** | ● (Nische) | ◐–● (OCR/Foto) | ● Import+OCR | ● CRA Auto-fill | ◐ | — | ● Belege→Konten |
| **Offizielle e-File** | ○ | ● ELSTER | ● IRS e-File | ● NETFILE | ● HMRC | — | ○/◐ |
| **Guided Interview** | ◐ Happy Path | ● | ● TurboTax Gold | ● | ◐ | — | ○ |
| **Privacy Transparenz** | ◐→● Pfad | ◐ (DE-Server-Claim Buhl) | ○ oft Cross-Sell | ● „never sell“ | ◐ | ● | ◐ |
| **BYO / User-controlled AI** | ● | ○ (SteuerGPT locked) | ○ | ○ | ○ | ● Lumo | ○ |
| **2FA / Account Security** | ● | ◐–● | ● | ● | ● | ● | ● |
| **Audit-Logs Nutzer-sichtbar** | ◐ Backend | ○ | ◐ | ◐ | ◐ | ● | ◐ |
| **Ganzjährige Belegablage** | ● | ◐ Saison-Fokus | ◐ | ◐ | ● FreeAgent | — | ● |
| **Cross-border / Expat** | ● Grenzgänger | ○–◐ | ◐ | ◐ | ◐ | — | ○ |
| **Preis-Klarheit** | ● Fair-Claim | ◐ Abo | ○ Upsell-Kritik | ● PWYW/$0 | ◐ | ● | ◐ |
| **UX Speed / Polish** | ◐ | ◐–● | ● TurboTax | ● | ◐ | ● | ● Linear-Bar ≠ Accounting |
| **Live Support** | ◐ Solo-Chat | ● Hotline | ● Live/CPA | ◐–● Pro | ● | ◐ | ● |
| **Mobile First** | ◐ | ● Taxfix | ● | ● | ◐ | ● | ● |

### 3.2 Nach Region — DE-Cluster

| Feature | TaxDoc | WISO Steuer | tax / Buhl | Smartsteuer | TaxFix | Lohnsteuer kompakt | Mein ELSTER |
|---------|--------|-------------|------------|-------------|--------|--------------------|-------------|
| ELSTER-Übermittlung §87c | ○ | ● | ● | ● | ● | ● | ● (Portal) |
| VaSt / vorausgefüllt | ○ | ● | ● | ● | ● | ● | ● |
| Interview / Lotse | ◐ | ● | ● | ● | ● Chat | ● | ○ Formulare |
| Beleg-Foto / OCR | ◐ KI | ● | ● | ◐ | ● | ◐ | ○ |
| KI-Assistent | ● BYO | ● SteuerGPT | ◐ | ◐ | ◐ | ○ | ○ |
| Grenzgänger-Tiefe | ● | ○ | ○ | ◐ | ○ | ◐ | ○ manuell |
| Ganzjahr Docs | ● | ◐ | ◐ | ○ | ◐ | ○ | ○ |
| Preismodell | Einmallizenz-Pfad | Abo ~36€ / Einzel ~46€ | Desktop-Kauf | ~36–40€ | ~40–70€ | ~35€ | 0€ |
| DE-Hosting Claim | Render (offen) | Eigene Server DE ● | DE | DE | DE | DE | Staat |

### 3.3 Nach Region — International

| Feature | TaxDoc (DE) | TurboTax | H&R Block | FreeTaxUSA | Cash App Taxes | Wealthsimple Tax | TaxCalc / FreeAgent | Impots.gouv | Taxback / Sprintax |
|---------|-------------|----------|-----------|------------|----------------|------------------|---------------------|-------------|-------------------|
| Guided UX | ◐ | ● | ● | ◐ | ◐ | ● | ◐–● | ○ | Service ● |
| e-File offiziell | ○ | ● | ● | ● | ● | ● | ● | ● | Agent ● |
| Preis-Transparenz | ● Ziel | ○ | ◐ | ● | ● $0 | ● $0/PWYW | ◐ | ● 0€ | Fee/% |
| Privacy Messaging | ● Ziel | ○ | ○ | ◐ | ◐ | ● | ◐ | Staat | ◐ |
| Cross-border | ● DE-AT/CH… | ◐ | ◐ | ○ | ○ | ◐ | ◐ | ○ | ● Service |
| Doc year-round | ● | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ |

### 3.4 UX- & Trust-Benchmarks (nicht Steuer, aber Qualitätsbar)

| Pattern | Vorbild | Was TaxDoc übernehmen soll |
|---------|---------|----------------------------|
| Zero-access / No-logs AI Story | **Proton Lumo** | Klare Texte: BYO-Keys, was den Server verlässt, Retention, kein Training auf Nutzerdaten (Contract + UI) |
| Privacy Labels / „was wir nicht tun“ | **Apple Privacy** | Trust-Seite: Datentypen, Subprozessoren, Verkauf = nein |
| Vault / Recovery UX | **1Password** | 2FA Setup, Backup-Codes, Session-Übersicht |
| Banking Trust | **N26 / Trade Republic** | Security-Center: Geräte, Login-Historie, klare Alerts |
| Product Speed | **Linear** | Cmd+K, snappy Navigation, keine Spinner-Wüste |
| Clarity / Empty States | **Notion** | Jede leere Seite sagt den nächsten Schritt |
| Accounting Docs | **Xero / QuickBooks / FreshBooks / Wave** | Beleg-Pipeline, Kategorien, Export für Steuerjahr |
| FR Expense Neo-Bank | **Shine / Qonto** | Beleg-Foto → Kategorie (Inspiration, nicht Copy) |

---

## 4. Gap-Analyse — Wo die Giganten gewinnen

| Gap | Wer gewinnt | Warum es weh tut | TaxDoc-Antwort (legal) |
|-----|-------------|------------------|------------------------|
| **1-Klick-Abgabe** | WISO, TaxFix, TurboTax, Wealthsimple | Nutzer wollen „fertig“ | Beste **Mein-ELSTER-Checkliste** + Zeitversprechen; später echtes ERiC oder Partner |
| **VaSt / Auto-Import** | DE-Cluster, CRA Auto-fill, Broker-Import US | Weniger Tipparbeit = weniger Fehler | Manuelle + KI-Extraktion härten; Import-Stubs nicht faken |
| **Markenvertrauen / Tests** | Stiftung Warentest, Finanztip, CNET | Solo-Founder hat keine Testsieger-Plakette | Transparenz, Privacy, Niche (Grenzgänger), Reviews von Betatestern |
| **Live CPA / Hotline** | H&R, TurboTax Live, WISO Coaching | Komplexe Fälle brauchen Menschen | In-App-Support skalieren; klar: **keine** Steuerberatung |
| **Mobile Polish** | TaxFix, US Apps | Smartphone-First Erwartung | Capacitor → echte Mobile-Flows für Upload + Checkliste |
| **Refund-Garantie Marketing** | WISO „Ø Erstattung“, Wealthsimple guarantee | Starke Conversion — oft rechtlich heikel | **Keine** Erstattungsgarantie; höchstens Accuracy auf *eigene* Rechenfehler mit Disclaimer |
| **Offizielle Zertifizierung** | IRS Authorized, CRA NETFILE, ELSTER-Schnittstelle | Trust-Signal #1 in Steuer | Nur anstreben wenn Budget/Recht; bis dahin **explizit** Hilfsmittel |

---

## 5. TaxDoc Unique Strengths — verdoppeln

1. **BYO AI** — Nutzer bringt OpenAI/Anthropic/Google-Key; Keys verschlüsselt. Global selten (Gegenteil von locked SteuerGPT / Intuit AI). Nähe zu **Proton**-Philosophie ohne Zero-access-Infrastructure.
2. **Grenzgänger-Modul** — DE-Wohnsitz + AT/CH/… Checklisten. DE-Apps schwach; Taxback = teurer Service; Borderpay = nur Tracker.
3. **Ganzjährige Belegverwaltung** — nicht nur Filing-Season-Tool (Xero-DNA im Steuerkontext).
4. **Ehrlichkeit als Produktfeature** — Mein ELSTER selbst, StBerG-Disclaimer, Compliance-Guard gegen Fake-Claims. FreeTaxUSA-Level Transparenz schlägt TurboTax-Upsell-Ärger.
5. **Fairer Preis** — Einmallizenz-Pfad vs. Abo-Zwang / Pay-at-file Überraschungen.
6. **Beleg→Zeile mit Confidence** — sichtbare Unsicherheit (besser als falsche Sicherheit).
7. **Beta-Funnel + menschlicher Support** — für Solo-Founder ungewöhnlich nah am Nutzer (Linear Support-Kultur).

---

## 6. Priorisierte Improvement Backlog

Impact: **H/M/L** · Effort (Solo): **S** ≤1 Wo · **M** 2–4 Wo · **L** 1–3 Mo · **XL** >3 Mo / Partner

### P0 — Vertrauen + Kernnutzen (jetzt)

| ID | Item | Impact | Effort | Schlägt Wettbewerb wie… |
|----|------|--------|--------|-------------------------|
| P0-1 | **Validierungspaket Beleg→Zeile**: Pflichtfelder, Summen-Check, Doppelbelege, „prüfen“-Queue mit Copy-to-clipboard | H | M | ✅ 2026-08-01 |
| P0-2 | **Interview-Happy-Path v2**: 5–7 Schritte Profil→Belege→Grenz?→Zeilen→Export ELSTER | H | M | ✅ `/interview` |
| P0-3 | **Trust-Center Seite**: Was speichern wir / was nicht, Subprozessoren, BYO-AI Datenfluss, Retention, 2FA, Export/Löschen | H | S | ✅ `/trust` |
| P0-4 | **Security UX**: 2FA Onboarding-Nudge, Login-Historie in Settings, sichtbares Audit „wer wann“ | H | M | ✅ Nudge + Historie |
| P0-5 | **Rechner Präzision DE**: Grundtabelle/Tarif, soli, Grundfreibetrag Jahr X; Quellen + „Schätzung“-Label | H | M | ⏸ deferred |
| P0-6 | **Preisseite FreeTaxUSA-Klarheit**: Was ist drin / nicht drin (kein ELSTER-Submit, keine Beratung) | H | S | ✅ `/pricing` + weltweite Strategie |
| P0-7 | **Lawyer-Pack**: DPA Render (+ Stripe), Datenschutzttext final, Impressum komplett | H | S–M (extern) | ⏸ extern |

### P1 — Nützlichkeit + Polish (nächste 90 Tage)

| ID | Item | Impact | Effort | Benchmark |
|----|------|--------|--------|-----------|
| P1-1 | **Export-Paket Steuerjahr**: PDF-Checkliste + JSON + Beleg-ZIP | H | M | Xero/QBO Export; ELSTER-Druck |
| P1-2 | **Grenzgänger Deepening**: Länder-Karten (CH/AT/FR), Dokument-Gap-Score, DBA-Hinweis nur info | H | M | Taxback Scope als Self-Service-Lite |
| P1-3 | **UX Speed Pass**: Route-Prefetch, Skeleton überall, Cmd+K Actions für ELSTER-Zeilen | M | M | Linear |
| P1-4 | **Empty States + a11y**: WCAG AA Kernseiten, Fokus, Screenreader Labels | M | M | Notion Clarity; Apple a11y |
| P1-5 | **Support FAQ → Bot besser** + Canned Admin-Replies; SLA-Erwartung ehrlich | M | S | H&R chat Lite |
| P1-6 | **Mobile Upload Pfad**: Kamera→Dokument→Kategorie (Capacitor oder PWA) | H | L | TaxFix Foto-Flow; Shine Belege |
| P1-7 | **KI-Confidence Calibration**: niedrige Confidence → Review-UI; kein „Steuertipp garantiert“ | H | M | TaxGPT Professionell + Proton Honesty |
| P1-8 | **Retention Automation**: Soft-Delete Jobs, User-wahlbare Speicherdauer | M | M | Wealthsimple „not longer than needed“ |
| P1-9 | **Offline-fähige Checkliste**: Service Worker Cache für Export-HTML | M | M | Progressive Web; Docs unterwegs |

### P2 — Ambitioniert, nicht fake

| ID | Item | Impact | Effort | Hinweis |
|----|------|--------|--------|---------|
| P2-1 | Echtes **ERiC / ELSTER-Schnittstelle** oder lizenzierter Partner | XL | XL | Nur mit Recht + Zert; sonst weiter NO-GO |
| P2-2 | **VaSt-/Lohn-Import** (offizielle Wege) | H | XL | Wie Wealthsimple CRA — DE-Äquivalent schwer |
| P2-3 | **Local-first / E2E Belege** (Client-side encryption) | H | XL | Proton-Niveau; großes Engineering |
| P2-4 | Externe **Pentest** + Public Security Page | M | M € | Vor Scale |
| P2-5 | Multi-Country Filing Engines (US/CA/UK) | L kurzfristig | XL | Nicht ablenken; Architektur offen halten |
| P2-6 | Bank-Open-Banking Import | M | XL | PSD2; Compliance-Schwer |
| P2-7 | Store Apps (iOS/Android) polished | M | L | Nach PWA-Beweis |

---

## 7. Explizite NO-GO-Liste (legal / regulatory / ethisch)

| NO-GO | Warum |
|-------|--------|
| Als **Steuerberater** auftreten oder Beratung ersetzen | StBerG |
| **Fake-ELSTER-Submit** / „wir übermitteln ans Finanzamt“ ohne ERiC | Irreführung, UWG, Vertrauensbruch |
| **Mein ELSTER scrapen** / Credential-Phishing-Flows | Illegal / ToS |
| **Erstattungsgarantie** à la irreführende Werbevergleiche ohne belastbare Methodik | UWG-Risiko |
| Nutzerdaten an KI-Anbieter senden **ohne** klare Einwilligung / BYO-Klarheit | DSGVO |
| Behaupten „**Zero-access**“ / „**end-to-end**“ ohne technische Wahrheit | Irreführung (Proton hat echte Architektur) |
| **IRS/CRA/HMRC e-File** Claims für DE-Produkt | Falsch |
| Ungeprüfte **DBA-/Quellensteuer-Ergebnisse** als verbindlich | Haftung + StBerG-Nähe |
| Security-Theater („1000 % sicher“) | Bereits in Security-Docs ausgeschlossen |
| Competitor-Integrationen (WISO-Import) als **live** verkaufen wenn Stub | Bereits soft-hide — so lassen |

**Erlaubt:** Hilfsmittel, Schätzungen mit Label, Checklisten, Copy-Paste-Hilfe, Privacy-first Messaging das **stimmt**, Verweis auf Mein ELSTER / Steuerberater.

---

## 8. 90-Tage-Plan (Solo Founder — realistisch)

Annahme: ~20–30 fokussierte Dev-Stunden/Woche + 1 Lawyer-Slot.

### Tage 1–30 — Trust & Precision Foundation

| Woche | Fokus | Deliverables |
|-------|-------|--------------|
| 1 | Trust | Trust-Center Seite; Preisseite „drin/nicht drin“; Compliance-Texte sync |
| 2 | Legal | Anwalt: DPA Render, Datenschutz final, Impressum |
| 3 | Precision | Rechner DE-Jahr 2025/2026 Tarif + Tests; Confidence-Regeln verschärfen |
| 4 | Validation | Beleg→Zeile Validierung + „prüfen“-Inbox |

### Tage 31–60 — Guided Usefulness

| Woche | Fokus | Deliverables |
|-------|-------|--------------|
| 5–6 | Interview v2 | Happy Path End-to-End inkl. Grenzgänger-Branch |
| 7 | Export | PDF+JSON+ZIP Steuerjahr |
| 8 | Security UX | 2FA Nudge, Login-Historie, Audit-UI lite |

### Tage 61–90 — Polish & Niche Moat

| Woche | Fokus | Deliverables |
|-------|-------|--------------|
| 9 | Grenzgänger | CH/AT Deep-Checklisten + Gap-Score |
| 10 | UX Pass | Speed, Empty States, a11y Kernpfad |
| 11 | Mobile | Kamera-Upload PWA oder Capacitor MVP |
| 12 | Buffer | Betatester-Feedback, Bugfixes, Pentest-Angebot einholen |

**Nicht in 90 Tagen:** ERiC, VaSt, E2E-Belege, US/CA Filing Engines.

### Sequenz-Logik

```
Trust-Texte + Lawyer  →  Precision/Validation  →  Interview  →  Export
                              ↓
                        Security UX parallel
                              ↓
                     Grenzgänger + UX Polish + Mobile
```

Privacy-Messaging **vor** aggressivem Marketing — sonst TurboTax-Upsell-Trauma in DE-Form.

---

## 9. Messgrößen (world-class, ehrlich)

| KPI | Ziel 90 Tage | Kommentar |
|-----|--------------|-----------|
| Zeit „erster ELSTER-Export“ | ≤ 25 Min Median | TurboTax-Speed-Äquivalent ohne Submit |
| % Zeilen mit Confidence ≥ 0.8 nach Review | ↑ | Qualität |
| 2FA-Aktivierungsrate Betatester | ≥ 40 % | Security UX |
| Support First-Response | ≤ 24 h | Solo-realistisch |
| Trust-Center Bounce→Signup | tracken | Privacy als Conversion |
| Criticial Bugs Filing-Pfad | 0 | Precision |

---

## 10. Quellen / Research-Stichproben (2026)

- DE: Finanztip Steuersoftware; Buhl WISO/tax Produktseiten; Smartsteuer/TaxFix Vergleiche  
- US: TurboTax / H&R Block / FreeTaxUSA / Cash App Taxes Feature-Vergleiche 2026 Filing Season  
- CA: Wealthsimple Tax NETFILE, Security/Privacy Pages  
- UK: TaxCalc, FreeAgent/QBO Self-Employed Muster  
- Privacy: Proton Lumo zero-access / no-logs; Apple Privacy Labels  
- Cross-border: Taxback/Sprintax (Service); Borderpay-artige Tracker (nicht Filing)  
- Interne Ist-Lage: `COMPETITIVE-PARITY-DE.md`, `ELSTER-ASSISTENT-PHASE1.md`, `DATENSCHUTZ-COMPLIANCE.md`

---

## 11. Fazit

**World-class** heißt nicht „Feature-Parität mit Intuit und Buhl“. Es heißt: in den Dimensionen **Präzision der Vorbereitung**, **Privacy/Security-Glaubwürdigkeit** und **Produktgeschwindigkeit** mit den Besten der Welt mithalten — und in **Grenzgänger + BYO-AI + Ganzjahr-Belege** klar besser sein — **ohne** illegale oder unehrliche Abgabe-Claims.

Nächster operativer Schritt: **P0-3 + P0-6 + P0-1** in dieser Reihenfolge starten.
