/**
 * Magic-link helpers (zero-friction save). SMTP optional.
 */

import { createHash, randomBytes } from 'crypto';
import { db } from '@/lib/db/client';

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 min

export function hashMagicToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function createRawMagicToken(): string {
  return randomBytes(32).toString('hex');
}

export async function storeMagicLinkToken(email: string, rawToken: string): Promise<void> {
  const identifier = email.toLowerCase().trim();
  const token = hashMagicToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  // Clear prior tokens for this email
  await db.verificationToken.deleteMany({ where: { identifier } });
  await db.verificationToken.create({
    data: { identifier, token, expires },
  });
}

export async function consumeMagicLinkToken(
  email: string,
  rawToken: string
): Promise<boolean> {
  const identifier = email.toLowerCase().trim();
  const token = hashMagicToken(rawToken);
  const row = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } },
  });
  if (!row || row.expires < new Date()) {
    if (row) {
      await db.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      }).catch(() => undefined);
    }
    return false;
  }
  await db.verificationToken.delete({
    where: { identifier_token: { identifier, token } },
  });
  return true;
}

export async function ensureUserForMagicLink(email: string): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: string;
  twoFactorEnabled: boolean;
  tokenVersion: number;
}> {
  const normalized = email.toLowerCase().trim();
  let user = await db.user.findUnique({ where: { email: normalized } });
  if (!user) {
    // Placeholder password — magic-link only accounts; random unusable hash
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
    user = await db.user.create({
      data: {
        email: normalized,
        name: normalized.split('@')[0] || 'TaxDoc',
        passwordHash,
        country: 'DE',
        language: 'de',
      },
    });
    try {
      await db.subscription.create({
        data: {
          userId: user.id,
          planId: 'trial',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    } catch {
      // non-fatal
    }
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    tokenVersion: user.tokenVersion,
  };
}

/** Best-effort email; returns whether a real send was attempted successfully. */
export async function trySendMagicLinkEmail(
  to: string,
  link: string
): Promise<{ sent: boolean; reason: string }> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();
  const from = process.env.EMAIL_FROM?.trim() || user;

  if (!host || !user || !pass || !from) {
    console.info(`[magic-link] SMTP not configured. Link for ${to}: ${link}`);
    return { sent: false, reason: 'no_smtp' };
  }

  try {
    // Runtime-only load so build stays green if the package is absent in some envs.
    // Prefer installed `nodemailer` (see package.json).
    type Mailer = {
      createTransport: (opts: Record<string, unknown>) => {
        sendMail: (opts: Record<string, unknown>) => Promise<unknown>;
      };
    };
    const loadMailer = new Function(
      'return import("nodemailer").then((m) => m.default || m)'
    ) as () => Promise<Mailer>;
    let mailer: Mailer | null = null;
    try {
      mailer = await loadMailer();
    } catch {
      mailer = null;
    }
    if (!mailer?.createTransport) {
      console.info(`[magic-link] nodemailer missing. Link for ${to}: ${link}`);
      return { sent: false, reason: 'no_nodemailer' };
    }
    const transporter = mailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to,
      subject: 'TaxDoc — Anmelde-Link (Magic Link)',
      text: `Hallo,\n\nmit diesem Link meldest du dich bei TaxDoc an (30 Min gültig):\n\n${link}\n\nKeine Steuerberatung. Keine Auto-Abgabe.\n\nTaxDoc`,
      html: `<p>Hallo,</p><p>mit diesem Link meldest du dich bei TaxDoc an (30&nbsp;Min gültig):</p><p><a href="${link}">${link}</a></p><p style="color:#666;font-size:12px">Keine Steuerberatung. Keine Auto-Abgabe.</p>`,
    });
    return { sent: true, reason: 'smtp' };
  } catch (err) {
    console.error('[magic-link] send failed', err);
    console.info(`[magic-link] fallback link for ${to}: ${link}`);
    return { sent: false, reason: 'send_error' };
  }
}
