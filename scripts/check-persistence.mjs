#!/usr/bin/env node
/**
 * Production startup persistence check (no TypeScript path aliases).
 * Exit 0 always — warns loudly if Steuerprofil would be wiped on redeploy.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = process.env.DATA_DIR || '/var/data';
const databaseUrl = process.env.DATABASE_URL || '';
const expectedDb = `file:${dataDir}/prod.db`;
const warnings = [];

function ephemeral(value) {
  const lower = String(value).toLowerCase();
  return ['/tmp', '/temp/', 'file:./'].some((m) => lower.includes(m));
}

function isDedicatedMount(dir) {
  try {
    const mounts = readFileSync('/proc/mounts', 'utf8')
      .split('\n')
      .map((line) => line.split(/\s+/)[1])
      .filter(Boolean);
    const normalized = dir.replace(/\/$/, '') || '/';
    return mounts.includes(normalized);
  } catch {
    return null;
  }
}

if (ephemeral(dataDir)) {
  warnings.push(`DATA_DIR=${dataDir} looks ephemeral`);
}
if (!databaseUrl) {
  warnings.push('DATABASE_URL is unset');
} else if (ephemeral(databaseUrl)) {
  warnings.push(`DATABASE_URL=${databaseUrl} looks ephemeral`);
} else if (
  databaseUrl.startsWith('file:') &&
  !databaseUrl.includes(`${dataDir}/`) &&
  databaseUrl !== expectedDb
) {
  warnings.push(`DATABASE_URL=${databaseUrl} is outside DATA_DIR=${dataDir}`);
}

const dedicatedMount = isDedicatedMount(dataDir);
if (dedicatedMount === false) {
  warnings.push(
    `DATA_DIR=${dataDir} is NOT a Render disk mount — Steuerprofil wiped on every deploy`
  );
}

let writable = false;
try {
  mkdirSync(join(dataDir, 'uploads'), { recursive: true });
  const probe = join(dataDir, '.taxdoc-write-probe');
  writeFileSync(probe, 'ok', 'utf8');
  writable = readFileSync(probe, 'utf8') === 'ok';
} catch (error) {
  warnings.push(`DATA_DIR not writable: ${error.message}`);
}

if (writable && dataDir === '/var/data') {
  const marker = join(dataDir, '.taxdoc-disk-marker');
  if (!existsSync(marker)) {
    try {
      writeFileSync(
        marker,
        `TaxDoc persistent disk marker\ncreated=${new Date().toISOString()}\n`,
        'utf8'
      );
    } catch {
      /* ignore */
    }
  }
}

if (warnings.length === 0 && writable) {
  console.log(
    `[TaxDoc persistence] OK — DATA_DIR=${dataDir} DATABASE_URL=${databaseUrl || expectedDb} mount=${dedicatedMount}`
  );
  process.exit(0);
}

console.error(
  '[TaxDoc persistence] CRITICAL: Steuerprofil may be wiped on redeploy without a Render disk at /var/data.'
);
for (const warning of warnings) {
  console.error(`[TaxDoc persistence] ${warning}`);
}
if (!writable) {
  console.error('[TaxDoc persistence] Could not write under DATA_DIR.');
}
console.error(
  '[TaxDoc persistence] Ops: Render Dashboard → taxdoc-beta → Disks → Add disk → Mount path /var/data (2 GB). See docs/cloud/PERSISTENT-STORAGE.md'
);
process.exit(0);
