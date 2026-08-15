/**
 * Bounded in-memory Map with TTL eviction.
 * Use for hot-path caches / rate maps on small hosts (Render Starter ~512MB).
 */

export type TtlMapOptions = {
  maxSize: number;
  /** Default TTL for entries without an explicit expiresAt override (ms). */
  ttlMs: number;
  /** Min ms between full expired scans (default 30s). */
  pruneIntervalMs?: number;
};

export class TtlMap<V> {
  private readonly store = new Map<string, { value: V; expiresAt: number }>();
  private lastPruneAt = 0;
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly pruneIntervalMs: number;

  constructor(options: TtlMapOptions) {
    this.maxSize = Math.max(1, options.maxSize);
    this.ttlMs = Math.max(1, options.ttlMs);
    this.pruneIntervalMs = options.pruneIntervalMs ?? 30_000;
  }

  get size(): number {
    return this.store.size;
  }

  get(key: string): V | undefined {
    return this.peek(key)?.value;
  }

  /** Value + absolute expiry, or undefined if missing/expired. */
  peek(key: string): { value: V; expiresAt: number } | undefined {
    this.pruneIfNeeded();
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, value: V, ttlMs = this.ttlMs): void {
    this.pruneIfNeeded();
    const expiresAt = Date.now() + Math.max(1, ttlMs);
    // Refresh insert order so active keys survive eviction longer.
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    this.store.set(key, { value, expiresAt });
    this.evictOverflow();
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): IterableIterator<string> {
    return this.store.keys();
  }

  entries(): IterableIterator<[string, { value: V; expiresAt: number }]> {
    return this.store.entries();
  }

  private pruneIfNeeded(now = Date.now()): void {
    if (
      now - this.lastPruneAt < this.pruneIntervalMs &&
      this.store.size < this.maxSize
    ) {
      return;
    }
    this.lastPruneAt = now;
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
    this.evictOverflow();
  }

  private evictOverflow(): void {
    while (this.store.size > this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }
}
