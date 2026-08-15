import { NextResponse } from 'next/server';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** Generic client-safe 500 body — never leaks stack traces in production. */
export function internalErrorResponse(logLabel?: string, error?: unknown) {
  if (logLabel) {
    console.error(logLabel, error);
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

/** Strip internal details from caught errors before returning to clients. */
export function clientSafeErrorMessage(
  error: unknown,
  fallback = 'Internal server error'
): string {
  if (!IS_PRODUCTION) {
    return error instanceof Error ? error.message : fallback;
  }
  return fallback;
}

export function isProduction(): boolean {
  return IS_PRODUCTION;
}
