# TaxDoc Beta — Einladungen Tester 10–49 (Beispiel-Batch)

> **Hinweis:** Dieses Dokument ist ein **historisches Beispiel** für die erste Freunde-Runde (40 Konten). Das System unterstützt inzwischen bis zu **10.000** Tester-Slots — siehe `docs/TESTER-INVITE-DE.md` für das aktuelle E-Mail-Format und Skalierung.

Vorbereitet für manuellen Versand (WhatsApp / E-Mail). **Keine echten Kontaktdaten im Repo** — Spalte „Kontakt“ unten vom Beta-Team ausfüllen.

## Zugang (alle gleich)

| Feld | Wert |
|------|------|
| URL | https://taxdoc-beta.onrender.com/auth/login |
| Passwort | `TaxDocTest2026!` |

## Zuordnung (40 Konten)

| # | Login-E-Mail | Platzhalter-Name (DB) | Kontakt (ausfüllen) | Status |
|---|--------------|----------------------|---------------------|--------|
| 10 | `tester10@taxdoc.test` | Test User 10 | | ☐ gesendet |
| 11 | `tester11@taxdoc.test` | Test User 11 | | ☐ gesendet |
| 12 | `tester12@taxdoc.test` | Test User 12 | | ☐ gesendet |
| 13 | `tester13@taxdoc.test` | Test User 13 | | ☐ gesendet |
| 14 | `tester14@taxdoc.test` | Test User 14 | | ☐ gesendet |
| 15 | `tester15@taxdoc.test` | Test User 15 | | ☐ gesendet |
| 16 | `tester16@taxdoc.test` | Test User 16 | | ☐ gesendet |
| 17 | `tester17@taxdoc.test` | Test User 17 | | ☐ gesendet |
| 18 | `tester18@taxdoc.test` | Test User 18 | | ☐ gesendet |
| 19 | `tester19@taxdoc.test` | Test User 19 | | ☐ gesendet |
| 20 | `tester20@taxdoc.test` | Test User 20 | | ☐ gesendet |
| 21 | `tester21@taxdoc.test` | Test User 21 | | ☐ gesendet |
| 22 | `tester22@taxdoc.test` | Test User 22 | | ☐ gesendet |
| 23 | `tester23@taxdoc.test` | Test User 23 | | ☐ gesendet |
| 24 | `tester24@taxdoc.test` | Test User 24 | | ☐ gesendet |
| 25 | `tester25@taxdoc.test` | Test User 25 | | ☐ gesendet |
| 26 | `tester26@taxdoc.test` | Test User 26 | | ☐ gesendet |
| 27 | `tester27@taxdoc.test` | Test User 27 | | ☐ gesendet |
| 28 | `tester28@taxdoc.test` | Test User 28 | | ☐ gesendet |
| 29 | `tester29@taxdoc.test` | Test User 29 | | ☐ gesendet |
| 30 | `tester30@taxdoc.test` | Test User 30 | | ☐ gesendet |
| 31 | `tester31@taxdoc.test` | Test User 31 | | ☐ gesendet |
| 32 | `tester32@taxdoc.test` | Test User 32 | | ☐ gesendet |
| 33 | `tester33@taxdoc.test` | Test User 33 | | ☐ gesendet |
| 34 | `tester34@taxdoc.test` | Test User 34 | | ☐ gesendet |
| 35 | `tester35@taxdoc.test` | Test User 35 | | ☐ gesendet |
| 36 | `tester36@taxdoc.test` | Test User 36 | | ☐ gesendet |
| 37 | `tester37@taxdoc.test` | Test User 37 | | ☐ gesendet |
| 38 | `tester38@taxdoc.test` | Test User 38 | | ☐ gesendet |
| 39 | `tester39@taxdoc.test` | Test User 39 | | ☐ gesendet |
| 40 | `tester40@taxdoc.test` | Test User 40 | | ☐ gesendet |
| 41 | `tester41@taxdoc.test` | Test User 41 | | ☐ gesendet |
| 42 | `tester42@taxdoc.test` | Test User 42 | | ☐ gesendet |
| 43 | `tester43@taxdoc.test` | Test User 43 | | ☐ gesendet |
| 44 | `tester44@taxdoc.test` | Test User 44 | | ☐ gesendet |
| 45 | `tester45@taxdoc.test` | Test User 45 | | ☐ gesendet |
| 46 | `tester46@taxdoc.test` | Test User 46 | | ☐ gesendet |
| 47 | `tester47@taxdoc.test` | Test User 47 | | ☐ gesendet |
| 48 | `tester48@taxdoc.test` | Test User 48 | | ☐ gesendet |
| 49 | `tester49@taxdoc.test` | Test User 49 | | ☐ gesendet |

## Nachrichtenvorlage (pro Person)

Ersetze `{Name}` mit dem echten Vornamen und `{EMAIL}` mit der Zeile aus der Tabelle.

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

## Kontakt-CSV (lokal ausfüllen, nicht committen)

Speichere z. B. als `docs/tester-contacts-10-49.csv` (in `.gitignore` aufnehmen, wenn echte Daten):

```csv
tester_number,assigned_email,real_name,contact_email,whatsapp,notes,sent
10,tester10@taxdoc.test,,,,,
11,tester11@taxdoc.test,,,,,
...
49,tester49@taxdoc.test,,,,,
```

Vollständige Account-Liste (generiert): `dist/mobile/TEST-ACCOUNTS.txt` und `dist/mobile/test-accounts.csv` (gitignored).
