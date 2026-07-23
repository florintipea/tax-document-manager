#!/usr/bin/env node
/**
 * Remove Render keep-alive cron job (keeps state file for reference).
 */
import { removeCron, appendLog, hasCronInstalled } from './keepalive-common.mjs';

function main() {
  if (!hasCronInstalled()) {
    console.log('Cron job not installed — nothing to remove.');
    return;
  }

  removeCron();
  appendLog('cron job uninstalled via npm run keepalive:uninstall');
  console.log('Cron job removed.');
  console.log('State file kept. Run keepalive:install to reinstall.');
}

main();
