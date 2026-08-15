# TaxDoc Meta — 14-Tage Launch (Ads Manager Klick-für-Klick, DE)

> **Wenn Budget knapp:** siehe [`ORGANIC-VS-PAID-VERGLEICH.md`](./ORGANIC-VS-PAID-VERGLEICH.md) (Mini **5–10 €/Tag** vs. rein organisch — 14-Tage-Vergleich).

**Ziel:** Beta-Signups auf `/beta-anfrage` — nicht Vanity-Views.  
**Budget:** **15–30 €/Tag** für 14 Tage (~210–420 €).  
**Creatives:** `marketing/reel-hook-01` … `05` → Dateien `taxdoc-hook-0X-music.mp4` (**Mixkit Piano behalten**).  
**Primärtexte:** `marketing/ads/ad-d` … `ad-h`.  
**Playbook:** `docs/ADS-WORLDCLASS-PLAYBOOK-DE.md`

> Dieses Dokument ersetzt den alten „Boost Post → mehr Personen“-Weg.  
> Du erstellst eine **Conversions**-Kampagne im **Meta Ads Manager** — nicht den IG-Boost-Button.

---

## 0. Vor dem Start (einmalig)

1. [business.facebook.com](https://business.facebook.com) → **Events Manager** → Pixel anlegen (oder bestehende Pixel-ID kopieren).
2. Render Env: `NEXT_PUBLIC_META_PIXEL_ID=<deine-id>` setzen → Deploy abwarten.
3. Events Manager → **Test Events** → `/beta-anfrage` öffnen → **PageView** prüfen.
4. Formular einmal absenden (Test) → Event **Lead** muss erscheinen (nur nach erfolgreichem Submit).
5. Domain `taxdoc-beta.onrender.com` in Business Manager verifizieren (falls noch nicht).

Ohne Pixel: Fallback-Ziel **Traffic → Landing-Page-Views** (nicht Link-Klicks bevorzugen) — parallel Pixel fixen.

---

## 1. Kampagne anlegen (Tag 1)

1. Öffne [adsmanager.facebook.com](https://adsmanager.facebook.com).
2. Oben rechts: **+ Erstellen** (Kampagne erstellen).
3. Kaufziel: **Conversions** (manchmal „Interaktionen auf der Website“ / „Verkäufe“-Familie — wähle Website-Conversions / Leads).
   - **Nicht** wählen: Reichweite, Engagement, Videoaufrufe, Traffic (außer Fallback).
4. Kampagnenname z. B. `TaxDoc Beta 14d Hooks`.
5. Special Ad Category: prüfen (Finanzprodukte/Dienstleistungen) — Claims fair halten.
6. Budget: **Kampagnenbudget** (CBO) **15–30 €/Tag** · Laufzeit 14 Tage oder fortlaufend mit manuellem Stopp Tag 14.
7. Weiter → Anzeigengruppe.

---

## 2. Anzeigengruppe (Audience)

1. Conversion-Event: **Lead** (Pixel). Fallback: **Landing-Page-Views**.
2. Standort: **Deutschland**.
3. Alter: **25–55**.
4. Sprache: **Deutsch**.
5. Targeting: **Advantage+ / Broad** — keine engen Interessen mischen.
6. Platzierungen: **Advantage+ Platzierungen** ok (Creative ist 9:16).
7. Name z. B. `DE Broad Lead`.

Optional später (eigene Ad Sets): Selbstständige-Interessen · Retarget nur mit Hook 5.

---

## 3. Fünf Anzeigen (Hooks 1–5)

Für **jede** Anzeige:

| Feld | Wert |
|------|------|
| Format | Einzelnes Video / Reel |
| Video | `taxdoc-hook-0X-music.mp4` aus `marketing/reel-hook-0X/` |
| Primärtext | Inhalt aus `ad-d` (1), `ad-e` (2), `ad-f` (3), `ad-g` (4), `ad-h` (5) — Abschnitt „PRIMÄRTEXT“ |
| Überschrift / Beschreibung | aus derselben Datei |
| Website-URL | siehe unten (UTMs) |
| CTA-Button | **Mehr erfahren** oder **Jetzt anmelden** |

### URLs mit UTM (kopieren)

```
https://taxdoc-beta.onrender.com/beta-anfrage?utm_source=meta&utm_medium=paid&utm_campaign=beta_14d&utm_content=hook1_download
https://taxdoc-beta.onrender.com/beta-anfrage?utm_source=meta&utm_medium=paid&utm_campaign=beta_14d&utm_content=hook2_before_after
https://taxdoc-beta.onrender.com/beta-anfrage?utm_source=meta&utm_medium=paid&utm_campaign=beta_14d&utm_content=hook3_selbststaendig
https://taxdoc-beta.onrender.com/beta-anfrage?utm_source=meta&utm_medium=paid&utm_campaign=beta_14d&utm_content=hook4_ugc
https://taxdoc-beta.onrender.com/beta-anfrage?utm_source=meta&utm_medium=paid&utm_campaign=beta_14d&utm_content=hook5_offer
```

(Auch in jedem Ordner: `UTM.txt`.)

Advantage+ Creative: bei Finanz-Claims eher **aus** oder manuell previewen.

---

## 4. Veröffentlichen & Tage 1–14

| Tag | Aktion |
|-----|--------|
| 1 | Kampagne **Veröffentlichen**. Alle 5 Ads live. |
| 2–3 | Nur Tracking prüfen (Lead/PageView, LP mobil). **Kein** Creative killen. |
| 4 | Hook-Rate (3s/Impr.) + Outbound-CTR je Ad — schwächste 1–2 pausieren. |
| 5–7 | Gewinner: optional nur ersten Frame iterieren. |
| 8–10 | Budget Richtung Top-2. Bei CTR↑ und CVR↓ → LP Message Match prüfen. |
| 11–12 | Optional kleines Retarget-Set mit Hook 5. |
| 13–14 | Report: CPL, # Leads, Hook-Rate — nächste Hooks briefen. |

**Kill-Regeln:** siehe Playbook §5. Tag 1–3 nicht wegen CPM killen.

**Scale:** nur Gewinner +20–30 % Budget/Tag — nicht verdoppeln.

---

## 5. Dashboard — was du anschaust

**Primär:** Cost per Lead · # Leads · LP-CVR  
**Sekundär:** Landing-Page-Views · Outbound-CTR · Hook-Rate (3s/Impressions)  
**Ignorieren für Budget:** reine Reichweite / Impressions / Follower

---

## 6. Dateien-Schnellzugriff

| Was | Wo |
|-----|-----|
| Hook-MP4s | `marketing/reel-hook-01` … `05` / `*-music.mp4` |
| Primärtexte | `marketing/ads/ad-d` … `ad-h` |
| Index | `marketing/ads/hooks/README.md` |
| Alte Reel-Boost-Liste | `marketing/reel-short-BOOST-REIHENFOLGE.md` (verweist hierher) |
| Pixel-Doku | Playbook §4.4 + `.env.example` (`NEXT_PUBLIC_META_PIXEL_ID`) |
