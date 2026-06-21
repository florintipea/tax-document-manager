/**
 * Re-enables beta tester access (does not grant admin rights).
 */

import { PrismaClient } from '@prisma/client';
import { reactivateBetaTestPhase } from '../lib/test-phase/access';

const prisma = new PrismaClient();

async function main() {
  const days = Number(process.env.BETA_TEST_DAYS || 90);
  console.log(`Reactivating beta test phase for ${days} days...\n`);

  const count = await reactivateBetaTestPhase(days);

  await prisma.user.updateMany({
    where: {
      email: { endsWith: `@${process.env.TEST_ACCOUNT_DOMAIN || 'taxdoc.test'}` },
      role: { notIn: ['admin', 'super_admin'] },
    },
    data: { role: 'user' },
  });

  console.log(`✅ Reactivated ${count} beta-tester subscription(s).`);
  console.log('   All testers remain normal users (no admin access).');
  console.log('\nSet on your server:');
  console.log('   TEST_PHASE_ENABLED=true');
  console.log('Then restart the app.');
}

main()
  .catch((error) => {
    console.error('Failed to reactivate test phase:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
