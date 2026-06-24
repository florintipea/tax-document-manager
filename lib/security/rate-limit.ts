/**
 * Rate limiting with optional Redis and in-memory fallback.
 * Redis is lazy-loaded and never crashes the app when unavailable.
 */

import type { Redis } from 'ioredis';

export type RateLimitBackend = 'redis' | 'memory';

let redis: Redis | null = null;
let redisUnavailable = !isValidRedisUrl(process.env.REDIS_URL);
let startupLogged = false;

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function isValidRedisUrl(url: string | undefined): boolean {
  if (!url?.trim()) {
    return false;
  }
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'redis:' || parsed.protocol === 'rediss:';
  } catch {
    return false;
  }
}

async function getRedis(): Promise<Redis | null> {
  const redisUrl = process.env.REDIS_URL;

  if (redisUnavailable || !isValidRedisUrl(redisUrl)) {
    if (redisUrl && !redisUnavailable) {
      redisUnavailable = true;
      console.warn('[TaxDoc] REDIS_URL is invalid — using in-memory rate limits.');
    }
    return null;
  }

  if (!redis) {
    try {
      const { Redis: RedisClient } = await import('ioredis');
      redis = new RedisClient(redisUrl!, {
        retryStrategy: () => null,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      redis.on('error', () => {
        redisUnavailable = true;
      });
    } catch (error) {
      redisUnavailable = true;
      redis = null;
      console.warn('[TaxDoc] Redis init failed — using in-memory rate limits:', error);
      return null;
    }
  }

  return redis;
}

export function getRateLimitBackend(): RateLimitBackend {
  if (isValidRedisUrl(process.env.REDIS_URL) && !redisUnavailable) {
    return 'redis';
  }
  return 'memory';
}

/** Log once at startup — call from instrumentation.ts */
export function logRateLimitStartup(): void {
  if (startupLogged) {
    return;
  }
  startupLogged = true;

  if (isValidRedisUrl(process.env.REDIS_URL)) {
    console.log('[TaxDoc] Rate limiting: redis (distributed, with memory fallback)');
  } else if (process.env.REDIS_URL) {
    console.warn('[TaxDoc] Rate limiting: memory (REDIS_URL invalid or unsupported)');
  } else {
    console.log('[TaxDoc] Rate limiting: memory (single instance)');
  }
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

function checkMemoryRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const key = `${options.keyPrefix || 'ratelimit'}:${identifier}`;
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (existing && existing.expiresAt <= now) {
    memoryStore.delete(key);
  }

  const current = memoryStore.get(key);
  const count = current?.count ?? 0;

  if (count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(current?.expiresAt ?? now + options.windowMs),
    };
  }

  const expiresAt = current?.expiresAt ?? now + options.windowMs;
  memoryStore.set(key, { count: count + 1, expiresAt });

  return {
    allowed: true,
    remaining: Math.max(0, options.maxRequests - count - 1),
    resetTime: new Date(expiresAt),
  };
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const client = await getRedis();

  if (!client) {
    return checkMemoryRateLimit(identifier, options);
  }

  try {
    if (client.status !== 'ready') {
      await client.connect();
    }

    const key = `${options.keyPrefix || 'ratelimit'}:${identifier}`;
    const windowSeconds = Math.ceil(options.windowMs / 1000);
    const count = await client.incr(key);

    if (count === 1) {
      await client.expire(key, windowSeconds);
    }

    if (count > options.maxRequests) {
      const ttl = await client.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + Math.max(ttl, 0) * 1000),
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, options.maxRequests - count),
      resetTime: new Date(Date.now() + windowSeconds * 1000),
    };
  } catch (error) {
    redisUnavailable = true;
    return checkMemoryRateLimit(identifier, options);
  }
}

/** Clear rate-limit entries (memory + Redis) for admin recovery on startup. */
export async function clearRateLimitsByPrefix(prefix: string): Promise<number> {
  let cleared = 0;

  for (const key of [...memoryStore.keys()]) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
      cleared += 1;
    }
  }

  const client = await getRedis();
  if (!client) {
    return cleared;
  }

  try {
    if (client.status !== 'ready') {
      await client.connect();
    }

    const keys = await client.keys(`${prefix}*`);
    if (keys.length > 0) {
      await client.del(...keys);
      cleared += keys.length;
    }
  } catch (error) {
    redisUnavailable = true;
    console.warn('[TaxDoc] Could not clear Redis rate limits:', error);
  }

  return cleared;
}

export const RateLimitPresets = {
  login: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
    keyPrefix: 'ratelimit:login',
  },
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'ratelimit:api',
  },
  ai: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyPrefix: 'ratelimit:ai',
  },
  upload: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'ratelimit:upload',
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    keyPrefix: 'ratelimit:password-reset',
  },
  twoFactorVerify: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'ratelimit:2fa-verify',
  },
} as const;
