#!/usr/bin/env node
import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = join(__dirname, '..');
export const STATE_FILE = join(PROJECT_ROOT, '.taxdoc-keepalive-state.json');
export const CLOUD_EXPIRY_FILE = join(PROJECT_ROOT, '.taxdoc-keepalive-until');
export const LOG_FILE = join(PROJECT_ROOT, 'logs', 'keepalive.log');
export const EXPIRED_MARKER = join(PROJECT_ROOT, 'dist', 'mobile', 'KEEPALIVE-EXPIRED.txt');
export const CRON_MARKER = 'keep-alive-scheduled.mjs';
export const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export function readCloudExpiry() {
  if (!fs.existsSync(CLOUD_EXPIRY_FILE)) return null;
  return fs.readFileSync(CLOUD_EXPIRY_FILE, 'utf8').trim();
}

export function writeCloudExpiry(isoDate) {
  fs.writeFileSync(CLOUD_EXPIRY_FILE, `${isoDate}\n`);
}

/** Extend cloud (GitHub Actions) expiry by 14 days from max(today, current expiry). */
export function extendCloudExpiry() {
  const current = readCloudExpiry();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let base = today;
  if (current && /^\d{4}-\d{2}-\d{2}$/.test(current)) {
    const parsed = new Date(`${current}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed > today) {
      base = parsed;
    }
  }

  const newExpiry = new Date(base);
  newExpiry.setUTCDate(newExpiry.getUTCDate() + 14);
  const iso = newExpiry.toISOString().slice(0, 10);
  writeCloudExpiry(iso);
  return iso;
}

export function isCloudExpired() {
  const expiry = readCloudExpiry();
  if (!expiry) return false;
  const today = new Date().toISOString().slice(0, 10);
  return today > expiry;
}

export function cronLine() {
  return `*/14 * * * * cd ${PROJECT_ROOT} && node scripts/keep-alive-scheduled.mjs >> logs/keepalive.log 2>&1`;
}

export function ensureLogsDir() {
  const logsDir = join(PROJECT_ROOT, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

export function readState() {
  if (!fs.existsSync(STATE_FILE)) return null;
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

export function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

export function createInitialState() {
  const now = Date.now();
  return {
    startedAt: now,
    expiresAt: now + TWO_WEEKS_MS,
  };
}

export function formatExpiry(expiresAt) {
  return new Date(expiresAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
}

const CRON_TIMEOUT_MS = 8000;

function runCrontab(args, input) {
  const result = spawnSync('crontab', args, {
    input,
    encoding: 'utf8',
    timeout: CRON_TIMEOUT_MS,
  });
  if (result.error?.code === 'ETIMEDOUT') {
    throw new Error(
      'crontab timed out — grant Full Disk Access to Terminal/Cursor in System Settings → Privacy & Security, then retry'
    );
  }
  if (result.status !== 0 && result.stderr && !result.stderr.includes('no crontab')) {
    throw new Error(result.stderr.trim() || `crontab exited ${result.status}`);
  }
  return result.stdout || '';
}

export function getCrontab() {
  try {
    return execFileSync('crontab', ['-l'], { encoding: 'utf8', timeout: CRON_TIMEOUT_MS });
  } catch {
    return '';
  }
}

export function hasCronInstalled(crontab = getCrontab()) {
  return crontab.split('\n').some((line) => line.includes(CRON_MARKER));
}

export function installCron() {
  const line = cronLine();
  const crontab = getCrontab();
  if (hasCronInstalled(crontab)) return false;

  const lines = crontab.split('\n').filter((l) => l.trim());
  lines.push(line);
  const cronFile = join(tmpdir(), `taxdoc-keepalive-cron-${process.pid}.txt`);
  fs.writeFileSync(cronFile, lines.join('\n') + '\n');
  try {
    runCrontab([cronFile]);
  } finally {
    fs.unlinkSync(cronFile);
  }
  return true;
}

export function removeCron() {
  const crontab = getCrontab();
  if (!hasCronInstalled(crontab)) return false;

  const lines = crontab
    .split('\n')
    .filter((line) => line.trim() && !line.includes(CRON_MARKER));

  if (lines.length === 0) {
    runCrontab(['-r']);
  } else {
    const cronFile = join(tmpdir(), `taxdoc-keepalive-cron-${process.pid}.txt`);
    fs.writeFileSync(cronFile, lines.join('\n') + '\n');
    try {
      runCrontab([cronFile]);
    } finally {
      fs.unlinkSync(cronFile);
    }
  }
  return true;
}

export function appendLog(message) {
  ensureLogsDir();
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}
