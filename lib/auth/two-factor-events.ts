import { db } from '@/lib/db/client';

export async function logTwoFactorEvent(
  userId: string,
  type: string,
  description: string,
  severity: 'low' | 'medium' | 'high' = 'low',
  ipAddress = 'unknown'
): Promise<void> {
  try {
    await db.securityEvent.create({
      data: {
        userId,
        type,
        severity,
        description,
        ipAddress,
        userAgent: 'unknown',
      },
    });
  } catch (error) {
    console.error('Failed to log 2FA security event:', error);
  }
}
