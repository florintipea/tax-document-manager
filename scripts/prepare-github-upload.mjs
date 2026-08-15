#!/usr/bin/env node
/**
 * Prepare dist/mobile/github-upload for isomorphic-git push.
 * Uses Node copy (not rsync) to avoid macOS renameat races on temp files.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const mobileDir = join(root, 'dist', 'mobile');
const outDir = join(mobileDir, 'github-upload');
const lockDir = join(mobileDir, '.github-upload.lock');
const stagingDir = join(
  mobileDir,
  `github-upload-staging-${process.pid}-${Date.now()}`
);

const pushWorkflows = process.env.GITHUB_PUSH_WORKFLOWS !== 'false';

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.next',
  'uploads',
  '.git',
  '.tools',
  'dist',
  'mobile',
  '.venv-marketing',
  '.venv-reels',
  'logs',
  '__pycache__',
]);

const SKIP_FILE_NAMES = new Set([
  '.DS_Store',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.taxdoc-keepalive-state.json',
  'tsconfig.tsbuildinfo',
]);

function shouldSkip(relPath, isDir) {
  const parts = relPath.split(/[/\\]/).filter(Boolean);
  if (parts.some((p) => SKIP_DIR_NAMES.has(p))) return true;
  if (!pushWorkflows && parts[0] === '.github' && parts[1] === 'workflows') {
    return true;
  }
  if (
    parts[0] === '.github' &&
    parts[1] === 'workflows' &&
    parts[2] === 'keep-alive.yml'
  ) {
    return true;
  }
  if (isDir) return false;
  const base = parts[parts.length - 1] || '';
  if (SKIP_FILE_NAMES.has(base)) return true;
  if (relPath.startsWith('prisma/dev.db') || relPath.startsWith('prisma/ci.db')) {
    return true;
  }
  if (relPath.startsWith('prisma/prisma/')) return true;
  if (relPath.startsWith('marketing/') && /\.(mp4|mov)$/i.test(base)) return true;
  return false;
}

function copyTree(srcDir, destDir, relBase = '') {
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const rel = relBase ? join(relBase, entry.name) : entry.name;
    const from = join(srcDir, entry.name);
    const to = join(destDir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkip(rel, true)) continue;
      copyTree(from, to, rel);
    } else if (entry.isFile()) {
      if (shouldSkip(rel, false)) continue;
      cpSync(from, to);
    }
  }
}

mkdirSync(mobileDir, { recursive: true });

async function acquireLock(maxWaitMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    try {
      mkdirSync(lockDir);
      writeFileSync(join(lockDir, 'pid'), String(process.pid));
      return;
    } catch (err) {
      if (err && err.code !== 'EEXIST') throw err;
      await sleep(400);
    }
  }
  rmSync(lockDir, { recursive: true, force: true });
  mkdirSync(lockDir);
  writeFileSync(join(lockDir, 'pid'), String(process.pid));
}

function releaseLock() {
  rmSync(lockDir, { recursive: true, force: true });
}

await acquireLock();

try {
  for (const name of readdirSync(mobileDir)) {
    if (
      name.startsWith('github-upload-staging-') ||
      name.startsWith('.git-push-temp')
    ) {
      rmSync(join(mobileDir, name), { recursive: true, force: true });
    }
  }

  rmSync(outDir, { recursive: true, force: true });
  rmSync(stagingDir, { recursive: true, force: true });
  mkdirSync(stagingDir, { recursive: true });

  copyTree(root, stagingDir);

  for (const secret of ['.env', '.env.local', '.env.production', '.env.development']) {
    rmSync(join(stagingDir, secret), { force: true });
  }

  if (!pushWorkflows) {
    rmSync(join(stagingDir, '.github', 'workflows'), {
      recursive: true,
      force: true,
    });
  } else {
    rmSync(join(stagingDir, '.github', 'workflows', 'keep-alive.yml'), {
      force: true,
    });
  }

  // Sanity: production start script dependency must ship
  const ensureCols = join(stagingDir, 'scripts', 'ensure-tax-profile-columns.ts');
  if (!existsSync(ensureCols)) {
    throw new Error(`Missing required file after copy: ${relative(root, ensureCols)}`);
  }

  rmSync(outDir, { recursive: true, force: true });
  renameSync(stagingDir, outDir);
  console.log(`\n✅ Ready: ${outDir}`);
} catch (error) {
  rmSync(stagingDir, { recursive: true, force: true });
  releaseLock();
  throw error;
}

releaseLock();
