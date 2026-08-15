const REMEMBER_EMAIL_KEY = 'taxdoc.rememberEmail';
const REMEMBER_ME_KEY = 'taxdoc.rememberMe';

export function getRememberedEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
}

export function getRememberMePreference(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
}

export function saveRememberMePreference(email: string, remember: boolean): void {
  if (typeof window === 'undefined') return;

  if (remember) {
    localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
    localStorage.setItem(REMEMBER_ME_KEY, 'false');
  }
}

export const SESSION_MAX_AGE = {
  remember: 30 * 24 * 60 * 60,
  default: 24 * 60 * 60,
} as const;
