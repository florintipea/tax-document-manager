#!/usr/bin/env node
/**
 * Extend Render keep-alive by 14 more days and reinstall cron if needed.
 */
import {
  TWO_WEEKS_MS,
  CLOUD_EXPIRY_FILE,
  createInitialState,
  readState,
  writeState,
  installCron,
  hasCronInstalled,
  appendLog,
  formatExpiry,
  extendCloudExpiry,
  EXPIRED_MARKER,
} from './keepalive-common.mjs';
import fs from 'node:fs';

function main() {
  const now = Date.now();
  let state = readState();

  if (!state) {
    state = createInitialState();
    console.log('No prior state — starting fresh 2-week period.');
  } else if (now > state.expiresAt) {
    state.expiresAt = now + TWO_WEEKS_MS;
    console.log('Period had expired — new 2-week period started.');
  } else {
    state.expiresAt += TWO_WEEKS_MS;
    console.log('Extended existing period by 2 weeks.');
  }

  writeState(state);
  const cloudUntil = extendCloudExpiry();
  appendLog(`extended keep-alive until ${formatExpiry(state.expiresAt)}`);
  appendLog(`cloud expiry updated to ${cloudUntil}`);

  if (fs.existsSync(EXPIRED_MARKER)) {
    fs.unlinkSync(EXPIRED_MARKER);
  }

  try {
    const added = installCron();
    if (added) {
      appendLog('cron job reinstalled');
      console.log('Cron job reinstalled.');
    } else if (hasCronInstalled()) {
      console.log('Cron job already active.');
    } else {
      console.warn('Cron not installed — run in Terminal.app: npm run keepalive:install');
    }
  } catch (error) {
    console.warn('Cron install failed:', error.message);
    console.warn('Run in Terminal.app: npm run keepalive:install');
  }

  console.log(`New local expiry: ${formatExpiry(state.expiresAt)}`);
  console.log(`Cloud expiry (${CLOUD_EXPIRY_FILE}): ${cloudUntil}`);
  console.log('Push to GitHub so Actions picks up the new date: npm run github:push');
}

main();
