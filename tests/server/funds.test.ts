import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { actOnDoc, getDoc, saveDoc } from '@/server/services/docs';
import { GL, jvEditList, jvEditLoad, jvEditSave } from '@/server/services/gl';
import { fundPosition, openAdvances, replenishmentRemarks } from '@/server/services/funds';
import { budgetMonitor, budgetPeriods } from '@/server/services/budget';
import { openVouchers } from '@/server/services/payables';
import '@/server/rpc';
import { TC } from '@/shared/codes';
import { today } from '@/shared/dates';

async function ctxFor(ba: string): Promise<Ctx> {
  return { db: await getDb(ba), ba, user: 'admin', fullName: 'System Administrator', group: 'ADMIN' };
}

describe('legacy transaction codes', () => {
  it('uses the codes found in the legacy source', () => {
    expect(TC.JOURNAL_VOUCHER).toBe('00');
    expect(TC.PETTY_CASH).toBe('40');
    expect(TC.VOUCHER_PAYABLE).toBe('42');
    expect(TC.CHECK_VOUCHER).toBe('43');
    expect(TC.REVOLVING_FUND).toBe('44');
    expect(TC.PAYROLL).toBe('45');
    expect(TC.CA_LIQUIDATION).toBe('46');
    expect(TC.DELIVERY).toBe('30');
    expect(TC.SALES_INVOICE).toBe('53');
    expect(new Set(Object.values(TC)).size).toBe(Object.values(TC).length);
  });
});

describe('replenishment remarks', () => {
  it('writes a range when the whole series is replenished, else a list', () => {
    expect(replenishmentRemarks('Petty Cash Fund', ['PCV-1'], ['PCV-1'])).toBe('Representing Petty Cash Fund replenishment from Doc. No PCV-1');
    expect(replenishmentRemarks('Petty Cash Fund', ['PCV-2', 'PCV-1'], ['PCV-1', 'PCV-2'])).toBe('Representing Petty Cash Fund replenishment from Doc. Nos PCV-1 to PCV-2');
    expect(replenishmentRemarks('Revolving Fund', ['RFV-1', 'RFV-3'], ['RFV-1', 'RFV-2', 'RFV-3'])).toBe('Representing Revolving Fund replenishment for Doc. Nos RFV-1, RFV-3');
  });
});

describe.each(['8100', '8300'])('finance modules, company %s', (ba) => {
  it('keeps the petty cash fund in balance with its vouchers and replenishments', async () => {
    const ctx = await ctxFor(ba);
    const reps = await ctx.db.all('fundrepltbl');
    expect(reps.some((r) => r.status === 'paid' && r.vpno && r.vpno !== '0')).toBe(true);
    expect(reps.some((r) => r.status === 'unpaid' && r.vpno === '0')).toBe(true);
    const pcf = await fundPosition(ctx.db, TC.PETTY_CASH);
    // Imprest system: fund on hand + vouchers spent but not yet paid back = the fund.
    const unpaid = reps.filter((r) => r.status === 'unpaid' && r.tc === TC.PETTY_CASH).reduce((s, r) => s + Number(r.totalamt), 0);
    expect(Math.abs(pcf.balance + unpaid + pcf.unreplenished - 50000)).toBeLessThan(0.01);
    for (const r of reps) {
      const vouchers = await ctx.db.all('exphdrtbl', { where: { replno: r.replno, tc: r.tc } });
      expect(Math.abs(vouchers.reduce((s, v) => s + Number(v.docamt), 0) - Number(r.totalamt))).toBeLessThan(0.01);
      expect(vouchers.every((v) => v.cvstat === 'repl')).toBe(true);
    }
  });

  it('refuses a petty cash voucher larger than the fund', async () => {
    const ctx = await ctxFor(ba);
    await expect(saveDoc(ctx, 'pcv', { transdate: today(), venno: 'V00909', lines: [{ acctno: '6200700', ccno: 'ADM', amount: 9_999_999, vatable: 'Y' }] })).rejects.toThrow(/available in the petty cash fund/);
  });

  it('liquidates cash advances with a refund or a reimbursement', async () => {
    const ctx = await ctxFor(ba);
    const liqs = await ctx.db.all('exphdrtbl', { where: { tc: TC.CA_LIQUIDATION, status: 'Posted' } });
    expect(liqs.length).toBe(2);
    for (const l of liqs) {
      const adv = await ctx.db.one('exphdrtbl', { docno: l.refdoc, tc: TC.VOUCHER_PAYABLE });
      expect(adv?.liqstat).toBe('Liquidated');
      expect(adv?.replno).toBe(l.docno);
    }
    const reimbursing = liqs.find((l) => Number(l.vpbals) > 0)!;
    expect(Number(reimbursing.vpbals)).toBeCloseTo(1250, 2);
    // The reimbursement can be paid by cheque like a voucher.
    const payable = await openVouchers(ctx.db, reimbursing.venno);
    expect(payable.some((v) => v.vpno === reimbursing.docno && v.tc === TC.CA_LIQUIDATION)).toBe(true);
    // One advance is still open and older than 30 days.
    const open = await openAdvances(ctx.db);
    expect(open.some((a) => a.days > 30 && a.amount === 8000)).toBe(true);
    const view = await getDoc(ctx, 'liq', reimbursing.docno);
    expect(view.links?.some((x) => x.type === 'vp' && x.no === reimbursing.refdoc)).toBe(true);
  });

  it('voids and re-liquidates an advance', async () => {
    const ctx = await ctxFor(ba);
    const liq = (await ctx.db.all('exphdrtbl', { where: { tc: TC.CA_LIQUIDATION, status: 'Posted' } })).find((l) => Number(l.vpbals) === 0)!;
    await actOnDoc(ctx, 'liq', liq.docno, 'void');
    expect((await ctx.db.one('exphdrtbl', { docno: liq.refdoc, tc: TC.VOUCHER_PAYABLE }))?.liqstat).toBe('Open');
    const again = await saveDoc(ctx, 'liq', { transdate: today(), refdoc: liq.refdoc, lines: [{ acctno: '6200110', ccno: 'LOG', amount: 1000, vatable: 'N' }] });
    expect(again.message).toMatch(/returned to the cashier/);
  });

  it('compares budgets with actual spending', async () => {
    const ctx = await ctxFor(ba);
    const periods = await budgetPeriods(ctx);
    expect(periods.length).toBe(3);
    const m = await budgetMonitor(ctx, periods[1].datefr, periods[1].dateto);
    expect(m.centers.length).toBeGreaterThan(1);
    expect(m.totals.budget).toBeGreaterThan(0);
    const states = new Set(m.centers.flatMap((c) => c.lines.map((l) => l.state)));
    expect(states.has('Within budget')).toBe(true);
    expect(states.has('Over budget') || states.has('Near limit')).toBe(true);
  });

  it('edits an automatic JV entry before posting and keeps it balanced', async () => {
    const ctx = await ctxFor(ba);
    const { docs } = await jvEditList(ctx, {});
    const doc = docs.find((d) => d.tc === TC.PETTY_CASH || d.tc === TC.VOUCHER_PAYABLE)!;
    expect(doc).toBeTruthy();
    const loaded = await jvEditLoad(ctx, doc.tc, doc.docno);
    const lines = loaded.lines.map((l) => ({ ...l, ccno: l.dramt > 0 && !String(l.acctno).startsWith('1') ? 'ADM' : l.ccno }));
    await expect(jvEditSave(ctx, { tc: doc.tc, docno: doc.docno, reason: 'test', lines: [...lines, { acctno: GL.CASH_ON_HAND, dramt: 1 }] })).rejects.toThrow(/must be equal/);
    await expect(jvEditSave(ctx, { tc: doc.tc, docno: doc.docno, reason: '', lines })).rejects.toThrow(/why/);
    const msg = await jvEditSave(ctx, { tc: doc.tc, docno: doc.docno, reason: 'Charge to Administration', lines });
    expect(msg).toMatch(/corrected/);
    const after = await jvEditLoad(ctx, doc.tc, doc.docno);
    expect(after.lines.length).toBe(lines.length);
    const log = await ctx.db.all('ng_audit_log', { where: { doc_no: doc.docno, table_name: 'gltranstbl' } });
    expect(log.length).toBeGreaterThan(0);
  });

  it('writes journal vouchers with the legacy code 00', async () => {
    const ctx = await ctxFor(ba);
    const jv = await ctx.db.all('gltranstbl', { where: { jvsource: 'JV' } });
    expect(jv.length).toBeGreaterThan(0);
    expect(jv.every((l) => l.tc === TC.JOURNAL_VOUCHER)).toBe(true);
  });
});
