import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { cancelOrderRequest, decideOrderRequest, managerQueue, salesmanWorkspace, submitOrderRequest } from '@/server/services/salesman';
import { applyBulkUpdate, customerTools, decideCustomerRequest, previewBulkUpdate, requestCustomer, transferCustomers } from '@/server/services/customers';
import '@/server/rpc';

async function ctxFor(ba: string, user = 'admin', group = 'ADMIN'): Promise<Ctx> {
  return { db: await getDb(ba), ba, user, fullName: user, group };
}

describe("salesman's workspace and order requests", () => {
  it('shows the customers, sales and requests of a salesman', async () => {
    const ctx = await ctxFor('8100', 'sales', 'SALES');
    const w = await salesmanWorkspace(ctx, 'S001');
    expect(w.smnno).toBe('S001');
    expect(w.customers.length).toBeGreaterThan(0);
    expect(w.requests.length).toBeGreaterThan(0);
    expect(w.rights.mgr).toBe(false);
  });

  it('turns an approved request into a sales order, and rejects with a reason', async () => {
    const sales = await ctxFor('8100', 'sales', 'SALES');
    const w = await salesmanWorkspace(await ctxFor('8100'), 'S001');
    const cust = w.customers[0];
    const fg = w.products[0];
    await expect(submitOrderRequest(sales, { smnno: 'S001', custno: cust.custno, lines: [] })).rejects.toThrow(/product/);
    const msg = await submitOrderRequest(sales, { smnno: 'S001', custno: cust.custno, lines: [{ codeno: fg.codeno, qty: 5 }] });
    const reqno = msg.match(/REQ-\S+/)![0];
    await expect(decideOrderRequest(sales, { reqno, approve: true, plntno: 'X' })).rejects.toThrow(/sales manager/);
    const fin = await ctxFor('8100', 'finance', 'FINHEAD');
    const q = await managerQueue(fin);
    expect(q.rows.find((r) => r.reqno === reqno)?.exposure).toBeTruthy();
    await decideOrderRequest(fin, { reqno, approve: true, plntno: q.plants[0].value });
    // Legacy keys: the request number is reqsohdrtbl.sono; the sales order says where it came from.
    const after = await fin.db.one('reqsohdrtbl', { sono: reqno });
    expect(after?.status).toBe('Approved');
    const so = (await fin.db.all('sohdrtbl', { where: { remarks: { like: reqno } } }))[0];
    expect(so).toBeTruthy();
    expect((await managerQueue(fin)).rows.find((r) => r.reqno === reqno)?.sono).toBe(so.sono);

    const msg2 = await submitOrderRequest(sales, { smnno: 'S001', custno: cust.custno, lines: [{ codeno: fg.codeno, qty: 2 }] });
    const req2 = msg2.match(/REQ-\S+/)![0];
    await expect(decideOrderRequest(fin, { reqno: req2, approve: false })).rejects.toThrow(/why/);
    await decideOrderRequest(fin, { reqno: req2, approve: false, note: 'Over the credit limit' });
    await expect(cancelOrderRequest(sales, req2)).rejects.toThrow(/rejected/);
  });
});

describe('customer tools', () => {
  it('previews and applies an Excel update, keeping the old record', async () => {
    const ctx = await ctxFor('8300');
    const t = await customerTools(ctx);
    const [a, b] = t.customers;
    const preview = await previewBulkUpdate(ctx, [{ custno: a.custno }, { custno: 'NOPE' }, { custno: b.custno, smnno: 'S999' }], { custtype: 'Distributor' });
    expect(preview[1].ok).toBe(false);
    expect(preview[2].problem).toMatch(/S999/);
    const msg = await applyBulkUpdate(ctx, [{ custno: a.custno }], { custtype: a.custtype === 'Distributor' ? 'Dealer' : 'Distributor' });
    expect(msg).toMatch(/1 customer/);
    expect((await ctx.db.all('custmasttbl_update', { where: { custno: a.custno, updatetype: 'Excel upload' } })).length).toBe(1);
  });

  it('transfers customers between salesmen', async () => {
    const ctx = await ctxFor('8300');
    const t = await customerTools(ctx);
    const mine = t.customers.filter((c) => c.smnno === 'S001');
    expect(mine.length).toBeGreaterThan(0);
    await expect(transferCustomers(ctx, { from: 'S001', to: 'S001', custnos: [mine[0].custno] })).rejects.toThrow(/different/);
    await transferCustomers(ctx, { from: 'S001', to: 'S002', custnos: [mine[0].custno] });
    expect((await ctx.db.one('custmasttbl', { custno: mine[0].custno }))?.smnno).toBe('S002');
    await expect(transferCustomers(ctx, { from: 'S001', to: 'S002', custnos: [mine[0].custno] })).rejects.toThrow(/no longer/);
  });

  it('creates a customer from a request', async () => {
    const ctx = await ctxFor('8100');
    const waiting = (await customerTools(ctx)).requests.find((r) => r.stat === 'Requested')!;
    expect(waiting).toBeTruthy();
    await expect(requestCustomer(ctx, { reqname: waiting.reqname })).rejects.toThrow(/already waiting/);
    const msg = await decideCustomerRequest(ctx, { docno: waiting.docno, approve: true, row: { smnno: 'S001', areano: 'NCR' } });
    const custno = msg.match(/Customer (\S+)/)![1];
    expect((await ctx.db.one('custmasttbl', { custno }))?.bussname).toBe(waiting.reqname);
    await expect(requestCustomer(ctx, { reqname: waiting.reqname })).rejects.toThrow(/already exists/);
  });
});
