# TaxDoc — Weltweite Preisstrategie

**Stand Recherche:** August 2026  
**Produkt:** DE-first (Mein-ELSTER-Vorbereitung). Keine Fake-e-File-Claims.  
**Keine Rechtsberatung.** Preise = Orientierung aus öffentlichen Quellen; vor Kauf immer aktuelle Anbieterseite prüfen.

Verwandt: [`COMPETITIVE-IMPROVEMENT-ROADMAP-DE.md`](./COMPETITIVE-IMPROVEMENT-ROADMAP-DE.md), `lib/billing/market-pricing.ts`.

---

## 1. Ziele

1. **Unter** typischen bezahlten Alternativen im jeweiligen Markt  
2. **Einstieg erschwinglich** (Free/Beta + Starter)  
3. **Profitabel** — keine Race-to-zero; klare Margen dank BYO-AI  
4. **#1 Preis–Leistung–Qualität** wo TaxDoc echt liefert (Belege ganzjährig, Beleg→Zeile, Privacy, Grenzgänger)

**Nicht:** „Günstiger als Mein ELSTER / Impots.gouv / FinanzOnline / HMRC“ (staatlich = 0 €).

---

## 2. Wettbewerber-Preise (Stichprobe Aug 2026)

### DE (Kernmarkt)

| Anbieter | Öffentlicher Richtpreis | Quelle / Hinweis |
|----------|-------------------------|------------------|
| **Mein ELSTER** | 0 € | Staatliches Portal — Referenz, kein Preisziel |
| **CHECK24 Steuer** | 0 € | CHIP Online-Vergleich 2026 |
| **Lohnsteuer kompakt / SteuerGo** | ca. **34,95 €** / Abgabe | CHIP |
| **smartsteuer** | ca. **35,99–39,99 €** / Abgabe | finanzfacts / CHIP |
| **WISO Steuer** | **35,99 €** Abo / **45,99 €** Einzelkauf | [buhl.de/steuer/kaufen](https://www.buhl.de/steuer/kaufen/) |
| **Taxfix** | ca. **39,99 €** / Abgabe | finanzfacts |
| **SteuerSparErklärung** | ca. **26–60 €** je Edition | geldio / GMX Partnerpreise |

**Schlussfolgerung DE:** Bezahlte Cluster ~**35–46 €** pro Saison. TaxDoc muss klar **unter ~35 €** für den Haupt-SKU liegen und Mehrwert (ganzjährig, BYO-AI, Grenzgänger) ohne ELSTER-Submit-Claim verkaufen.

### AT / CH (Stubs + Grenzgänger-Nische)

| Markt | Typische Alternative | Richtpreis | TaxDoc-Haltung |
|-------|----------------------|------------|----------------|
| **AT** | FinanzOnline (Staat) | 0 € | Kein „günstiger als Staat“; TaxDoc = DE-Beleg-OS / Grenzgänger-Hilfe |
| **CH** | Kantonale Portale (eTAX, ZHprivateTax, …) | 0 € | Staat = Referenz |
| **CH** | KI-Helfer (z. B. meinesteuern.ch ~CHF 35; iqtax ~CHF 39–99) | **CHF 29–99** | TaxDoc zeigt CHF-Äquivalent nur für **DE↔CH Grenzgänger-Vorbereitung**, kein CH-Filing |

### US (Stubs — kein IRS e-File)

| Anbieter | Richtpreis Filing 2026 | Quelle |
|----------|------------------------|--------|
| Cash App Taxes | **$0** fed+state | CNBC / Vergleichsportale |
| FreeTaxUSA | **$0** federal + **~$15.99** state | freetaxusa / Canopy |
| H&R Block DIY | ~**$35–85** federal + state | Vergleichsportale |
| TurboTax DIY | ~**$79–139** federal + ~$40–64 state | PrimeWay / Comparison Math |
| TaxAct | ~**$30–100** federal + state | Canopy |

**Haltung:** Preise nur als Marktvergleich; Verkauf = **DE-Produkt** / Doc-Prep-Stub. Nie „US e-File inklusive“.

### CA (Stub)

| Anbieter | Richtpreis | Quelle |
|----------|------------|--------|
| Wealthsimple Tax Basic | **PWYW ab $0 CAD** (voller Funktionsumfang) | wealthsimple.com |
| Wealthsimple Plus / Pro | **~$40 / ~$80 CAD** | Help Centre / Pricing |
| TurboTax Canada | tiered DIY (Pay-when-you-file) | turbotax.intuit.ca |

**Haltung:** Unter $0 NETFILE unmöglich. TaxDoc = ehrlich DE-first; kein NETFILE-Claim.

### UK / FR (Stubs)

| Markt | Alternative | Richtpreis | Haltung |
|-------|-------------|------------|---------|
| **UK** | HMRC Self Assessment | 0 £ | Staatlich; Commercial (FreeAgent etc.) = Buchhaltung, nicht 1:1 |
| **FR** | Impots.gouv | 0 € | Staatlich; TaxDoc kein FR-Filing |

---

## 3. TaxDoc Zielpreise (vorgeschlagen, Aug 2026)

### DE / AT (EUR) — live verkaufbar

| Tier | Preis | Was | Warum profitabel / wettbewerbsfähig |
|------|-------|-----|-------------------------------------|
| **Free / Beta** | **0 €** | Belege, Happy-Path, Basis-Checkliste, Support-MVP | Acquisition; Beta-Invites bleiben frei |
| **Starter** | **24,99 €** Einmallizenz | Docs + ELSTER-Vorbereitung + Mapping | **Unter** Lohnsteuer kompakt / smartsteuer (~35 €) |
| **Pro** | **29,99 €** Lizenz + **14,99 €**/Jahr Updates | + BYO-AI, Grenzgänger, Export, Validierung | **Unter** WISO-Abo (35,99 €); Updates optional |
| **Advisor Tools** | **249 €** Lizenz + **99 €**/Jahr | Multi-Client / Export-Tools — **keine** StBerG-Beratung | Unter bisherigem 390 €; klar als Tooling |

### CH (Anzeige, CHF)

| Tier | Preis | Hinweis |
|------|-------|---------|
| Starter | **CHF 24** | Nur wenn CH-Profil; Features = DE-Grenzgänger-Prep |
| Pro | **CHF 29** + **CHF 15**/Jahr | Kein Kantons-Filing |

### US / CA / UK (Anzeige nur, Coming soon)

| Markt | Anzeige-Starter | Vergleichsschnipsel | Verkauf |
|-------|-----------------|---------------------|---------|
| US | **$19** Lizenz-Äquivalent | vs. TurboTax Deluxe ~$79+ | **Nicht** e-File; Stub |
| CA | **CAD $19** | vs. Wealthsimple Plus ~$40 (Support) — Basic bleibt $0 | Stub |
| UK | **£19** | vs. commercial SA tools / accounting | Stub |

---

## 4. COGS & Marge (Annahmen Solo / Render)

| Kostenart | Annahme / Monat | Kommentar |
|-----------|-----------------|-----------|
| Hosting Render (Starter) | ~**7–25 €** | Disk + Web Service |
| LLM / KI | **~0 €** (BYO Keys) | **Hauptmargenhebel** vs. SteuerGPT-locked Konkurrenz |
| Stripe Fees | ~**1,5 % + 0,25 €** / Zahlung | Nur bei Checkout |
| Support-Zeit | variabel | Beta: In-App-Chat; skaliert mit Testers |
| Storage Belege | im Hosting | Soft-Delete / Retention später (P1) |

**Break-even grob:** Bei ~**2–3 Pro-Lizenzen/Monat** decken Fixkosten Hosting; Starter und Updates verbessern Cashflow. Free/Beta kostet Support — Cap durch Invite-Flow.

**Nicht verkaufen:** ELSTER-Submit, Steuerberatung, VaSt-Import, Erstattungsgarantie.

---

## 5. Messaging-Regeln

- FreeTaxUSA-Klarheit: **drin / nicht drin** auf `/pricing`
- Pro Markt: „vs. [Lokal]: TaxDoc X / Wettbewerb Y (Stand Aug 2026)“ — mit Disclaimer „Preise ändern sich“
- Non-DE: Badge **„DE-first — Filing in diesem Land noch nicht live“**
- Advisor-Tier heißt **Advisor Tools**, nie „Steuerberater-Service“

---

## 6. Umsetzung im Code

- `lib/billing/market-pricing.ts` — Länder → Displaypreise + Vergleichstexte  
- `lib/billing/plans.ts` — kanonische EUR-Checkout-Preise (Starter/Pro/Advisor)  
- `/pricing` — Länderwahl + Matrix + Vergleich  
- Beta: weiterhin kostenlos über Invite / Testphase  

---

## 7. Review-Cadenz

Preise und Wettbewerber-Stichprobe **jedes Filing-Jahr** (Nov–Feb) aktualisieren; Quellenlinks oben ersetzen wenn Herstellerpreise springen.
