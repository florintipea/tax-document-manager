import { db } from '@/lib/db/client';
import { TESTER_EMAIL_DOMAIN } from '@/lib/test-phase/flags';
import { parseTesterSlot } from '@/lib/test-phase/tester-accounts';

export const BETA_TESTER_PASSWORD =
  process.env.TEST_ACCOUNT_PASSWORD || 'TaxDocTest2026!';

export interface BetaAssignInput {
  assignedToEmail: string;
  assignedToName?: string;
  assignedIp?: string;
}

export interface BetaAssignResult {
  testerEmail: string;
  password: string;
  loginUrl: string;
  slot: number;
}

export class BetaAssignError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'ALREADY_ASSIGNED'
      | 'NO_SLOTS'
      | 'TEST_PHASE_ENDED'
      | 'INVALID_INPUT'
  ) {
    super(message);
    this.name = 'BetaAssignError';
  }
}

function resolveLoginUrl(): string {
  const base = (
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
  return `${base}/auth/login`;
}

async function findNextFreeTester(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]
) {
  const domain = TESTER_EMAIL_DOMAIN.toLowerCase();
  const assigned = await tx.betaInvite.findMany({ select: { userId: true } });
  const assignedIds = assigned.map((row) => row.userId);

  const candidates = await tx.user.findMany({
    where: {
      AND: [
        { email: { endsWith: `@${domain}` } },
        { email: { startsWith: 'tester' } },
        ...(assignedIds.length > 0 ? [{ id: { notIn: assignedIds } }] : []),
      ],
    },
    select: { id: true, email: true },
  });

  const sorted = candidates
    .map((user) => {
      const slot = parseTesterSlot(user.email, domain);
      return slot != null ? { ...user, slot } : null;
    })
    .filter((row): row is { id: string; email: string; slot: number } => row != null)
    .sort((a, b) => a.slot - b.slot);

  return sorted[0] ?? null;
}

export async function assignNextBetaSlot(
  input: BetaAssignInput
): Promise<BetaAssignResult> {
  const email = input.assignedToEmail.toLowerCase().trim();
  const name = input.assignedToName?.trim() || undefined;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BetaAssignError('Ungültige E-Mail-Adresse.', 'INVALID_INPUT');
  }

  if (process.env.TEST_PHASE_ENABLED === 'false') {
    throw new BetaAssignError(
      'Die Beta-Phase ist derzeit geschlossen.',
      'TEST_PHASE_ENDED'
    );
  }

  const existing = await db.betaInvite.findFirst({
    where: { assignedToEmail: email },
    select: { testerEmail: true },
  });

  if (existing) {
    throw new BetaAssignError(
      'Für diese E-Mail wurde bereits ein Beta-Zugang vergeben.',
      'ALREADY_ASSIGNED'
    );
  }

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const result = await db.$transaction(async (tx) => {
        const next = await findNextFreeTester(tx);
        if (!next) {
          throw new BetaAssignError(
            'Alle Beta-Plätze sind vergeben. Bitte später erneut versuchen.',
            'NO_SLOTS'
          );
        }

        await tx.betaInvite.create({
          data: {
            userId: next.id,
            testerEmail: next.email,
            assignedToEmail: email,
            assignedToName: name,
            assignedIp: input.assignedIp,
          },
        });

        if (name) {
          await tx.user.update({
            where: { id: next.id },
            data: { name },
          });
        }

        return {
          testerEmail: next.email,
          password: BETA_TESTER_PASSWORD,
          loginUrl: resolveLoginUrl(),
          slot: next.slot,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof BetaAssignError) {
        throw error;
      }

      const isUniqueViolation =
        error instanceof Error &&
        (error.message.includes('Unique constraint') ||
          error.message.includes('UNIQUE constraint'));

      if (!isUniqueViolation || attempt === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw new BetaAssignError(
    'Alle Beta-Plätze sind vergeben. Bitte später erneut versuchen.',
    'NO_SLOTS'
  );
}

export async function getBetaSlotStats() {
  const domain = TESTER_EMAIL_DOMAIN.toLowerCase();
  const [accountsCreated, assignedCount] = await Promise.all([
    db.user.count({
      where: {
        AND: [
          { email: { endsWith: `@${domain}` } },
          { email: { startsWith: 'tester' } },
        ],
      },
    }),
    db.betaInvite.count(),
  ]);

  return {
    accountsCreated,
    assignedCount,
    freeSlots: Math.max(0, accountsCreated - assignedCount),
  };
}
