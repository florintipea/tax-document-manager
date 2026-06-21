/**
 * Rate limiting with optional Redis and in-memory fallback.
 */

import { Redis } from 'ioredis';

let redis: Redis | null = null;
let redisUnavailable = !process.env.REDIS_URL;

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function getRedis(): Redis | null {
  if (redisUnavailable || !process.env.REDIS_URL) {
    return null;
  }

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      retryStrategy: () => null,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    redis.on('error', () => {
      redisUnavailable = true;
    });
  }

  return redis;
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
  const client = getRedis();

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

export const RateLimitPresets = {
  login: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
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
