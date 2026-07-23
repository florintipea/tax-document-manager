/**
 * Admin Utilities
 * Functions to check admin permissions and roles
 */

import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';

export type UserRole = 'user' | 'admin' | 'super_admin';

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) return false;

    const userId = (session.user as any).id;
    if (!userId) return false;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === 'admin' || user?.role === 'super_admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) return false;

    const userId = (session.user as any).id;
    if (!userId) return false;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (role === 'super_admin') {
      return user?.role === 'super_admin';
    }
    if (role === 'admin') {
      return user?.role === 'admin' || user?.role === 'super_admin';
    }
    return true; // All authenticated users have 'user' role
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Get current user's role
 */
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const session = await auth();
    if (!session?.user) return null;

    const userId = (session.user as any).id;
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return (user?.role as UserRole) || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Require admin - throws error if not admin
 */
export async function requireAdmin(): Promise<void> {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    throw new Error('Admin access required');
  }
}


