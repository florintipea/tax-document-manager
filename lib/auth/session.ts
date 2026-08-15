import { auth } from '@/lib/auth/config';

type SessionUser = {
  id?: string;
  twoFactorVerified?: boolean;
};

function isSessionFullyAuthenticated(user: SessionUser | undefined): boolean {
  if (!user?.id) return false;
  // Sessions created before 2FA completion must not access protected APIs.
  return user.twoFactorVerified !== false;
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!isSessionFullyAuthenticated(user)) return null;
  return user!.id!;
}

export async function requireSessionUserId(): Promise<string | null> {
  return getSessionUserId();
}
