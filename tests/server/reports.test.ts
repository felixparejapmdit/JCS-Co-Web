import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { REPORTS, reportCatalog, runReport } from '@/server/services/reports';
import '@/server/rpc';

async function ctxFor(ba: string, user = 'admin', group = 'ADMIN'): Promise<Ctx> {
  return { db: await getDb(ba), ba, user, fullName: user, group };
}

const YEAR = { from: '2000-01-01', to: '2100-12-31' };

describe.each(['8100', '8300'])('report library, company %s', (ba) => {
  it.each(REPORTS.map((r) => r.id))('%s runs and its totals add up', async (id) => {
    const ctx = await ctxFor(ba);
    const r = await runReport(ctx, id, YEAR);
    expect(Array.isArray(r.rows)).toBe(true);
    const def = REPORTS.find((x) => x.id === id)!;
    for (const c of def.columns.filter((x) => x.total)) {
      const s = r.rows.reduce((a, row) => a + Number(row[c.key] ?? 0), 0);
      expect(Math.abs(s - Number(r.totals[c.key]))).toBeLessThan(0.02);
    }
    for (const row of r.rows.slice(0, 5)) for (const c of def.columns) expect(row, `${id} ${c.key}`).toHaveProperty(c.key);
  });
});

describe('report data', () => {
  it('has rows in the main registers of the sample data', async () => {
    const ctx = await ctxFor('8100');
    for (const id of ['ap/vp-register', 'ap/cv-register', 'ap/fund-register', 'ap/expense-query', 'ar/collection-register', 'sd/sales-register', 'gl/gl-transactions', 'gl/chart-of-accounts']) {
      expect((await runReport(ctx, id, YEAR)).count, id).toBeGreaterThan(0);
    }
  });

  it('keeps the GL balanced and the expense summary equal to the expense lines', async () => {
    const ctx = await ctxFor('8100');
    const gl = await runReport(ctx, 'gl/gl-transactions', YEAR);
    expect(Math.abs(gl.totals.dramt - gl.totals.cramt)).toBeLessThan(0.02);
    const lines = await runReport(ctx, 'ap/expense-query', YEAR);
    const byAcct = await runReport(ctx, 'ap/expense-by-account', YEAR);
    expect(byAcct.totals.amount).toBeCloseTo(lines.totals.amount, 2);
  });

  it('shows only the reports of the user group and checks the right on run', async () => {
    const lab = await ctxFor('8100', 'lab', 'LAB');
    expect(await reportCatalog(lab)).toHaveLength(0);
    await expect(runReport(lab, 'ap/vp-register', YEAR)).rejects.toThrow();
    const cashier = await ctxFor('8100', 'cashier', 'CASHIER');
    const ids = (await reportCatalog(cashier)).map((r) => r.id);
    expect(ids).toContain('ar/collection-register');
    expect(ids).not.toContain('ap/vp-register');
  });

  it('rejects a start date after the end date', async () => {
    await expect(runReport(await ctxFor('8100'), 'ap/vp-register', { from: '2026-12-01', to: '2026-01-01' })).rejects.toThrow(/start date/);
  });
});

describe('report row links', () => {
  it('opens a van sales invoice on its daily sales report, a sales invoice on its own page', async () => {
    const ctx = await ctxFor('8300');
    const { rows } = await runReport(ctx, 'sd/sales-register', YEAR);
    const van = rows.filter((r) => /^ETC/.test(String(r.invno)));
    expect(van.length).toBeGreaterThan(0);
    for (const r of van) expect(r._href).toBe(`/dashboard/sd/dsr/${r.dsrno}`);
    for (const r of rows.filter((x) => /^SI-/.test(String(x.invno)))) expect(r._href).toBeUndefined();
  });
});
