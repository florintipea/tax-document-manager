'use client';

import { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { submitReport } from '@/lib/reports/submit-client';
import toast from 'react-hot-toast';

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  defaultType?: 'feedback' | 'bug';
}

export function FeedbackDialog({
  open,
  onClose,
  defaultType = 'feedback',
}: FeedbackDialogProps) {
  const { t } = useI18n();
  const [type, setType] = useState<'feedback' | 'bug'>(defaultType);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (message.trim().length < 3) {
      toast.error(t('feedback.messageRequired'));
      return;
    }

    setSubmitting(true);
    const ok = await submitReport({
      type,
      title: title.trim() || undefined,
      message: message.trim(),
    });
    setSubmitting(false);

    if (ok) {
      toast.success(t('feedback.sent'));
      setTitle('');
      setMessage('');
      onClose();
    } else {
      toast.error(t('feedback.sendFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('feedback.title')}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('feedback.description')}</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('feedback')}
              className={`px-3 py-1.5 rounded-full text-sm ${
                type === 'feedback'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {t('feedback.typeFeedback')}
            </button>
            <button
              type="button"
              onClick={() => setType('bug')}
              className={`px-3 py-1.5 rounded-full text-sm ${
                type === 'bug'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {t('feedback.typeBug')}
            </button>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('feedback.subjectPlaceholder')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('feedback.messagePlaceholder')}
            rows={5}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t('common.loading') : t('feedback.send')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        leftIcon={<MessageSquarePlus className="w-4 h-4" />}
      >
        <span className="hidden lg:inline">{t('feedback.button')}</span>
      </Button>
      <FeedbackDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
