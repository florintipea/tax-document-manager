#!/bin/sh
# TaxDoc production startup — migrations, optional bootstrap, then Next.js server.
set -u

DATA_DIR="${DATA_DIR:-/var/data}"
export DATA_DIR
export DATABASE_URL="${DATABASE_URL:-file:${DATA_DIR}/prod.db}"

log() {
  echo "[TaxDoc startup] $*"
}

mkdir -p "${DATA_DIR}/uploads"

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

log "Ensuring admin account (always runs on startup)..."
if npx tsx scripts/ensure-admin.ts; then
  log "Admin account ready."
else
  log "WARNING: admin ensure failed — login may not work until this succeeds."
fi

BOOTSTRAP_FLAG="${DATA_DIR}/.bootstrapped"
if [ ! -f "$BOOTSTRAP_FLAG" ]; then
  log "First run: creating beta tester accounts..."
  if npx tsx scripts/bootstrap-production.ts; then
    touch "$BOOTSTRAP_FLAG"
    log "Bootstrap complete."
  else
    log "Bootstrap failed — app will still start (admin was ensured above)."
  fi
fi

log "Starting TaxDoc on port ${PORT:-3000}..."
exec node server.js
