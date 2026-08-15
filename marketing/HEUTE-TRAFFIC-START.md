# HEUTE — Traffic & Funnel starten (15 Min)

**Datum:** 2026-08-08 · **Priorität:** DE-Traffic & Funnel aktiv füttern  
**Plan:** Arm A organisch **heute** (Tag 1) · Arm B Mini-Paid **optional / später** (nicht heute anlegen)  
**Quelle:** `ORGANIC-VS-PAID-VERGLEICH.md` Tag 1 + Ads-Playbook Hook 1

---

## 1) Welches Video zuerst?

| | |
|--|--|
| **Hook** | Hook 1 — Download-Chaos |
| **Datei (Finder)** | `~/Desktop/TaxDoc-Hooks-Download/taxdoc-hook-01-music.mp4` |
| **Repo-Pfad** | `marketing/reel-hook-01/taxdoc-hook-01-music.mp4` |
| **Hinweis** | Piano behalten — **nicht** stumm ersetzen |

---

## 2) Caption (copy-paste) — Instagram

Aus `marketing/reel-hook-01/CAPTION-IG.txt`:

```
Steuer-PDFs im Download-Chaos?
Suchen. Tippen. Verlieren.
TaxDoc: hochladen, sortieren, Überblick.
Beta gratis — kein Abo-Zwang. Hilfsmittel, keine Beratung.
🧪 Link in Bio → beta-anfrage
#steuererklärung #steuertipps #betatest #deutschland #selbstständig #finanztipps
```

### Facebook (optional, gleicher Tag)

Aus `marketing/reel-hook-01/CAPTION-FB.txt` — **für organisch** die Paid-URL unten durch die Organic-URL ersetzen:

```
Steuer-PDFs im Download-Ordner vergraben?
TaxDoc Beta: Belege hochladen, KI hilft beim Sortieren, Überblick statt Chaos.
Hilfsmittel — keine Steuerberatung. Beta kostenlos.
https://taxdoc-beta.onrender.com/beta-anfrage?utm_source=meta&utm_medium=organic&utm_campaign=beta_14d_compare&utm_content=hook1_download
```

---

## 3) Bio- / Link-URL mit UTM (Arm A — organisch)

**In die Instagram-Bio (und Story-Sticker) setzen:**

```
https://taxdoc-beta.onrender.com/beta-anfrage?utm_source=meta&utm_medium=organic&utm_campaign=beta_14d_compare&utm_content=hook1_download
```

- `utm_medium=organic` — **nicht** `paid`
- Kein Boost auf diesem Post

---

## 4) ManyChat / DM — wenn Kommentar **GRENZE**

Nur relevant, wenn du den Trigger `GRENZE` nutzt (Grenzgänger-Reel / Keyword).  
Details: `marketing/scripts/MANYCHAT-DM-BETA.md`

| Kommentar | DM-Link |
|-----------|---------|
| **GRENZE** | `https://taxdoc-beta.onrender.com/grenze` |
| **BETA** (alt) | `https://taxdoc-beta.onrender.com/beta-anfrage` |

**DM-Text (GRENZE) — copy-paste:**

```
Hey! 👋 Schön, dass du dein Belege-Chaos beenden willst.

Hier ist dein kostenloser Zugang zur TaxDoc Beta:
🔗 https://taxdoc-beta.onrender.com/grenze

Lade einfach dein erstes Foto oder PDF hoch, um die KI-Sortierung und die unverbindliche Schätzung zu testen. Ganz ohne Abo-Zwang! Viel Spaß beim Ausprobieren!
```

Hook-1-Caption heute sagt „Link in Bio“ — ManyChat ist Extra, kein Muss für den ersten Post.

---

## 5) Nach dem Post — Admin Hub checken

1. Einloggen: https://taxdoc-beta.onrender.com/admin  
2. Öffnen: https://taxdoc-beta.onrender.com/admin/beta-funnel  
3. Prüfen:
   - **Visits** auf `/beta-anfrage` (Session/UTM, falls sichtbar)
   - **Beta-Anfragen / Requests** — filtern nach `utm_medium=organic` bzw. `utm_content=hook1_download`
4. Optional Meta Insights: Views, 3s-Views, Profilbesuche, Link-Taps notieren

**Quelle der Wahrheit = Admin Hub**, nicht nur Reel-Views.

---

## Arm B (optional — NICHT heute Meta-Kampagne bauen)

Laut Vergleich **B1 — Signal zuerst**: Tage 1–3 nur organisch.  
Wenn du später Mini-Paid willst: Ads Manager, **5–10 €/Tag**, URL mit `utm_medium=paid` — siehe `ORGANIC-VS-PAID-VERGLEICH.md`.  
**Heute:** keinen Boost, keine neue Kampagne.

---

## Checkliste (abhaken)

- [ ] Finder: `TaxDoc-Hooks-Download` → Hook-01-MP4
- [ ] Bio-Link = Organic-UTM oben
- [ ] Reel IG (+ optional FB) mit Caption aus Abschnitt 2
- [ ] **Kein** Boost
- [ ] ManyChat GRENZE → `/grenze` nur falls Keyword aktiv
- [ ] Admin Hub → Beta-Funnel: Visits / Anfragen checken
