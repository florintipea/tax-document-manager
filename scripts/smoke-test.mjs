#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000';
const cookieJar = new Map();

function storeCookies(response) {
  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [];

  for (const cookie of cookies) {
    const [pair] = cookie.split(';');
    const [key, value] = pair.trim().split('=');
    if (key && value) cookieJar.set(key, value);
  }
}

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const headers = new Headers(options.headers || {});
  const cookieHeader = [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  if (cookieHeader) headers.set('cookie', cookieHeader);

  const response = await fetch(url, { ...options, headers, redirect: 'manual' });
  storeCookies(response);

  const buffer = Buffer.from(await response.arrayBuffer());
  const text = buffer.toString('utf8');
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { response, json, text, buffer };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const stamp = Date.now();
  const email = `smoke-${stamp}@example.com`;
  const password = 'SmokeTest123';

  console.log(`Running smoke tests against ${BASE}`);

  const register = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Smoke Tester' }),
  });
  assert(register.response.ok, `Register failed: ${register.text}`);

  const csrf = await request('/api/auth/csrf');
  assert(csrf.json?.csrfToken, 'Missing CSRF token');

  const login = await request('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken: csrf.json.csrfToken,
      email,
      password,
      callbackUrl: `${BASE}/dashboard`,
    }),
  });
  assert(login.response.status === 302, `Login failed with status ${login.response.status}`);
  assert(cookieJar.has('authjs.session-token') || cookieJar.size > 0, 'Login did not set session cookie');

  const tax = await request('/api/tax/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      country: 'US',
      income: 75000,
      taxWithheld: 9000,
      filingStatus: 'single',
      year: 2024,
    }),
  });
  assert(tax.response.ok, `Tax calculate failed: ${tax.text}`);
  assert(typeof tax.json?.taxOwed === 'number', 'Tax response missing taxOwed');

  const samplePdf =
    process.env.SMOKE_SAMPLE_PDF || 'fixtures/sample.pdf';

  assert(existsSync(samplePdf), `Sample PDF not found: ${samplePdf}`);

  const form = new FormData();
  const blob = new Blob([await readFile(samplePdf)], { type: 'application/pdf' });
  form.append('files', blob, 'sample.pdf');

  const upload = await request('/api/documents/upload', {
    method: 'POST',
    body: form,
  });
  assert(upload.response.ok, `Upload failed: ${upload.text}`);
  const doc = upload.json?.documents?.[0];
  assert(doc?.id, 'Upload did not return a document id');
  assert(doc.fileUrl?.includes('/api/documents/'), 'Upload did not return secure file URL');

  const download = await request(doc.fileUrl);
  assert(download.response.ok, `Download failed: ${download.response.status}`);
  assert(download.buffer.length > 0, 'Download returned empty file');

  const search = await request('/api/documents?search=sample');
  assert(search.response.ok, `Search failed: ${search.text}`);

  const wiso = await request('/api/integrations/wiso', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'smoke-demo', password: 'smoke-demo-pass' }),
  });
  assert(wiso.response.ok, `WISO connect failed: ${wiso.text}`);

  const wisoSync = await request('/api/integrations/wiso', { method: 'PATCH' });
  assert(wisoSync.response.ok, `WISO sync failed: ${wisoSync.text}`);

  const notebook = await request('/api/integrations/notebook-lm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: 'smoke-demo-key' }),
  });
  assert(notebook.response.ok, `Notebook LM connect failed: ${notebook.text}`);

  const notebookStatus = await request('/api/integrations/notebook-lm');
  assert(notebookStatus.response.ok, `Notebook LM status failed: ${notebookStatus.text}`);
  assert(notebookStatus.json?.connected === true, 'Notebook LM not connected');

  const del = await request(`/api/documents/${doc.id}`, { method: 'DELETE' });
  assert(del.response.ok, `Delete failed: ${del.text}`);

  console.log('✅ Smoke tests passed');
}

main().catch((error) => {
  console.error('❌ Smoke tests failed:', error.message);
  process.exit(1);
});
