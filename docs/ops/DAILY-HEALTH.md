# Daily health verification (TaxDoc)

**Scope:** Confirm production systems respond error-free. Marketing / growth is handled elsewhere.

## Goal note (honest)

Zielbild: **1 Mio. deutsche Abonnenten in einem Jahr**. Tägliche Health-Checks und Monitoring halten die Plattform **stabil und erreichbar** — sie erzeugen **keine** Abonnenten. Dafür braucht es Produkt-Skalierung (Onboarding, Funnel, Zahlung, Support, Infrastruktur für Last), Growth/Marketing und Conversion. Monitoring ≠ Wachstum; ohne skalierfähiges Produkt bleibt 1M unerreichbar.

**Growth-Plan (Pfad, Funnel-Mathe, tägliche User/Agent-Alignment, KPIs):** [`docs/growth/PATH-TO-1M-DE-12MONTHS.md`](../growth/PATH-TO-1M-DE-12MONTHS.md) · [`docs/growth/DAILY-ALIGNMENT.md`](../growth/DAILY-ALIGNMENT.md) · [`docs/growth/KPI-TRACKER.md`](../growth/KPI-TRACKER.md)

Dieses Dokument und `scripts/daily-health-check.mjs` decken **nur** die tägliche technische Verifikation ab.

## What we check

| Area | Expectation |
|------|-------------|
| `GET /api/health` | **200**, `ok: true`, `service: taxdoc`; checks `db` + `disk` (when `DATA_DIR` set) |
| `GET /`, `/auth/login`, `/beta-anfrage`, `/pricing`, `/trust` | **200** |
| `GET /admin` (no session) | **3xx redirect** (e.g. → `/auth/login`), never **500** |
| Critical APIs without auth (`/api/documents`, `/api/user/settings`, `/api/dashboard/finance`, `/api/elster/preview`, `/api/billing`, `/api/admin/insights`) | **401 or 403**, never **500** |
| `GET /api/pricing/effective` | **200** (P1) |
| Optional `--unit` / `HEALTH_RUN_UNIT_TESTS=1` | Fast vitest suite locally |

Results are appended to [`DAILY-HEALTH-LOG.md`](./DAILY-HEALTH-LOG.md) (or printed as JSON with `--json`).

## How the parent agent runs this daily

1. From workspace root:
   ```bash
   npm run health:daily
   # or against a custom host:
   HEALTH_BASE_URL=https://taxdoc-beta.onrender.com npm run health:daily
   ```
2. Exit code **0** = no P0 failures; **1** = P0 failure(s).
3. Read the new dated section in `docs/ops/DAILY-HEALTH-LOG.md`.
4. On P0: fix, deploy (`npm run render:deploy` / push), re-run until green.
5. Optional deep persistence report (needs `CRON_SECRET` in `.env` matching Render):
   ```bash
   CRON_SECRET=… npm run health:daily
   ```
   Hits `/api/health?deep=1` with `Authorization: Bearer …`.
6. Optional unit tests (local, not against production):
   ```bash
   npm run health:daily -- --unit
   ```

**Default target:** `https://taxdoc-beta.onrender.com`  
(`APP_URL` / `SMOKE_BASE_URL` are used only if they are `https` and not localhost. Override with `HEALTH_BASE_URL`.)

## `/api/health` behaviour

Public (Render health check + daily script):

- Always pings the database (`SELECT 1`).
- If `DATA_DIR` is set, probes that the directory is writable.
- Returns **503** + `ok: false` if DB or disk fails (so Render marks the instance unhealthy).
- Response shape (minimal): `{ ok, service, status, timestamp, checks: { db, disk } }`.

Privileged details (`?deep=1` or `?admin=1`):

- **Admin session** *or* `Authorization: Bearer $CRON_SECRET`
- Adds `memory`, `security`, `persistence` (warnings, mount, writable).

## Optional: Render Cron → secure health

If you want Render to ping deep health on a schedule (in addition to the parent agent):

1. Ensure `CRON_SECRET` (or `ADMIN_CRON_SECRET`) is set on the web service **and** the cron job.
2. Create a Render Cron Job (same repo, Node) that runs daily, e.g.:
   ```bash
   node -e "
   const b=process.env.APP_URL.replace(/\/$/,'');
   const s=process.env.CRON_SECRET;
   fetch(b+'/api/health?deep=1',{headers:{Authorization:'Bearer '+s}})
     .then(async r=>{const j=await r.json(); console.log(r.status,j); process.exit(r.ok&&j.ok?0:1)})
   "
   ```
3. Env on the cron service: `APP_URL=https://taxdoc-beta.onrender.com`, `CRON_SECRET=<same as web>`.
4. Render’s built-in **Health Check Path** should stay `/api/health` (public, no secret) — that already includes DB + disk.

Do **not** put the cron secret in public URLs or client code.

## Adding checks

1. Extend the lists in `scripts/daily-health-check.mjs`.
2. Document the new row in the table above.
3. Prefer **P0** for user-facing outages / 500s; **P1** for non-blocking regressions.
