#!/usr/bin/env node
/**
 * Set admin env vars on Render and trigger a deploy (one-time password reset flow).
 * Usage: ADMIN_PASSWORD='...' node scripts/render-set-admin-env.mjs
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

async function renderApi(path, method = 'GET', body) {
  const key = process.env.RENDER_API_KEY;
  const response = await fetch(`https://api.render.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Render API ${method} ${path} (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function upsertEnvVar(serviceId, key, value) {
  await renderApi(
    `/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
    'PUT',
    { value }
  );
  console.log(`Set ${key}`);
}

async function main() {
  loadEnvFile();

  const apiKey = process.env.RENDER_API_KEY;
  const serviceName = process.env.RENDER_SERVICE_NAME || 'taxdoc-beta';
  const adminEmail = process.env.ADMIN_EMAIL || 'lf.tipea@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!apiKey) {
    console.error('Missing RENDER_API_KEY in .env');
    process.exit(1);
  }
  if (!adminPassword) {
    console.error('Missing ADMIN_PASSWORD (pass on command line or in .env)');
    process.exit(1);
  }

  const services = await renderApi('/services?limit=100');
  const service = services.find((s) => s.service?.name === serviceName)?.service;
  if (!service?.id) {
    console.error(`Service not found: ${serviceName}`);
    process.exit(1);
  }

  await upsertEnvVar(service.id, 'ADMIN_EMAIL', adminEmail);
  await upsertEnvVar(service.id, 'ADMIN_PASSWORD', adminPassword);
  await upsertEnvVar(service.id, 'ADMIN_FORCE_RESET', 'true');

  console.log('Triggering deploy...');
  await renderApi(`/services/${service.id}/deploys`, 'POST', {
    clearCache: 'do_not_clear',
  });

  console.log('Done. Wait for deploy to go live, then verify login and remove ADMIN_FORCE_RESET.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
