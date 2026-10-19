import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { actOnDoc, getDoc, saveDoc } from '@/server/services/docs';
import { depositLeft, openDeposits } from '@/server/services/depapp';
import { invoiceBalance, openInvoices } from '@/server/services/receivables';
import { TC } from '@/shared/codes';
import { today } from '@/shared/dates';
import '@/server/rpc';

async function ctxFor(ba: string): Promise<Ctx> {
  return { db: await getDb(ba), ba, user: 'admin', fullName: 'System Administrator', group: 'ADMIN' };
}

describe.each(['8100', '8300'])('deposit application, company %s', (ba) => {
  it('has an applied deposit and one waiting in the sample data', async () => {
    const ctx = await ctxFor(ba);
    expect((await ctx.db.all('depapptbl')).some((r) => r.savestat === 'Applied')).toBe(true);
    expect((await openDeposits(ctx.db)).length).toBeGreaterThan(0);
  });

  it('applies a deposit to an invoice, books it and can be voided', async () => {
    const ctx = await ctxFor(ba);
    let dep: Awaited<ReturnType<typeof openDeposits>>[number] | undefined;
    let invs: Awaited<ReturnType<typeof openInvoices>> = [];
    for (const d of await openDeposits(ctx.db)) {
      invs = await openInvoices(ctx.db, d.custno);
      if (invs.length) {
        dep = d;
        break;
      }
    }
    expect(dep, 'a deposit of a customer with open invoices').toBeTruthy();
    const inv = invs[0];
    const amt = Math.min(dep!.left, inv.balance, 5000);
    const before = await depositLeft(ctx.db, dep!.orno);

    // Over-applying is refused.
    await expect(saveDoc(ctx, 'da', { orno: dep!.orno, transdate: today(), lines: [{ invno: inv.invno, oramt: dep!.left + 1, ewt: 0 }] })).rejects.toThrow();

    const { no } = await saveDoc(ctx, 'da', { orno: dep!.orno, transdate: today(), lines: [{ invno: inv.invno, oramt: amt, ewt: 0 }] });
    expect((await getDoc(ctx, 'da', no)).status).toBe('Open');
    await actOnDoc(ctx, 'da', no, 'post');
    expect((await getDoc(ctx, 'da', no)).status).toBe('Posted');
    expect(await depositLeft(ctx.db, dep!.orno)).toBeCloseTo(before - amt, 2);
    const h = (await ctx.db.one('saleshdrtbl', { invno: inv.invno }))!;
    expect((await invoiceBalance(ctx.db, h)).balance).toBeCloseTo(inv.balance - amt, 2);
    const gl = await ctx.db.all('gltranstbl', { where: { docno: no, tc: TC.COLLECTION } });
    expect(gl.reduce((s, r) => s + Number(r.dramt), 0)).toBeCloseTo(gl.reduce((s, r) => s + Number(r.cramt), 0), 2);

    // The receipt cannot be voided while its deposit is applied.
    await expect(actOnDoc(ctx, 'or', dep!.orno, 'void')).rejects.toThrow(/deposit application/);

    await actOnDoc(ctx, 'da', no, 'void');
    expect(await depositLeft(ctx.db, dep!.orno)).toBeCloseTo(before, 2);
    expect((await invoiceBalance(ctx.db, h)).balance).toBeCloseTo(inv.balance, 2);
  });
});
