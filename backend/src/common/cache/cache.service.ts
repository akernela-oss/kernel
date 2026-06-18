import { Injectable } from '@nestjs/common';

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Lightweight in-process cache with TTL + explicit invalidation.
 *
 * Used to memoise the expensive aggregate computation (dashboard / KPIs /
 * queue) so bursts of concurrent reads do not each recompute the whole bundle.
 * Any write invalidates the cache, so reads are always consistent.
 *
 * For multi-instance horizontal scaling, swap this for a shared Redis-backed
 * cache (the public API stays the same).
 */
@Injectable()
export class CacheService {
  private store = new Map<string, Entry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async wrap<T>(key: string, ttlMs: number, factory: () => Promise<T> | T): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /** Drop everything — called after any mutation so aggregates stay fresh. */
  clear(): void {
    this.store.clear();
  }
}
