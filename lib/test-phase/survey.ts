import { db } from '@/lib/db/client';
import {
  BETA_TESTER_PLAN_ID,
  isBetaTesterEmail,
  isTestPhaseEnabled,
  TESTER_EMAIL_DOMAIN,
} from './access';

export async function queuePricingSurveyForBetaTesters(): Promise<number> {
  const domain = TESTER_EMAIL_DOMAIN.toLowerCase();

  const testers = await db.user.findMany({
    where: {
      OR: [
        { email: { endsWith: `@${domain}` } },
        { subscription: { planId: BETA_TESTER_PLAN_ID } },
      ],
    },
    select: { id: true },
  });

  let queued = 0;
  for (const tester of testers) {
    await db.pricingSurveyInvite.upsert({
      where: { userId: tester.id },
      create: { userId: tester.id },
      update: { dismissed: false, invitedAt: new Date() },
    });
    queued += 1;
  }

  return queued;
}

export async function getPricingSurveyStatus(userId: string, email: string) {
  const [invite, response] = await Promise.all([
    db.pricingSurveyInvite.findUnique({ where: { userId } }),
    db.pricingSurvey.findUnique({ where: { userId } }),
  ]);

  const isBetaTester =
    isBetaTesterEmail(email) ||
    Boolean(
      await db.subscription.findFirst({
        where: { userId, planId: BETA_TESTER_PLAN_ID },
        select: { id: true },
      })
    );

  const phaseEnded = !isTestPhaseEnabled();
  const hasResponded = Boolean(response);
  const hasInvite = Boolean(invite);

  const shouldShow =
    phaseEnded &&
    isBetaTester &&
    !hasResponded &&
    hasInvite &&
    !invite?.dismissed;

  return {
    shouldShow,
    hasResponded,
    dismissed: invite?.dismissed ?? false,
    phaseEnded,
    isBetaTester,
  };
}
