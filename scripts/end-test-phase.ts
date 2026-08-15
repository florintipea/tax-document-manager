/**
 * Ends the beta test phase for all tester accounts.
 * Testers keep role "user" only — they lose app access until reactivated.
 */

import { PrismaClient } from '@prisma/client';
import { endBetaTestPhase } from '../lib/test-phase/access';
import { queuePricingSurveyForBetaTesters } from '../lib/test-phase/survey';

const prisma = new PrismaClient();

async function main() {
  console.log('Ending TaxDoc beta test phase...\n');

  const count = await endBetaTestPhase();
  const surveyQueued = await queuePricingSurveyForBetaTesters();

  const testers = await prisma.user.findMany({
    where: {
      email: { endsWith: `@${process.env.TEST_ACCOUNT_DOMAIN || 'taxdoc.test'}` },
    },
    select: { email: true, role: true },
  });

  const admins = testers.filter((t) => t.role === 'admin' || t.role === 'super_admin');
  if (admins.length > 0) {
    console.warn('Warning: tester-domain emails with admin role:', admins);
  }

  console.log(`✅ Deactivated ${count} beta-tester subscription(s).`);
  console.log(`   Pricing survey invites queued: ${surveyQueued}`);
  console.log(`   Tester accounts found: ${testers.length} (all remain role: user)`);
  console.log('\nSet on your server (Render / .env):');
  console.log('   TEST_PHASE_ENABLED=false');
  console.log('\nThen restart the app. Testers cannot log in until you run:');
  console.log('   npm run test:reactivate-phase');
  console.log('   TEST_PHASE_ENABLED=true');
}

main()
  .catch((error) => {
    console.error('Failed to end test phase:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
