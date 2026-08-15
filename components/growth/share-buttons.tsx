'use client';

import { useCallback, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import toast from 'react-hot-toast';

interface ShareButtonsProps {
  text: string;
  url: string;
  className?: string;
}

export function ShareButtons({ text, url, className }: ShareButtonsProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const fullMessage = `${text} ${url}`.trim();

  const shareWhatsApp = useCallback(() => {
    const wa = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
    window.open(wa, '_blank', 'noopener,noreferrer');
  }, [fullMessage]);

  const shareNative = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'TaxDoc', text, url });
        return;
      } catch {
        // user cancelled or not supported — fall through
      }
    }
    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      toast.success(t('quickCheck.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('quickCheck.copyFailed'));
    }
  }, [fullMessage, text, url, t]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      toast.success(t('quickCheck.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('quickCheck.copyFailed'));
    }
  }, [fullMessage, t]);

  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
        {t('quickCheck.shareTitle')}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={shareWhatsApp}>
          WhatsApp
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void shareNative()}
          leftIcon={<Share2 className="h-4 w-4" />}
        >
          {t('quickCheck.share')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void copyLink()}
          leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        >
          {t('quickCheck.copyLink')}
        </Button>
      </div>
    </div>
  );
}
