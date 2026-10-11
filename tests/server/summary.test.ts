import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import { allDocServices } from '@/server/services/docs';
import { dashboard } from '@/server/services/admin';
import '@/server/rpc';

describe('demo data coverage', () => {
  it.each(['8100', '8200', '8300'])('company %s has activity in every module it uses', async (ba) => {
    const ctx = { db: await getDb(ba), ba, user: 'admin', fullName: 'System Administrator', group: 'ADMIN' };
    const counts: Record<string, string> = {};
    for (const svc of allDocServices()) {
      const { counts: c } = await svc.list(ctx, {});
      counts[svc.type] = Object.entries(c)
        .map(([k, v]) => `${k}:${v}`)
        .join(' ');
    }
    const d = await dashboard(ctx);
    if (process.env.SHOW_SEED) console.log(ba, JSON.stringify(counts), JSON.stringify({ tasks: d.tasks.length, ar: d.ar, ap: d.ap, sales: d.sales }));
    expect(d.tasks.length).toBeGreaterThan(0);
    expect(Object.values(counts).filter((c) => c !== 'all:0').length).toBeGreaterThan(8);
  });
});
