export type LoginErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'RATE_LIMITED'
  | 'ACCESS_DENIED'
  | 'SERVER_ERROR';

type TranslateFn = (key: string) => string;

const LOGIN_ERROR_I18N_KEYS: Record<LoginErrorCode, string> = {
  INVALID_INPUT: 'auth.invalidCredentials',
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
  ACCOUNT_LOCKED: 'auth.accountLocked',
  RATE_LIMITED: 'auth.rateLimited',
  ACCESS_DENIED: 'auth.accessDenied',
  SERVER_ERROR: 'auth.serverError',
};

export function loginErrorResponse(
  error: string,
  code: LoginErrorCode,
  status: number
) {
  return Response.json({ error, code }, { status });
}

export function getLoginUiMessage(
  status: number,
  data: { error?: string; code?: string },
  t?: TranslateFn
): string {
  const code = data.code as LoginErrorCode | undefined;

  // Server sends a timestamped lockout/rate-limit message — show it as-is.
  if (
    data.error &&
    (code === 'ACCOUNT_LOCKED' || code === 'RATE_LIMITED')
  ) {
    return data.error;
  }

  if (code && LOGIN_ERROR_I18N_KEYS[code]) {
    if (t) {
      return t(LOGIN_ERROR_I18N_KEYS[code]);
    }
  }

  if (data.error) {
    return data.error;
  }

  if (t) {
    switch (status) {
      case 423:
        return t('auth.accountLocked');
      case 429:
        return t('auth.rateLimited');
      case 401:
        return t('auth.invalidCredentials');
      case 403:
        return t('auth.accessDenied');
      case 500:
        return t('auth.serverError');
      default:
        return t('auth.genericError');
    }
  }

  switch (code) {
    case 'ACCOUNT_LOCKED':
      return 'Konto vorübergehend gesperrt. Bitte später erneut versuchen.';
    case 'RATE_LIMITED':
      return 'Zu viele Anmeldeversuche. Bitte warten und erneut versuchen.';
    case 'INVALID_CREDENTIALS':
    case 'INVALID_INPUT':
      return 'Ungültige E-Mail oder Passwort.';
    case 'ACCESS_DENIED':
      return 'Sie haben keinen Zugriff auf die Anmeldung.';
    case 'SERVER_ERROR':
      return 'Serverfehler. Bitte in Kürze erneut versuchen.';
    default:
      break;
  }

  switch (status) {
    case 423:
      return 'Konto vorübergehend gesperrt. Bitte später erneut versuchen.';
    case 429:
      return 'Zu viele Anmeldeversuche. Bitte warten und erneut versuchen.';
    case 401:
      return 'Ungültige E-Mail oder Passwort.';
    case 403:
      return 'Sie haben keinen Zugriff auf die Anmeldung.';
    case 500:
      return 'Serverfehler. Bitte in Kürze erneut versuchen.';
    default:
      return 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.';
  }
}
