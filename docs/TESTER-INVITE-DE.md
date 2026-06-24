# TaxDoc Beta — Tester-Einladung (DE)

Dokumentation für Beta-Tester-Einladungen. **Jeder Tester bekommt genau ein Konto** — nicht dieselbe E-Mail an alle senden.

## Zugangsdaten

| Feld | Wert |
|------|------|
| URL | https://taxdoc-beta.onrender.com/auth/login |
| E-Mails | `tester01@taxdoc.test` … `tester50@taxdoc.test` |
| Passwort (alle) | `TaxDocTest2026!` |

### Zuordnung Tester → Konto

| Tester | E-Mail |
|--------|--------|
| Tester 01 | `tester01@taxdoc.test` |
| Tester 02 | `tester02@taxdoc.test` |
| Tester 03 | `tester03@taxdoc.test` |
| … | … |
| Tester 50 | `tester50@taxdoc.test` |

Format: `tester` + zweistellige Nummer + `@taxdoc.test` (z. B. Tester 07 → `tester07@taxdoc.test`).

## Render Cold-Start (Free Tier)

Die Beta-Instanz schläft nach **~15 Minuten** Inaktivität.

1. Beim ersten Aufruf kann die Seite 1–2 Minuten laden (Render-Startbildschirm).
2. Optional: https://taxdoc-beta.onrender.com/wake.html öffnen — wartet automatisch, bis `/api/health` bereit ist.
3. Danach **Hard Refresh** (Mac: Cmd+Shift+R, Windows: Ctrl+Shift+R) auf der Login-Seite.
4. Dauerhafte Lösung: Render **Starter** (bezahlt) oder Keep-Alive-Ping alle 14 Min.

## Was testen?

1. Login mit der zugewiesenen Tester-E-Mail
2. Dashboard öffnen
3. Kleines PDF hochladen
4. Steuerrechner: Eingaben speichern und Ergebnis prüfen

Bei Problemen: kurze Fehlermeldung + Screenshot an das Beta-Team.

---

## Vorlage — WhatsApp / E-Mail (kopieren & anpassen)

Ersetze `{Name}` und `{EMAIL}` (z. B. `tester03@taxdoc.test` für Tester 03).

```
Betreff: TaxDoc Beta — Einladung & kurze Hinweise

Hallo {Name},

du bist eingeladen zur TaxDoc Beta:
https://taxdoc-beta.onrender.com/auth/login

Dein Login:
E-Mail: {EMAIL}
Passwort: TaxDocTest2026!

Wichtiger Hinweis:
Die App liegt auf Render Free. Nach ca. 15 Minuten ohne Nutzung kann die Instanz schlafen. Wenn die Seite beim ersten Aufruf lange lädt, bitte 1–2 Minuten warten — oder kurz https://taxdoc-beta.onrender.com/wake.html öffnen — und danach die Seite hart neu laden (Hard Refresh).

Bitte testen:
Login → Dashboard → Dokument hochladen (kleines PDF) → Steuerrechner (Eingaben speichern).

Falls etwas nicht funktioniert, schick mir bitte eine kurze Fehlermeldung und einen Screenshot.

Danke fürs Testen — euer Feedback entscheidet über die nächste Runde!

Beste Grüße,
TaxDoc Beta-Team
```

### Beispiel für Tester 03

- `{Name}` → z. B. „Max“
- `{EMAIL}` → `tester03@taxdoc.test`
