'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/provider';
import toast from 'react-hot-toast';

interface SaveResultsCtaProps {
  from?: string;
  className?: string;
}

/**
 * Soft gate: save permanently via Magic Link or classic register.
 * No OAuth in this pass (not wired); Magic Link when SMTP available.
 */
export function SaveResultsCta({ from = 'quickcheck', className }: SaveResultsCtaProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const sendMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setDevLink(null);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), from }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t('magicLink.failed'));
        return;
      }
      toast.success(data.message || t('magicLink.sent'));
      if (typeof data.devLink === 'string') {
        setDevLink(data.devLink);
      }
    } catch {
      toast.error(t('magicLink.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-blue-200 bg-white/90 p-4 dark:border-blue-900 dark:bg-gray-800/90 ${className || ''}`}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
        <Sparkles className="h-5 w-5 text-blue-600" />
        {t('magicLink.saveTitle')}
      </div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{t('magicLink.saveBody')}</p>

      <form onSubmit={(e) => void sendMagic(e)} className="mb-3 space-y-2">
        <Input
          type="email"
          required
          placeholder={t('magicLink.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
        />
        <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
          {t('magicLink.send')}
        </Button>
      </form>

      {devLink ? (
        <p className="mb-3 break-all text-xs text-amber-800 dark:text-amber-200">
          {t('magicLink.devHint')}{' '}
          <a href={devLink} className="underline">
            {devLink}
          </a>
        </p>
      ) : null}

      <p className="text-center text-xs text-gray-500">
        {t('magicLink.orRegister')}{' '}
        <Link
          href={`/auth/register?from=${encodeURIComponent(from)}`}
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {t('landing.getStarted')}
        </Link>
      </p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('magicLink.legal')}</p>
    </div>
  );
}
