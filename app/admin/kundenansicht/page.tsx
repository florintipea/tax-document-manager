'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';
import { enableCustomerView } from '@/lib/admin/customer-view';

/** Admin-only: start Kundenansicht. Non-admins → dashboard. */
export default function KundenansichtRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    enableCustomerView();
    router.replace('/dashboard?kundenansicht=1');
  }, [status, isAdmin, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loading variant="spinner" size="lg" text="Kundenansicht starten…" />
    </div>
  );
}
