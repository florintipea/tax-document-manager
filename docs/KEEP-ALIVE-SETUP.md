# Render Keep-Alive — **DISABLED** (Render Starter)

**Status (July 2026):** Keep-alive pings are **stopped**. The app uses **Render Starter** ($7/mo), which does not spin down after inactivity. No cron, GitHub Actions, or UptimeRobot needed.

To upgrade in Render dashboard: see [CLOUD-HOSTING.txt](./cloud/CLOUD-HOSTING.txt) → "Render Starter".

---

## What was disabled

| Method | Status |
|--------|--------|
| **macOS cron** (`npm run keepalive:install`) | Uninstalled — `npm run keepalive:uninstall` |
| **GitHub Actions** (`.github/workflows/keep-alive.yml`) | Workflow removed locally; expiry set to `2020-01-01` in `.taxdoc-keepalive-until` |
| **UptimeRobot** | Not used |

If a **Render Keep-Alive** workflow still appears under GitHub → Actions, delete it manually:

1. Repo → `.github/workflows/keep-alive.yml` → Delete file (or disable workflow in Actions settings)

---

## Scripts kept for reference (do not install)

Scripts remain in `scripts/` but are **not** in use:

```bash
npm run keepalive:install   # DEPRECATED — use Render Starter instead
npm run keepalive:status    # Status anzeigen
npm run keepalive:extend    # +2 Wochen (cloud expiry file)
npm run keepalive:uninstall # Cron entfernen
```

---

## Historical context (Free tier only)

Render **Free Tier** schläft nach ~15 Minuten Inaktivität ein. Ein Ping alle 14 Minuten auf `/api/health` hielt die Instanz wach. Das war nur für die Beta auf Free nötig.

Health endpoint (unchanged):

```
https://taxdoc-beta.onrender.com/api/health
```

Manual workflow template (if ever needed again): `docs/KEEP-ALIVE-WORKFLOW-TO-ADD-MANUALLY.yml`
