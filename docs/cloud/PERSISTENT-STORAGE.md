TaxDoc — Persistent storage (Steuerprofil survives deploys)
============================================================

Why Steuerprofil can disappear after "Aktualisierungen"
-------------------------------------------------------
Production uses SQLite at:

  DATA_DIR=/var/data
  DATABASE_URL=file:/var/data/prod.db

On Render, ONLY files under a **mounted persistent disk** survive redeploys.
If `DATA_DIR=/var/data` is set but **no disk is attached**, `/var/data` is a
normal container directory and is wiped on every deploy — including:

  - Steuerprofil (primary + partner fields)
  - calculatorDraft
  - uploaded documents
  - all user accounts / sessions in SQLite

Root cause we hit on taxdoc-beta: service was on Starter, env pointed at
`/var/data`, but `serviceDetails.disk` was null (no disk resource).


Required ops step (one-time)
----------------------------
Render Dashboard → service **taxdoc-beta** → **Disks** → **Add disk**:

  Name:       taxdoc-data
  Mount path: /var/data
  Size:       2 GB (increase later if needed; cannot shrink)

Or via API / deploy script:

  npm run render:deploy

  (`scripts/render-deploy.mjs` calls POST /v1/disks when missing.)

After attaching: trigger a deploy so the mount becomes active.

Env vars (must stay):
  DATA_DIR=/var/data
  DATABASE_URL=file:/var/data/prod.db

`render.yaml` already declares this disk for Blueprint-created services.


Verify after deploy
-------------------
1. Render Logs — look for:
     [TaxDoc persistence] OK — DATA_DIR=/var/data ... mount=true
   If you see CRITICAL / "NOT a mounted persistent disk", the disk is missing.

2. Admin (logged in):
     GET /api/health?admin=1
   Expect: persistence.ok=true, dedicatedMount=true, steuerprofilSafe=true

3. Functional check:
   - Open Einstellungen → Steuerprofil
   - Change a field (e.g. Vorname) — wait for autosave / click Speichern
   - Hard-reload the page — value still there
   - Optional: trigger a Manual Deploy, wait until Live, reload — value still there


What does NOT wipe Steuerprofil
-------------------------------
- Migrations (partner / calculatorDraft) are ADD COLUMN only
- ensure-admin only syncs password / lockout / role
- create-test-accounts / bootstrap only sync tester password / role
  (they do not clear tax profile columns)


Postgres (optional later)
-------------------------
For multi-instance or stronger durability, switch DATABASE_URL to Render
Postgres and keep DATA_DIR disk for uploads. Until then, the 2 GB disk +
SQLite is the supported beta setup.
