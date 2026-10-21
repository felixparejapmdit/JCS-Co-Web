import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { MemoryStore, useStore } from '@/server/platform/store';
import { GET as v1, POST as v1Post } from '@/app/api/v1/[[...path]]/route';
import { POST as aos } from '@/app/api/aos/route';
import { GET as health } from '@/app/api/healthz/route';
import { createKey, revokeKey } from '@/server/services/apikeys';
import { invalidateCompany } from '@/server/platform/read-cache';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { DEMO_PASSWORD } from '@/server/seed';

const BASE = 'http://localhost:8180';

async function adminCtx(): Promise<Ctx> {
  return { db: await getDb('8300'), ba: '8300', user: 'admin', fullName: 'System Administrator', group: 'ADMIN' };
}

function get(path: string, key?: string) {
  return v1(new NextRequest(`${BASE}${path}`, { headers: key ? { authorization: `Bearer ${key}` } : {} }));
}

beforeEach(() => useStore(new MemoryStore()));

describe('public API v1', () => {
  it('needs a valid key, and says which version answered', async () => {
    const res = await get('/api/v1/customers');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatchObject({ code: 'unauthorized' });
    expect(body.error.request_id).toMatch(/^req_/);
    expect(res.headers.get('X-Request-Id')).toBe(body.error.request_id);
    expect((await get('/api/v1/customers', 'caos_8300_not-a-real-key-not-a-real-key00')).status).toBe(401);

    const { key } = await createKey(await adminCtx(), { name: 'Test reports', group: 'ADMIN' });
    expect(key).toMatch(/^caos_8300_[A-Za-z0-9_-]{32}$/);
    const ok = await get('/api/v1', key);
    expect(ok.status).toBe(200);
    expect(ok.headers.get('API-Version')).toBe('1');
    expect((await ok.json()).data).toMatchObject({ api: 'Cloud AOS', version: 1, company: 'Chemag Trading Corporation' });
  });

  it('pages every list with a cursor and a Link header', async () => {
    const { key } = await createKey(await adminCtx(), { name: 'Paging', group: 'ADMIN' });
    const first = await get('/api/v1/materials?limit=2', key);
    const p1 = await first.json();
    expect(p1.data).toHaveLength(2);
    expect(p1.page).toMatchObject({ limit: 2, has_more: true });
    expect(first.headers.get('Link')).toContain('rel="next"');
    const second = await (await get(`/api/v1/materials?limit=2&cursor=${p1.page.next_cursor}`, key)).json();
    expect(second.data[0]).not.toEqual(p1.data[0]);
    // Walking every page returns every row once.
    const seen: unknown[] = [];
    let cursor = '';
    for (let i = 0; i < 100; i++) {
      const page = await (await get(`/api/v1/materials?limit=3${cursor ? `&cursor=${cursor}` : ''}`, key)).json();
      seen.push(...page.data);
      if (!page.page.has_more) break;
      cursor = page.page.next_cursor;
    }
    expect(seen).toHaveLength(p1.page.total);
    expect((await get('/api/v1/materials?cursor=%%%', key)).status).toBe(400);
  });

  it('serves resources: one master record, documents, reports and stock', async () => {
    const { key } = await createKey(await adminCtx(), { name: 'Resources', group: 'ADMIN' });
    const list = await (await get('/api/v1/customers', key)).json();
    const one = list.data[0];
    const single = await (await get(`/api/v1/customers/${one.custno}`, key)).json();
    expect(single.data.custno).toBe(one.custno);
    expect((await get('/api/v1/customers/NOPE', key)).status).toBe(404);

    const types = (await (await get('/api/v1/documents', key)).json()).data.map((d: { type: string }) => d.type);
    expect(types).toContain('si');
    const invoices = await (await get('/api/v1/documents/si?limit=5', key)).json();
    expect(invoices.data.length).toBeGreaterThan(0);
    const inv = await (await get(`/api/v1/documents/si/${encodeURIComponent(invoices.data[0].invno)}`, key)).json();
    expect(inv.data.title).toBeTruthy();
    expect((await get('/api/v1/documents/nope', key)).status).toBe(404);

    const tb = await get('/api/v1/reports/trial-balance?as_of=2026-12-31', key);
    expect(tb.status).toBe(200);
    expect((await get('/api/v1/reports/nope', key)).status).toBe(404);
    expect((await get('/api/v1/stock', key)).status).toBe(200);
  });

  it('is read-only, keeps the rights of the key\'s group, and stops at once when revoked', async () => {
    const ctx = await adminCtx();
    const { key, record } = await createKey(ctx, { name: 'Lab only', group: 'LAB' });
    // The Lab group has no right to view the chart of accounts.
    const denied = await get('/api/v1/accounts', key);
    expect(denied.status).toBe(403);
    expect((await denied.json()).error.code).toBe('forbidden');

    const post = await v1Post(new NextRequest(`${BASE}/api/v1/customers`, { method: 'POST', headers: { authorization: `Bearer ${key}` } }));
    expect(post.status).toBe(405);
    expect(post.headers.get('Allow')).toContain('GET');

    await revokeKey(ctx, record.id);
    expect((await get('/api/v1', key)).status).toBe(401);
  });

  it('forgets a key at once when its company data is replaced (e.g. a sample reload)', async () => {
    const ctx = await adminCtx();
    const { key, record } = await createKey(ctx, { name: 'Wiped', group: 'ADMIN' });
    expect((await get('/api/v1', key)).status).toBe(200); // accepted and remembered
    await ctx.db.remove('ng_api_keys', { id: record.id });
    await invalidateCompany('8300'); // what any save or reload does
    expect((await get('/api/v1', key)).status).toBe(401);
  });
});

describe('internal API (BFF) through the gateway', () => {
  async function signIn() {
    const res = await aos(new NextRequest(`${BASE}/api/aos`, { method: 'POST', body: JSON.stringify({ op: 'auth.login', args: { username: 'admin', password: DEMO_PASSWORD, ba: '8300' } }) }));
    return res.headers.get('set-cookie')!.split(';')[0];
  }
  const call = (cookie: string, op: string, args: object, key?: string) =>
    aos(new NextRequest(`${BASE}/api/aos`, { method: 'POST', headers: { cookie, ...(key ? { 'idempotency-key': key } : {}) }, body: JSON.stringify({ op, args }) }));

  it('runs a save sent twice with the same Idempotency-Key once', async () => {
    const cookie = await signIn();
    const href = '/dashboard/admin/data-source';
    const first = await call(cookie, 'system.favToggle', { href }, 'idem-test-0001');
    const second = await call(cookie, 'system.favToggle', { href }, 'idem-test-0001');
    expect((await first.json()).data.favourite).toBe(true);
    expect(second.headers.get('Idempotent-Replayed')).toBe('true');
    expect((await second.json()).data.favourite).toBe(true); // not toggled back off
    // A new key is a new request.
    expect((await (await call(cookie, 'system.favToggle', { href }, 'idem-test-0002')).json()).data.favourite).toBe(false);
  });

  it('slows down repeated wrong passwords with 429', async () => {
    const attempt = () =>
      aos(new NextRequest(`${BASE}/api/aos`, { method: 'POST', headers: { 'x-forwarded-for': '10.9.9.9' }, body: JSON.stringify({ op: 'auth.login', args: { username: 'nobody-here', password: 'wrong' } }) }));
    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('gives every answer a request id and safe headers', async () => {
    const res = await health(new NextRequest(`${BASE}/api/healthz`, { headers: { 'x-request-id': 'monitor-123456' } }));
    expect(res.headers.get('X-Request-Id')).toBe('monitor-123456');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect((await res.json()).cache).toBe('memory');
  });
});
