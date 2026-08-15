#!/usr/bin/env node
/**
 * Trigger weekly admin digest against the live web service.
 * Used by Render Cron: CRON_SECRET + APP_URL required.
 */
const base = (process.env.APP_URL || '').replace(/\/$/, '');
const secret = process.env.CRON_SECRET || process.env.ADMIN_CRON_SECRET;
if (!base || !secret) {
  console.error('APP_URL and CRON_SECRET required');
  process.exit(1);
}

const res = await fetch(`${base}/api/admin/weekly-report`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${secret}` },
});
const text = await res.text();
console.log(res.status, text);
if (!res.ok) process.exit(1);
