# Tägliche Ausrichtung auf das 1M-Ziel

**Zweck:** Jeder Tag von User + Agent muss denselben Nordstern füttern.  
**Nordstern:** ≥ 1.000.000 **DE Product Subscribers** (Registered Stretch) + paralleles Paid-Band 50k–200k — Definition in [`PATH-TO-1M-DE-12MONTHS.md`](./PATH-TO-1M-DE-12MONTHS.md) §1.  
**Live:** https://taxdoc-beta.onrender.com

Follower, Views und „beschäftigt wirken“ zählen **nicht**, außer sie erzeugen messbar Traffic → Signup → Activation → Paid.

---

## Compounding-Regel

> Wenn die heutige Aufgabe weder (a) mehr qualifizierte Signups, (b) höhere Activation/Paid, (c) höheren k-Factor, noch (d) Reliability für mehr Last erzeugt — **streichen oder umwidmen**.

---

## USER — Marketing / Ops (täglich)

| # | Aktion | Mappt auf |
|---|--------|-----------|
| 1 | Eine Conversion-Aktion (Creative, Ad, Outreach, PR, Partner) | Traffic / Signup |
| 2 | Meta-Metriken: Hook-Rate, CTR, **CPL** — nicht Reichweite | Funnel-Qualität |
| 3 | Message Match Ad ↔ LP (`/`, `/grenze`, `/schweiz`, `/rechner`, `/grenzgaenger`, `/beleg-check`, `/beta-anfrage`, `/pricing`) | LP→Signup |
| 4 | Ad-Klicks in `/admin/beta-funnel` (wenn Paid) | Messung |
| 5 | Support &lt; 24h antworten | Activation / Trust / Word-of-Mouth |
| 6 | Mind. ein Asset in der Hook-Pipeline | Skalierung Creatives |

**Wochenquota (Minimum):** 5 Hook-Tests · 30 Outreach · 1 Funnel-Review · KPI-Zeile freitags.

---

## AGENT — Produkt / Reliability / Growth (täglich)

| # | Aktion | Mappt auf |
|---|--------|-----------|
| 1 | `npm run health:daily` → Log grün ([`../ops/DAILY-HEALTH.md`](../ops/DAILY-HEALTH.md)) | Reliability = Scale-Voraussetzung |
| 2 | P0-Ausfälle fixen + deployen | Trust / Retention |
| 3 | Ein Ticket an Gate G0–G11 oder GR-* voranbringen | Scale unlock |
| 4 | Smoke: Signup/Beta, Pricing, Auth, Billing-Pfad | Funnel nicht kaputt |
| 5 | Capacity (Memory/Disk/OOM) im Blick; Scaling wenn nötig | Vermeidet R1 |
| 6 | Keine NO-GO-Claims in Ship-Copy | Legal / Marke |

**Wochenquota (Minimum):** 1 Growth-Gate-Ship · 1 Activation-Verbesserung · Infra-Check vor Traffic-Erhöhung.

---

## Gemeinsam (täglich, 5 Min Sync-Mentalmodell)

1. **Welcher Monats-Meilenstein (M1–M12) ist aktiv?**  
2. **Welcher Engpass heute?** Traffic · LP-CVR · Activation · Paid · Infra · Legal  
3. **Eine gemeinsame Priorität** für den Tag (nicht zehn).

---

## Was bewusst *nicht* täglich

- Neue Features ohne Gate-Bezug  
- Redesigns ohne Conversion-Hypothese  
- Follower-Kampagnen / Boost „Reichweite“  
- Internationale Filing-Engines (ablenken vom DE-1M)

---

## Bei Zielkonflikt

| Konflikt | Entscheidung |
|----------|--------------|
| Schönes Feature vs. Referral-Loop | **Referral / Activation zuerst** |
| Mehr Ads vs. kaputtes Pixel | **Pixel zuerst** |
| Content-Volume vs. Hook-Qualität | **Qualität (Konzept-Vielfalt)** |
| Neuer Markt vs. DE-Scale | **DE zuerst** |
| Uptime-Arbeit vs. Growth-Feature bei rotem Health | **Health zuerst** |

Vollplan, Mathematik, Risks: [`PATH-TO-1M-DE-12MONTHS.md`](./PATH-TO-1M-DE-12MONTHS.md) · KPIs: [`KPI-TRACKER.md`](./KPI-TRACKER.md) · Phase 1: [`PHASE1-IMPLEMENTED.md`](./PHASE1-IMPLEMENTED.md)
