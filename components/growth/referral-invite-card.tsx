'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Copy, Gift, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import toast from 'react-hot-toast';

interface ReferralStatus {
  code: string;
  accepted: number;
  target: number;
  unlocked: boolean;
  hasDiscount: boolean;
  invitePath: string;
}

export function ReferralInviteCard({ className }: { className?: string }) {
  const { status } = useSession();
  const { t } = useI18n();
  const [data, setData] = useState<ReferralStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      const res = await fetch('/api/referral');
      if (!res.ok) return;
      const json = (await res.json()) as ReferralStatus;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const inviteUrl =
    typeof window !== 'undefined' && data
      ? `${window.location.origin}${data.invitePath}`
      : data
        ? `https://taxdoc-beta.onrender.com${data.invitePath}`
        : '';

  const copyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(
        `${t('referral.shareText')} ${inviteUrl}`
      );
      toast.success(t('referral.copied'));
    } catch {
      toast.error(t('quickCheck.copyFailed'));
    }
  };

  if (status !== 'authenticated') {
    return (
      <div
        className={`rounded-xl border border-violet-200 bg-violet-50/80 p-4 dark:border-violet-800 dark:bg-violet-950/30 ${className || ''}`}
      >
        <div className="mb-2 flex items-center gap-2 font-semibold text-violet-900 dark:text-violet-100">
          <Gift className="h-5 w-5" />
          {t('referral.title')}
        </div>
        <p className="mb-3 text-sm text-violet-800 dark:text-violet-200">
          {t('referral.guestBody')}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/auth/register">{t('referral.guestCta')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-violet-200 bg-violet-50/80 p-4 dark:border-violet-800 dark:bg-violet-950/30 ${className || ''}`}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold text-violet-900 dark:text-violet-100">
        <Users className="h-5 w-5" />
        {t('referral.title')}
      </div>
      <p className="mb-3 text-sm text-violet-800 dark:text-violet-200">
        {t('referral.body')}
      </p>
      {loading && !data ? (
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      ) : data ? (
        <>
          <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
            {t('referral.progress', {
              accepted: String(data.accepted),
              target: String(data.target),
            })}
          </p>
          {data.unlocked && (
            <p className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {t('referral.unlocked')}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => void copyInvite()}
              leftIcon={<Copy className="h-4 w-4" />}
            >
              {t('referral.copyInvite')}
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/pricing">{t('referral.seePricing')}</Link>
            </Button>
          </div>
          <p className="mt-2 text-xs text-violet-700/80 dark:text-violet-300/80">
            {t('referral.legal')}
          </p>
        </>
      ) : null}
    </div>
  );
}
