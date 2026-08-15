'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { Eye, Shield } from 'lucide-react';
import { useAdminCustomerView } from '@/lib/admin/use-admin-customer-view';
import { enableCustomerView } from '@/lib/admin/customer-view';

/**
 * Small dismissible bar — only chrome in Kundenansicht.
 * Admin sidebar items are hidden separately via showAdminChrome.
 */
export function AdminCustomerPreviewBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { active, enter, exit } = useAdminCustomerView();

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  useEffect(() => {
    if (!isAdmin) return;
    if (searchParams.get('adminPreview') === '1' || searchParams.get('kundenansicht') === '1') {
      enableCustomerView();
      enter();
    }
  }, [isAdmin, searchParams, enter]);

  if (!isAdmin || !active) return null;
  if (pathname?.startsWith('/admin')) return null;

  return (
    <div
      className="fixed bottom-3 left-1/2 z-[70] flex w-[min(96vw,28rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-amber-300/90 bg-amber-50/95 px-3 py-2 shadow-md backdrop-blur dark:border-amber-700 dark:bg-amber-950/95"
      role="status"
    >
      <Eye className="h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200" />
      <p className="min-w-0 flex-1 truncate text-xs font-medium text-amber-950 dark:text-amber-50">
        Admin: Kundenansicht aktiv
      </p>
      <button
        type="button"
        onClick={() => {
          exit();
          router.push('/admin');
        }}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-800 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-900"
      >
        <Shield className="h-3 w-3" />
        Admin-Zentrale
      </button>
      <Link
        href="/admin"
        onClick={() => exit()}
        className="sr-only"
      >
        Zurück zur Admin-Zentrale
      </Link>
    </div>
  );
}
