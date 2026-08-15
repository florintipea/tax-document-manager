#!/usr/bin/env node
/**
 * Install macOS cron job for Render keep-alive (2-week trial).
 * Mac muss wach sein — cron pausiert im Schlafmodus. Für 24/7: GitHub Actions
 * (docs/KEEP-ALIVE-SETUP.md).
 *
 * DEPRECATED for production: upgrade to Render Starter ($7/mo) instead — no pings
 * needed. See docs/cloud/CLOUD-HOSTING.txt → "Render Starter".
 */
import {
  STATE_FILE,
  cronLine,
  createInitialState,
  readState,
  writeState,
  installCron,
  hasCronInstalled,
  appendLog,
  formatExpiry,
  ensureLogsDir,
} from './keepalive-common.mjs';

function main() {
  ensureLogsDir();

  const isNew = !readState();
  if (isNew) {
    const state = createInitialState();
    writeState(state);
    appendLog(`installed keep-alive until ${formatExpiry(state.expiresAt)}`);
    console.log(`State file created: ${STATE_FILE}`);
    console.log(`Expires: ${formatExpiry(state.expiresAt)}`);
  } else {
    const state = readState();
    console.log(`Existing install — expires: ${formatExpiry(state.expiresAt)}`);
  }

  try {
    const added = installCron();
    if (added) {
      appendLog('cron job installed');
      console.log('Cron job installed.');
    } else if (hasCronInstalled()) {
      console.log('Cron job already present.');
    }
  } catch (error) {
    console.error('Cron install failed:', error.message);
    console.error('');
    console.error('Manual install — run in Terminal.app:');
    console.error(`  (crontab -l 2>/dev/null; echo '${cronLine()}') | crontab -`);
    process.exitCode = 1;
  }

  console.log(`Cron line: ${cronLine()}`);
  console.log('');
  console.log('Hinweis: Mac muss wach sein — für Schlafmodus GitHub Actions nutzen.');
  console.log('  docs/KEEP-ALIVE-SETUP.md');
}

main();
