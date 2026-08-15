# Admin Live-Support & Onboarding (MVP)

## Was ist gebaut

TaxDoc benachrichtigt Admins bei Beta-Interesse, erlaubt In-App-Chat mit Testern und zeigt Erstnutzern eine kurze Einführungstour. Admins können **proaktiv** Tester anschreiben, sobald diese eingeloggt / aktiv sind.

## Flows

### 1) Beta-Besuch / Interesse

1. Besucher öffnet `/beta` oder `/beta-anfrage`.
2. `BetaVisitTracker` sendet `POST /api/beta/visit` (IP gehasht, Session-ID, optional UTM).
3. Event landet in `BetaVisitEvent`; bei neuem Besuch (5-Min-Dedup) entsteht `AdminNotification` „Neuer Beta-Besuch“.
4. Erfolgreiche Anfrage (`POST /api/beta/request`) erzeugt zusätzlich „Neue Beta-Anfrage“ und einen Willkommens-Support-Thread.

### 2) Support-Chat

| Rolle | Wo |
|--------|-----|
| Tester | Hilfe-Button unten rechts, Seite `/support` |
| Admin | `/admin/support` + Glocke in der Navbar + **Nachricht senden** in Admin-Zentrale / Tester-Aktivität |

- Modelle: `SupportThread`, `SupportMessage` (`user` / `admin` / `bot`)
- Regelbasierter Bot (FAQ zu Login, Upload, Rechner, ELSTER, Datenschutz)
- Keywords wie `hilfe`, `problem`, `funktioniert nicht` → Status `escalated` + Notification „Kunde braucht Hilfe“
- Polling ~10–15s; Admin-Badge auch per SSE `/api/admin/notifications/stream`
- **Proaktiv (Admin → Tester):** `POST /api/admin/support` mit `{ userId, body? }` öffnet/erstellt Thread und setzt bei Nachricht `waiting_user`. Tester sieht Unread-Badge am Hilfe-Button (`GET /api/support/unread`); Öffnen des Chats markiert gelesen.

### 3) Onboarding-Tour

- Wenn `User.onboardingCompletedAt` leer: Vollbild-Tour nach Login (Slides + kurzes Video unter `/onboarding/…`)
- **Überspringen** / **Fertig** → `POST /api/user/onboarding` setzt Zeitstempel; Tour erscheint nicht erneut
- StBerG-Hinweis in der Tour und im Chat

### 4) Admin-Benachrichtigungen

- In-App: Glocke (Badge + Liste), Poll + SSE
- Optional: Browser-`Notification` wenn Permission erteilt (kein Service-Worker / kein natives App-Push)

## Wichtige URLs

| URL | Zweck |
|-----|--------|
| https://taxdoc-beta.onrender.com/beta | Besuch tracken → Redirect Anfrage |
| https://taxdoc-beta.onrender.com/beta-anfrage | Formular + Besuchssignal |
| https://taxdoc-beta.onrender.com/support | Hilfe-Seite (eingeloggt) |
| https://taxdoc-beta.onrender.com/admin | Admin-Zentrale (aktive Tester + Nachricht senden) |
| https://taxdoc-beta.onrender.com/admin/support | Admin-Chat |
| https://taxdoc-beta.onrender.com/admin/tester-activity | Tester-Liste + Nachricht senden |
| https://taxdoc-beta.onrender.com/dashboard | Tour nach erstem Login |

## Nicht enthalten (bewusst)

- Kein SMS- / natives Mobile-Push
- Kein vollständiges Web-Push mit Service Worker
- Kein LLM-Chatbot (nur Regeln; vorhandene AI-Keys bleiben für den Steuer-Assistenten)
- Keine Echtzeit-Websockets (Poll/SSE reicht für MVP)

## Admin-Schnelltest (5 Schritte)

1. Als Admin einloggen → Navbar-Glocke sichtbar; Admin-Zentrale öffnen.
2. Inkognito `/beta-anfrage` öffnen → Glocke zeigt „Neuer Beta-Besuch“ (ggf. 8–20s).
3. Beta-Anfrage absenden → „Neue Beta-Anfrage“ + Thread unter `/admin/support`.
4. Als Tester einloggen → Tour → Hilfe-Chat „Hilfe“ tippen → Admin sieht „Kunde braucht Hilfe“ und kann antworten.
5. **Proaktiv:** Admin → Admin-Zentrale / Tester-Aktivität → „Nachricht senden“ → Text schreiben → als Tester einloggen → Hilfe-Button zeigt „Neu“ / Badge → Nachricht im Chat.

## Rechtliches

Alle Bot-/Tour-Texte betonen: TaxDoc ist ein **Hilfsmittel**, keine Steuerberatung (§ 5 StBerG). Keine Garantie auf Steuererstattung.
