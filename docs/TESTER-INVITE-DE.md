# TaxDoc Beta — Tester-Einladung (DE)

Dokumentation für Beta-Tester-Einladungen. **Jeder Tester bekommt genau ein Konto** — nicht dieselbe E-Mail an alle senden.

## Zugangsdaten

| Feld | Wert |
|------|------|
| URL (Login) | https://taxdoc-beta.onrender.com/auth/login |
| Beta-Anfrage (Link in Bio) | https://taxdoc-beta.onrender.com/beta |
| E-Mails (Render aktuell) | `tester001@taxdoc.test` … `tester200@taxdoc.test` |
| Passwort (alle) | `TaxDocTest2026!` |

### Zuordnung Tester → Konto

| Tester | E-Mail |
|--------|--------|
| Tester 01 | `tester001@taxdoc.test` (bei `TEST_ACCOUNT_COUNT=200`) |
| Tester 02 | `tester002@taxdoc.test` |
| Tester 03 | `tester003@taxdoc.test` |
| … | … |
| Tester 99 | `tester99@taxdoc.test` |
| Tester 100 | `tester100@taxdoc.test` |
| … | … |
| Tester 10000 | `tester10000@taxdoc.test` (bei `TEST_ACCOUNT_COUNT=10000` → `tester00001` … `tester10000`) |

**E-Mail-Format:** `tester` + fortlaufende Nummer (zero-padded) + `@taxdoc.test`

Die Padding-Breite = `max(2, Stellenanzahl von TEST_ACCOUNT_COUNT)`:

| `TEST_ACCOUNT_COUNT` | Beispiel Slot 1 | Beispiel Slot 100 | Beispiel Slot 10000 |
|----------------------|-----------------|-------------------|---------------------|
| 50 (Standard) | `tester01` | — | — |
| 100 | `tester01` | `tester100` | — |
| 500 | `tester001` | `tester100` | — |
| 10000 | `tester00001` | `tester00100` | `tester10000` |

Render Production nutzt derzeit `TEST_ACCOUNT_COUNT=200`, daher ist die laufende Nummer 3-stellig (z. B. `tester001`, `tester050`, `tester200`). Historische 2-stellige Konten (`tester01` …) sind nicht Teil der aktuellen Render-Sync-Konfiguration.

**Beispiel-Batch 10–49:** Siehe `docs/TESTER-INVITES-BATCH-10-49.md` (historisches Beispiel für frühe Freunde-Tester).

## Beta-Zugang automatisch (Instagram)

Follower öffnen **/beta** → Name + E-Mail → nächster freier Slot wird zugewiesen. Zugangsdaten erscheinen einmal auf dem Bildschirm (keine E-Mail). Admin: `/admin/tester-activity` (vergeben vs. frei).

## Konten anlegen (nicht alle 10.000 auf einmal!)

```bash
# Standard: 50 Konten (lokal / erste Beta-Runde)
npm run db:create-test-accounts

# Mehr Konten nach Bedarf (max. 10.000)
TEST_ACCOUNT_COUNT=200 npm run db:create-test-accounts

# Verifizieren (App muss laufen)
npm run db:verify-test-accounts
```

**Lokal/Render mit `TEST_ACCOUNT_COUNT=200`:** 200 Konten (`tester001` … `tester200`).

**Render Production:** In Render Shell ausführen:
```bash
TEST_ACCOUNT_COUNT=200 npx tsx scripts/create-test-accounts.ts
```
Migration `BetaInvite` läuft beim Deploy automatisch (`start-production.sh`).

## Hosting (Render Starter)

Die Beta-Instanz läuft auf **Render Starter** — **kein Cold-Start**, die App ist sofort erreichbar.

- Login-URL: https://taxdoc-beta.onrender.com/auth/login
- Kein `wake.html` oder Wartezeit nötig

## Was testen?

1. Login mit der zugewiesenen Tester-E-Mail
2. Dashboard öffnen
3. Kleines PDF hochladen
4. Steuerrechner: Eingaben speichern und Ergebnis prüfen

Bei Problemen: kurze Fehlermeldung + Screenshot an das Beta-Team.

---

## Vorlage — WhatsApp / E-Mail (kopieren & anpassen)

Ersetze `{Name}` und `{EMAIL}` (z. B. `tester003@taxdoc.test` fuer Tester 03 bei `TEST_ACCOUNT_COUNT=200`).

```
Betreff: TaxDoc Beta — Einladung & kurze Hinweise

Hallo {Name},

du bist eingeladen zur TaxDoc Beta:
https://taxdoc-beta.onrender.com/auth/login

Dein Login:
E-Mail: {EMAIL}
Passwort: TaxDocTest2026!

Die App ist sofort erreichbar (Render Starter — kein Warten beim ersten Aufruf).

Bitte testen:
Login → Dashboard → Dokument hochladen (kleines PDF) → Steuerrechner (Eingaben speichern).

Falls etwas nicht funktioniert, schick mir bitte eine kurze Fehlermeldung und einen Screenshot.

Danke fürs Testen — euer Feedback entscheidet über die nächste Runde!

Beste Grüße,
TaxDoc Beta-Team
```

### Beispiel fuer Tester 03

- `{Name}` → z. B. „Max“
- `{EMAIL}` -> `tester003@taxdoc.test`

## Versand

Einladungen werden **manuell** versendet (WhatsApp, persönliche E-Mail, Instagram-DM, etc.). Es gibt **kein** automatisches E-Mail-System im Projekt — SMTP ist optional und derzeit nicht konfiguriert.

**Öffentliche Registrierung:** Die App hat eine `/auth/register`-Seite (14-Tage-Trial), aber Beta-Tester aus Marketing-Kampagnen bekommen **dedizierte `testerNN@taxdoc.test`-Konten** mit Plan `beta-tester` — nicht die öffentliche Registrierung nutzen.
