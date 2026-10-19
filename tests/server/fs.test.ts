import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { financialStatements } from '@/server/services/gl';
import { fsSchedules } from '@/server/services/fs';
import { actOnDoc, saveDoc } from '@/server/services/docs';
import { today } from '@/shared/dates';
import '@/server/rpc';

async function ctxFor(ba: string): Promise<Ctx> {
  return { db: await getDb(ba), ba, user: 'admin', fullName: 'System Administrator', group: 'ADMIN' };
}

const Y = Number(today().slice(0, 4));
const M = Number(today().slice(5, 7));

describe.each(['8100', '8300'])('financial statement schedules, company %s', (ba) => {
  it('gives the same net income as the standard income statement', async () => {
    const ctx = await ctxFor(ba);
    const fs = await financialStatements(ctx, { year: Y, month: M, includeUnposted: true });
    const s = await fsSchedules(ctx, { year: Y, month: M, includeUnposted: true });
    expect(s.pnl.netIncome.ytd).toBeCloseTo(fs.incomeYtd.net, 2);
    expect(s.pnl.netIncome.month).toBeCloseTo(fs.incomeMonth.net, 2);
    expect(s.pnl.sales.ytd).toBeCloseTo(fs.incomeYtd.totalRevenue, 2);
  });

  it('splits every expense into a schedule and keeps the roll-forwards consistent', async () => {
    const ctx = await ctxFor(ba);
    const fs = await financialStatements(ctx, { year: Y, month: M, includeUnposted: true });
    const s = await fsSchedules(ctx, { year: Y, month: M, includeUnposted: true });
    const scheduled = s.schedules.reduce((a, x) => a + x.ytd, 0);
    expect(scheduled).toBeCloseTo(fs.incomeYtd.totalExpenses, 2);
    expect(s.schedules.some((x) => x.group === 'Overhead & Direct Labor')).toBe(true);
    const m = s.cosSchedule.ytd.materials;
    expect(m.used).toBeCloseTo(m.beginning + m.purchases + m.otherIn - m.ending, 2);
    expect(s.cosSchedule.ytd.total).toBeCloseTo(s.pnl.cos.ytd, 2);
  });
});

describe("prior years' adjustments", () => {
  it('lists manual JVs flagged as correcting a closed year', async () => {
    const ctx = await ctxFor('8100');
    const { no } = await saveDoc(ctx, 'jv', { transdate: today(), remarks: 'Correct 2025 depreciation', prioryradjt: 'Y', lines: [{ acctno: '3200100', dramt: 1500, cramt: 0 }, { acctno: '1110100', dramt: 0, cramt: 1500 }] });
    await actOnDoc(ctx, 'jv', no, 'approve');
    await actOnDoc(ctx, 'jv', no, 'post');
    const s = await fsSchedules(ctx, { year: Y, month: M, includeUnposted: true });
    expect(s.adjustments.filter((a) => a.jvno === no)).toHaveLength(2);
    expect(s.adjustmentsNet).toBeCloseTo(-1500, 2);
    const main = await ctx.db.all('glmaintranstbl', { where: { jvno: no } });
    expect(main.every((r) => r.prioryradjt === 'Y')).toBe(true);
  });
});
