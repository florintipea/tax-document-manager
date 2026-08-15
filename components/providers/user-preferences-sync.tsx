'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useI18n } from '@/lib/i18n/provider';
import { useTheme } from '@/components/providers/theme-provider';
import type { Locale } from '@/lib/i18n/config';
import type { Theme } from '@/lib/theme/utils';

export function UserPreferencesSync() {
  const { status } = useSession();
  const { setLocale } = useI18n();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (status !== 'authenticated') return;

    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/user/settings');
        if (!response.ok) return;

        const data = await response.json();
        const language = data.settings?.language;
        const theme = data.settings?.theme as Theme | undefined;

        if (language) {
          setLocale(language as Locale);
        }
        if (theme) {
          setTheme(theme);
        }
      } catch {
        // Settings load failed — settings page shows its own toast
      }
    };

    void loadPreferences();
  }, [status, setLocale, setTheme]);

  return null;
}
