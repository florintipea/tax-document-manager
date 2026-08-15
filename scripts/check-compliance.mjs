#!/usr/bin/env node
/**
 * Automated DSGVO / legal compliance checklist (CI-failing on critical gaps).
 * Defensive checks only — no network calls, no attack simulations.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const errors = [];
const warnings = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function mustExist(rel, label) {
  if (!exists(rel)) {
    errors.push(`Missing ${label}: ${rel}`);
  }
}

function mustContain(rel, needles, label) {
  if (!exists(rel)) {
    errors.push(`Missing file for ${label}: ${rel}`);
    return;
  }
  const text = read(rel);
  for (const needle of needles) {
    if (!text.includes(needle)) {
      errors.push(`${label}: expected "${needle}" in ${rel}`);
    }
  }
}

// ── Critical routes / pages ─────────────────────────────────────────────────
mustExist('app/legal/datenschutz/page.tsx', 'Datenschutz page');
mustExist('app/legal/impressum/page.tsx', 'Impressum page');
mustExist('docs/DATENSCHUTZ-COMPLIANCE.md', 'Datenschutz compliance doc');
mustExist('docs/SECURITY-MONTHLY.md', 'Monthly security process doc');

// Export / delete account (Art. 15/17/20)
mustExist('app/api/user/export/route.ts', 'GDPR data export API');
mustExist('app/api/user/delete/route.ts', 'Account deletion API');

// Security headers module
mustExist('lib/security/headers.ts', 'Security headers');
mustContain('lib/security/headers.ts', [
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'X-Content-Type-Options',
], 'Security headers content');

// Legal content: contact email + serviceable address present
mustContain('lib/i18n/messages/de.json', [
  'lf.tipea@gmail.com',
  'impressumAddress',
  'Sigismundstrasse 19',
  '78462 Konstanz',
], 'DE legal contact');
mustContain('lib/i18n/messages/de.json', [
  'datenschutzRetention',
  'datenschutzSubprocessors',
  'datenschutzCookies',
  'datenschutzRights',
], 'DE Datenschutz completeness keys');

const impressum = exists('app/legal/impressum/page.tsx')
  ? read('app/legal/impressum/page.tsx')
  : '';
if (impressum && !impressum.includes('impressumAddress')) {
  errors.push('Impressum must show serviceable address (legal.impressumAddress)');
}
if (exists('lib/i18n/messages/de.json')) {
  const deLegal = read('lib/i18n/messages/de.json');
  if (deLegal.includes('impressumAddressTodo') || /Anschrift: noch nicht hinterlegt/.test(deLegal)) {
    errors.push('DE impressum still has address TODO — replace with real serviceable address');
  }
}

// Optional: false StBerG claim patterns in app marketing copy (not disclaimers)
const claimFiles = [
  'app/page.tsx',
  'lib/i18n/messages/de.json',
  'lib/i18n/messages/en.json',
];
const dangerous = [
  /wir sind (ein )?steuerberater/i,
  /licensed tax advisor/i,
  /offizielle steuerberatung/i,
  /ersetzt (einen )?steuerberater(?!.*(nicht|kein))/i,
];

for (const rel of claimFiles) {
  if (!exists(rel)) continue;
  const text = read(rel);
  for (const re of dangerous) {
    if (re.test(text)) {
      // Allow lines that clearly negate the claim
      const lines = text.split('\n').filter((l) => re.test(l));
      const bad = lines.filter(
        (l) =>
          !/kein|nicht|no |not |ersatz|keine steuerberatung|not tax advice|hilfsmittel/i.test(
            l
          )
      );
      if (bad.length > 0) {
        errors.push(`Possible false Steuerberater claim in ${rel}: ${bad[0].trim().slice(0, 120)}`);
      }
    }
  }
}

// Cookie notice component (necessary cookies)
if (!exists('components/legal/cookie-notice.tsx')) {
  warnings.push('Cookie notice component missing (recommended for transparency)');
}

// Docs checklist markers
if (exists('docs/DATENSCHUTZ-COMPLIANCE.md')) {
  const doc = read('docs/DATENSCHUTZ-COMPLIANCE.md');
  for (const marker of ['## Checklist', 'Lawyer review', 'AV-Vertrag', 'Render']) {
    if (!doc.includes(marker)) {
      warnings.push(`DATENSCHUTZ-COMPLIANCE.md missing section marker: ${marker}`);
    }
  }
}

console.log('TaxDoc compliance check');
console.log('=======================');
if (warnings.length) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.log('\nCritical failures:');
  for (const e of errors) console.log(`  ✖ ${e}`);
  console.log(`\nFailed with ${errors.length} critical issue(s).`);
  process.exit(1);
}

console.log('\n✔ All critical compliance checks passed.');
if (warnings.length) {
  console.log(`(${warnings.length} warning(s) — non-blocking)`);
}
process.exit(0);
