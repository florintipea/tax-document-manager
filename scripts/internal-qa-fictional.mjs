#!/usr/bin/env node
/**
 * Internal QA pass with clearly fictional Max Mustermann data.
 * Usage:
 *   QA_BASE_URL=https://taxdoc-beta.onrender.com node scripts/internal-qa-fictional.mjs
 *   QA_EMAIL=tester002@taxdoc.test QA_PASSWORD=... node scripts/internal-qa-fictional.mjs
 *
 * Never uses real customer PII. Does not call fake ELSTER submit.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvFile() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
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

loadEnvFile();

const BASE = (process.env.QA_BASE_URL || process.env.SMOKE_BASE_URL || 'https://taxdoc-beta.onrender.com').replace(
  /\/$/,
  ''
);
const YEAR = Number(process.env.QA_YEAR || new Date().getFullYear() - 1);
const EMAIL = process.env.QA_EMAIL || 'tester002@taxdoc.test';
const PASSWORD = process.env.QA_PASSWORD || process.env.TEST_ACCOUNT_PASSWORD || 'TaxDocTest2026!';
const WRITE_REPORT = process.env.QA_WRITE_REPORT !== 'false';

/** Fictional persona — clearly fake, no real PII */
const PERSONA = {
  name: 'Max Mustermann',
  anrede: 'herr',
  vorname: 'Max',
  nachname: 'Mustermann',
  geburtsdatum: '1985-03-15',
  steuernummer: '12/345/67890', // fictional Finanzamt format
  idNr: '12345678901', // fictional 11 digits (not a real IdNr)
  street: 'Musterstraße 12',
  zip: '80331',
  city: 'München',
  bundesland: 'BY',
  steuerklasse: 'I',
  religion: 'keine',
  country: 'DE',
  language: 'de',
  deFilingMode: 'einzel',
  isCrossBorder: true,
  hasRentalIncome: true,
  hasEmploymentIncome: true,
  calculatorDraft: JSON.stringify({
    income: 54000,
    taxWithheld: 9200,
    year: YEAR,
    note: 'FIKTIV QA Max Mustermann',
  }),
};

const cookieJar = new Map();
const results = [];

function storeCookies(response) {
  const cookies =
    typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  for (const cookie of cookies) {
    const [pair] = cookie.split(';');
    const [key, value] = pair.trim().split('=');
    if (key && value !== undefined) cookieJar.set(key, value);
  }
}

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
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
  return { response, json, text, status: response.status };
}

function record(area, status, detail) {
  results.push({ area, status, detail });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} [${area}] ${detail}`);
}

async function expectOk(area, path, options = {}, assertFn) {
  try {
    const res = await request(path, options);
    if (assertFn) {
      assertFn(res);
    } else if (!(res.status >= 200 && res.status < 300)) {
      throw new Error(`HTTP ${res.status}: ${res.text.slice(0, 200)}`);
    }
    record(area, 'pass', `${options.method || 'GET'} ${path} → ${res.status}`);
    return res;
  } catch (error) {
    record(area, 'fail', `${options.method || 'GET'} ${path}: ${error.message}`);
    return null;
  }
}

async function login() {
  const csrf = await request('/api/auth/csrf');
  if (!csrf.json?.csrfToken) {
    record('auth', 'fail', 'CSRF token missing');
    return false;
  }
  const login = await request('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken: csrf.json.csrfToken,
      email: EMAIL,
      password: PASSWORD,
      redirect: 'false',
      json: 'true',
    }),
  });
  if (login.status !== 302 && login.status !== 200) {
    record('auth', 'fail', `Login HTTP ${login.status}`);
    return false;
  }
  const session = await request('/api/auth/session');
  if (!session.json?.user?.email) {
    record('auth', 'fail', 'Session empty after login');
    return false;
  }
  record('auth', 'pass', `Logged in as ${session.json.user.email}`);
  return true;
}

async function main() {
  console.log(`Internal QA (fictional) against ${BASE}`);
  console.log(`Persona: ${PERSONA.vorname} ${PERSONA.nachname} | year=${YEAR} | account=${EMAIL}`);

  // Public pages
  for (const path of [
    '/',
    '/pricing',
    '/trust',
    '/beta',
    '/beta-anfrage',
    '/legal/impressum',
    '/legal/datenschutz',
    '/auth/login',
    '/api/health',
  ]) {
    await expectOk(`public:${path}`, path, {}, (res) => {
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
    });
  }

  // Pricing API (public-ish)
  await expectOk('pricing:effective', '/api/pricing/effective');

  if (!(await login())) {
    writeReport();
    process.exit(1);
  }

  // Admin must reject non-admin
  const adminRes = await request('/api/admin/insights');
  if (adminRes.status === 401 || adminRes.status === 403) {
    record('admin:reject', 'pass', `Non-admin blocked (${adminRes.status})`);
  } else {
    record('admin:reject', 'fail', `Expected 401/403, got ${adminRes.status}`);
  }

  // Onboarding
  await expectOk('onboarding', '/api/user/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true }),
  });

  // Steuerprofil — fictional Max Mustermann
  await expectOk('steuerprofil', '/api/user/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: PERSONA.name,
      country: PERSONA.country,
      language: PERSONA.language,
      anrede: PERSONA.anrede,
      vorname: PERSONA.vorname,
      nachname: PERSONA.nachname,
      geburtsdatum: PERSONA.geburtsdatum,
      steuernummer: PERSONA.steuernummer,
      idNr: PERSONA.idNr,
      street: PERSONA.street,
      zip: PERSONA.zip,
      city: PERSONA.city,
      bundesland: PERSONA.bundesland,
      steuerklasse: PERSONA.steuerklasse,
      religion: PERSONA.religion,
      deFilingMode: PERSONA.deFilingMode,
      isCrossBorder: PERSONA.isCrossBorder,
      hasRentalIncome: PERSONA.hasRentalIncome,
      hasEmploymentIncome: PERSONA.hasEmploymentIncome,
      calculatorDraft: PERSONA.calculatorDraft,
    }),
  });

  const settings = await request('/api/user/settings');
  if (settings.json?.settings?.vorname === 'Max' && settings.json?.settings?.idNr === '12345678901') {
    record('steuerprofil:persist', 'pass', 'Max Mustermann + fiktive IdNr persisted');
  } else {
    record(
      'steuerprofil:persist',
      'fail',
      `Unexpected settings: ${JSON.stringify(settings.json?.settings?.vorname)} / ${settings.json?.settings?.idNr}`
    );
  }

  // Dashboard
  await expectOk('dashboard:finance', '/api/dashboard/finance');

  // Documents list + upload fictional PDF
  await expectOk('documents:list', `/api/documents?year=${YEAR}`);
  const samplePdf = join(root, 'fixtures', 'sample.pdf');
  if (existsSync(samplePdf)) {
    const form = new FormData();
    const blob = new Blob([readFileSync(samplePdf)], { type: 'application/pdf' });
    form.append('files', blob, `lohnabrechnung-mustermann-FIKTIV-${YEAR}.pdf`);
    await expectOk('documents:upload', '/api/documents/upload', {
      method: 'POST',
      body: form,
    });
  } else {
    record('documents:upload', 'warn', 'fixtures/sample.pdf missing — skipped');
  }

  // Categories
  await expectOk('categories', '/api/categories');

  // Grenzgänger + ELSTER structured data
  await expectOk('elster:grenzgaenger', '/api/elster/grenzgaenger', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: YEAR,
      enabled: true,
      workCountry: 'AT',
      residenceCountry: 'DE',
      foreignEmploymentIncome: 54000,
      foreignWithholdingTax: 4200,
      commutingKmOneWay: 38,
      commutingDays: 210,
      socialInsuranceCountry: 'AT',
      dbaMethodHint: 'anrechnung',
      notes: 'FIKTIV QA Max Mustermann — kein echtes ELSTER-Submit',
      needsReview: true,
    }),
  });

  await expectOk('elster:entries', '/api/elster/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: YEAR,
      kind: 'income',
      category: 'gehalt',
      label: 'Gehalt fiktiv Mustermann',
      amount: 48000,
      needsReview: true,
    }),
  });

  await expectOk('elster:properties', '/api/elster/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: 'Musterstraße 1, 80331 München',
      purchasePrice: 350000,
      purchaseCosts: 25000,
      buildingValue: 280000,
      label: 'Musterwohnung QA',
    }),
  });

  await expectOk('elster:rental', '/api/elster/rental', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: YEAR,
      objectLabel: 'Musterwohnung QA',
      grossRent: 12000,
      operatingCosts: 2400,
      werbungskosten: 800,
      afaAmount: 5600,
      needsReview: true,
    }),
  });

  await expectOk('elster:nebenkosten', '/api/elster/nebenkosten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: YEAR,
      settlementAmount: 450,
      isNachzahlung: true,
      objectLabel: 'NK Muster 2025 QA',
    }),
  });

  // Preview + export checklist
  const preview = await request(`/api/elster/preview?year=${YEAR}`);
  if (preview.status === 200 && preview.json?.preview?.fields?.length > 0 && preview.json.preview.validation) {
    record(
      'elster:preview',
      'pass',
      `fields=${preview.json.preview.fields.length} anlagen=${preview.json.preview.anlagen.length} gaps=${preview.json.preview.gaps.length}`
    );
  } else {
    record(
      'elster:preview',
      'fail',
      `HTTP ${preview.status}: ${preview.text.slice(0, 300)}`
    );
  }

  // Batch autofill (KI-Vorschlag → ELSTER prep) — no ELSTER submit
  const batch = await request('/api/elster/batch-autofill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: YEAR,
      mode: 'year',
      reanalyze: true,
      applyTaxLines: true,
    }),
  });
  if (
    batch.status === 200 &&
    batch.json?.disclaimerDe &&
    /prüfen|unverbindlich|Auto-Abgabe/i.test(batch.json.disclaimerDe) &&
    batch.json?.summary &&
    Array.isArray(batch.json.results)
  ) {
    record(
      'elster:batch-autofill',
      'pass',
      `ok=${batch.json.summary.ok} error=${batch.json.summary.error} taxLines=${batch.json.summary.taxLinesCreated} review=${batch.json.summary.needsReviewCount}`
    );
  } else if (batch.status === 404) {
    record('elster:batch-autofill', 'fail', 'Endpoint missing on deploy — push required');
  } else {
    record(
      'elster:batch-autofill',
      'fail',
      `HTTP ${batch.status}: ${batch.text.slice(0, 300)}`
    );
  }

  const exp = await request(`/api/elster/export?year=${YEAR}&format=json`);
  if (exp.status === 200 && exp.json?.export?.checklist?.length) {
    record('elster:export', 'pass', `checklist items=${exp.json.export.checklist.length}`);
  } else {
    record('elster:export', 'fail', `HTTP ${exp.status}: ${exp.text.slice(0, 200)}`);
  }

  // Calculator
  await expectOk('calculator', '/api/tax/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      country: 'DE',
      income: 54000,
      taxWithheld: 9200,
      steuerklasse: 'I',
      deFilingMode: 'einzel',
      year: YEAR,
      crossBorder: {
        enabled: true,
        workCountry: 'AT',
        residenceCountry: 'DE',
        foreignIncome: 54000,
        foreignTaxPaid: 4200,
      },
      rental: {
        enabled: true,
        grossRent: 12000,
        operatingCosts: 2400,
        buildingValue: 280000,
        afaRate: 2,
      },
    }),
  });

  // AI — graceful without BYO key
  const ai = await request('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hallo — nur QA, fiktiv' }),
  });
  if (ai.status === 503 && (ai.json?.code === 'AI_NOT_CONFIGURED' || /KI|AI|provider/i.test(ai.json?.error || ''))) {
    record('ai:chat', 'pass', 'Graceful AI_NOT_CONFIGURED without BYO key');
  } else if (ai.status === 200) {
    record('ai:chat', 'pass', 'AI responded (provider configured)');
  } else {
    record('ai:chat', 'fail', `Unexpected AI HTTP ${ai.status}: ${ai.text.slice(0, 200)}`);
  }
  await expectOk('ai:status', '/api/ai/status');

  // Support chat
  await expectOk('support:get', '/api/support/thread');
  await expectOk('support:post', '/api/support/thread', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: 'FIKTIV QA: Hallo Support — Max Mustermann Testnachricht, bitte ignorieren.',
    }),
  });

  // GDPR export (no delete — keep tester account)
  await expectOk('gdpr:export', '/api/user/export');

  // Billing read
  await expectOk('billing', '/api/billing');

  // Interview / authenticated pages return redirect or 200
  for (const path of [
    '/dashboard',
    '/documents',
    '/calculator',
    '/steuererklaerung',
    '/grenzgaenger',
    '/interview',
    '/settings',
    '/ai-assistant',
    '/support',
    '/tax-forms',
  ]) {
    await expectOk(`page:${path}`, path, {}, (res) => {
      if (res.status !== 200 && res.status !== 307 && res.status !== 302) {
        throw new Error(`HTTP ${res.status}`);
      }
    });
  }

  // Beta request — validation only (invalid email format) to avoid burning slots
  const betaBad = await request('/api/beta/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', name: 'QA' }),
  });
  if (betaBad.status === 400) {
    record('beta:validation', 'pass', 'Invalid email rejected');
  } else {
    record('beta:validation', 'warn', `Expected 400, got ${betaBad.status}`);
  }

  writeReport();
  const fails = results.filter((r) => r.status === 'fail');
  console.log(`\nDone. pass=${results.filter((r) => r.status === 'pass').length} fail=${fails.length} warn=${results.filter((r) => r.status === 'warn').length}`);
  process.exit(fails.length ? 1 : 0);
}

function writeReport() {
  if (!WRITE_REPORT) return;
  const docsDir = join(root, 'docs');
  mkdirSync(docsDir, { recursive: true });
  const lines = [
    '# Internal QA — Fictional Pass',
    '',
    `**Datum:** ${new Date().toISOString()}`,
    `**Base:** ${BASE}`,
    `**Account:** \`${EMAIL}\` (Tester)`,
    '',
    '## Persona (fiktiv)',
    '',
    '- **Name:** Max Mustermann',
    `- **Steuernummer:** \`${PERSONA.steuernummer}\` (fiktiv)`,
    `- **IdNr:** \`${PERSONA.idNr}\` (11 Ziffern, fiktiv — keine echte IdNr)`,
    `- **Adresse:** ${PERSONA.street}, ${PERSONA.zip} ${PERSONA.city}`,
    `- **Grenzgänger:** Wohnsitz DE, Arbeit AT, Einkommen ${YEAR}: 54 000 € (fiktiv)`,
    '- **Kein** ELSTER-/ERiC-Submit',
    '',
    '## Ergebnisse',
    '',
    '| Bereich | Status | Detail |',
    '|---|---|---|',
    ...results.map(
      (r) =>
        `| ${r.area} | ${r.status === 'pass' ? 'PASS' : r.status === 'fail' ? 'FAIL' : 'WARN'} | ${String(r.detail).replace(/\|/g, '\\|')} |`
    ),
    '',
    '## Bekannte Limits',
    '',
    '- KI-Chat braucht BYO API-Key → ohne Key erwarteter 503 `AI_NOT_CONFIGURED`',
    '- Kein Fake-ELSTER-Submit / ERiC',
    '- GDPR-Delete bewusst nicht gegen Tester-Accounts ausgeführt',
    '- Beta-Slot-Vergabe nicht mit echten Invites spammt (nur Validierung getestet)',
    '',
  ];
  const out = join(docsDir, 'INTERNAL-QA-FICTIONAL-PASS.md');
  writeFileSync(out, lines.join('\n'));
  console.log(`Wrote ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
