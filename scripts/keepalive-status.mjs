#!/usr/bin/env node
/**
 * Show Render keep-alive status (expiry, cron, days remaining).
 */
import {
  STATE_FILE,
  CLOUD_EXPIRY_FILE,
  cronLine,
  readState,
  hasCronInstalled,
  formatExpiry,
  readCloudExpiry,
  isCloudExpired,
  EXPIRED_MARKER,
} from './keepalive-common.mjs';
import fs from 'node:fs';

function main() {
  const state = readState();
  const cronInstalled = hasCronInstalled();
  const now = Date.now();

  console.log('TaxDoc Render Keep-Alive Status');
  console.log('================================');

  if (!state) {
    console.log('Status: not installed');
    console.log(`State file: ${STATE_FILE} (missing)`);
    console.log(`Cron: ${cronInstalled ? 'installed' : 'not installed'}`);
    if (cronInstalled) console.log(`Cron line: ${cronLine()}`);
    process.exit(0);
  }

  const expired = now > state.expiresAt;
  const daysLeft = Math.max(0, Math.ceil((state.expiresAt - now) / (24 * 60 * 60 * 1000)));

  console.log(`Started:  ${formatExpiry(state.startedAt)}`);
  console.log(`Expires:  ${formatExpiry(state.expiresAt)}`);
  console.log(`Status:   ${expired ? 'EXPIRED' : 'active'}`);
  if (!expired) {
    console.log(`Remaining: ${daysLeft} day(s)`);
  }
  console.log(`Cron:     ${cronInstalled ? 'installed' : 'not installed'}`);
  if (cronInstalled) {
    console.log(`Cron line: ${cronLine()}`);
  }
  if (fs.existsSync(EXPIRED_MARKER)) {
    console.log(`Expired marker: ${EXPIRED_MARKER}`);
  }
  if (expired) {
    console.log('');
    console.log('Extend with: npm run keepalive:extend');
  }

  const cloudExpiry = readCloudExpiry();
  console.log('');
  console.log('Cloud (GitHub Actions)');
  console.log('----------------------');
  if (!cloudExpiry) {
    console.log(`File: ${CLOUD_EXPIRY_FILE} (missing)`);
  } else {
    console.log(`Expires: ${cloudExpiry}`);
    console.log(`Status:  ${isCloudExpired() ? 'EXPIRED' : 'active'}`);
    if (isCloudExpired()) {
      console.log('Extend: npm run keepalive:extend && npm run github:push');
    }
  }
  console.log('Docs: docs/KEEP-ALIVE-SETUP.md');
}

main();
