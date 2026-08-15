#!/bin/sh
# TaxDoc production startup — migrations, optional bootstrap, then Next.js server.
set -u

DATA_DIR="${DATA_DIR:-/var/data}"
export DATA_DIR
export DATABASE_URL="${DATABASE_URL:-file:${DATA_DIR}/prod.db}"

# Starter plan ≈512MB. Default V8 heap (~256MB) OOMs after a few days of growth
# and Render reports exit 139. Cap JS heap so native + SQLite still fit.
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=384}"

log() {
    echo "[TaxDoc startup] $*"
}

# Guard: ephemeral /tmp SQLite wipes Steuerprofil, calculatorDraft, and documents on redeploy.
case "${DATABASE_URL}" in
  *"/tmp/"*|file:./tmp/*|file:/tmp/*)
    log "CRITICAL: DATABASE_URL points at ephemeral storage (${DATABASE_URL})."
    log "Steuerprofil will NOT survive deploys. Set DATABASE_URL=file:/var/data/prod.db and attach a Render disk."
    if [ "${ALLOW_EPHEMERAL_DB:-}" != "true" ]; then
      log "Refusing to start. Set ALLOW_EPHEMERAL_DB=true only for throwaway demos."
      exit 1
    fi
    log "ALLOW_EPHEMERAL_DB=true — continuing with ephemeral DB (data loss expected)."
    ;;
esac

case "${DATA_DIR}" in
  /tmp|/*/tmp|*/tmp/*)
    log "WARNING: DATA_DIR=${DATA_DIR} looks ephemeral — uploads may be lost on redeploy."
    ;;
esac

log "DATA_DIR=${DATA_DIR}"
log "DATABASE_URL=${DATABASE_URL}"

mkdir -p "${DATA_DIR}/uploads"

log "Checking persistent storage (Steuerprofil / documents)..."
node scripts/check-persistence.mjs || log "Persistence check skipped (non-fatal)."

log "Running database migrations..."
if npx prisma migrate deploy; then
  log "Migrations applied."
else
  log "Migration deploy failed — repairing tax-profile columns and retrying..."
  npx tsx scripts/ensure-tax-profile-columns.ts || log "Column repair skipped (non-fatal)."
  if npx prisma migrate deploy; then
    log "Migrations applied after repair."
  else
    log "WARNING: migrations still failing — starting app anyway (check logs if DB errors occur)."
  fi
fi

npx tsx scripts/ensure-tax-profile-columns.ts || log "Column repair skipped (non-fatal)."

log "Ensuring admin account (non-fatal on failure)..."
if npx tsx scripts/ensure-admin.ts; then
  log "Admin account ready."
else
  log "WARNING: admin ensure failed — set ADMIN_EMAIL and ADMIN_PASSWORD in Render dashboard."
  log "If admin exists but password is unknown, set ADMIN_FORCE_RESET=true for one deploy, then remove."
  log "App will start anyway; public pages and health check remain available."
fi

BOOTSTRAP_FLAG="${DATA_DIR}/.bootstrapped"
TESTERS_FLAG="${DATA_DIR}/.testers-synced"

# Avoid re-upserting hundreds of testers on every restart (bcrypt + SQLite + tsx
# spikes memory right when recovering from OOM). Force with SYNC_TEST_ACCOUNTS_ON_START=true.
if [ -n "${TEST_ACCOUNT_COUNT:-}" ]; then
  if [ "${SYNC_TEST_ACCOUNTS_ON_START:-}" = "true" ] || [ ! -f "$TESTERS_FLAG" ]; then
    log "Syncing beta tester accounts (TEST_ACCOUNT_COUNT=${TEST_ACCOUNT_COUNT})..."
    export SKIP_TEST_ACCOUNT_FILES="${SKIP_TEST_ACCOUNT_FILES:-true}"
    if npx tsx scripts/create-test-accounts.ts; then
      touch "$TESTERS_FLAG"
      log "Tester accounts synced."
    else
      log "WARNING: tester account sync failed (non-fatal)."
    fi
  else
    log "Skipping tester sync (flag ${TESTERS_FLAG} present; set SYNC_TEST_ACCOUNTS_ON_START=true to force)."
  fi
fi

if [ ! -f "$BOOTSTRAP_FLAG" ]; then
  log "First run: creating beta tester accounts..."
  if npx tsx scripts/bootstrap-production.ts; then
    touch "$BOOTSTRAP_FLAG"
    touch "$TESTERS_FLAG"
    log "Bootstrap complete."
  else
    log "Bootstrap failed — app will still start (admin was ensured above)."
  fi
fi

log "Starting TaxDoc on port ${PORT:-3000} (NODE_OPTIONS=${NODE_OPTIONS})..."
exec node server.js
