/**
 * Read cache (Redis or memory, see store.ts): a read operation answered within the last few seconds
 * is served again without touching the database.
 *
 * Rules that keep it correct:
 * - Only read operations are cached (READ_OPS in shared/ops.ts), per company and per user, because
 *   answers depend on the user's rights.
 * - Every save in a company bumps that company's generation number. Keys carry the generation, so
 *   a save makes all earlier answers unreachable at once: you always see your own changes.
 * - Answers live at most CACHE_TTL_SECONDS (default 15). That bounds how long a change made outside
 *   Cloud AOS (the legacy AOS100 on the same database) can take to show.
 * - On by default only against MySQL; the in-memory sample data is already as fast as a cache.
 *   CACHE_READS=false switches it off, CACHE_READS=true forces it on (tests).
 */
import { createHash } from 'node:crypto';
import { store } from './store';

const GEN_TTL = 7 * 24 * 3600;
const MAX_BYTES = 1_000_000; // larger answers are not worth keeping in the cache

export function readCacheEnabled(mysql: boolean): boolean {
  const flag = process.env.CACHE_READS;
  if (flag === 'false') return false;
  if (flag === 'true') return true;
  return mysql;
}

function ttl(): number {
  const n = Number(process.env.CACHE_TTL_SECONDS ?? 15);
  return Number.isFinite(n) && n > 0 ? n : 15;
}

/** Stable text of the arguments, whatever the order of their keys. */
function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  return `{${Object.keys(v as object)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
    .join(',')}}`;
}

/** The company's cache generation: it changes with every save, a sample reload or a company switch. */
export async function generation(ba: string): Promise<string> {
  return (await store().get(`gen:${ba}`)) ?? '0';
}

/** Answers a read from the cache, or runs it and keeps the answer. */
export async function cachedRead<T>(scope: { ba: string; user: string; op: string; args: unknown }, run: () => Promise<T>): Promise<T> {
  const s = store();
  const hash = createHash('sha1').update(stable(scope.args)).digest('base64url');
  const key = `read:${scope.ba}:${await generation(scope.ba)}:${scope.user}:${scope.op}:${hash}`;
  const hit = await s.get(key);
  if (hit !== null) return JSON.parse(hit) as T;
  const value = await run();
  const text = JSON.stringify(value ?? null);
  if (text.length <= MAX_BYTES) await s.set(key, text, ttl());
  return value;
}

/** Makes every cached answer of a company stale (called after each save). */
export async function invalidateCompany(ba: string): Promise<void> {
  await store().incr(`gen:${ba}`, GEN_TTL);
}
