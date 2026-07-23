#!/usr/bin/env node
/**
 * Scheduled keep-alive with 2-week expiry. Invoked by cron every 14 minutes.
 * Mac muss wach sein — für Schlafmodus GitHub Actions nutzen (docs/KEEP-ALIVE-SETUP.md).
 */
import fs from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_ROOT,
  EXPIRED_MARKER,
  createInitialState,
  readState,
  writeState,
  removeCron,
  appendLog,
  formatExpiry,
} from './keepalive-common.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function notifyExpired() {
  const script =
    'display notification "TaxDoc Keep-Alive beendet — 2 Wochen um. Verlängern? npm run keepalive:extend" with title "TaxDoc Keep-Alive"';
  try {
    execSync(`osascript -e ${JSON.stringify(script)}`);
  } catch (error) {
    appendLog(`notification failed: ${error.message}`);
  }
}

function writeExpiredMarker(expiresAt) {
  const dir = dirname(EXPIRED_MARKER);
  fs.mkdirSync(dir, { recursive: true });
  const text = [
    'TaxDoc Render Keep-Alive expired.',
    `Expired at: ${formatExpiry(expiresAt)}`,
    '',
    'To extend for another 2 weeks, run:',
    '  npm run keepalive:extend',
    '',
    'To uninstall:',
    '  npm run keepalive:uninstall',
  ].join('\n');
  fs.writeFileSync(EXPIRED_MARKER, text + '\n');
}

function handleExpiry(state) {
  appendLog('keep-alive period expired — stopping pings');
  writeExpiredMarker(state.expiresAt);
  notifyExpired();
  removeCron();
  appendLog('cron job removed');
  process.exit(0);
}

function runPing() {
  const script = join(__dirname, 'keep-alive-render.mjs');
  const result = spawnSync(process.execPath, [script], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    env: process.env,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.status ?? 1;
}

function main() {
  let state = readState();
  if (!state) {
    state = createInitialState();
    writeState(state);
    appendLog(`initialized keep-alive until ${formatExpiry(state.expiresAt)}`);
  }

  if (Date.now() > state.expiresAt) {
    handleExpiry(state);
    return;
  }

  const status = runPing();
  if (status !== 0) {
    appendLog(`ping failed with exit code ${status}`);
    process.exit(status);
  }
}

main();
