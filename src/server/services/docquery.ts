// Document Query (legacy DocQuery.aspx, checked against form 052): find any document, see its
// ledger entries and correction history, and make controlled corrections. The legacy page
// rewrote dates, customers, vendors, plants and movements of posted documents directly;
// Cloud AOS keeps the corrections that cannot break stock or the ledger, each with a check:
//   date            both dates in open periods, no ledger line of the document posted yet
//   reference       remarks / supplier invoice no. / customer PO
//   salesman        invoices, sales orders and receipts (reporting only)
//   customer        sales invoice with nothing paid or applied (and its delivery)
//   vendor          receiving report not yet billed on a voucher payable
// Every correction is written to updatetbl (legacy log) and ng_audit_log.
import type { Db, Row } from '../db';
import { ACTION, FORM, TC } from '@/shared/codes';
import { nowStamp, today, ym } from '@/shared/dates';
import { Ctx, assertOpenPeriod, audit, fail, isAllowed, need, num, requireRight, str } from './context';
import { docService } from './docs';
import { findDocuments } from './admin';
import { invoiceBalance } from './receivables';

type Field = 'transdate' | 'remarks' | 'refdoc' | 'pono' | 'smnno' | 'custno' | 'venno';

const DETAIL: Record<string, [string, string]> = {
  exphdrtbl: ['expdettbl', 'docno'],
  cvhdrtbl: ['cvdettbl', 'docno'],
  invhdrtbl: ['invdettbl', 'mmrrno'],
  isshdrtbl: ['issdettbl', 'dono'],
  saleshdrtbl: ['salesdettbl', 'invno'],
};
const SHARED_TC_TABLES = new Set(['exphdrtbl', 'colhdrtbl', 'saleshdrtbl']);

export async function queryDocuments(ctx: Ctx, q: string) {
  await requireRight(ctx, FORM.GL_REPORTS, ACTION.VIEW, 'use Document Query');
  return findDocuments(ctx, q);
}

async function load(ctx: Ctx, type: string, no: string) {
  const svc = docService(type);
  const doc = await svc.load(ctx, no);
  if (!doc) fail(`${svc.title} ${no} was not found.`);
  return { svc, h: doc.h, lines: doc.lines };
}

function keyOf(svc: ReturnType<typeof docService>, h: Row, no: string): Row {
  return { [svc.noColumn]: no, ...(SHARED_TC_TABLES.has(svc.table) && h.tc ? { tc: h.tc } : {}) };
}

async function glOf(db: Db, svc: ReturnType<typeof docService>, h: Row, no: string): Promise<Row[]> {
  const tc = str(h.tc) || svc.tc;
  return (await db.all('gltranstbl', { where: { docno: no, ...(tc ? { tc } : {}) }, orderBy: [['transdate', 'asc']] })).filter((g) => String(g.glstatus).toUpperCase() !== 'VOID');
}

/** What can be corrected on a document, and why not when it cannot. */
export async function correctionInfo(ctx: Ctx, type: string, no: string) {
  await requireRight(ctx, FORM.GL_REPORTS, ACTION.VIEW, 'use Document Query');
  const { svc, h } = await load(ctx, type, no);
  const canEdit = await isAllowed(ctx.db, ctx.group, svc.form, ACTION.EDIT);
  const gl = await glOf(ctx.db, svc, h, no);
  const posted = gl.some((g) => String(g.glstatus).toUpperCase() === 'POSTED');
  const status = str(h.status);
  const voided = status.toLowerCase() === 'void';
  const fields: { field: Field; label: string; value: string; allowed: boolean; why?: string; kind: 'date' | 'text' | 'customer' | 'vendor' | 'salesman' }[] = [];
  const no_ = (why: string) => ({ allowed: false, why });
  const ok = { allowed: true };
  const gate = (extra?: string) => (!canEdit ? no_(`Needs the Edit right on ${svc.title} (form ${svc.form}).`) : voided ? no_('The document is void.') : extra ? no_(extra) : ok);

  if (h.transdate !== undefined) fields.push({ field: 'transdate', label: 'Document date', value: str(h.transdate), kind: 'date', ...gate(posted ? 'Its ledger entries are already posted by JV Posting; correct the ledger with a journal voucher.' : undefined) });
  fields.push({ field: 'remarks', label: 'Remarks', value: str(h.remarks), kind: 'text', ...gate() });
  if (svc.table === 'exphdrtbl' && h.tc === TC.VOUCHER_PAYABLE) fields.push({ field: 'refdoc', label: "Supplier's invoice no.", value: str(h.refdoc), kind: 'text', ...gate() });
  if (svc.table === 'sohdrtbl') fields.push({ field: 'pono', label: "Customer's PO no.", value: str(h.pono), kind: 'text', ...gate() });
  if (['saleshdrtbl', 'sohdrtbl', 'colhdrtbl'].includes(svc.table)) fields.push({ field: 'smnno', label: 'Salesman', value: str(h.smnno), kind: 'salesman', ...gate() });
  if (svc.table === 'saleshdrtbl') {
    const b = status === 'Posted' ? await invoiceBalance(ctx.db, h) : null;
    fields.push({ field: 'custno', label: 'Customer', value: str(h.custno), kind: 'customer', ...gate(b && Math.abs(b.balance - num(h.netamt)) > 0.009 ? 'Payments or memos are already applied to this invoice.' : undefined) });
  }
  if (svc.table === 'invhdrtbl' && h.tc === TC.RECEIVING) {
    const vp = await ctx.db.one('exphdrtbl', { mmrrno: no, tc: TC.VOUCHER_PAYABLE, status: { ne: 'Void' } });
    fields.push({ field: 'venno', label: 'Vendor', value: str(h.venno), kind: 'vendor', ...gate(vp ? `Already billed on voucher payable ${vp.docno}.` : undefined) });
  }
  const history = (await ctx.db.all('updatetbl', { where: { docno: no }, orderBy: [['dateupdate', 'desc']] })).map((u) => ({ when: str(u.dateupdate), user: str(u.user), what: str(u.remarks) }));
  return {
    type,
    title: svc.title,
    no,
    status,
    form: svc.form,
    tc: str(h.tc) || svc.tc || '',
    header: { transdate: h.transdate, party: h.bussname ?? h.custno ?? h.venno ?? h.payeename ?? '', amount: num(h.netamt ?? h.docamt ?? h.colamt ?? h.soamt ?? 0) },
    fields,
    gl: gl.map((g) => ({ acctno: g.acctno, ccno: g.ccno, pc: g.pc, dramt: num(g.dramt), cramt: num(g.cramt), transdate: g.transdate, glstatus: g.glstatus, jvno: g.jvno })),
    history,
  };
}

export async function applyCorrection(ctx: Ctx, input: { type?: unknown; no?: unknown; field?: unknown; value?: unknown; reason?: unknown }): Promise<string> {
  const type = need(str(input.type), 'Choose the document.');
  const no = need(str(input.no), 'Choose the document.');
  const field = need(str(input.field), 'Choose what to correct.') as Field;
  const value = str(input.value);
  const reason = need(str(input.reason), 'Give the reason for the correction.');
  const info = await correctionInfo(ctx, type, no);
  const f = info.fields.find((x) => x.field === field);
  if (!f) fail('That correction is not available for this document.');
  if (!f.allowed) fail(f.why ?? 'This correction is not allowed.');
  if (value === f.value) fail('The new value is the same as the current one.');
  const { svc, h } = await load(ctx, type, no);
  const key = keyOf(svc, h, no);

  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    if (field === 'transdate') {
      need(value, 'Enter the new date.');
      if (value > today()) fail('The new date is in the future.');
      const tc = info.tc || undefined;
      await assertOpenPeriod(db, f.value, tc);
      await assertOpenPeriod(db, value, tc);
      const { transyear, transmon } = ym(value);
      const patch: Row = { transdate: value };
      if (h.transyear !== undefined) Object.assign(patch, { transyear, transmon });
      await db.update(svc.table, key, patch);
      const det = DETAIL[svc.table];
      if (det) {
        const rows = await db.all(det[0], { where: { [det[1]]: no } });
        if (rows.some((r) => r.transdate !== undefined)) await db.update(det[0], { [det[1]]: no, ...(det[0] === 'expdettbl' && h.tc ? { tc: h.tc } : {}) }, rows[0].transyear !== undefined ? { transdate: value, transyear, transmon } : { transdate: value });
      }
      await db.update('gltranstbl', { docno: no, ...(info.tc ? { tc: info.tc } : {}), glstatus: 'OPEN' }, { transdate: value, transyear, transmon });
    } else if (field === 'smnno') {
      if (!(await db.one('smnmtbl', { smnno: value }))) fail(`Salesman ${value} does not exist.`);
      await db.update(svc.table, key, { smnno: value });
    } else if (field === 'custno') {
      const cust = await db.one('custmasttbl', { custno: value });
      if (!cust) fail(`Customer ${value} does not exist.`);
      await db.update(svc.table, key, { custno: value, shipto: str(cust.address) });
      if (h.dono) await db.update('isshdrtbl', { dono: h.dono }, { custno: value, shipto: str(cust.address) });
    } else if (field === 'venno') {
      if (!(await db.one('venmasttbl', { venno: value }))) fail(`Vendor ${value} does not exist.`);
      await db.update(svc.table, key, { venno: value });
    } else {
      await db.update(svc.table, key, { [field]: value });
    }
    await db.insert('updatetbl', { docno: no, tc: info.tc || '00', user: ctx.user, dateupdate: nowStamp(), refdoc: field, update_dateonly: today(), remarks: `${f.label}: ${f.value || 'blank'} -> ${value || 'blank'}. ${reason}`, origname: f.value, web: 'Y' });
    await audit(c, { form: svc.form, tc: info.tc || undefined, docno: no, trans: `Document Query: ${f.label} corrected`, table: svc.table, before: { [field]: f.value }, after: { [field]: value, reason } });
    return `${f.label} of ${info.title} ${no} corrected.`;
  });
}
