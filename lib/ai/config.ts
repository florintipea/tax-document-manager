/**
 * AI provider configuration helpers
 */

import {
  isResolvedAIConfigured,
  resolveAIConfigForUser,
  type ResolvedAIConfig,
} from '@/lib/ai/user-providers';

export function isServerAIConfigured(): boolean {
  return !!(
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim()
  );
}

/** @deprecated Prefer isServerAIConfigured or isAIConfiguredForUser */
export function isAIConfigured(): boolean {
  return isServerAIConfigured();
}

export async function isAIConfiguredForUser(userId: string): Promise<boolean> {
  const config = await resolveAIConfigForUser(userId);
  return isResolvedAIConfigured(config);
}

export function getServerProviderStatus(): Record<string, boolean> {
  return {
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    google: Boolean(process.env.GOOGLE_AI_API_KEY?.trim()),
  };
}

export const AI_ENV_VARS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_AI_API_KEY',
] as const;

export type { ResolvedAIConfig };
