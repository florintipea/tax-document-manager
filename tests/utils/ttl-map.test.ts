import { describe, expect, it } from 'vitest';
import { TtlMap } from '@/lib/utils/ttl-map';

describe('TtlMap', () => {
  it('evicts oldest keys when over maxSize', () => {
    const map = new TtlMap<number>({ maxSize: 3, ttlMs: 60_000, pruneIntervalMs: 0 });
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    map.set('d', 4);
    expect(map.size).toBe(3);
    expect(map.get('a')).toBeUndefined();
    expect(map.get('d')).toBe(4);
  });

  it('expires entries by TTL', async () => {
    const map = new TtlMap<string>({ maxSize: 10, ttlMs: 20, pruneIntervalMs: 0 });
    map.set('x', 'yes', 20);
    expect(map.peek('x')?.value).toBe('yes');
    await new Promise((r) => setTimeout(r, 35));
    expect(map.get('x')).toBeUndefined();
  });
});
