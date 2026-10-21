import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RedisMock from 'ioredis-mock';
import { MemoryStore, RedisStore, store, useStore } from '@/server/platform/store';
import { cachedRead, invalidateCompany } from '@/server/platform/read-cache';
import { withIdempotency } from '@/server/platform/idempotency';
import { countFailure, enforce, refuseIfFull, RateLimited } from '@/server/platform/rate-limit';
import { getJob, startJob } from '@/server/platform/jobs';
import { getDb } from '@/server/db';
import { runOp } from '@/server/rpc';
import type { Session } from '@/server/auth';

const admin: Session = { u: 'admin', n: 'System Administrator', g: 'ADMIN', ba: '8300', cos: ['8100', '8300'] };

beforeEach(() => useStore(new MemoryStore()));
afterEach(() => vi.useRealTimers());

describe('store', () => {
  it('keeps values until they expire, and counts', async () => {
    vi.useFakeTimers();
    const s = new MemoryStore();
    await s.set('a', '1', 2);
    expect(await s.get('a')).toBe('1');
    expect(await s.setIfAbsent('a', '2', 2)).toBe(false);
    expect(await s.incr('n', 60)).toBe(1);
    expect(await s.incr('n', 60)).toBe(2);
    vi.advanceTimersByTime(2500);
    expect(await s.get('a')).toBeNull();
    expect(await s.setIfAbsent('a', '3', 2)).toBe(true);
  });

  it('works on Redis (ioredis-mock), with the same answers as memory', async () => {
    const s = new RedisStore(new RedisMock() as never);
    await s.set('k', 'v', 30);
    expect(await s.get('k')).toBe('v');
    expect(await s.setIfAbsent('k', 'w', 30)).toBe(false);
    expect(await s.setIfAbsent('lock', 'x', 30)).toBe(true);
    expect(await s.incr('c', 60)).toBe(1);
    expect(await s.incr('c', 60)).toBe(2);
    await s.del('k');
    expect(await s.get('k')).toBeNull();
  });

  it('keeps working from memory when Redis does not answer', async () => {
    const broken = { get: () => Promise.reject(new Error('down')), set: () => Promise.reject(new Error('down')), incr: () => Promise.reject(new Error('down')), del: () => Promise.reject(new Error('down')) };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const s = new RedisStore(broken as never);
    await s.set('k', 'v', 30);
    expect(await s.get('k')).toBe('v'); // answered by the memory fallback
    expect(warn).toHaveBeenCalledTimes(1); // reported once, not on every call
    warn.mockRestore();
  });
});

describe('read cache', () => {
  it('answers a repeated read from the cache until the company saves something', async () => {
    let runs = 0;
    const read = () => cachedRead({ ba: '8300', user: 'admin', op: 'x.list', args: { b: 1, a: 2 } }, async () => ++runs);
    expect(await read()).toBe(1);
    expect(await cachedRead({ ba: '8300', user: 'admin', op: 'x.list', args: { a: 2, b: 1 } }, async () => ++runs)).toBe(1); // same args, other order
    await invalidateCompany('8300');
    expect(await read()).toBe(2);
    // Other users and other companies have their own answers.
    expect(await cachedRead({ ba: '8300', user: 'finance', op: 'x.list', args: { a: 2, b: 1 } }, async () => ++runs)).toBe(3);
  });

  it('runs through runOp: a save in the app clears the cached reads of that company', async () => {
    process.env.CACHE_READS = 'true';
    try {
      const db = await getDb('8300');
      const before = ((await runOp('master.list', { id: 'salesmen' }, admin)) as { rows: unknown[] }).rows.length;
      // A change behind the app's back (e.g. the legacy system) is not seen until the cache expires...
      await db.insert('smnmtbl', { smnno: 'S999', fullname: 'Cache Test', areano: 'NCR', smnstat: 'Active' });
      expect(((await runOp('master.list', { id: 'salesmen' }, admin)) as { rows: unknown[] }).rows.length).toBe(before);
      // ...but any save through Cloud AOS clears it at once.
      await runOp('system.favToggle', { href: '/dashboard/admin/companies' }, admin);
      expect(((await runOp('master.list', { id: 'salesmen' }, admin)) as { rows: unknown[] }).rows.length).toBe(before + 1);
      await runOp('system.favToggle', { href: '/dashboard/admin/companies' }, admin);
      await db.remove('smnmtbl', { smnno: 'S999' });
    } finally {
      delete process.env.CACHE_READS;
    }
  });
});

describe('idempotency', () => {
  it('runs a request once for the same key and replays the answer', async () => {
    let runs = 0;
    const first = await withIdempotency('8300:admin:doc.save', 'key-12345678', async () => ({ no: `SO-${++runs}` }));
    const again = await withIdempotency('8300:admin:doc.save', 'key-12345678', async () => ({ no: `SO-${++runs}` }));
    expect(first).toEqual({ value: { no: 'SO-1' }, replayed: false });
    expect(again).toEqual({ value: { no: 'SO-1' }, replayed: true });
    expect(runs).toBe(1);
  });

  it('refuses a duplicate while the first is still running, and lets a failed request be tried again', async () => {
    let release!: () => void;
    const slow = withIdempotency('s', 'key-running1', () => new Promise<string>((r) => (release = () => r('done'))));
    await expect(withIdempotency('s', 'key-running1', async () => 'second')).rejects.toThrow(/already being processed/);
    release();
    expect((await slow).value).toBe('done');

    await expect(withIdempotency('s', 'key-failing1', async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect((await withIdempotency('s', 'key-failing1', async () => 'ok')).value).toBe('ok');
    await expect(withIdempotency('s', 'bad key!', async () => 1)).rejects.toThrow(/Idempotency-Key/);
  });
});

describe('rate limits', () => {
  it('answers 429 once a bucket is over its limit', async () => {
    const rule = { limit: 3, windowSec: 60 };
    for (let i = 0; i < 3; i++) await enforce('t', rule);
    await expect(enforce('t', rule)).rejects.toBeInstanceOf(RateLimited);
  });

  it('counts failures only, for sign-in', async () => {
    const rule = { limit: 2, windowSec: 60 };
    await refuseIfFull('signin:x', rule);
    await countFailure('signin:x', rule);
    await countFailure('signin:x', rule);
    await expect(refuseIfFull('signin:x', rule)).rejects.toThrow(/Too many requests/);
  });
});

describe('async jobs', () => {
  it('runs in the background, reports progress and its result, for its owner only', async () => {
    let finish!: () => void;
    const job = await startJob('test', 'admin', async (progress) => {
      await progress('Half way');
      await new Promise<void>((r) => (finish = r));
      return { rows: 42 };
    });
    expect(job.status).toBe('running');
    await vi.waitFor(async () => expect((await getJob(job.id, 'admin')).progress).toBe('Half way'));
    finish();
    await vi.waitFor(async () => expect((await getJob(job.id, 'admin')).status).toBe('done'));
    expect((await getJob(job.id, 'admin')).result).toEqual({ rows: 42 });
    await expect(getJob(job.id, 'someone-else')).rejects.toThrow(/does not exist/);
  });

  it('records a failure', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const job = await startJob('test', 'admin', async () => {
      throw new Error('disk full');
    });
    await vi.waitFor(async () => expect((await getJob(job.id, 'admin')).status).toBe('failed'));
    err.mockRestore();
  });
});

describe('the store is shared', () => {
  it('is memory without REDIS_URL', () => {
    expect(store().kind).toBe('memory');
  });
});
