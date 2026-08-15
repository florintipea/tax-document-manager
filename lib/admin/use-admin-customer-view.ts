'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  CUSTOMER_VIEW_STORAGE,
  disableCustomerView,
  enableCustomerView,
  isCustomerViewEnabled,
} from '@/lib/admin/customer-view';

const EVENT = 'taxdoc-kundenansicht-change';

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function getSnapshot(): boolean {
  return isCustomerViewEnabled();
}

function getServerSnapshot(): boolean {
  return false;
}

function notify() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT));
  }
}

/** Shared toggle for Admin → Kundenansicht (customer product chrome). */
export function useAdminCustomerView() {
  const active = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const enter = useCallback(() => {
    enableCustomerView();
    notify();
  }, []);

  const exit = useCallback(() => {
    disableCustomerView();
    notify();
  }, []);

  const toggle = useCallback(() => {
    if (isCustomerViewEnabled()) {
      disableCustomerView();
    } else {
      enableCustomerView();
    }
    notify();
  }, []);

  // Keep storage key in sync if other tabs change it
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CUSTOMER_VIEW_STORAGE) notify();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { active: ready && active, ready, enter, exit, toggle };
}
