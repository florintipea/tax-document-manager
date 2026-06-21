#!/usr/bin/env node
/**
 * Ping TaxDoc on Render every 14 minutes to reduce free-tier spin-down.
 *
 * Usage (cron on any machine with network access):
 *   */14 * * * * cd /path/to/tax-document-manager && node scripts/keep-alive-render.mjs
 *
 * Or run manually:
 *   RENDER_WAKE_URL=https://taxdoc-beta.onrender.com/api/health node scripts/keep-alive-render.mjs
 *
 * Note: Render free tier still sleeps without regular traffic. Paid plans avoid spin-down.
 */

import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvFile() {
  const envPath = join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
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

async function main() {
  loadEnvFile();

  const serviceName = process.env.RENDER_SERVICE_NAME || 'taxdoc-beta';
  const url =
    process.env.RENDER_WAKE_URL ||
    process.env.APP_URL?.replace(/\/$/, '') + '/api/health' ||
    `https://${serviceName}.onrender.com/api/health`;

  const started = Date.now();
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  const elapsed = Date.now() - started;
  const body = await response.text();

  console.log(
    `[keep-alive] ${new Date().toISOString()} ${response.status} ${elapsed}ms ${url}`
  );
  if (!response.ok) {
    console.warn('[keep-alive] non-OK response:', body.slice(0, 200));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[keep-alive] failed:', error.message || error);
  process.exit(1);
});
