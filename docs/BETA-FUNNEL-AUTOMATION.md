# Beta Funnel Automation

## Uebersicht

TaxDoc vergibt im Beta-Funnel nach erfolgreicher Anfrage automatisch den naechsten freien Tester-Slot. Die Ausgabe erfolgt primaer direkt auf der Erfolgsseite von `/beta-anfrage`, damit der Flow auch ohne SMTP robust funktioniert.

Ausgegeben werden:

- zugewiesene `tester...@taxdoc.test`-E-Mail
- gemeinsames Passwort
- Login-URL
- kurze Nutzungsanleitung
- Datenschutz-Hinweis
- Download einer `.txt`-Anleitung

Optional kann zusaetzlich eine E-Mail angestossen werden, wenn `BETA_ONBOARDING_EMAIL_WEBHOOK_URL` gesetzt ist. Diese E-Mail ist **nicht** Voraussetzung fuer den Funnel.

## Wie Auto-Onboarding funktioniert

1. Nutzer oeffnet `/beta-anfrage`.
2. Nach Absenden prueft `POST /api/beta/request` die Eingaben und das Rate-Limit.
3. `assignNextBetaSlot()` reserviert atomar genau einen freien Tester-Account.
4. Die API antwortet nur mit den Daten des zugewiesenen Accounts.
5. Die Erfolgsseite zeigt die Zugangsdaten einmalig an und bietet Copy-Buttons + Download.

Wichtig:

- keine Abhaengigkeit von SMTP
- keine Ausgabe anderer Tester-Konten
- bei optionaler E-Mail keine Garantie auf Zustellung

## Ad-Klicks eintragen

Admin-Bereich:

- `/admin/beta-funnel`

Dort:

1. Datum waehlen
2. Anzahl der Ad-Klicks fuer diesen Tag eintragen
3. Auf `Speichern` klicken

Die Werte werden in `DailyAdClick` gespeichert.

## Wo Conversions sichtbar sind

Admin-Bereich:

- `/admin/beta-funnel`

Dort sichtbar:

- Ad-Klicks
- Beta-Anfragen
- Konten zugewiesen
- Erst-Logins
- Aktive Tester
- Conversion Klick -> Anfrage
- Conversion Anfrage -> Zuweisung
- Conversion Zuweisung -> Aktiv

Quick Filter:

- Heute
- 7 Tage
- 30 Tage

Ergaenzende Detailansicht:

- `/admin/tester-activity`

Diese Seite zeigt einzelne Tester-Slots, Zuweisungen, Logins, Uploads und Aktivitaet.
