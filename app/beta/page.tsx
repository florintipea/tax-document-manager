'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BetaVisitTracker } from '@/components/beta/beta-visit-tracker';

/** /beta tracks visit then redirects to /beta-anfrage */
export default function BetaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/beta-anfrage');
    }, 400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
      <BetaVisitTracker path="/beta" />
      Weiterleitung zur Beta-Anfrage…
    </div>
  );
}
