/**
 * Environment variable validation and type-safe access
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
] as const;

const optionalEnvVars = [
  'REDIS_URL',
  'TRUST_CLOUDFLARE',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'GOOGLE_AI_API_KEY',
  'GOOGLE_MODEL',
  'ENCRYPTION_KEY',
  'APP_URL',
] as const;

const productionSecurityVars = ['NEXTAUTH_SECRET', 'ENCRYPTION_KEY'] as const;

/**
 * Validate required environment variables at startup.
 * In production, missing security secrets log warnings (non-fatal) so cold starts
 * on Render do not crash before env is wired — see instrumentation.ts.
 */
export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing: string[] = [];
  const securityWarnings: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      if (isProduction && productionSecurityVars.includes(envVar as typeof productionSecurityVars[number])) {
        securityWarnings.push(envVar);
      } else {
        missing.push(envVar);
      }
    }
  }

  if (!process.env.ENCRYPTION_KEY && isProduction) {
    if (!securityWarnings.includes('ENCRYPTION_KEY')) {
      securityWarnings.push('ENCRYPTION_KEY');
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  for (const envVar of securityWarnings) {
    console.warn(
      `[TaxDoc] WARNING: ${envVar} is not set in production. ` +
      'Set it in your hosting dashboard for secure sessions and credential encryption.'
    );
  }

  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    console.warn(
      'WARNING: NEXTAUTH_SECRET should be at least 32 characters long for security.'
    );
  }

  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
    if (isProduction) {
      console.warn(
        'WARNING: ENCRYPTION_KEY must be at least 32 characters long for AES-256 encryption.'
      );
    } else {
      throw new Error(
        'ENCRYPTION_KEY must be at least 32 characters long for AES-256 encryption.'
      );
    }
  }
}

/**
 * Get environment variable with type safety
 */
export function getEnv(key: typeof requiredEnvVars[number]): string;
export function getEnv(key: typeof optionalEnvVars[number]): string | undefined;
export function getEnv(key: string): string | undefined {
  return process.env[key];
}

