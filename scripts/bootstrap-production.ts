/**
 * One-time production bootstrap: beta tester accounts.
 * Admin is ensured separately on every startup via ensure-admin.ts.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ensureAdmin } from './ensure-admin';
import {
  formatTesterEmail,
  formatTesterNumber,
  resolveAccountCount,
} from '../lib/test-phase/tester-accounts';

const prisma = new PrismaClient();

const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || 'TaxDocTest2026!';
const ACCOUNT_COUNT = resolveAccountCount(process.env.TEST_ACCOUNT_COUNT);
const EMAIL_DOMAIN = process.env.TEST_ACCOUNT_DOMAIN || 'taxdoc.test';

async function main() {
  await ensureAdmin(prisma);
  console.log('Admin account verified.');

  const testHash = await bcrypt.hash(TEST_PASSWORD, 12);
  for (let i = 1; i <= ACCOUNT_COUNT; i += 1) {
    const number = formatTesterNumber(i, ACCOUNT_COUNT);
    const email = formatTesterEmail(i, EMAIL_DOMAIN, ACCOUNT_COUNT);

    const user = await prisma.user.upsert({
      where: { email },
      // Do not overwrite Steuerprofil / calculatorDraft / partner fields on re-bootstrap
      update: {
        passwordHash: testHash,
        role: 'user',
      },
      create: {
        email,
        name: `Test User ${number}`,
        passwordHash: testHash,
        role: 'user',
        emailVerified: new Date(),
        country: 'DE',
        language: 'de',
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
  }

  console.log(`Beta testers ready: ${ACCOUNT_COUNT} accounts @${EMAIL_DOMAIN}`);
  console.log(`Tester password: ${TEST_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
