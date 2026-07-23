/**
 * Creates beta tester accounts (default 50, up to 10_000 via TEST_ACCOUNT_COUNT).
 * Re-run safely: existing accounts get password/lockout sync only.
 * Does NOT touch Steuerprofil, calculatorDraft, partner fields, or other user profile data.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  formatTesterEmail,
  formatTesterNumber,
  MAX_TESTER_COUNT,
  resolveAccountCount,
} from '../lib/test-phase/tester-accounts';

const prisma = new PrismaClient();

const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || 'TaxDocTest2026!';
const ACCOUNT_COUNT = resolveAccountCount(process.env.TEST_ACCOUNT_COUNT);
const EMAIL_DOMAIN = process.env.TEST_ACCOUNT_DOMAIN || 'taxdoc.test';

async function main() {
  console.log(`Creating ${ACCOUNT_COUNT} test accounts...`);

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const accounts: Array<{ number: string; email: string; name: string; password: string }> = [];

  for (let i = 1; i <= ACCOUNT_COUNT; i += 1) {
    const number = formatTesterNumber(i, ACCOUNT_COUNT);
    const email = formatTesterEmail(i, EMAIL_DOMAIN, ACCOUNT_COUNT);
    const name = `Test User ${number}`;

    const user = await prisma.user.upsert({
      where: { email },
      // Keep Steuerprofil / calculatorDraft / partner fields intact across redeploys
      update: {
        passwordHash,
        emailVerified: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        role: 'user',
      },
      create: {
        email,
        name,
        passwordHash,
        emailVerified: new Date(),
        country: 'DE',
        language: 'de',
        theme: 'system',
        role: 'user',
      },
    });

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        planId: 'beta-tester',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: user.id,
        planId: 'beta-tester',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    accounts.push({ number, email, name, password: TEST_PASSWORD });
    console.log(`✅ ${email}`);
  }

  const distDir = join(process.cwd(), 'dist', 'mobile');
  mkdirSync(distDir, { recursive: true });

  const lines = accounts.map(
    (account) =>
      `${account.number}. ${account.email}  |  Passwort: ${account.password}  |  ${account.name}`
  );

  const txtPath = join(distDir, 'TEST-ACCOUNTS.txt');
  writeFileSync(
    txtPath,
    [
      `TaxDoc – ${ACCOUNT_COUNT} Test-Accounts (max ${MAX_TESTER_COUNT})`,
      '====================================',
      '',
      'Alle Tester nutzen dasselbe Passwort:',
      `  ${TEST_PASSWORD}`,
      '',
      'WICHTIG – Tester-Rechte:',
      '  - Nur normale Nutzer (role: user) – KEIN Admin-Zugriff',
      '  - Kostenlos während der aktiven Testphase (Plan: beta-tester)',
      '  - Kein Zugriff auf /admin oder Meldungen-Verwaltung',
      '  - Nach Testphase-Ende: npm run test:end-phase + TEST_PHASE_ENABLED=false',
      '',
      'Nur lf.tipea@gmail.com ist Admin (npm run db:create-admin).',
      '',
      'Jeder Tester bekommt EINE eigene E-Mail (nur einmal vergeben):',
      '',
      ...lines,
      '',
      'App installieren:',
      '  Android → TaxDoc-Android.apk',
      '  iPhone  → TaxDoc-iPhone.zip (Safari → Home-Bildschirm)',
      '',
      'Server auf dem Mac muss laufen:',
      '  npm run dev:mobile',
      '',
      'Login-Seite: /auth/login',
      '',
      `Erstellt: ${new Date().toISOString()}`,
    ].join('\n')
  );

  const csvPath = join(distDir, 'test-accounts.csv');
  writeFileSync(
    csvPath,
    [
      'number,email,name,password',
      ...accounts.map(
        (a) => `${a.number},${a.email},"${a.name}",${a.password}`
      ),
    ].join('\n')
  );

  const sharePath = join(distDir, 'FRIEND-TEST-GUIDE.txt');
  writeFileSync(
    sharePath,
    [
      'TaxDoc Beta – Kurzanleitung für Tester',
      '========================================',
      '',
      '1. App öffnen (Link oder APK vom Entwickler)',
      '2. Anmelden mit deiner Test-E-Mail + Passwort',
      '',
      'Du bist Tester (normaler Nutzer) – kein Admin-Zugriff.',
      'Die App ist für dich in der Testphase kostenlos.',
      '',
      '4. E-Mail aus TEST-ACCOUNTS.txt (jeder nur seine Zeile!)',
      `5. Passwort für alle: ${TEST_PASSWORD}`,
      '',
      'Was testen:',
      '  - Anmelden / Abmelden',
      '  - Dokument hochladen (bis 100 MB)',
      '  - Scan mit Kamera',
      '  - Sprache Deutsch in Einstellungen',
      '  - Duplikat-Hinweis bei gleichem Dokument',
      '  - Feedback-Button oben in der App (Problem melden)',
      '',
      'Feedback: Nutze den „Feedback“-Button in der App –',
      'nur der Entwickler (Admin) sieht Meldungen unter Admin → Meldungen.',
    ].join('\n')
  );

  console.log(`\n📄 ${txtPath}`);
  console.log(`📄 ${csvPath}`);
  console.log(`📄 ${sharePath}`);
  console.log(`\n🎉 ${ACCOUNT_COUNT} test accounts ready.`);
  console.log(`   Password for all: ${TEST_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Failed to create test accounts:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
