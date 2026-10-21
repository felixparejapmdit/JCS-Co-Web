/**
 * The one key/value store behind every platform feature: the read cache, rate limits, idempotency
 * records and async jobs (see docs/ARCHITECTURE.md).
 *
 * - REDIS_URL set  -> Redis, shared by every server instance (production, several instances).
 * - REDIS_URL empty -> memory of this server process (development, a single server, tests).
 *
 * If Redis stops answering, the store keeps working from memory and logs it once, so a cache
 * outage never takes the application down. Keys are prefixed with "cloudaos:" in Redis.
 */
import type { Redis as RedisClient } from 'ioredis';

export interface Store {
  readonly kind: 'redis' | 'memory';
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec: number): Promise<void>;
  /** Sets the key only if it does not exist yet. True when this call created it (works as a lock). */
  setIfAbsent(key: string, value: string, ttlSec: number): Promise<boolean>;
  del(key: string): Promise<void>;
  /** Adds 1 and returns the new value. A new key expires ttlSec after it was created. */
  incr(key: string, ttlSec: number): Promise<number>;
}

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------
const MAX_MEMORY_KEYS = 20_000;

export class MemoryStore implements Store {
  readonly kind = 'memory' as const;
  private readonly map = new Map<string, { v: string; exp: number }>();

  private live(key: string) {
    const e = this.map.get(key);
    if (!e) return null;
    if (e.exp <= Date.now()) {
      this.map.delete(key);
      return null;
    }
    return e;
  }

  private put(key: string, v: string, ttlSec: number) {
    this.map.delete(key); // re-insert so the newest keys are last
    this.map.set(key, { v, exp: Date.now() + ttlSec * 1000 });
    if (this.map.size > MAX_MEMORY_KEYS) {
      // Drop the oldest tenth: expired keys go first because they are the oldest written.
      let n = Math.floor(MAX_MEMORY_KEYS / 10);
      for (const k of this.map.keys()) {
        this.map.delete(k);
        if (--n <= 0) break;
      }
    }
  }

  async get(key: string) {
    return this.live(key)?.v ?? null;
  }
  async set(key: string, value: string, ttlSec: number) {
    this.put(key, value, ttlSec);
  }
  async setIfAbsent(key: string, value: string, ttlSec: number) {
    if (this.live(key)) return false;
    this.put(key, value, ttlSec);
    return true;
  }
  async del(key: string) {
    this.map.delete(key);
  }
  async incr(key: string, ttlSec: number) {
    const e = this.live(key);
    const n = (e ? Number(e.v) : 0) + 1;
    if (e) e.v = String(n);
    else this.put(key, String(n), ttlSec);
    return n;
  }
}

// ---------------------------------------------------------------------------
// Redis, falling back to memory while it does not answer
// ---------------------------------------------------------------------------
export class RedisStore implements Store {
  readonly kind = 'redis' as const;
  private warned = false;

  constructor(
    private readonly redis: RedisClient,
    private readonly fallback: Store = new MemoryStore()
  ) {}

  private async safe<T>(run: (r: RedisClient) => Promise<T>, local: (m: Store) => Promise<T>): Promise<T> {
    try {
      return await run(this.redis);
    } catch (err) {
      if (!this.warned) {
        this.warned = true;
        console.warn('[cloud-aos] Redis is not answering; using this server\'s memory until it is back.', (err as Error)?.message ?? err);
      }
      return local(this.fallback);
    }
  }

  get(key: string) {
    return this.safe((r) => r.get(key), (m) => m.get(key));
  }
  async set(key: string, value: string, ttlSec: number) {
    await this.safe(async (r) => void (await r.set(key, value, 'EX', Math.max(1, Math.ceil(ttlSec)))), (m) => m.set(key, value, ttlSec));
  }
  setIfAbsent(key: string, value: string, ttlSec: number) {
    return this.safe(async (r) => (await r.set(key, value, 'EX', Math.max(1, Math.ceil(ttlSec)), 'NX')) === 'OK', (m) => m.setIfAbsent(key, value, ttlSec));
  }
  async del(key: string) {
    await this.safe(async (r) => void (await r.del(key)), (m) => m.del(key));
  }
  incr(key: string, ttlSec: number) {
    return this.safe(
      async (r) => {
        const n = await r.incr(key);
        if (n === 1) await r.expire(key, Math.max(1, Math.ceil(ttlSec)));
        return n;
      },
      (m) => m.incr(key, ttlSec)
    );
  }
}

// ---------------------------------------------------------------------------
// The process-wide store
// ---------------------------------------------------------------------------
const g = globalThis as unknown as { __cloudAosStore?: Store };

export function store(): Store {
  if (g.__cloudAosStore) return g.__cloudAosStore;
  const url = process.env.REDIS_URL;
  if (url) {
    // Loaded only when configured, so a server without Redis never needs the client.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require('ioredis') as typeof import('ioredis').default;
    const redis = new IORedis(url, {
      keyPrefix: 'cloudaos:',
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false, // fail fast while disconnected: the memory fallback answers
      connectTimeout: 2000,
    });
    redis.on('error', () => undefined); // reported once by RedisStore when a command fails
    g.__cloudAosStore = new RedisStore(redis);
  } else {
    g.__cloudAosStore = new MemoryStore();
  }
  return g.__cloudAosStore;
}

/** Replaces the store (tests). */
export function useStore(s: Store) {
  g.__cloudAosStore = s;
}
