# TaxDoc — Pfad zu ≥ 1.000.000 DE-Abonnenten in ≤ 12 Monaten

**Stand:** 2026-08-06  
**Live:** https://taxdoc-beta.onrender.com  
**Rolle User:** Marketing / Ops / Partnerships (täglich)  
**Rolle Agent:** Produkt-Gesundheit, Reliability, Growth-Features, Plan-Tracking (täglich)  
**Verwandt:** [`DAILY-ALIGNMENT.md`](./DAILY-ALIGNMENT.md) · [`KPI-TRACKER.md`](./KPI-TRACKER.md) · [`PHASE1-IMPLEMENTED.md`](./PHASE1-IMPLEMENTED.md) · [`../COMPETITIVE-IMPROVEMENT-ROADMAP-DE.md`](../COMPETITIVE-IMPROVEMENT-ROADMAP-DE.md) · [`../ADS-WORLDCLASS-PLAYBOOK-DE.md`](../ADS-WORLDCLASS-PLAYBOOK-DE.md) · [`../ops/DAILY-HEALTH.md`](../ops/DAILY-HEALTH.md)

> **Keine Rechtsberatung.** Keine Fake-ELSTER-/Erstattungsgarantie-Claims. Growth nur mit ehrlicher Positionierung (Hilfsmittel, Mein-ELSTER-Vorbereitung, Privacy-first).

---

## 0. Executive Verdict (ehrlich + ambitioniert)

| Frage | Antwort |
|-------|---------|
| **Ist 1 Mio. *zahlende* Abos in 12 Monaten realistisch?** | **Nein**, ohne **sehr großes Kapital** (typisch **≥ 5–15 Mio. €** Paid+Brand), **viralen Loop (k ≥ 0,8–1,2)**, **B2B/Partner-Kanäle** und/oder **Medien-Event**. Solo + kleines Ads-Budget: nahe unmöglich. |
| **Ist 1 Mio. *registrierte* DE-Nutzer in 12 Monaten ambitioniert machbar?** | **Nur als Stretch**, wenn Funnel, Pixel, Virality und Infrastruktur **früh** sitzen — und Traffic in der Größenordnung **mehrere Mio. LP-Visits** kommt (Paid + Organic + Partner). |
| **Was ist der parallele „überleben & skalieren“-Pfad?** | **50k–200k zahlende** Lizenzen in 12 Monaten als **nachhaltiges Ziel**; 1 Mio. Registered als **Nordstern**. |
| **Was bedeutet „schau dass wir das schaffen“ hier?** | Täglich **compounden**: jeder Marketing-Tag und jeder Agent-Tag muss denselben Funnel und dieselben Gates füttern — nicht Vanity (Follower, Views). |

**Nordstern-Definition (messbar):** siehe §1. Ohne klare Definition ist „1 Mio. Abonnenten“ Marketing-Nebel.

---

## 1. Definition „Abonnenten“ (verbindlich)

### Primary KPI (Nordstern-Zähler)

**DE Product Subscriber** = Account mit:

1. **bestätigter Registrierung** (E-Mail verifiziert *oder* erfolgreicher Erst-Login nach Beta-Zuweisung), **und**
2. **Markt DE** (Profil / Billing-Market `DE`), **und**
3. **entweder**
   - **Paid:** aktive Lizenz/Plan (Starter/Pro/Advisor Tools, Stripe bezahlt, nicht refunded), **oder**
   - **Registered free/beta:** aktiver Account mit mind. 1 Aktivierungs-Event (siehe unten)

**Nicht Primary:** Instagram-/TikTok-/LinkedIn-Follower, Reel-Views, Website-Visits allein.

### Secondary Funnel (Conversion-Kette)

```
Traffic → Landing Page → Signup / Beta-Anfrage → Account aktiv → Paying
```

| Stufe | Definition (TaxDoc) | Wo messen |
|-------|---------------------|-----------|
| **Traffic** | Sessions / Klicks auf LP oder App-URL (UTM) | Meta + Analytics |
| **LP View** | View `/`, `/beta-anfrage`, `/pricing` (je Campaign) | Pixel / Server |
| **Signup** | Beta-Anfrage zugewiesen **oder** Self-Signup complete | `/admin/beta-funnel`, DB |
| **Activation** | Erst-Login **und** ≥1: Dokument-Upload **oder** Interview-Schritt **oder** ELSTER-Checkliste geöffnet | Admin Tester-Activity / Events |
| **Paid** | Erfolgreicher Checkout (Starter/Pro) | Stripe + `/api/billing` |
| **Retained 30d** | Login oder Doc-Aktion in Tagen 8–30 | Product Analytics |

### Zwei parallele Ziele (nicht vermischen)

| Pfad | Ziel 12 Monate | Warum |
|------|----------------|-------|
| **A — Stretch Reach** | **≥ 1.000.000 registrierte DE-Accounts** (Primary Registered) | Marktanteil / Netzwerkeffekt / Partner-Hebel |
| **B — Sustainable Paid** | **50.000–200.000 zahlende** DE-Lizenzen | Cashflow, Support-fähig, glaubwürdig vs. WISO/Taxfix |
| **C — True 1M Paid** | 1.000.000 zahlend | Nur mit Bedingungen in §6 |

---

## 2. Funnel-Modell & Mathematik

### 2.1 Annahmen (Baseline → Stretch)

Cold-Traffic DE Fintech/Steuer — Richtwerte (keine Garantie); anpassen sobald echte Daten aus `/admin/beta-funnel` + Pixel da sind.

| Stufe | Schwach | Ziel | Stark (viral/warm) |
|-------|---------|------|--------------------|
| LP → Signup | 5 % | **10–12 %** | 18–25 % |
| Signup → Activation | 25 % | **45–55 %** | 65 %+ |
| Activation → Paid | 3 % | **8–15 %** | 20 %+ (Season) |
| Paid → Retained 30d | 40 % | **60 %+** | 75 %+ |

**K-Factor (Referral):**  
`k = Invites gesendet × Invite-Accept × Activation`  
Ohne k ≥ **0,3** bleibt Wachstum linear (Ads-Budget = Deckel). Für 1M Registered ohne 8-stellige Ads: Ziel **k ≥ 0,7** ab M4–M6.

### 2.2 Traffic-Bedarf für 1M Registered (Pfad A)

Annahme Ziel-CVR **LP→Signup = 12 %**, **Signup→Active irrelevant für Registered-Zähler** (Registered = Signup bestätigt).

| Registered-Ziel | Benötigte LP-Views (bei 12 % Signup) | ≈ pro Tag (gleichmäßig) | Realität (Ramp) |
|-----------------|--------------------------------------|-------------------------|-----------------|
| 100.000 | ~833.000 | ~2.300 | Peak Q4/Season höher |
| 500.000 | ~4,2 Mio. | ~11.500 | |
| **1.000.000** | **~8,3 Mio.** | **~23.000** | **Monate 9–12: 40–80k+/Tag** |

Zusatz: Bei nur **8 %** LP-CVR steigen Views auf **~12,5 Mio.** — Hook/LP sind also existenziell.

### 2.3 Paid-Pfad B (50k–200k)

| Paid-Ziel | Bei 10 % Activation→Paid aus Activated | Benötigte Activations | Bei 50 % Signup→Act. → Signups | LP-Views @12 % |
|-----------|----------------------------------------|------------------------|--------------------------------|----------------|
| 50.000 | 500.000 Activated | 1.000.000 Signups | ~8,3 Mio. | |
| 100.000 | 1.000.000 Activated | 2.000.000 Signups | ~16,7 Mio. | |
| 200.000 | 2.000.000 Activated | 4.000.000 Signups | ~33 Mio. | |

**Lesart:** 200k Paid in Jahr 1 ohne Virality ≈ **Ads + Partner in Größenordnung großer Consumer-Apps**. Mit starkem Referral + Steuerberater-/Arbeitgeber-Kanälen sinkt Paid-Traffic-Bedarf stark.

### 2.4 Budget-Sensitivität (Paid Acquisition)

| CPL (Signup) | Kosten für 1M Signups | Kommentar |
|--------------|----------------------|-----------|
| 3 € | 3 Mio. € | Sehr aggressiv / nur mit starkem Creative+Offer |
| **8–15 €** | **8–15 Mio. €** | Realistischer Meta-Finance-Bereich DE (kalt) |
| 25 €+ | 25 Mio. €+ | Learning kaputt / falsches Event |

**Schluss:** 1M Registered **rein über Ads** = **Millionen-Budget**. Deshalb: Organic Meta, SEO, PR, Partner, Referral **müssen** ≥ 40–70 % der Signups tragen ab M6.

### 2.5 Revenue-Skizze (Pfad B, Einmallizenz)

Annahme Mix 70 % Starter 24,99 € / 30 % Pro 29,99 € ≈ **~26,50 €** ARPU einmalig (Updates extra).

| Paid | ≈ Umsatz (ohne Updates) |
|------|-------------------------|
| 50.000 | ~1,3 Mio. € |
| 100.000 | ~2,7 Mio. € |
| 200.000 | ~5,3 Mio. € |

Deckt Hosting/Support/Ads **nur**, wenn CAC < LTV und Support skaliert (Self-Serve, FAQ, Caps).

---

## 3. Drei Pfade im Überblick

### Pfad A — Stretch: 1M Registered DE

1. Pixel + Lead-Event wasserdicht (Woche 1).  
2. Hook-Rate / LP-CVR auf Zielniveau (Ads-Playbook).  
3. Self-Signup öffnen (Beta-Cap sprengen) sobald Reliability ok.  
4. Invite/Referral-Loop live (Produkt-Gate).  
5. Partner: Steuerkanzleien-Tools, Arbeitgeber-Benefits, Creator, PR.  
6. Season-Peak Jan–Juli maximal ausfahren.  
7. Infra: weg von OOM-Starter-Falle **vor** Traffic-Spike.

### Pfad B — Parallel: 50k–200k Paid

1. Pricing klar (`/pricing`), Checkout reibungslos.  
2. Activation-onboarding ≤ 10 Min zum „Aha“ (Beleg→Zeile / Checkliste).  
3. Paywall nach Wert, nicht vor Trust.  
4. Season-Campaigns + Retargeting Activated→Paid.  
5. Advisor Tools (B2B-lite) für Multiplikatoren — **ohne** StBerG-Claim.

### Pfad C — Was für *echte* 1M Paid wahr sein muss

Mindestens **drei** der folgenden:

| Bedingung | Konkret |
|-----------|---------|
| **Kapital** | Mehrstelliger Paid+Brand-Budget **oder** VC/Strategic |
| **Viral** | k dauerhaft ≥ 1 **oder** kultureller Hit (Finanztip-Level + Produkt hält) |
| **Distribution** | Großpartner (Bank, Telco, Arbeitgeber-Netz, Steuerberater-Software mit Reach) |
| **Produkt-Parität wahrgenommen** | Nutzer glaubt „besser/fairer als WISO“ für *ihren* Use-Case (nicht ELSTER-Fake) |
| **Ops** | Support, Fraud, Legal, Infra für 7-stellige Accounts |

Ohne das: **1M Paid = Fantasie**. Mit Pfad A+B bleibt das Ziel **ambitioniert steuerbar**.

---

## 4. Channel-Mix (DE)

Priorität nach Hebel × Kontrolle. Details Creatives: [`ADS-WORLDCLASS-PLAYBOOK-DE.md`](../ADS-WORLDCLASS-PLAYBOOK-DE.md), [`INSTAGRAM-VIRAL-MARKETING-DE.md`](../INSTAGRAM-VIRAL-MARKETING-DE.md).

| Kanal | Rolle | M1–M3 | M4–M8 | M9–M12 | Owner |
|-------|-------|-------|-------|--------|-------|
| **Meta Organic** (IG Reels/FB) | Hook-Tests, Trust, Retarget-Audience | 70 % Zeit | 40 % | 25 % | User |
| **Meta Paid** | Skalierbarer Signup-Traffic; nie „Reichweite“ | Learning 20–50 €/Tag | Scale wenn CPL ok | Season max | User |
| **LinkedIn** | Founder + Steuerberater/HR/Expat | 3 Posts/Wo | Partnerschafts-DMs | Thought leadership | User |
| **SEO / Content** | „Belege sortieren“, Grenzgänger, Mein-ELSTER-Hilfe | Tech-SEO + 4 Pillar | 2–4 Artikel/Mo | Seasonal Landing | Agent+User |
| **Partnerschaften** | Steuerberater-Tools, Employer Benefits, Creator | 10 Outreach/Wo | 3 Pilot-Deals | Scale Deals | User |
| **PR** | Gründerstory, Privacy, Fair-Preis | Pitch-Liste | 1–2 Features | Season-Push | User |
| **Referral** | Viraler Loop | Spec | Live + Incentives | Optimize k | Agent→User |
| **Community** | Discord/Telegram Betatester | Soft | Advocacy | UGC | User |

**Budget-Split Vorschlag (sobald Paid läuft):**  
40 % Meta Prospecting · 25 % Retargeting · 15 % Partnerships/Creators · 10 % PR/Tools · 10 % Experimente.

**Steuerberater-Partner:** Positionierung = **Advisor Tools / Beleg-OS für Mandanten-Vorbereitung**, nie „wir ersetzen Beratung“. Employer: Benefit „Belege das Jahr über“ für Mitarbeiter (Privacy-Story).

---

## 5. Produkt-Roadmap-Gates (unlocken Scale)

Verknüpft mit [`COMPETITIVE-IMPROVEMENT-ROADMAP-DE.md`](../COMPETITIVE-IMPROVEMENT-ROADMAP-DE.md). **Ohne Gates = Traffic verbrannt.**

| Gate | Warum Scale-Blocker | Roadmap-IDs | Deadline-Ziel |
|------|---------------------|-------------|----------------|
| **G0 Measurement** | Ohne Pixel/Events keine Optimierung | Ads-Playbook; Admin Funnel | **Woche 1** |
| **G1 Trust Legal** | DE-Scale ohne DPA/Impressum/Datenschutz = Abbruchrisiko | P0-7 Lawyer-Pack; `/trust` ✅ | **M1** |
| **G2 Onboarding ≤10 Min** | Activation tot → Paid tot | P0-2 ✅ härten; Empty States P1-4 | **M1–M2** |
| **G3 Self-Signup + Capacity** | Beta-Slots deckeln 1M | Auth/Billing; Cap entfernen | **M2** |
| **G4 Invite / Referral Loop** | Ohne k bleibt Ads-Deckel | Neu (Growth P0); Invite-Batch-Docs | **M2–M3** |
| **G5 Checkout / Pricing** | Registered ohne Revenue | P0-6 ✅; Stripe friction↓ | **M2** |
| **G6 Reliability @ Load** | OOM Starter, Disk, S3 | [`SCALING-SCAFFOLDS.md`](../SCALING-SCAFFOLDS.md); Health daily | **vor M4 Spike** |
| **G7 Export-Paket** | „Fertig“-Gefühl ohne Fake-Submit | P1-1 | **M3–M4** |
| **G8 Mobile Upload** | Smartphone-First Traffic | P1-6 | **M4–M6** |
| **G9 Grenzgänger Moat** | Differentiation / PR / LinkedIn | P1-2 | **M3–M5** |
| **G10 Support Scale** | 1M Nutzer ohne Self-Serve = Tod | P1-5; Canned replies | **laufend ab M2** |
| **G11 Pentest / Security Page** | Enterprise/Partner Trust | P2-4 | **vor großen B2B-Deals** |

### Priorisierte Growth-Backlog (Agent, zusätzlich zur Competitive-Roadmap)

| ID | Item | Impact | Wann |
|----|------|--------|------|
| GR-1 | Meta Pixel + CAPI + Event `Lead`/`CompleteRegistration`/`Purchase` | H | Sofort |
| GR-2 | UTM + Server-Side Attribution in Admin | H | M1 |
| GR-3 | Referral: Invite-Link, Reward, Anti-Fraud | H | M2–M3 · **MVP live** ([`PHASE1-IMPLEMENTED.md`](./PHASE1-IMPLEMENTED.md)) |
| GR-4 | Activation-E-Mails / In-App Nudges (kein Spam) | H | M2 |
| GR-5 | Public Signup (nicht nur Beta-Slots) | H | M2 |
| GR-6 | Rate-Limits + Queue bei Upload-Spikes | H | M3 |
| GR-7 | S3 / persistente Storage live | H | M3–M4 |
| GR-8 | Status-Page + Error-Budget | M | M4 |
| GR-9 | SEO-Landing Templates (Intent) | M | M2–M12 · **Phase 1:** `/grenze`, `/schweiz`, `/rechner`, `/grenzgaenger`, `/beleg-check` |
| GR-10 | Partner-Landing + Promo-Codes | M | M3+ |

---

## 6. Monatliche Meilensteine M1–M12

Annahmen Start: Beta live, Ads-Learning schwach (Views ohne Leads), Solo-Founder + Agent. Zahlen = **Leading Indicators**, monatlich im KPI-Tracker nachziehen.

| Monat | Registered (kumul.) | Paid (kumul.) | Produkt-Gates | Marketing-Fokus |
|-------|---------------------|---------------|---------------|-----------------|
| **M1** | 500–2.000 | 0–50 | G0, G1 Start, Hook≥Ziel | Pixel, 5 Hook-Varianten, CPL lernen |
| **M2** | 5.000 | 100–500 | G2, G3, G5 | Self-Signup, Retargeting, LinkedIn Outreach |
| **M3** | 15.000 | 500–2.000 | G4 live, G7 Start | Referral Launch, 1 Partner-Pilot |
| **M4** | 40.000 | 2.000–5.000 | G6 Infra, G9 | Scale Ads wenn CPL&lt;Ziel; PR-Pitch |
| **M5** | 80.000 | 5.000–10.000 | G8 Mobile MVP | Creator-UGC, SEO Pillars |
| **M6** | 150.000 | 10.000–25.000 | Support Scale | Halbzeit-Review: kill/scale Kanäle |
| **M7** | 280.000 | 20.000–40.000 | Optimization | Season prep Creatives |
| **M8** | 450.000 | 30.000–60.000 | Partner Scale | Employer/Steuerberater Deals |
| **M9** | 650.000 | 40.000–90.000 | Load-Tests | Early Season Push |
| **M10** | 800.000 | 50.000–120.000 | Stabilität | Peak Traffic Ops |
| **M11** | 920.000 | 60.000–160.000 | Retention | Win-back, Updates-Upsell |
| **M12** | **≥ 1.000.000** Stretch | **50k–200k** Zielband | Review Jahr 2 | Ehrlicher Post-Mortem + Plan Y2 |

**Kill-Kriterien (ehrlich):**  
Wenn nach **M3** LP→Signup &lt; 5 % **und** CPL &gt; 25 € **und** Referral k &lt; 0,1 → Pfad A pausieren, auf Pfad B + Produkt-PMF fokussieren (nicht „mehr Budget auf totes Creative“).

---

## 7. Wöchentliche Cadence

### Montag — Plan & Zahlen

| User | Agent |
|------|-------|
| KPI-Tracker Woche füllen; Budget-Cap setzen | Health-Log lesen; Funnel-Zahlen aus Admin exportieren/helfen |
| Top-3 Marketing-Hypothesen der Woche | Top-3 Product/Growth-Tickets der Woche |

### Di–Do — Execution

| User | Agent |
|------|-------|
| Creatives posten/testen; Ads nur Conversion-Ziel | Ships: Onboarding, Bugs, Growth-Features |
| Outreach Partner/Creator (Quota) | Reliability: Memory, Disk, Deploy-Green |
| Community / Support-Antworten (menschlich) | Support-Tooling, FAQ, Canned Replies |

### Freitag — Learn

| User | Agent |
|------|-------|
| Kill/Keep Creatives; CPL Review | Activation-Funnel Drop-offs analysieren |
| 1 Learning in Ads-Playbook notieren | 1 Learning in dieses Doc oder KPI-Notiz |

### Wochenende (optional, Season)

User: 1–2 Organic Posts max (Burnout vermeiden). Agent: nur P0-Outages.

---

## 8. Tägliche Checklisten

### USER (Marketing / Ops) — ~60–120 Min

- [ ] **Eine** Aktion die Signups oder Activation erhöht (nicht Follower)
- [ ] Meta: Hook-Rate / Outbound-CTR / CPL prüfen (nicht Impressions)
- [ ] Mind. 1 Content-Asset in Pipeline (Hook-Variante, Carousel, Story)
- [ ] Ad-Klicks in `/admin/beta-funnel` eintragen (wenn Paid)
- [ ] 3–10 Outreach (Partner, Creator, LinkedIn) **oder** 1 PR-Schritt
- [ ] Support-Inbox &lt; 24h (Beta-Glaubwürdigkeit)
- [ ] UTM-Links korrekt? Message Match Ad↔LP?

### AGENT (Produkt / Reliability / Growth) — täglich

- [ ] `npm run health:daily` gegen Live → Log grün ([`DAILY-HEALTH.md`](../ops/DAILY-HEALTH.md))
- [ ] P0-Bugs / 500er sofort fixen + deploy
- [ ] Mind. 1 Growth-Gate-Ticket voran (GR-* oder P1 aus Competitive-Roadmap)
- [ ] Funnel-Regression: `/beta-anfrage`, `/pricing`, Auth, Billing Smoke
- [ ] Capacity: Memory/Disk/OOM-Risiko; Scaling-Scaffolds wenn nötig
- [ ] Alignment: heutige Arbeit auf M-Meilenstein mappen ([`DAILY-ALIGNMENT.md`](./DAILY-ALIGNMENT.md))
- [ ] Keine NO-GO Claims in UI/Copy (Competitive §7)

---

## 9. Risk Register

| ID | Risiko | Wirkung auf 1M | Frühwarnung | Mitigation |
|----|--------|----------------|-------------|------------|
| R1 | **Render Starter OOM / Disk voll** | Traffic → Downtime → Trust tot | Health Disk/Memory; 502 Spikes | Upgrade Plan; S3; Rate-Limits; Soft-Delete |
| R2 | **Schwache Hooks** | Views ohne Leads; Budget verbrannt | Hook-Rate &lt; 20 % | 5 Konzept-Varianten; Playbook §3 |
| R3 | **Kein / falsches Pixel-Event** | Meta optimiert Müll | 0 Leads trotz Klicks | G0 Woche 1; CAPI |
| R4 | **Legal / StBerG / UWG** | Abmahnung, Store-Kill, PR-Desaster | Aggressive Copy | Lawyer-Pack; NO-GO-Liste; ehrliche Limits |
| R5 | **Beta-Cap / Invite-Only zu lange** | Ceiling bei wenigen hundert | Slot-Exhaustion | G3 Self-Signup |
| R6 | **Kein Referral** | Lineares Wachstum, Ads-Deckel | k ≈ 0 nach M3 | GR-3 priorisieren |
| R7 | **Activation-Friedhof** | Signups ohne Nutzen → keine Paid, schlechte Word-of-Mouth | Act-Rate &lt; 25 % | Onboarding, Empty States, Nudges |
| R8 | **Support-Kollaps** | 1-Sterne, Churn, Founder-Burnout | Response &gt; 48h | FAQ-Bot, Caps, Status-Page |
| R9 | **Season-Miss** | 70 % Nachfrage in Monaten 1–7 verpasst | Kalender | Creatives+Infra vor Peak |
| R10 | **Vanity-Ablenkung** | Monate ohne Compounding | Follower als KPI | Primary = Registered/Paid |
| R11 | **Competitor Spend / Brand** | CPL steigt | Auction Insights | Niche Grenzgänger + Privacy; Partner |
| R12 | **Datenschutz-Vorfall** | Existentiell | Incidents | Security UX, Retention, Pentest vor Scale |

---

## 10. Nächste 7 Tage (sofort)

| Tag | User | Agent |
|-----|------|-------|
| **1** | Pixel/Events prüfen; Ads-Ziel nur Lead/Conversion | Health daily; Event-Endpunkte verifizieren |
| **2** | 3 neue Hook-Creatives (Konzept verschieden) | LP Message-Match `/beta-anfrage` härten |
| **3** | Organische Posts + 1 Paid Learning-Campaign klein | Activation-Dropoff messen (Admin) |
| **4** | LinkedIn: 20 Steuerberater/HR anschreiben | Referral MVP live — harden Anti-Fraud ([`PHASE1-IMPLEMENTED.md`](./PHASE1-IMPLEMENTED.md)) |
| **5** | Ad-Klicks + Funnel in Admin pflegen; CPL notieren | Lawyer-Pack Status / Trust-Lücken listen |
| **6** | 1 Partner-Pitch (Kanzlei oder Creator) | Infra: Memory/Disk Baseline dokumentieren |
| **7** | Wochen-Review: kill/keep; KPI-Tracker Zeile 1 | Ships: größter Activation-Bug der Woche |

---

## 11. Governance

- **Wöchentlich:** KPI-Tracker aktualisieren.  
- **Monatlich:** Meilenstein M* vs. Ist; Kill-Kriterien prüfen.  
- **Quartalsweise:** Pfad A vs. B vs. C neu bewerten (Kapital, k, Partner).  
- Dieses Doc ist **lebendig** — Zahlen aus echten Funnel-Daten überschreiben Annahmen.

**Bottom line:** Wir zielen auf **1M registrierte DE-Nutzer** als Stretch und **50k–200k Paid** als nachhaltiges Parallelziel. Echte **1M Paid** nur mit Kapital/Viral/Partner — und trotzdem jeden Tag so arbeiten, als ob Compounding der einzige Weg ist.
