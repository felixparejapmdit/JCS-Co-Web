// Salesman's and sales manager's workspace (legacy SalesmanModule, forms 076 / 077).
// A salesman sees his customers, their balances and his sales, and sends order requests
// (reqsohdrtbl / reqsodettbl). The sales manager turns a request into a sales order or rejects it.
import type { Db, Row } from '../db';
import { ACTION, FORM, INVOICE_TCS } from '@/shared/codes';
import { addDays, today } from '@/shared/dates';
import { fmtPeso, r2, r4, sum } from '@/shared/money';
import { Ctx, audit, fail, isAllowed, need, nextDocNo, num, str, yearPrefix } from './context';
import { docService } from './docs';
import { customerExposure } from './receivables';
import { priceOf } from './sales';

async function rights(ctx: Ctx) {
  const [own, add, mgr, decide] = await Promise.all([
    isAllowed(ctx.db, ctx.group, FORM.SALESMAN, ACTION.VIEW),
    isAllowed(ctx.db, ctx.group, FORM.SALESMAN, ACTION.INSERT),
    isAllowed(ctx.db, ctx.group, FORM.SALES_MANAGER, ACTION.VIEW),
    isAllowed(ctx.db, ctx.group, FORM.SALES_MANAGER, ACTION.RELEASE),
  ]);
  if (!own && !mgr) fail("Your user group cannot open the salesman's workspace.", 403);
  return { own, add, mgr, decide };
}

/** The salesman a user works as: sys_userrecords.smnno when the company keeps it. */
async function linkedSalesman(db: Db, user: string): Promise<string> {
  const u = await db.one('sys_userrecords', { username: user });
  return str(u?.smnno);
}

async function salesmanFor(ctx: Ctx, wanted: string, mgr: boolean): Promise<string> {
  const linked = await linkedSalesman(ctx.db, ctx.user);
  if (linked && !mgr) return linked;
  const smnno = wanted || linked;
  if (!smnno) return '';
  if (!(await ctx.db.one('smnmtbl', { smnno }))) fail(`Salesman ${smnno} does not exist.`);
  return smnno;
}

export async function salesmanWorkspace(ctx: Ctx, wanted = '') {
  const r = await rights(ctx);
  const salesmen = (await ctx.db.all('smnmtbl', { orderBy: [['fullname', 'asc']] })).filter((s) => String(s.status ?? 'Active').toLowerCase() === 'active');
  const linked = await linkedSalesman(ctx.db, ctx.user);
  const smnno = await salesmanFor(ctx, wanted, r.mgr);
  const base = { rights: r, linked, smnno, salesmen: salesmen.map((s) => ({ value: s.smnno, label: `${s.fullname} (${s.smnno})` })), canPick: r.mgr || !linked };
  if (!smnno) return { ...base, customers: [], requests: [], products: [], stats: null };

  const custs = (await ctx.db.all('custmasttbl', { where: { smnno }, orderBy: [['bussname', 'asc']] })).filter((c) => String(c.status ?? 'Active').toLowerCase() === 'active');
  const customers: Row[] = [];
  for (const c of custs) {
    const x = await customerExposure(ctx.db, c.custno);
    const limit = num(c.crlimit);
    customers.push({ custno: c.custno, bussname: c.bussname, address: c.address, term: num(c.term), limit, openAr: r2(x.openAr), overdue: r2(x.overdue), openOrders: r2(x.openOrders), available: limit ? r2(limit - x.openAr - x.openOrders) : null });
  }
  const mFrom = `${today().slice(0, 8)}01`;
  const sales = await ctx.db.all('saleshdrtbl', { where: { smnno, tc: { in: INVOICE_TCS }, status: 'Posted', transdate: { gte: mFrom } } });
  const reqs = await ctx.db.all('reqsohdrtbl', { where: { smnno }, orderBy: [['transdate', 'desc'], ['sono', 'desc']], limit: 40 });
  const products = (await ctx.db.all('mmasttbl', { where: { mmtype: 'FG' }, orderBy: [['mmdesc', 'asc']] })).map((m) => ({ codeno: m.codeno, mmdesc: m.mmdesc, um: m.um }));
  for (const p of products as Row[]) p.sp = await priceOf(ctx.db, p.codeno);
  return {
    ...base,
    customers,
    requests: await withLines(ctx.db, reqs, custs),
    products,
    stats: {
      customers: customers.length,
      openAr: r2(sum(customers, (c) => c.openAr)),
      overdue: r2(sum(customers, (c) => c.overdue)),
      salesMtd: r2(sum(sales, (s) => num(s.netamt))),
      pending: reqs.filter((q) => q.status === 'Requested').length,
    },
  };
}

/** reqsohdrtbl keys the request by `sono` (the request number); the sales order made from it says so in its remarks. */
async function withLines(db: Db, reqs: Row[], custs?: Row[]): Promise<Row[]> {
  const lines = await db.all('reqsodettbl', { where: { sono: { in: reqs.map((r) => r.sono) } }, orderBy: [['itmno', 'asc']] });
  const mats = await db.all('mmasttbl');
  const cs = custs ?? (await db.all('custmasttbl'));
  const orders = await db.all('sohdrtbl', { where: { remarks: { like: 'order request' } } });
  return reqs.map((r): Row => ({
    ...r,
    reqno: r.sono,
    sono: orders.find((o) => String(o.remarks).includes(String(r.sono)))?.sono ?? '',
    customer: cs.find((c) => c.custno === r.custno)?.bussname ?? r.custno,
    reqamt: num(r.soamt),
    rejectnote: String(r.status) === 'Rejected' ? String(r.remarks ?? '').split('Rejected: ').pop() : '',
    lines: lines.filter((l) => l.sono === r.sono).map((l) => ({ codeno: l.codeno, mmdesc: mats.find((m) => m.codeno === l.codeno)?.mmdesc ?? l.codeno, um: l.um, qty: num(l.qty), sp: num(l.sp), netamt: num(l.netamt) })),
  }));
}

export async function submitOrderRequest(ctx: Ctx, input: Row): Promise<string> {
  const r = await rights(ctx);
  if (!r.add) fail('Your user group cannot send order requests.', 403);
  const smnno = need(await salesmanFor(ctx, str(input.smnno), r.mgr), 'Choose the salesman.');
  const custno = need(str(input.custno), 'Choose the customer.');
  const cust = await ctx.db.one('custmasttbl', { custno });
  if (!cust) fail(`Customer ${custno} does not exist.`);
  if (cust.smnno !== smnno && !r.mgr) fail(`${cust.bussname} is not one of your customers.`);
  const deldate = str(input.deldate) || addDays(today(), 3);
  if (deldate < today()) fail('The delivery date has already passed.');
  const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.codeno) && num(l.qty) > 0);
  if (!raw.length) fail('Add at least one product with a quantity.');
  const lines: Row[] = [];
  for (const l of raw) {
    const m = await ctx.db.one('mmasttbl', { codeno: str(l.codeno) });
    if (!m) fail(`Product ${l.codeno} does not exist.`);
    const sp = await priceOf(ctx.db, m.codeno);
    const qty = r4(num(l.qty));
    lines.push({ codeno: m.codeno, um: m.um, qty, sp, netamt: r2(qty * sp) });
  }
  return ctx.db.tx(async (db) => {
    const reqno = await nextDocNo(db, 'reqsohdrtbl', 'sono', yearPrefix('REQ'));
    const reqamt = r2(sum(lines, (l) => l.netamt));
    await db.insert('reqsohdrtbl', { sono: reqno, transdate: today(), custno, smnno, deldate, shipto: str(cust.address), pono: str(input.pono), remarks: str(input.remarks), soamt: reqamt, delstat: 'Undelivered', status: 'Requested', sysver: 'CloudAOS', user: ctx.user });
    let itmno = 0;
    for (const l of lines) await db.insert('reqsodettbl', { sono: reqno, itmno: ++itmno, ...l, itmamt: l.netamt, qtbal: l.qty, status: 'Requested' });
    await audit({ ...ctx, db }, { form: FORM.SALESMAN, docno: reqno, trans: `Order request for ${cust.bussname}`, table: 'reqsohdrtbl' });
    return `Order request ${reqno} sent for ${fmtPeso(reqamt)}. The sales manager will turn it into a sales order.`;
  });
}

export async function cancelOrderRequest(ctx: Ctx, reqno: string): Promise<string> {
  await rights(ctx);
  const q = await ctx.db.one('reqsohdrtbl', { sono: reqno });
  if (!q) fail(`Request ${reqno} was not found.`);
  if (q.status !== 'Requested') fail(`Request ${reqno} is already ${String(q.status).toLowerCase()}.`);
  if (q.user !== ctx.user && !(await isAllowed(ctx.db, ctx.group, FORM.SALES_MANAGER, ACTION.RELEASE))) fail('Only the salesman who sent the request can cancel it.');
  await ctx.db.update('reqsohdrtbl', { sono: reqno }, { status: 'Cancelled', pdate: today() });
  return `Request ${reqno} cancelled.`;
}

export async function managerQueue(ctx: Ctx) {
  const r = await rights(ctx);
  if (!r.mgr) fail("Your user group cannot open the sales manager's queue.", 403);
  const reqs = await ctx.db.all('reqsohdrtbl', { orderBy: [['transdate', 'desc'], ['sono', 'desc']], limit: 80 });
  const smn = await ctx.db.all('smnmtbl');
  const rows = (await withLines(ctx.db, reqs)).map((q): Row => ({ ...q, salesman: smn.find((s) => s.smnno === q.smnno)?.fullname ?? q.smnno }));
  for (const q of rows.filter((x) => x.status === 'Requested')) {
    const c = await ctx.db.one('custmasttbl', { custno: q.custno });
    const x = await customerExposure(ctx.db, q.custno);
    const limit = num(c?.crlimit);
    q.exposure = { limit, openAr: r2(x.openAr), overdue: r2(x.overdue), openOrders: r2(x.openOrders), over: limit ? r2(x.openAr + x.openOrders + q.reqamt - limit) : 0 };
  }
  const plants = (await ctx.db.all('plnttbl', { orderBy: [['plntno', 'asc']] })).filter((p) => String(p.status ?? 'Active').toLowerCase() !== 'inactive');
  return { rows, canDecide: r.decide, plants: plants.map((p) => ({ value: p.plntno, label: `${p.plntname} (${p.plntno})` })) };
}

export async function decideOrderRequest(ctx: Ctx, input: { reqno?: unknown; approve?: unknown; plntno?: unknown; note?: unknown }): Promise<string> {
  const r = await rights(ctx);
  if (!r.decide) fail('Only the sales manager can decide order requests.', 403);
  const reqno = need(str(input.reqno), 'Choose the request.');
  const q = await ctx.db.one('reqsohdrtbl', { sono: reqno });
  if (!q) fail(`Request ${reqno} was not found.`);
  if (q.status !== 'Requested') fail(`Request ${reqno} is already ${String(q.status).toLowerCase()}.`);
  if (!input.approve) {
    const note = need(str(input.note), 'Tell the salesman why the request is rejected.');
    await ctx.db.update('reqsohdrtbl', { sono: reqno }, { status: 'Rejected', remarks: `${str(q.remarks)}${q.remarks ? ' · ' : ''}Rejected: ${note}`, apprvdby: ctx.user, pdate: today() });
    return `Request ${reqno} rejected.`;
  }
  const plntno = need(str(input.plntno), 'Choose the plant that will deliver.');
  const lines = await ctx.db.all('reqsodettbl', { where: { sono: reqno }, orderBy: [['itmno', 'asc']] });
  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    const { no: sono } = await docService('so').save(c, { transdate: today(), custno: q.custno, plntno, smnno: q.smnno, deldate: q.deldate, pono: q.pono || reqno, remarks: `From order request ${reqno}${q.remarks ? `: ${q.remarks}` : ''}`, lines: lines.map((l) => ({ codeno: l.codeno, qty: num(l.qty), sp: num(l.sp) })) });
    await db.update('reqsohdrtbl', { sono: reqno }, { status: 'Approved', plntno, apprvdby: ctx.user, pdate: today() });
    await audit(c, { form: FORM.SALES_MANAGER, docno: reqno, trans: `Order request turned into sales order ${sono}`, table: 'reqsohdrtbl' });
    return `Sales order ${sono} created from ${reqno}. It now goes through the usual credit approval.`;
  });
}
