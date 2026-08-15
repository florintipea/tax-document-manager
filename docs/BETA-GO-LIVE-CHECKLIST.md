# TaxDoc Beta Go-Live Checklist

Use this checklist before inviting beta testers. Each item is **pass** or **fail**.

## Automated gates (local or CI)

| Check | Command | Pass criteria |
|-------|---------|---------------|
| Dependencies | `npm ci` | Exit 0 |
| Database | `DATABASE_URL=file:./ci.db npx prisma migrate deploy` | All migrations applied |
| Build | `npm run build` | Exit 0, no TypeScript errors |
| Unit tests | `npm run test:unit` | All Vitest tests green |
| Smoke (optional, needs running server) | `npm run start` then `npm run smoke:test` | Exit 0 |

## Production HTTP checks (cloud only)

Replace `BASE` with your Render URL (e.g. `https://taxdoc-beta.onrender.com`).

| Check | Request | Pass criteria |
|-------|---------|---------------|
| Health | `curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/health"` | `200` |
| Login-check | `curl -sS -X POST "$BASE/api/auth/login-check" -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"wrongpass12"}'` | `401` (not 500) |
| Dashboard (unauthenticated) | `curl -sS -o /dev/null -w "%{http_code}" -L "$BASE/dashboard"` | Redirect to login (`302`/`307`) |
| Tester URL | Open `$BASE` in browser | Login page loads; cloud banner visible on free tier |

## Render environment variables (required)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | e.g. `file:/var/data/prod.db` |
| `DATA_DIR` | Yes | e.g. `/var/data` |
| **Persistent disk** | Yes (SQLite) | Mount `/var/data` (2 GB+). Env alone is not enough — see `docs/cloud/PERSISTENT-STORAGE.md` |
| `NEXTAUTH_SECRET` | Yes | ≥32 random characters |
| `NEXTAUTH_URL` | Yes | Public app URL |
| `APP_URL` | Yes | Same as `NEXTAUTH_URL` |
| `ENCRYPTION_KEY` | Yes | ≥32 random characters |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | Yes | Synced on startup via `ensure-admin` |
| `TEST_PHASE_ENABLED` | Yes (beta) | `true` to allow tester accounts |

Optional: `REDIS_URL`, Stripe keys, AI provider keys — see `.env.example`.

## Cold start (Render free tier)

1. After ~15 min idle, first request may show Render loading screen for 1–2 minutes.
2. Wait, then hard-refresh the login page.
3. Optional keep-alive: `node scripts/keep-alive-render.mjs` every 14 min.
4. Permanent fix: upgrade to Render Starter (paid).

## Admin verification

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in Render dashboard.
2. Redeploy once so `ensure-admin` syncs password and clears lockout.
3. Log in at `/auth/login` with admin credentials.
4. Confirm `/dashboard` loads and billing widget renders.

## Beta tester flow

- Tester accounts: `tester01@taxdoc.test` … `tester10000@taxdoc.test` (max. 10.000 slots; default bootstrap creates 50)
- Password (all testers): **`TaxDocTest2026!`**
- Login URL: https://taxdoc-beta.onrender.com/auth/login
- **One account per tester** — e.g. Tester 03 → `tester03@taxdoc.test` (see `docs/TESTER-INVITE-DE.md` for copy-paste WhatsApp/email template)
- Hosting: Render **Starter** (no cold start; instant login at `/auth/login`)
- `TEST_PHASE_ENABLED=false` blocks tester logins and redirects to `/auth/test-phase-ended`.
- Do **not** disable test phase until public launch.

## CI (GitHub Actions)

Conservative workflow: **build + Vitest required**; lint and `npm audit` are **non-blocking** (`continue-on-error: true`).

| Location | Purpose |
|----------|---------|
| `.github/workflows/ci.yml` | Source of truth in this repo |
| `docs/CI-WORKFLOW-TO-ADD-MANUALLY.yml` | Same YAML + instructions if PAT lacks `workflow` scope |

### Add CI manually (PAT without `workflow` scope)

1. Open repo on GitHub → **Add file** → **Create new file**
2. Path: `.github/workflows/ci.yml`
3. Copy the YAML between `--- BEGIN ci.yml ---` and `--- END ci.yml ---` in `docs/CI-WORKFLOW-TO-ADD-MANUALLY.yml`
4. Commit to `main`
5. Push a test commit or re-run workflow — expect: install → migrate → build → test (green); lint/audit may warn but do not fail the job

### Grant `workflow` scope (optional)

1. GitHub → Settings → Developer settings → Personal access tokens
2. Enable **repo** + **workflow**
3. Update `.env`: `GITHUB_TOKEN=ghp_...`
4. Re-run: `npm run github:prepare && npm run github:push` (workflow included automatically)

## Scaling scaffolds (disabled)

CSP nonce and S3 adapters exist but are **not wired** to production routes. See `docs/SCALING-SCAFFOLDS.md`.

## GitHub push (PAT scopes)

`npm run github:push` uses `GITHUB_TOKEN` from `.env` (see `scripts/github-push.mjs`).

| Scope | Required | Why |
|-------|----------|-----|
| `repo` | Yes | Push code to private repository |
| `workflow` | For CI file | Push `.github/workflows/ci.yml` |

If the token has **repo only** (no `workflow`), the push scripts **exclude** workflow files automatically. Add CI manually from `docs/CI-WORKFLOW-TO-ADD-MANUALLY.yml`, or regenerate the token with **repo + workflow** scopes.

## Rollback runbook

Use when a deploy breaks production or beta testers report critical failures.

### 1. Redeploy previous version (Render)

1. [Render Dashboard](https://dashboard.render.com) → **taxdoc-beta** → **Events** (or **Deploys**)
2. Find the last **live** deploy before the bad release
3. Click **Rollback** (or **Manual Deploy** → select previous commit)
4. Wait until status is **Live** (~10–15 min on free tier)

### 2. Check logs

| Where | What to look for |
|-------|------------------|
| Render → **Logs** (runtime) | Startup errors, `ensure-admin`, Prisma migrate failures |
| Render → **Events** → failed deploy | Docker build errors, missing env vars |
| Browser → `/api/health` | `200` + `"status":"ready"` |
| `curl` login-check (see table above) | `401` for wrong password (not `500`) |

### 3. Admin password recovery

If admin cannot log in after rollback or env change:

1. Render → **Environment** → set `ADMIN_EMAIL` and `ADMIN_PASSWORD`
2. **Manual Deploy** (or redeploy) so `ensure-admin` syncs the password on startup
3. Log in at `/auth/login` with those credentials

Do **not** commit `ADMIN_PASSWORD` to GitHub. Keep it only in Render env (or local `.env` for `npm run render:deploy`).

### 4. Communicate to testers

- Share the stable URL: `https://taxdoc-beta.onrender.com`
- If rollback was due to data issues, ask testers to re-test login and one core flow (upload or calculator)

## Go / No-Go

**GO** when all of the following are true:

- [ ] `npm run build` passes
- [ ] `npm run test:unit` passes
- [ ] Production `/api/health` returns 200
- [ ] Production login-check returns 401 for bad credentials (not 500)
- [ ] Admin can log in and reach dashboard
- [ ] `TEST_PHASE_ENABLED=true` on cloud
- [ ] Tester URL shared only for cloud instance (not localhost)

**NO-GO** if build fails, health returns non-200, login-check returns 500, or admin cannot authenticate.
