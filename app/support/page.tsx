'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Loading } from '@/components/ui/loading';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function SupportPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading variant="spinner" size="lg" />
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-10 max-w-xl">
        <div className="text-center mb-8">
          <MessageCircle className="w-10 h-10 mx-auto text-blue-600 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hilfe & Support</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Der Chat unten rechts antwortet zuerst mit Tipps. Bei Problemen schreib „Hilfe“ oder
            „funktioniert nicht“ — dann wird ein Admin benachrichtigt. Nachrichten vom TaxDoc-Team
            erscheinen ebenfalls hier (Badge „Neu“ am Hilfe-Button).
          </p>
          <p className="text-xs text-gray-400 mt-3">
            TaxDoc ist ein Hilfsmittel, keine Steuerberatung.{' '}
            <Link href="/legal/impressum" className="underline">
              Impressum
            </Link>
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
