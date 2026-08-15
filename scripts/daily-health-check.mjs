#!/usr/bin/env node
/**
 * Daily TaxDoc production health check.
 *
 * Usage:
 *   node scripts/daily-health-check.mjs
 *   HEALTH_BASE_URL=https://taxdoc-beta.onrender.com node scripts/daily-health-check.mjs
 *   node scripts/daily-health-check.mjs --json
 *   node scripts/daily-health-check.mjs --no-log
 *   node scripts/daily-health-check.mjs --unit
 *
 * Env:
 *   HEALTH_BASE_URL / APP_URL / SMOKE_BASE_URL — target (default production)
 *   CRON_SECRET — optional; deep health with persistence details
 *   HEALTH_RUN_UNIT_TESTS=1 — also run vitest (or pass --unit)
 */

import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

const args = new Set(process.argv.slice(2));
const jsonOnly = args.has('--json');
const noLog = args.has('--no-log') || jsonOnly;
const runUnit =
  args.has('--unit') || process.env.HEALTH_RUN_UNIT_TESTS === '1';

function resolveBase() {
  if (process.env.HEALTH_BASE_URL) {
    return process.env.HEALTH_BASE_URL.replace(/\/$/, '');
  }
  // Prefer production for daily ops. Ignore local APP_URL/SMOKE_BASE_URL (often localhost).
  for (const key of ['APP_URL', 'SMOKE_BASE_URL']) {
    const value = process.env[key];
    if (
      value &&
      /^https:\/\//i.test(value) &&
      !/localhost|127\.0\.0\.1/i.test(value)
    ) {
      return value.replace(/\/$/, '');
    }
  }
  return 'https://taxdoc-beta.onrender.com';
}

const BASE = resolveBase();

const CRON_SECRET =
  process.env.CRON_SECRET || process.env.ADMIN_CRON_SECRET || '';

const LOG_PATH = join(root, 'docs', 'ops', 'DAILY-HEALTH-LOG.md');

/** @typedef {{ name: string, ok: boolean, status?: number, expected?: string, detail?: string, severity: 'P0' | 'P1' | 'info' }} CheckResult */

/** @type {CheckResult[]} */
const results = [];

function record(check) {
  results.push(check);
  if (!jsonOnly) {
    const mark = check.ok ? 'PASS' : 'FAIL';
    const extra = [
      check.status != null ? `HTTP ${check.status}` : null,
      check.expected ? `expected ${check.expected}` : null,
      check.detail,
    ]
      .filter(Boolean)
      .join(' · ');
    console.log(`[${mark}] ${check.name}${extra ? ` — ${extra}` : ''}`);
  }
}

async function fetchRaw(path, options = {}) {
  const url = `${BASE}${path}`;
  const headers = new Headers(options.headers || {});
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      redirect: 'manual',
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { response, json, text, url };
  } finally {
    clearTimeout(timeout);
  }
}

function isRedirect(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function expectStatus(name, path, allowed, severity = 'P0') {
  try {
    const { response } = await fetchRaw(path);
    const ok = allowed.includes(response.status);
    record({
      name,
      ok,
      status: response.status,
      expected: allowed.join('|'),
      severity,
    });
  } catch (error) {
    record({
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      severity,
    });
  }
}

async function checkHealth() {
  const headers = {};
  if (CRON_SECRET) {
    headers.Authorization = `Bearer ${CRON_SECRET}`;
  }
  const path = CRON_SECRET ? '/api/health?deep=1' : '/api/health';
  try {
    const { response, json } = await fetchRaw(path, { headers });
    const statusOk = response.status === 200;
    const bodyOk = json?.ok === true && json?.service === 'taxdoc';
    const checksOk =
      !json?.checks ||
      (json.checks.db === 'ok' &&
        (json.checks.disk === 'ok' || json.checks.disk === 'skipped'));
    const ok = statusOk && bodyOk && checksOk;
    record({
      name: 'GET /api/health',
      ok,
      status: response.status,
      expected: '200 + ok/ready',
      detail: json?.checks
        ? `checks=${JSON.stringify(json.checks)} status=${json.status}`
        : json
          ? `status=${json.status}`
          : 'non-JSON body',
      severity: 'P0',
    });
    if (json?.persistence && !json.persistence.ok) {
      record({
        name: 'persistence (deep)',
        ok: false,
        detail: (json.persistence.warnings || []).join('; ') || 'persistence.ok=false',
        severity: 'P1',
      });
    } else if (json?.persistence?.ok) {
      record({
        name: 'persistence (deep)',
        ok: true,
        detail: `DATA_DIR writable, mount=${json.persistence.dedicatedMount}`,
        severity: 'info',
      });
    }
  } catch (error) {
    record({
      name: 'GET /api/health',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      severity: 'P0',
    });
  }
}

async function checkAdminRedirect() {
  try {
    const { response } = await fetchRaw('/admin');
    const ok =
      isRedirect(response.status) &&
      response.status !== 500 &&
      response.status < 500;
    const loc = response.headers.get('location') || '';
    record({
      name: 'GET /admin (redirect, not 500)',
      ok,
      status: response.status,
      expected: '3xx → /auth/login',
      detail: loc ? `Location: ${loc}` : undefined,
      severity: 'P0',
    });
  } catch (error) {
    record({
      name: 'GET /admin (redirect, not 500)',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      severity: 'P0',
    });
  }
}

function runUnitTests() {
  if (!jsonOnly) console.log('\nRunning unit tests (vitest)...');
  const started = Date.now();
  const result = spawnSync('npx', ['vitest', 'run', '--reporter=dot'], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    timeout: 120_000,
  });
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const ok = result.status === 0;
  record({
    name: 'unit tests (vitest)',
    ok,
    detail: ok
      ? `passed in ${elapsed}s`
      : `exit ${result.status} in ${elapsed}s`,
    severity: 'P1',
  });
  if (!ok && !jsonOnly && result.stderr) {
    console.error(result.stderr.slice(-800));
  }
}

function formatLogEntry(summary) {
  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toISOString();
  const lines = [
    ``,
    `## ${date}`,
    ``,
    `- **When:** ${time}`,
    `- **Target:** ${BASE}`,
    `- **Result:** ${summary.ok ? 'OK' : 'FAILED'} (${summary.passed}/${summary.total} checks; P0 failures: ${summary.p0Failures})`,
    ``,
    `| Check | Result | Detail |`,
    `| --- | --- | --- |`,
  ];
  for (const r of results) {
    const detail = [r.status != null ? `HTTP ${r.status}` : null, r.detail]
      .filter(Boolean)
      .join(' — ')
      .replace(/\|/g, '\\|');
    lines.push(
      `| ${r.name} | ${r.ok ? 'PASS' : `FAIL (${r.severity})`} | ${detail || '—'} |`
    );
  }
  lines.push('');
  return lines.join('\n');
}

function appendLog(summary) {
  mkdirSync(dirname(LOG_PATH), { recursive: true });
  if (!existsSync(LOG_PATH)) {
    writeFileSync(
      LOG_PATH,
      `# Daily health log\n\nAppend-only. Generated by \`scripts/daily-health-check.mjs\`.\n`,
      'utf8'
    );
  }
  appendFileSync(LOG_PATH, formatLogEntry(summary), 'utf8');
  if (!jsonOnly) console.log(`\nAppended entry → ${LOG_PATH}`);
}

async function main() {
  if (!jsonOnly) {
    console.log(`TaxDoc daily health check → ${BASE}`);
    console.log(`Started ${new Date().toISOString()}\n`);
  }

  await checkHealth();

  for (const path of [
    '/',
    '/auth/login',
    '/beta-anfrage',
    '/pricing',
    '/trust',
  ]) {
    await expectStatus(`GET ${path}`, path, [200], 'P0');
  }

  await checkAdminRedirect();

  const protectedApis = [
    ['GET /api/documents', '/api/documents', [401, 403]],
    ['GET /api/user/settings', '/api/user/settings', [401, 403]],
    ['GET /api/dashboard/finance', '/api/dashboard/finance', [401, 403]],
    ['GET /api/elster/preview', '/api/elster/preview', [401, 403]],
    ['GET /api/billing', '/api/billing', [401, 403]],
    ['GET /api/admin/insights', '/api/admin/insights', [401, 403]],
  ];
  for (const [name, path, allowed] of protectedApis) {
    await expectStatus(name, path, allowed, 'P0');
  }

  // Public API that should stay up
  await expectStatus(
    'GET /api/pricing/effective',
    '/api/pricing/effective',
    [200],
    'P1'
  );

  if (runUnit) {
    runUnitTests();
  }

  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  const p0Failures = results.filter((r) => !r.ok && r.severity === 'P0').length;
  const p1Failures = results.filter((r) => !r.ok && r.severity === 'P1').length;
  const ok = p0Failures === 0;

  const summary = {
    ok,
    passed,
    total,
    p0Failures,
    p1Failures,
    base: BASE,
    timestamp: new Date().toISOString(),
    checks: results,
  };

  if (!noLog) {
    appendLog(summary);
  }

  if (jsonOnly) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(
      `\n${ok ? '✅ HEALTH OK' : '❌ HEALTH FAILED'} — ${passed}/${total} passed` +
        (p0Failures ? ` · ${p0Failures} P0` : '') +
        (p1Failures ? ` · ${p1Failures} P1` : '')
    );
  }

  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error('Daily health check crashed:', error);
  process.exit(1);
});
