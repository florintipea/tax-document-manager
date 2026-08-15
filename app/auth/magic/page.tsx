'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { AppLogo } from '@/components/brand/app-logo';
import { Loading } from '@/components/ui/loading';
import { useI18n } from '@/lib/i18n/provider';

function MagicInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = params.get('email');
    const token = params.get('token');
    if (!email || !token) {
      setError(t('magicLink.invalid'));
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await signIn('credentials', {
        email,
        magicToken: token,
        redirect: false,
      });
      if (cancelled) return;
      if (result?.error) {
        setError(result.error || t('magicLink.invalid'));
        return;
      }
      router.replace('/dashboard');
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router, t]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 dark:from-gray-900 dark:to-gray-800">
      <AppLogo size="md" />
      {error ? (
        <div className="mt-6 max-w-sm text-center">
          <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            {t('landing.signIn')}
          </Link>
          {' · '}
          <Link href="/rechner" className="text-blue-600 hover:underline">
            {t('growthNav.rechner')}
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <Loading variant="spinner" size="lg" text={t('magicLink.signingIn')} />
        </div>
      )}
    </div>
  );
}

export default function MagicAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loading variant="spinner" size="lg" />
        </div>
      }
    >
      <MagicInner />
    </Suspense>
  );
}
