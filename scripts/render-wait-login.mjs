#!/usr/bin/env node
/** Poll Render deploy + verify admin login-check returns 200 */

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

async function renderApi(path) {
  const response = await fetch(`https://api.render.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.RENDER_API_KEY}`,
      Accept: 'application/json',
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  loadEnvFile();
  const serviceName = process.env.RENDER_SERVICE_NAME || 'taxdoc-beta';
  const email = process.env.ADMIN_EMAIL || 'lf.tipea@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@2024!Secure';
  const publicUrl = 'https://taxdoc-beta.onrender.com';

  const services = await renderApi('/services?limit=100');
  const service = services.find((s) => s.service?.name === serviceName)?.service;
  if (!service?.id) throw new Error('Service not found');

  const deadline = Date.now() + 35 * 60 * 1000;
  while (Date.now() < deadline) {
    const list = await renderApi(`/services/${service.id}/deploys?limit=1`);
    const status = list[0]?.deploy?.status;
    process.stdout.write(`\rDeploy: ${status || 'pending'}...   `);
    if (status === 'live') break;
    if (status === 'build_failed' || status === 'update_failed') {
      throw new Error(`Deploy failed: ${status}`);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  console.log('\nDeploy live. Verifying login...');

  const loginDeadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < loginDeadline) {
    const response = await fetch(`${publicUrl}/api/auth/login-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      console.log(`Login-check OK (${response.status}):`, JSON.stringify(body));
      return;
    }
    process.stdout.write(`\rLogin: ${response.status} ${body.error || ''} — retry...   `);
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error('Login-check never returned 200');
}

main().catch((e) => {
  console.error('\n', e.message || e);
  process.exit(1);
});
