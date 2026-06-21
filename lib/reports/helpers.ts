import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export type ReportType = 'feedback' | 'error' | 'bug';
export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const role = (session.user as { role?: string }).role;
  if (role !== 'admin' && role !== 'super_admin') return null;

  return session;
}

export function adminUnauthorized() {
  return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
}

export function detectPlatform(userAgent?: string | null): string {
  if (!userAgent) return 'web';
  const ua = userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  return 'web';
}
