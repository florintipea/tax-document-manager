import { db } from '@/lib/db/client';
import { protectSecret, revealSecret } from '@/lib/security/credentials';
import type { AIProvider } from '@/lib/ai/providers';

export type UserAIProviderType = AIProvider | 'custom';

export interface UserAIProviderRecord {
  id: string;
  provider: UserAIProviderType;
  connectionType: 'api_key' | 'oauth';
  model: string | null;
  label: string | null;
  isActive: boolean;
  connectedAt: Date;
  /** True only when an API key exists and decrypts successfully */
  hasApiKey: boolean;
  hasOAuth: boolean;
  /** Ciphertext present but decrypt failed — user must reconnect */
  keyUnreadable: boolean;
  keyPreview: string | null;
}

export interface ResolvedAIConfig {
  openai?: { apiKey: string; model?: string; source: 'user' | 'server' };
  anthropic?: { apiKey: string; model?: string; source: 'user' | 'server' };
  google?: { apiKey: string; model?: string; source: 'user' | 'server' };
}

const PROVIDER_KEY_PREFIXES: Record<AIProvider, string> = {
  openai: 'sk-',
  anthropic: 'sk-ant-',
  google: 'AI',
};

export function maskApiKey(apiKey: string, provider: UserAIProviderType): string {
  if (apiKey.length <= 8) return '••••••••';
  const prefix = provider !== 'custom' ? PROVIDER_KEY_PREFIXES[provider as AIProvider] : '';
  const visiblePrefix = apiKey.startsWith(prefix) ? prefix : apiKey.slice(0, 4);
  return `${visiblePrefix}••••${apiKey.slice(-4)}`;
}

function getServerConfig(): ResolvedAIConfig {
  const config: ResolvedAIConfig = {};

  if (process.env.OPENAI_API_KEY?.trim()) {
    config.openai = {
      apiKey: process.env.OPENAI_API_KEY.trim(),
      model: process.env.OPENAI_MODEL,
      source: 'server',
    };
  }
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    config.anthropic = {
      apiKey: process.env.ANTHROPIC_API_KEY.trim(),
      model: process.env.ANTHROPIC_MODEL,
      source: 'server',
    };
  }
  if (process.env.GOOGLE_AI_API_KEY?.trim()) {
    config.google = {
      apiKey: process.env.GOOGLE_AI_API_KEY.trim(),
      model: process.env.GOOGLE_MODEL,
      source: 'server',
    };
  }

  return config;
}

function decryptProviderSecret(
  provider: { apiKey: string | null; refreshToken: string | null; accessToken: string | null }
): string | null {
  if (!provider.apiKey) return null;
  try {
    return revealSecret(provider.apiKey);
  } catch {
    return null;
  }
}

export async function listUserAIProviders(userId: string): Promise<UserAIProviderRecord[]> {
  const rows = await db.userAIProvider.findMany({
    where: { userId },
    orderBy: { connectedAt: 'desc' },
  });

  return rows.map((row) => {
    let keyPreview: string | null = null;
    let hasApiKey = false;
    let keyUnreadable = false;
    if (row.apiKey) {
      try {
        const revealed = revealSecret(row.apiKey);
        hasApiKey = Boolean(revealed?.trim());
        keyPreview = hasApiKey
          ? maskApiKey(revealed, row.provider as UserAIProviderType)
          : null;
      } catch {
        keyUnreadable = true;
        keyPreview = null;
      }
    }

    return {
      id: row.id,
      provider: row.provider as UserAIProviderType,
      connectionType: row.connectionType as 'api_key' | 'oauth',
      model: row.model,
      label: row.label,
      isActive: row.isActive,
      connectedAt: row.connectedAt,
      hasApiKey,
      hasOAuth: Boolean(row.refreshToken || row.accessToken),
      keyUnreadable,
      keyPreview,
    };
  });
}

export async function resolveAIConfigForUser(userId: string): Promise<ResolvedAIConfig> {
  const config = getServerConfig();
  const userProviders = await db.userAIProvider.findMany({
    where: { userId, isActive: true },
  });

  for (const row of userProviders) {
    const provider = row.provider as UserAIProviderType;
    if (provider === 'custom') continue;

    const secret = decryptProviderSecret(row);
    if (!secret?.trim()) continue;

    const entry = {
      apiKey: secret.trim(),
      model: row.model || undefined,
      source: 'user' as const,
    };

    if (provider === 'openai') config.openai = entry;
    if (provider === 'anthropic') config.anthropic = entry;
    if (provider === 'google') config.google = entry;
  }

  return config;
}

export function isResolvedAIConfigured(config: ResolvedAIConfig): boolean {
  return Boolean(config.openai || config.anthropic || config.google);
}

export async function isUserAIConfigured(userId: string): Promise<boolean> {
  const config = await resolveAIConfigForUser(userId);
  return isResolvedAIConfigured(config);
}

/** True when the user has at least one decryptable own API key (not only server env). */
export async function hasUserOwnedAIKeys(userId: string): Promise<boolean> {
  const config = await resolveAIConfigForUser(userId);
  return Boolean(
    config.openai?.source === 'user' ||
      config.anthropic?.source === 'user' ||
      config.google?.source === 'user'
  );
}

export async function upsertUserAIProvider(
  userId: string,
  data: {
    provider: UserAIProviderType;
    apiKey?: string;
    model?: string;
    label?: string;
    connectionType?: 'api_key' | 'oauth';
    refreshToken?: string;
    accessToken?: string;
  }
) {
  const encryptedApiKey = data.apiKey ? protectSecret(data.apiKey.trim()) : undefined;
  const encryptedRefresh = data.refreshToken ? protectSecret(data.refreshToken) : undefined;
  const encryptedAccess = data.accessToken ? protectSecret(data.accessToken) : undefined;

  return db.userAIProvider.upsert({
    where: {
      userId_provider: {
        userId,
        provider: data.provider,
      },
    },
    create: {
      userId,
      provider: data.provider,
      connectionType: data.connectionType || 'api_key',
      apiKey: encryptedApiKey,
      refreshToken: encryptedRefresh,
      accessToken: encryptedAccess,
      model: data.model,
      label: data.label,
      isActive: true,
      connectedAt: new Date(),
    },
    update: {
      connectionType: data.connectionType || 'api_key',
      ...(encryptedApiKey !== undefined ? { apiKey: encryptedApiKey } : {}),
      ...(encryptedRefresh !== undefined ? { refreshToken: encryptedRefresh } : {}),
      ...(encryptedAccess !== undefined ? { accessToken: encryptedAccess } : {}),
      model: data.model,
      label: data.label,
      isActive: true,
      connectedAt: new Date(),
    },
  });
}

export async function disconnectUserAIProvider(
  userId: string,
  provider: UserAIProviderType
): Promise<void> {
  await db.userAIProvider.deleteMany({
    where: { userId, provider },
  });
}

export async function getDecryptedApiKeyForProvider(
  userId: string,
  provider: UserAIProviderType
): Promise<string | null> {
  const row = await db.userAIProvider.findUnique({
    where: {
      userId_provider: { userId, provider },
    },
  });

  if (!row || !row.isActive || !row.apiKey) return null;
  return decryptProviderSecret(row);
}
