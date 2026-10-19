import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { closeDsr, dsrDetail, dsrInvoice, dsrList, dsrState, openDsr, returnFromVan, saveCount } from '@/server/services/dsr';
import { GL } from '@/server/services/gl';
import { openInvoices } from '@/server/services/receivables';
import { VAN } from '@/server/seed';
import { TC } from '@/shared/codes';
import { addDays } from '@/shared/dates';
import '@/server/rpc';

async function ctxFor(ba: string, user = 'admin', group = 'ADMIN'): Promise<Ctx> {
  return { db: await getDb(ba), ba, user, fullName: user, group };
}

const sumGl = (rows: any[]) => rows.reduce((s, r) => s + Number(r.dramt || 0) - Number(r.cramt || 0), 0);

describe('transaction codes of van sales', () => {
  it('follows the legacy source: 84 ETCSI, 85 ETCI, 88 return receipt', () => {
    expect(TC.EVENT_CASH_INVOICE).toBe('84');
    expect(TC.EVENT_CHARGE_INVOICE).toBe('85');
    expect(TC.RETURN_IN).toBe('88');
  });
});

describe.each(['8100', '8300'])('daily sales report, company %s', (ba) => {
  it('has an open report for the van salesman in the sample data', async () => {
    const ctx = await ctxFor(ba);
    const list = await dsrList(ctx);
    expect(list.salesmen.map((s) => s.smnno)).toContain(VAN.SALESMAN);
    expect(list.rows.some((r) => r.status === 'OPEN')).toBe(true);
    const closed = list.rows.find((r) => r.status === 'COMPLETED');
    if (closed) {
      const st = await dsrState(ctx.db, closed.dsrno);
      expect(st.invoices.filter((i) => i.status !== 'Void').every((i) => i.status === 'Posted')).toBe(true);
      expect(await ctx.db.count('shrinkreporttbl', { dsrno: closed.dsrno })).toBeGreaterThan(0);
    }
  });

  it('keeps the van inventory account equal to the stock on the van', async () => {
    const ctx = await ctxFor(ba);
    const gl = await ctx.db.all('gltranstbl', { where: { acctno: GL.VAN_INVENTORY, glstatus: { ne: 'VOID' } } });
    const open = (await dsrList(ctx)).rows.find((r) => r.status === 'OPEN')!;
    const st = await dsrState(ctx.db, open.dsrno);
    const onVan = st.recon.reduce((s, r) => s + (r.expected + r.sold) * r.uc, 0); // sales are costed at closing
    expect(Math.abs(sumGl(gl) - onVan)).toBeLessThan(1);
  });

  it('refuses to sell or return more than is on the van', async () => {
    const ctx = await ctxFor(ba);
    const open = (await dsrList(ctx)).rows.find((r) => r.status === 'OPEN')!;
    const st = await dsrState(ctx.db, open.dsrno);
    const r = st.recon.find((x) => x.expected > 0)!;
    await expect(dsrInvoice(ctx, open.dsrno, { tc: TC.EVENT_CASH_INVOICE, lines: [{ codeno: r.codeno, qty: r.expected + 1 }] })).rejects.toThrow(/left on the van/);
    await expect(returnFromVan(ctx, open.dsrno, { plntno: (await ctx.db.all('plnttbl'))[0].plntno, lines: [{ codeno: r.codeno, qty: r.expected + 1 }] })).rejects.toThrow(/on the van/);
    await expect(dsrInvoice(ctx, open.dsrno, { tc: TC.EVENT_CHARGE_INVOICE, lines: [{ codeno: r.codeno, qty: 1 }] })).rejects.toThrow(/customer/);
  });

  it('closes the day: posts invoices, books cost and carries the count forward', async () => {
    const ctx = await ctxFor(ba);
    const open = (await dsrList(ctx)).rows.find((r) => r.status === 'OPEN')!;
    let st = await dsrState(ctx.db, open.dsrno);
    const r = st.recon.find((x) => x.expected >= 2)!;
    const cust = (await ctx.db.all('custmasttbl', { orderBy: [['custno', 'asc']] }))[0];
    await dsrInvoice(ctx, open.dsrno, { tc: TC.EVENT_CHARGE_INVOICE, custno: cust.custno, lines: [{ codeno: r.codeno, qty: 1 }] });
    await expect(closeDsr(ctx, open.dsrno)).rejects.toThrow(/count/);
    st = await dsrState(ctx.db, open.dsrno);
    await saveCount(ctx, open.dsrno, { lines: st.recon.map((x) => ({ codeno: x.codeno, qty: x.expected })) });
    await expect(closeDsr({ ...ctx, user: 'accountant', group: 'ACCTG' }, open.dsrno)).rejects.toThrow();
    const msg = await closeDsr(ctx, open.dsrno);
    expect(msg).toMatch(/closed/);
    const d = await dsrDetail(ctx, open.dsrno);
    expect(d.open).toBe(false);
    const am = await ctx.db.all('amstocktbl', { where: { smnno: VAN.SALESMAN } });
    for (const x of st.recon.filter((y) => y.expected > 0)) expect(Number(am.find((a) => a.codeno === x.codeno)?.qty)).toBeCloseTo(x.expected, 3);
    // The charge invoice is now a receivable of the customer.
    const inv = d.invoices.find((i) => i.tc === TC.EVENT_CHARGE_INVOICE && i.custno === cust.custno)!;
    expect((await openInvoices(ctx.db, cust.custno)).some((i) => i.invno === inv.invno)).toBe(true);
    // A new report must be dated after the last one.
    await expect(openDsr(ctx, { smnno: VAN.SALESMAN, transdate: d.header.transdate })).rejects.toThrow(/later/);
    const next = await openDsr(ctx, { smnno: VAN.SALESMAN, transdate: addDays(d.header.transdate, 1) }).catch((e) => e);
    if (typeof next === 'string') expect((await dsrState(ctx.db, next)).recon.reduce((s, x) => s + x.am, 0)).toBeGreaterThan(0);
  });
});
