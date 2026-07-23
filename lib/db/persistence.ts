/**
 * Production SQLite / data-dir persistence checks.
 * Render only preserves files under a mounted persistent disk (e.g. /var/data).
 * Without that mount, Steuerprofil and documents are wiped on every deploy.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDataDir } from '@/lib/utils/paths';

const EPHEMERAL_MARKERS = ['/tmp', '/temp/', 'file:./', 'file:dev.db'];

export type PersistenceReport = {
  ok: boolean;
  dataDir: string;
  databaseUrl: string;
  databasePath: string | null;
  databaseOnDataDir: boolean;
  dataDirWritable: boolean;
  looksPersistent: boolean;
  /** true = /proc/mounts shows DATA_DIR as its own mount; null = not Linux / unknown */
  dedicatedMount: boolean | null;
  warnings: string[];
};

function sqlitePathFromUrl(databaseUrl: string): string | null {
  const trimmed = databaseUrl.trim();
  if (!trimmed.startsWith('file:')) return null;
  const raw = trimmed.slice('file:'.length);
  if (raw.startsWith('/')) return raw;
  return join(process.cwd(), raw.replace(/^\.\//, ''));
}

function pathLooksEphemeral(pathOrUrl: string): boolean {
  const lower = pathOrUrl.toLowerCase();
  return EPHEMERAL_MARKERS.some((marker) => lower.includes(marker));
}

/** True when DATA_DIR is the intended Render mount (or a real absolute path outside /tmp). */
export function looksLikePersistentDataDir(dataDir: string): boolean {
  if (!dataDir || pathLooksEphemeral(dataDir)) return false;
  if (dataDir === '/var/data' || dataDir.startsWith('/var/data/')) return true;
  return dataDir.startsWith('/') && !dataDir.startsWith('/tmp');
}

/**
 * On Linux (Render/Docker): true only if `dataDir` itself appears in /proc/mounts.
 * A plain mkdir under the container root is NOT a dedicated mount and is wiped on deploy.
 */
export function isDedicatedMount(dataDir: string): boolean | null {
  try {
    const mounts = readFileSync('/proc/mounts', 'utf8')
      .split('\n')
      .map((line) => line.split(/\s+/)[1])
      .filter(Boolean);
    const normalized = dataDir.replace(/\/$/, '') || '/';
    return mounts.includes(normalized);
  } catch {
    return null;
  }
}

export function probeDataDirWritable(dataDir: string): boolean {
  try {
    mkdirSync(dataDir, { recursive: true });
    const probe = join(dataDir, '.taxdoc-write-probe');
    const token = `${Date.now()}`;
    writeFileSync(probe, token, 'utf8');
    const read = readFileSync(probe, 'utf8');
    return read === token;
  } catch {
    return false;
  }
}

/**
 * Assess whether Steuerprofil / uploads will survive redeploy.
 * Does not mutate the DB — only filesystem + env.
 */
export function assessPersistence(
  options: { databaseUrl?: string; dataDir?: string } = {}
): PersistenceReport {
  const dataDir = options.dataDir ?? getDataDir();
  const databaseUrl =
    options.databaseUrl ?? process.env.DATABASE_URL ?? '';
  const databasePath = sqlitePathFromUrl(databaseUrl);
  const warnings: string[] = [];

  const looksPersistent = looksLikePersistentDataDir(dataDir);
  if (!looksPersistent) {
    warnings.push(
      `DATA_DIR="${dataDir}" looks ephemeral — attach a Render disk at /var/data (see docs/cloud/PERSISTENT-STORAGE.md).`
    );
  }

  const dedicatedMount = isDedicatedMount(dataDir);
  if (dedicatedMount === false && process.env.NODE_ENV === 'production') {
    warnings.push(
      `DATA_DIR="${dataDir}" is NOT a mounted persistent disk (only a normal directory). Attach Render disk mountPath=/var/data — otherwise Steuerprofil is wiped on every deploy.`
    );
  }

  if (!databaseUrl) {
    warnings.push('DATABASE_URL is not set.');
  } else if (pathLooksEphemeral(databaseUrl)) {
    warnings.push(
      `DATABASE_URL="${databaseUrl}" points at ephemeral storage — Steuerprofil will be wiped on redeploy.`
    );
  }

  const databaseOnDataDir = Boolean(
    databasePath &&
      (databasePath === join(dataDir, 'prod.db') ||
        databasePath.startsWith(dataDir.endsWith('/') ? dataDir : `${dataDir}/`))
  );
  if (databasePath && !databaseOnDataDir) {
    warnings.push(
      `SQLite path "${databasePath}" is outside DATA_DIR="${dataDir}". Keep DATABASE_URL under the disk mount.`
    );
  }

  const dataDirWritable = probeDataDirWritable(dataDir);
  if (!dataDirWritable) {
    warnings.push(`DATA_DIR="${dataDir}" is not writable.`);
  }

  if (dataDirWritable && looksPersistent) {
    try {
      const marker = join(dataDir, '.taxdoc-disk-marker');
      if (!existsSync(marker)) {
        writeFileSync(
          marker,
          `TaxDoc persistent disk marker\ncreated=${new Date().toISOString()}\n`,
          'utf8'
        );
      }
    } catch {
      /* non-fatal */
    }
  }

  const mountOk = dedicatedMount !== false; // null (local mac) or true is fine
  const ok =
    looksPersistent &&
    dataDirWritable &&
    Boolean(databaseUrl) &&
    !pathLooksEphemeral(databaseUrl) &&
    (databaseOnDataDir || !databasePath) &&
    (process.env.NODE_ENV !== 'production' || mountOk);

  return {
    ok,
    dataDir,
    databaseUrl,
    databasePath,
    databaseOnDataDir,
    dataDirWritable,
    looksPersistent,
    dedicatedMount,
    warnings,
  };
}

/** Log a clear startup warning when production would lose Steuerprofil on deploy. */
export function logPersistenceStartupWarning(report: PersistenceReport): void {
  if (report.ok) {
    console.log(
      `[TaxDoc persistence] OK — DATA_DIR=${report.dataDir} DATABASE_URL=${report.databaseUrl} mount=${report.dedicatedMount}`
    );
    return;
  }
  console.error(
    '[TaxDoc persistence] CRITICAL: Steuerprofil / documents may be wiped on the next redeploy.'
  );
  for (const warning of report.warnings) {
    console.error(`[TaxDoc persistence] ${warning}`);
  }
}
