import { NextRequest, NextResponse } from 'next/server';
import { companies, getDb, isMysqlMode } from '@/server/db';
import { gateway } from '@/server/platform/gateway';
import { store } from '@/server/platform/store';

export const dynamic = 'force-dynamic';

/** How long a probe may take, and how long its answer is reused (a monitor may call every second). */
const PROBE_MS = 3000;
const REUSE_MS = 5000;

type Check = { ok: boolean; ms: number; error?: string };
let last: { at: number; db: Check; cache: Check } | null = null;

/** Runs one check. The answer is public, so it says only what failed; the details go to the server log. */
async function probe(name: string, run: () => Promise<unknown>): Promise<Check> {
  const t0 = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([run(), new Promise((_, reject) => (timer = setTimeout(() => reject(new Error('timeout')), PROBE_MS)))]);
    return { ok: true, ms: Date.now() - t0 };
  } catch (err) {
    console.error(`[cloud-aos] health check: ${name} failed`, err);
    const timeout = err instanceof Error && err.message === 'timeout';
    return { ok: false, ms: Date.now() - t0, error: timeout ? `no answer within ${PROBE_MS / 1000} s` : 'not reachable' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Health check for load balancers and monitoring.
 *   GET /api/healthz        readiness: the company database answers and the cache store works;
 *                           503 when the database cannot be reached, so traffic goes elsewhere.
 *   GET /api/healthz?live   liveness only: the process is up (no database call).
 */
export const GET = gateway('health', async (req: NextRequest) => {
  const base = { service: 'Cloud AOS', version: '2.0.0', data: isMysqlMode() ? 'company database' : 'sample data', cache: store().kind, timestamp: new Date().toISOString() };
  if (req.nextUrl.searchParams.has('live')) return NextResponse.json({ status: 'healthy', ...base });

  if (!last || Date.now() - last.at > REUSE_MS) {
    const first = companies()[0];
    const [db, cache] = await Promise.all([
      probe('database', async () => (first ? (await getDb(first.ba)).one('batbl', { ba: first.ba }) : null)),
      probe('cache', async () => {
        const key = `health:${process.pid}`;
        await store().set(key, '1', 10);
        if ((await store().get(key)) !== '1') throw new Error('the cache store did not keep a value');
      }),
    ]);
    last = { at: Date.now(), db, cache };
  }
  // The cache store falls back to memory by itself (platform/store.ts), so only the database decides.
  const healthy = last.db.ok;
  return NextResponse.json({ status: healthy ? 'healthy' : 'unhealthy', ...base, checks: { database: last.db, cache: last.cache } }, { status: healthy ? 200 : 503 });
});
