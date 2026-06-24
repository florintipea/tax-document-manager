#!/usr/bin/env node

/**
 * Verifies test accounts can log in via NextAuth credentials flow.
 */

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || 'TaxDocTest2026!';
const DOMAIN = process.env.TEST_ACCOUNT_DOMAIN || 'taxdoc.test';

const cookieJar = new Map();

function storeCookies(response) {
  const cookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];
  for (const cookie of cookies) {
    const [pair] = cookie.split(';');
    const [key, value] = pair.trim().split('=');
    if (key && value) cookieJar.set(key, value);
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const cookieHeader = [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  if (cookieHeader) headers.set('cookie', cookieHeader);

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    redirect: 'manual',
  });
  storeCookies(response);

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { response, json, text };
}

async function login(email) {
  cookieJar.clear();
  const csrf = await request('/api/auth/csrf');
  if (!csrf.json?.csrfToken) throw new Error('Missing CSRF token');

  const login = await request('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken: csrf.json.csrfToken,
      email,
      password: PASSWORD,
      callbackUrl: `${BASE}/dashboard`,
    }),
  });

  if (login.response.status !== 302) {
    throw new Error(`Login failed for ${email}: ${login.response.status} ${login.text}`);
  }

  const session = await request('/api/auth/session');
  if (!session.json?.user?.email) {
    throw new Error(`No session for ${email}`);
  }

  return session.json.user.email;
}

async function main() {
  console.log(`Verifying test accounts on ${BASE}`);

  const samples = [
    `tester01@${DOMAIN}`,
    `tester25@${DOMAIN}`,
    `tester50@${DOMAIN}`,
  ];

  for (const email of samples) {
    const loggedIn = await login(email);
    console.log(`✅ Login OK: ${loggedIn}`);
  }

  console.log('\n✅ Test account login verification passed');
}

main().catch((error) => {
  console.error('❌ Verification failed:', error.message || error);
  process.exit(1);
});
