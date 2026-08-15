'use client';

import {
  createContext,
  useContext,
  useSyncExternalStore,
  ReactNode,
} from 'react';
import { detectInitialLocale, defaultLocale, supportedLocales, type Locale } from './config';

// Import all translation files explicitly
import enMessages from './messages/en.json';
import deMessages from './messages/de.json';
import esMessages from './messages/es.json';
import roMessages from './messages/ro.json';
import elMessages from './messages/el.json';

type Messages = Record<string, unknown>;

const messagesMap: Record<string, Messages> = {
  en: enMessages,
  de: deMessages,
  es: esMessages,
  ro: roMessages,
  el: elMessages,
};

const LOCALE_CHANGE_EVENT = 'taxdoc-locale-change';

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  const saved = localStorage.getItem('locale');
  if (saved && (supportedLocales as readonly string[]).includes(saved)) {
    return saved as Locale;
  }
  return detectInitialLocale();
}

function subscribeLocale(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === 'locale') onStoreChange();
  };
  const onCustom = () => onStoreChange();
  window.addEventListener('storage', onStorage);
  window.addEventListener(LOCALE_CHANGE_EVENT, onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onCustom);
  };
}

interface I18nContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    readStoredLocale,
    () => defaultLocale
  );
  const messages = messagesMap[locale] || messagesMap.en;

  const setLocale = (newLocale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = messages;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') return key;

    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, param) => String(params[param] ?? ''));
    }

    return value;
  };

  return (
    <I18nContext.Provider value={{ locale, messages, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: defaultLocale,
      messages: messagesMap.en,
      setLocale: () => {},
      t: (key: string) => key,
    };
  }
  return context;
}
