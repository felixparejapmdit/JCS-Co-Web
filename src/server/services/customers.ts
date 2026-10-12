// Customer master tools of the legacy CustMast.aspx (form 020) that go beyond editing one record:
//  - update many customers at once from an Excel list (custtype, area, salesman),
//  - move customers from one salesman to another,
//  - customer-number requests (qryreqttbl reqtype 'Customer No.') turned into customers.
// Every change keeps a copy of the record before it in custmasttbl_update, as the legacy page does.
import type { Db, Row } from '../db';
import { ACTION, FORM } from '@/shared/codes';
import { nowStamp, today } from '@/shared/dates';
import { Ctx, audit, fail, isAllowed, need, nextDocNo, requireRight, str, yearPrefix } from './context';
import { saveMaster } from './masters';

const REQ_TYPE = 'Customer No.';

/** Copies the current customer record into custmasttbl_update (skipped when the table is missing). */
async function keepHistory(db: Db, custno: string, user: string, updatetype: string) {
  const c = await db.one('custmasttbl', { custno });
  if (!c) return;
  const { custno: _k, ...rest } = c;
  try {
    await db.insert('custmasttbl_update', { custno, ...pick(rest, ['moacctno', 'fname', 'bussname', 'address', 'term', 'smnno', 'crlimit', 'custtype', 'areano', 'tin', 'contactno', 'status', 'paytype', 'accttype', 'ewt', 'vat', 'searchname', 'prevmoacctno']), user, datecreated: nowStamp(), updatetype });
  } catch {
    // Older company databases do not have custmasttbl_update; ng_audit_log still records the change.
  }
}

function pick(r: Row, keys: string[]): Row {
  const out: Row = {};
  for (const k of keys) if (r[k] !== undefined) out[k] = r[k];
  return out;
}

export async function customerTools(ctx: Ctx) {
  await requireRight(ctx, FORM.CUSTOMER, ACTION.VIEW, 'view customers');
  const [custs, smn, areas] = await Promise.all([ctx.db.all('custmasttbl', { orderBy: [['bussname', 'asc']] }), ctx.db.all('smnmtbl', { orderBy: [['fullname', 'asc']] }), ctx.db.all('areatbl', { orderBy: [['areaname', 'asc']] })]);
  const types = [...new Set(custs.map((c) => str(c.custtype)).filter(Boolean))].sort();
  const reqs = await ctx.db.all('qryreqttbl', { where: { reqtype: REQ_TYPE }, orderBy: [['transdate', 'desc'], ['docno', 'desc']], limit: 60 });
  return {
    customers: custs.map((c) => ({ custno: c.custno, bussname: c.bussname, smnno: str(c.smnno), areano: str(c.areano), custtype: str(c.custtype), status: str(c.status) || 'Active' })),
    salesmen: smn.map((s) => ({ value: s.smnno, label: `${s.fullname} (${s.smnno})` })),
    areas: areas.map((a) => ({ value: a.areano, label: `${a.areaname} (${a.areano})` })),
    types: types.length ? types : ['Dealer', 'Distributor', 'Retail', 'Institutional'],
    requests: reqs.map((r) => ({ docno: r.docno, transdate: r.transdate, reqname: r.reqname, type1: str(r.type1), type2: str(r.type2), remarks: str(r.remarks), stat: str(r.stat), user: str(r.user), custno: /Customer no\. (\S+)/.exec(str(r.remarks))?.[1] ?? '' })),
    can: {
      edit: await isAllowed(ctx.db, ctx.group, FORM.CUSTOMER, ACTION.EDIT),
      add: await isAllowed(ctx.db, ctx.group, FORM.CUSTOMER, ACTION.INSERT),
      request: (await isAllowed(ctx.db, ctx.group, FORM.CUSTOMER, ACTION.VIEW)) || (await isAllowed(ctx.db, ctx.group, FORM.SALESMAN, ACTION.INSERT)),
    },
  };
}

// ---------------------------------------------------------------------------
// Excel / paste update
// ---------------------------------------------------------------------------
export interface BulkRow {
  custno: string;
  custtype?: string;
  areano?: string;
  smnno?: string;
}

/** Checks a pasted list and says what will change, without saving. */
export async function previewBulkUpdate(ctx: Ctx, rows: BulkRow[], defaults: Omit<BulkRow, 'custno'>) {
  await requireRight(ctx, FORM.CUSTOMER, ACTION.EDIT, 'update customers');
  if (!rows?.length) fail('Paste at least one customer number.');
  if (rows.length > 2000) fail('Update at most 2,000 customers at a time.');
  const [custs, smn, areas] = await Promise.all([ctx.db.all('custmasttbl'), ctx.db.all('smnmtbl'), ctx.db.all('areatbl')]);
  return rows.map((r, i) => {
    const custno = str(r.custno).toUpperCase();
    const c = custs.find((x) => String(x.custno).toUpperCase() === custno);
    const want = { custtype: str(r.custtype) || str(defaults.custtype), areano: str(r.areano) || str(defaults.areano), smnno: str(r.smnno) || str(defaults.smnno) };
    const problems: string[] = [];
    if (!c) problems.push('customer not found');
    if (want.smnno && !smn.some((s) => s.smnno === want.smnno)) problems.push(`salesman ${want.smnno} not found`);
    if (want.areano && !areas.some((a) => a.areano === want.areano)) problems.push(`area ${want.areano} not found`);
    const changes = c ? (Object.entries(want) as [string, string][]).filter(([k, v]) => v && str(c[k]) !== v).map(([k, v]) => ({ field: k, from: str(c[k]), to: v })) : [];
    if (c && !changes.length && !problems.length) problems.push('nothing to change');
    return { line: i + 1, custno: c?.custno ?? custno, bussname: c?.bussname ?? '', changes, problem: problems.join('; '), ok: Boolean(c) && changes.length > 0 && problems.length === 0 };
  });
}

export async function applyBulkUpdate(ctx: Ctx, rows: BulkRow[], defaults: Omit<BulkRow, 'custno'>): Promise<string> {
  const preview = await previewBulkUpdate(ctx, rows, defaults);
  const good = preview.filter((p) => p.ok);
  if (!good.length) fail('Nothing to update. Fix the lines marked in red first.');
  return ctx.db.tx(async (db) => {
    for (const p of good) {
      await keepHistory(db, p.custno, ctx.user, 'Excel upload');
      await db.update('custmasttbl', { custno: p.custno }, { ...Object.fromEntries(p.changes.map((c) => [c.field, c.to])), updateby: ctx.user, datechange: nowStamp() });
    }
    await audit({ ...ctx, db }, { form: FORM.CUSTOMER, docno: 'BULK', trans: `Updated ${good.length} customer(s) from an Excel list`, table: 'custmasttbl', after: { customers: good.map((g) => g.custno), defaults } });
    const skipped = preview.length - good.length;
    return `${good.length} customer(s) updated.${skipped ? ` ${skipped} line(s) skipped.` : ''}`;
  });
}

// ---------------------------------------------------------------------------
// Salesman transfer
// ---------------------------------------------------------------------------
export async function transferCustomers(ctx: Ctx, input: { from?: unknown; to?: unknown; custnos?: unknown; area?: unknown }): Promise<string> {
  await requireRight(ctx, FORM.CUSTOMER, ACTION.EDIT, 'transfer customers');
  const from = need(str(input.from), 'Choose the salesman the customers come from.');
  const to = need(str(input.to), 'Choose the salesman taking over.');
  if (from === to) fail('Choose two different salesmen.');
  const toSmn = await ctx.db.one('smnmtbl', { smnno: to });
  if (!toSmn) fail(`Salesman ${to} does not exist.`);
  const custnos = ((input.custnos as unknown[]) ?? []).map((x) => str(x)).filter(Boolean);
  if (!custnos.length) fail('Tick the customers to transfer.');
  return ctx.db.tx(async (db) => {
    let n = 0;
    for (const custno of custnos) {
      const c = await db.one('custmasttbl', { custno });
      if (!c) fail(`Customer ${custno} does not exist.`);
      if (str(c.smnno) !== from) fail(`${c.bussname} is no longer with salesman ${from}.`);
      await keepHistory(db, custno, ctx.user, `Transfer ${from} to ${to}`);
      await db.update('custmasttbl', { custno }, { smnno: to, ...(input.area ? { areano: str(toSmn.areano) || c.areano } : {}), updateby: ctx.user, datechange: nowStamp() });
      n += 1;
    }
    await audit({ ...ctx, db }, { form: FORM.CUSTOMER, docno: to, trans: `Transfer ${n} customer(s) from ${from} to ${to}`, table: 'custmasttbl', after: { custnos } });
    return `${n} customer(s) transferred to ${toSmn.fullname}. Open orders keep their original salesman.`;
  });
}

// ---------------------------------------------------------------------------
// Customer-number requests (qryreqttbl)
// ---------------------------------------------------------------------------
export async function requestCustomer(ctx: Ctx, input: Row): Promise<string> {
  const ok = (await isAllowed(ctx.db, ctx.group, FORM.CUSTOMER, ACTION.VIEW)) || (await isAllowed(ctx.db, ctx.group, FORM.SALESMAN, ACTION.INSERT));
  if (!ok) fail('Your user group cannot request customer numbers.', 403);
  const reqname = need(str(input.reqname), 'Enter the business name of the new customer.').toUpperCase();
  const custs = await ctx.db.all('custmasttbl');
  const same = custs.find((c) => String(c.bussname).toUpperCase() === reqname);
  if (same) fail(`${same.bussname} already exists as customer ${same.custno}.`);
  const pending = await ctx.db.one('qryreqttbl', { reqtype: REQ_TYPE, reqname, stat: 'Requested' });
  if (pending) fail(`A request for ${reqname} is already waiting (${pending.docno}).`);
  const docno = await nextDocNo(ctx.db, 'qryreqttbl', 'docno', yearPrefix('CRQ'));
  await ctx.db.insert('qryreqttbl', { docno, transdate: today(), reqtype: REQ_TYPE, reqname, type1: str(input.type1), type2: str(input.type2), remarks: str(input.remarks), branch: 'MAIN', user: ctx.user, createdby: ctx.user, datecreated: nowStamp(), stat: 'Requested' });
  return `Request ${docno} sent. Customers will create the account and you will see its number here.`;
}

export async function decideCustomerRequest(ctx: Ctx, input: { docno?: unknown; approve?: unknown; note?: unknown; row?: unknown }): Promise<string> {
  const docno = need(str(input.docno), 'Choose the request.');
  const q = await ctx.db.one('qryreqttbl', { docno, reqtype: REQ_TYPE });
  if (!q) fail(`Request ${docno} was not found.`);
  if (q.stat !== 'Requested') fail(`Request ${docno} is already ${String(q.stat).toLowerCase()}.`);
  if (!input.approve) {
    await requireRight(ctx, FORM.CUSTOMER, ACTION.EDIT, 'reject customer requests');
    const note = need(str(input.note), 'Give the reason for rejecting the request.');
    await ctx.db.update('qryreqttbl', { docno }, { stat: 'Rejected', remarks: `${str(q.remarks)}${q.remarks ? ' · ' : ''}Rejected by ${ctx.user}: ${note}` });
    return `Request ${docno} rejected.`;
  }
  await requireRight(ctx, FORM.CUSTOMER, ACTION.INSERT, 'create customers');
  const row = { bussname: q.reqname, ...((input.row as Row) ?? {}) };
  const { key } = await saveMaster(ctx, 'customers', row, true);
  await ctx.db.update('qryreqttbl', { docno }, { stat: 'Done', remarks: `${str(q.remarks)}${q.remarks ? ' · ' : ''}Customer no. ${key} created by ${ctx.user}` });
  return `Customer ${key} created for ${q.reqname}.`;
}
