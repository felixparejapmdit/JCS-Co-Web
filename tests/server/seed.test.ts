import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { allDocServices, getDoc } from '@/server/services/docs';
import { trialBalance } from '@/server/services/gl';
import { balances } from '@/server/services/inventory';
import { openInvoices } from '@/server/services/receivables';
import { dashboard } from '@/server/services/admin';
import '@/server/rpc';
import { today } from '@/shared/dates';

async function ctxFor(ba: string): Promise<Ctx> {
  return { db: await getDb(ba), ba, user: 'admin', fullName: 'System Administrator', group: 'ADMIN' };
}

describe.each(['8100', '8200', '8300'])('demo company %s', (ba) => {
  it('seeds and keeps the books balanced', async () => {
    const ctx = await ctxFor(ba);
    const tb = await trialBalance(ctx, { asOf: today(), includeUnposted: true });
    expect(tb.rows.length).toBeGreaterThan(5);
    expect(Math.abs(tb.totalDebit - tb.totalCredit)).toBeLessThan(0.01);
  });

  it('A/R and A/P subledgers agree with their control accounts', async () => {
    const ctx = await ctxFor(ba);
    const tb = await trialBalance(ctx, { asOf: '2999-12-31', includeUnposted: true });
    const gl = (acct: string) => {
      const r = tb.rows.find((x) => x.acctno === acct);
      return r ? r.debit - r.credit : 0;
    };
    const ar = (await openInvoices(ctx.db)).reduce((s, i) => s + i.balance, 0);
    expect(Math.abs(gl('1130100') - ar)).toBeLessThan(0.05);
    const vps = await ctx.db.all('exphdrtbl', { where: { status: 'Posted' } });
    const ap = vps.reduce((s, v) => s + Number(v.vpbals), 0);
    expect(Math.abs(-gl('2110100') - ap)).toBeLessThan(0.05);
  });

  it('never shows negative stock', async () => {
    const ctx = await ctxFor(ba);
    for (const b of (await balances(ctx.db)).values()) {
      expect(b.onhand).toBeGreaterThanOrEqual(-0.0001);
      for (const l of b.lots) expect(l.qty).toBeGreaterThanOrEqual(-0.0001);
    }
  });

  it('opens every document without errors', async () => {
    const ctx = await ctxFor(ba);
    for (const svc of allDocServices()) {
      const { rows } = await svc.list(ctx, {});
      for (const r of rows.slice(0, 15)) {
        const v = await getDoc(ctx, svc.type, String(r.no));
        expect(v.no).toBe(r.no);
      }
    }
  });

  it('builds the dashboard', async () => {
    const ctx = await ctxFor(ba);
    const d = await dashboard(ctx);
    expect(Array.isArray(d.tasks)).toBe(true);
  });
});
