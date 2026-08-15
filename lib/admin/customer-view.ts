/**
 * Admin dual-view: Kundenansicht vs Admin-Zentrale.
 * Cookie + sessionStorage so the mode survives navigation.
 */

export const CUSTOMER_VIEW_COOKIE = 'taxdoc_kundenansicht';
export const CUSTOMER_VIEW_STORAGE = 'taxdoc-admin-customer-preview';

export function readCustomerViewCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${CUSTOMER_VIEW_COOKIE}=1`));
}

export function writeCustomerViewCookie(active: boolean): void {
  if (typeof document === 'undefined') return;
  if (active) {
    document.cookie = `${CUSTOMER_VIEW_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = `${CUSTOMER_VIEW_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function enableCustomerView(): void {
  try {
    sessionStorage.setItem(CUSTOMER_VIEW_STORAGE, '1');
  } catch {
    /* ignore */
  }
  writeCustomerViewCookie(true);
}

export function disableCustomerView(): void {
  try {
    sessionStorage.removeItem(CUSTOMER_VIEW_STORAGE);
  } catch {
    /* ignore */
  }
  writeCustomerViewCookie(false);
}

export function isCustomerViewEnabled(): boolean {
  try {
    if (sessionStorage.getItem(CUSTOMER_VIEW_STORAGE) === '1') return true;
  } catch {
    /* ignore */
  }
  return readCustomerViewCookie();
}
