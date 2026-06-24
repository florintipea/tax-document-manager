/**
 * One-time production bootstrap: beta tester accounts.
 * Admin is ensured separately on every startup via ensure-admin.ts.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ensureAdmin } from './ensure-admin';

const prisma = new PrismaClient();

const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || 'TaxDocTest2026!';
const ACCOUNT_COUNT = Number(process.env.TEST_ACCOUNT_COUNT || 50);
const EMAIL_DOMAIN = process.env.TEST_ACCOUNT_DOMAIN || 'taxdoc.test';

async function main() {
  await ensureAdmin(prisma);
  console.log('Admin account verified.');

  const testHash = await bcrypt.hash(TEST_PASSWORD, 12);
  for (let i = 1; i <= ACCOUNT_COUNT; i += 1) {
    const number = String(i).padStart(2, '0');
    const email = `tester${number}@${EMAIL_DOMAIN}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: testHash,
        role: 'user',
        country: 'DE',
        language: 'de',
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
