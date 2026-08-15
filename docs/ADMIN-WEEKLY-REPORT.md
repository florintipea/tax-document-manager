# Admin Wochenbericht (Weekly Digest)

**Stand:** 2026-08-01  
**Nur Admin** (`admin` / `super_admin`). Tester sehen weder UI noch API-Daten.

## Was passiert

1. **Live-KPIs** im Admin-Hub (`/admin`): laden beim Öffnen + alle 60s aus der DB.  
2. **Wochenbericht**: Snapshot der letzten 7 Tage → `WeeklyAdminReport` + `AdminNotification` (Glocke, Typ `weekly_digest`).  
3. **E-Mail**: optional, wenn `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` gesetzt (sonst nur In-App).

## Manuell

Admin-Hub → **„Report jetzt erzeugen“**  
oder: `POST /api/admin/weekly-report` (Session-Cookie als Admin).

## Cron (Render)

- Service: `taxdoc-weekly-admin-report` in `render.yaml`  
- Schedule: `0 7 * * 1` (Mo 07:00 UTC ≈ 09:00 Berlin Winterzeit)  
- Command: `node scripts/cron-weekly-report.mjs`  
- Env (Dashboard): `APP_URL=https://taxdoc-beta.onrender.com`, `CRON_SECRET=<secret>`  
- Auth: `Authorization: Bearer $CRON_SECRET`

## APIs

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/admin/weekly-report` | Admin-Session |
| POST | `/api/admin/weekly-report` | Admin-Session **oder** Bearer `CRON_SECRET` |

## Inhalt (Highlights)

Nutzer/Logins, Beta-Besuche/Anfragen, Docs, Support/Eskalationen, Reports, Promos/Rabatte, Warnsignale.

Verwandt: [`ADMIN-DUAL-VIEW.md`](./ADMIN-DUAL-VIEW.md), [`ADMIN-INSIGHTS-DISCOUNTS.md`](./ADMIN-INSIGHTS-DISCOUNTS.md)
