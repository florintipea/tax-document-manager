/**
 * Environment variable validation and type-safe access
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
] as const;

const optionalEnvVars = [
  'REDIS_URL',
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

/**
 * Validate required environment variables at startup
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  // Validate NEXTAUTH_SECRET length
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    console.warn(
      'WARNING: NEXTAUTH_SECRET should be at least 32 characters long for security.'
    );
  }

  // Validate ENCRYPTION_KEY if provided
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
    throw new Error(
      'ENCRYPTION_KEY must be at least 32 characters long for AES-256 encryption.'
    );
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

