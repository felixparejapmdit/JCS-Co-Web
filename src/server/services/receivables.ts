import type { Db, Row } from '../db';
import { ACTION, FORM, INVOICE_TCS, TC } from '@/shared/codes';
import { addDays, daysBetween, today } from '@/shared/dates';
import { fmtPeso, r2, sum } from '@/shared/money';
import { OpenInvoice } from '@/shared/collections';
import { Ctx, assertOpenPeriod, audit, fail, need, nextDocNo, num, numberLines, requireRight, str, yearPrefix } from './context';
import { ActionDef, DocService, Loaded, STD, countBy, filterList, registerDoc } from './docs';
import { GL, GlEntry, reverseGl, writeGl } from './gl';

// ===========================================================================
// Invoice balances: invoice amount - payments (cash + EWT) - credit memos + debit memos
// ===========================================================================
export async function invoiceBalance(db: Db, inv: Row): Promise<{ balance: number; paid: number; ewt: number; memos: number; receipts: string[] }> {
  // Only issued (posted) receipts reduce the balance; drafts are re-checked when they are posted.
  const col = await db.all('coldettbl', { where: { invno: inv.invno, status: 'Posted' } });
  const paid = sum(col, (c) => num(c.oramt));
  const ewt = sum(col, (c) => num(c.ewt));
  const memoLines = await db.all('custdmcmdettbl', { where: { invno: inv.invno } });
  let memos = 0;
  for (const m of memoLines) {
    const h = await db.one('custdmcmhdrtbl', { dmcmno: m.dmcmno });
    if (!h || h.status !== 'Approved') continue;
    memos = r2(memos + (h.tc === TC.CREDIT_MEMO ? -num(m.amt) : num(m.amt)));
  }
  const balance = r2(num(inv.netamt) - paid - ewt + memos);
  return { balance, paid, ewt, memos, receipts: [...new Set(col.map((c) => String(c.orno)))] };
}

export async function openInvoices(db: Db, custno?: string): Promise<(OpenInvoice & Row)[]> {
  const where: Row = { tc: { in: INVOICE_TCS }, status: 'Posted' };
  if (custno) where.custno = custno;
  const heads = await db.all('saleshdrtbl', { where, orderBy: [['transdate', 'asc']] });
  const custs = await db.all('custmasttbl');
  const out: (OpenInvoice & Row)[] = [];
  for (const h of heads) {
    const b = await invoiceBalance(db, h);
    if (b.balance <= 0.004) continue;
    const c = custs.find((x) => x.custno === h.custno);
    const duedate = addDays(h.transdate, num(c?.term));
    out.push({ invno: h.invno, custno: h.custno, bussname: c?.bussname ?? h.custno, transdate: h.transdate, duedate, netamt: num(h.netamt), balance: b.balance, vatable: num(h.vat) > 0, daysOverdue: Math.max(0, daysBetween(duedate, today())), pc: h.pc });
  }
  return out;
}

export async function customerExposure(db: Db, custno: string, excludeSono?: string) {
  const inv = await openInvoices(db, custno);
  const openAr = sum(inv, (i) => i.balance);
  const overdue = sum(inv.filter((i) => i.daysOverdue > 0), (i) => i.balance);
  const sos = await db.all('sohdrtbl', { where: { custno, status: 'Approved', delstat: { in: ['Undelivered', 'Partial'] } } });
  let openOrders = 0;
  for (const s of sos) {
    if (s.sono === excludeSono) continue;
    const lines = await db.all('sodettbl', { where: { sono: s.sono } });
    openOrders += lines.reduce((t, l) => t + (num(l.qty) > 0 ? (num(l.netamt) * (num(l.qty) - num(l.issqty))) / num(l.qty) : 0), 0);
  }
  // Delivered but not yet invoiced goods also use up credit.
  const dos = await db.all('isshdrtbl', { where: { custno, status: 'Posted', mov: '201', invno: { isNull: true } } });
  for (const d of dos) for (const l of await db.all('issdettbl', { where: { dono: d.dono } })) openOrders += num(l.itmamt);
  return { openAr, overdue, openOrders: r2(openOrders) };
}

// ===========================================================================
// Collections / official receipts (Collection.aspx form 010, tc 60)
// ===========================================================================
async function customer(db: Db, custno: string): Promise<Row> {
  const c = await db.one('custmasttbl', { custno });
  if (!c) fail(`Customer ${custno} does not exist.`);
  return c;
}

const orService: DocService = {
  type: 'or',
  title: 'Official Receipt',
  form: FORM.COLLECTION,
  tc: TC.COLLECTION,
  table: 'colhdrtbl',
  noColumn: 'orno',

  async list(ctx, params) {
    const heads = await ctx.db.all('colhdrtbl', { where: { tc: TC.COLLECTION }, orderBy: [['transdate', 'desc'], ['orno', 'desc']] });
    const rows = heads.map((h) => ({ ...h, no: h.orno, party: h.bussname, amount: num(h.colamt) }));
    return { rows: filterList(rows, params, ['orno', 'party', 'chno', 'remarks', 'coltype', 'cdcrno']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('colhdrtbl', { orno: no, tc: TC.COLLECTION });
    if (!h) return null;
    // Lines of a voided deposit application no longer belong to the receipt.
    const lines = (await ctx.db.all('coldettbl', { where: { orno: no }, orderBy: [['itemno', 'asc']] })).filter((l) => !(l.depapp && l.status === 'Void'));
    return { h, lines };
  },

  async view(ctx, { h, lines }) {
    const applied = sum(lines, (l) => num(l.oramt));
    const ewt = sum(lines, (l) => num(l.ewt));
    const isPdc = h.coltype === 'Check' && h.pdate && h.pdate > h.transdate;
    return {
      no: h.orno,
      status: h.status,
      title: `Official Receipt ${h.orno}`,
      subtitle: `${h.bussname} · ${h.coltype}${h.chno ? ' ' + h.bank + ' #' + h.chno : ''}`,
      header: h,
      lines,
      totals: [
        { label: 'Amount received', value: num(h.colamt), strong: true },
        { label: 'Applied to invoices', value: applied },
        { label: 'Tax withheld (2307)', value: ewt },
        { label: 'Unapplied (customer deposit)', value: r2(num(h.colamt) - applied) },
      ],
      info: [
        { label: 'Tender', value: isPdc ? `Post-dated cheque, dated ${h.pdate}` : h.coltype },
        { label: 'CDCR', value: h.cdcrno ? `${h.cdcrno} (${h.cdcrstat})` : 'Not yet in a daily collection report' },
      ],
      links: [...lines.map((l) => ({ label: `Invoice ${l.invno}`, type: 'si', no: l.invno })), ...[...new Set(lines.filter((l) => l.depapp).map((l) => String(l.depapp)))].map((d) => ({ label: `Deposit application ${d}`, type: 'da', no: d }))],
      editable: h.status === 'Open',
      print: { kind: 'or' },
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open') defs.push({ ...STD.post(undefined, 'Issue receipt'), hint: 'Books the payment, reduces the invoice balances and records the 2307 tax credit.' }, STD.void());
    if (h.status === 'Posted' && (!h.cdcrno || h.cdcrstat === 'Open')) defs.push(STD.void('Reverses the payment and reopens the invoices.'));
    return defs;
  },

  async perform(ctx, { h, lines }, action) {
    if (action === 'post') {
      await assertOpenPeriod(ctx.db, h.transdate, TC.COLLECTION);
      for (const l of lines) {
        const inv = await ctx.db.one('saleshdrtbl', { invno: l.invno, tc: { in: INVOICE_TCS } });
        if (!inv || inv.status !== 'Posted') fail(`Invoice ${l.invno} is not posted.`);
        const b = await invoiceBalance(ctx.db, inv);
        // The receipt's own lines are not counted yet while it is Open, so the full settlement must fit.
        if (num(l.oramt) + num(l.ewt) > b.balance + 0.009) fail(`Invoice ${l.invno} only has ${fmtPeso(b.balance)} outstanding.`);
      }
      const applied = sum(lines, (l) => num(l.oramt));
      const ewt = sum(lines, (l) => num(l.ewt));
      const unapplied = r2(num(h.colamt) - applied);
      const isPdc = h.coltype === 'Check' && h.pdate && h.pdate > h.transdate;
      const entries: GlEntry[] = [{ acctno: isPdc ? GL.PDC_ON_HAND : GL.CASH_ON_HAND, dramt: num(h.colamt) }];
      if (ewt) entries.push({ acctno: GL.CWT_RECEIVABLE, dramt: ewt });
      for (const l of lines) {
        const inv = await ctx.db.one('saleshdrtbl', { invno: l.invno, tc: { in: INVOICE_TCS } });
        const pc = inv?.pc ? await ctx.db.one('pctrtbl', { pc: inv.pc }) : null;
        entries.push({ acctno: str(pc?.aracctno) || GL.AR_TRADE, pc: inv?.pc, cramt: r2(num(l.oramt) + num(l.ewt)) });
      }
      if (unapplied > 0) entries.push({ acctno: GL.CUSTOMER_DEPOSITS, cramt: unapplied });
      await writeGl(ctx, { tc: TC.COLLECTION, docno: h.orno, transdate: h.transdate, source: 'OR' }, entries);
      await ctx.db.update('colhdrtbl', { orno: h.orno, tc: TC.COLLECTION }, { status: 'Posted', cdcrstat: 'Open', valstat: 'Valid' });
      await ctx.db.update('coldettbl', { orno: h.orno }, { status: 'Posted' });
      return `Receipt ${h.orno} issued for ${fmtPeso(num(h.colamt))}.${unapplied > 0 ? ` ${fmtPeso(unapplied)} is kept as a customer deposit.` : ''}`;
    }
    if (action === 'void') {
      const applied = lines.find((l) => l.depapp && l.status !== 'Void');
      if (applied) fail(`Part of this receipt was applied in deposit application ${applied.depapp}. Void that application first.`);
      if (h.status === 'Posted') await reverseGl(ctx, TC.COLLECTION, h.orno, today());
      await ctx.db.update('colhdrtbl', { orno: h.orno, tc: TC.COLLECTION }, { status: 'Void', valstat: 'Void' });
      await ctx.db.update('coldettbl', { orno: h.orno }, { status: 'Void' });
      return `Receipt ${h.orno} voided.`;
    }
    fail('Unknown action');
  },

  async defaults() {
    return { transdate: today(), coltype: 'Check', lines: [] };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the receipt date.');
    await assertOpenPeriod(ctx.db, transdate, TC.COLLECTION);
    const c = await customer(ctx.db, need(str(input.custno), 'Choose the customer.'));
    const coltype = need(str(input.coltype), 'Choose how the customer paid.');
    if (!['Cash', 'Check', 'Online'].includes(coltype)) fail('Payment type must be Cash, Check or Online.');
    const colamt = r2(num(input.colamt));
    if (colamt <= 0) fail('Enter the amount received.');
    if (coltype === 'Check') {
      need(str(input.bank), 'Enter the issuing bank of the cheque.');
      need(str(input.chno), 'Enter the cheque number.');
    }
    const pdate = coltype === 'Check' ? str(input.pdate) || transdate : '';
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.invno) && (num(l.oramt) || num(l.ewt)));
    const open = await openInvoices(ctx.db, c.custno);
    const lines: Row[] = [];
    for (const [i, l] of raw.entries()) {
      const inv = open.find((x) => x.invno === str(l.invno));
      if (!inv) fail(`Line ${i + 1}: invoice ${l.invno} is not open for ${c.bussname}.`);
      const oramt = r2(num(l.oramt));
      const ewt = r2(num(l.ewt));
      if (oramt < 0 || ewt < 0) fail(`Line ${i + 1}: amounts cannot be negative.`);
      if (oramt + ewt > inv.balance + 0.009) fail(`Line ${i + 1}: invoice ${inv.invno} only has ${fmtPeso(inv.balance)} outstanding.`);
      if (ewt > r2(oramt + ewt) * 0.16) fail(`Line ${i + 1}: the tax withheld looks too high for invoice ${inv.invno}.`);
      lines.push({ invno: inv.invno, origamt: inv.netamt, oramt, ewt, netcolamt: oramt, ewtform: ewt > 0 ? 'N' : '', pdc: pdate > transdate ? 'Y' : 'N', custno: c.custno, pc: inv.pc, tc: TC.COLLECTION, status: 'Open', user: ctx.user, web: 'Y', coltype });
    }
    const applied = sum(lines, (l) => l.oramt);
    if (applied > colamt + 0.009) fail(`You applied ${fmtPeso(applied)} but only ${fmtPeso(colamt)} was received.`);
    let orno = str(input.no);
    const header = {
      tc: TC.COLLECTION,
      transdate,
      coldate: transdate,
      custno: c.custno,
      bussname: c.bussname,
      smnno: c.smnno,
      areano: c.areano,
      term: c.term,
      coltype,
      bank: str(input.bank),
      chno: str(input.chno),
      pdate,
      cheqstat: coltype === 'Check' ? (pdate > transdate ? 'PDC' : 'Current') : '',
      colamt,
      ewtrem: str(input.ewtrem),
      remarks: str(input.remarks),
      status: 'Open',
      cdcrstat: '',
      user: ctx.user,
      headcash: ctx.user,
      branch: 'MAIN',
      web: 'Y',
      doctype: 'OR',
    };
    if (orno) {
      const h = await ctx.db.one('colhdrtbl', { orno, tc: TC.COLLECTION });
      if (!h) fail(`Receipt ${orno} was not found.`);
      if (h.status !== 'Open') fail(`Receipt ${orno} is ${h.status} and can no longer be edited.`);
      await ctx.db.update('colhdrtbl', { orno, tc: TC.COLLECTION }, header);
      await ctx.db.remove('coldettbl', { orno });
    } else {
      orno = str(input.orno) || (await nextDocNo(ctx.db, 'colhdrtbl', 'orno', yearPrefix('OR', transdate)));
      if (await ctx.db.one('colhdrtbl', { orno })) fail(`Receipt number ${orno} is already used.`);
      await ctx.db.insert('colhdrtbl', { orno, docno: orno, ...header });
    }
    for (const l of numberLines(lines)) await ctx.db.insert('coldettbl', { orno, docno: orno, ...l, transid: `${orno}-${l.itemno}` });
    return { no: orno };
  },
};
registerDoc(orService);

// ===========================================================================
// Cashier's daily collection report (CDCR.aspx) and bank deposits (BankDep.aspx), form 011
// ===========================================================================
export async function cdcrCandidates(ctx: Ctx, asOf: string) {
  const cols = await ctx.db.all('colhdrtbl', { where: { tc: TC.COLLECTION, status: 'Posted', transdate: { lte: asOf } }, orderBy: [['transdate', 'asc']] });
  return cols
    .filter((c) => !c.cdcrno)
    .map((c) => ({ orno: c.orno, transdate: c.transdate, bussname: c.bussname, coltype: c.coltype, bank: c.bank, chno: c.chno, pdate: c.pdate, colamt: num(c.colamt), pdcHeld: c.coltype === 'Check' && c.pdate > asOf }));
}

export async function generateCdcr(ctx: Ctx, asOf: string): Promise<{ cdcrno: string; message: string }> {
  await requireRight(ctx, FORM.CDCR, ACTION.INSERT, 'prepare a daily collection report');
  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    const items = (await cdcrCandidates(c, asOf)).filter((x) => !x.pdcHeld);
    if (!items.length) fail('There are no new collections to include. Post-dated cheques stay out until their date.');
    const held = (await cdcrCandidates(c, asOf)).filter((x) => x.pdcHeld);
    const cdcrno = await nextDocNo(db, 'cdcrtbl', 'cdcrno', yearPrefix('CDCR', asOf));
    const cash = sum(items.filter((i) => i.coltype === 'Cash'), (i) => i.colamt);
    const check = sum(items.filter((i) => i.coltype === 'Check'), (i) => i.colamt);
    const online = sum(items.filter((i) => i.coltype === 'Online'), (i) => i.colamt);
    await db.insert('cdcrtbl', { cdcrno, transdate: asOf, cashamt: cash, checkamt: check, onlineamt: online, pdcamt: sum(held, (i) => i.colamt), status: 'Open', headcash: ctx.user, user: ctx.user, remarks: `${items.length} receipt(s)`, branch: 'MAIN', web: 'Y' });
    for (const i of items) await db.update('colhdrtbl', { orno: i.orno, tc: TC.COLLECTION }, { cdcrno, cdcrstat: 'In CDCR' });
    await audit(c, { form: FORM.CDCR, docno: cdcrno, trans: `Prepare CDCR (${items.length} receipts)`, table: 'cdcrtbl' });
    return { cdcrno, message: `CDCR ${cdcrno} prepared: cash ${fmtPeso(cash)}, cheques ${fmtPeso(check)}, online ${fmtPeso(online)}.` };
  });
}

export async function listCdcr(ctx: Ctx) {
  await requireRight(ctx, FORM.CDCR, ACTION.VIEW, 'view daily collection reports');
  const rows = await ctx.db.all('cdcrtbl', { orderBy: [['transdate', 'desc'], ['cdcrno', 'desc']] });
  const out: Row[] = [];
  for (const r of rows) {
    const items = await ctx.db.all('colhdrtbl', { where: { cdcrno: r.cdcrno } });
    out.push({ ...r, total: r2(num(r.cashamt) + num(r.checkamt) + num(r.onlineamt)), receipts: items.map((i) => ({ orno: i.orno, bussname: i.bussname, coltype: i.coltype, chno: i.chno, bank: i.bank, colamt: num(i.colamt) })) });
  }
  return out;
}

export async function createDeposit(ctx: Ctx, input: { cdcrnos: string[]; acctno: string; transdate: string }): Promise<{ depno: string; message: string }> {
  await requireRight(ctx, FORM.CDCR, ACTION.RELEASE, 'record bank deposits');
  if (!input.cdcrnos?.length) fail('Select the CDCRs to deposit.');
  const bank = await ctx.db.one('banktbl', { acctno: input.acctno });
  if (!bank) fail('Choose the bank account the money was deposited to.');
  await assertOpenPeriod(ctx.db, input.transdate);
  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    const depno = await nextDocNo(db, 'bankdephdrtbl', 'depno', yearPrefix('DEP', input.transdate));
    await db.insert('bankdephdrtbl', { depno, transdate: input.transdate });
    let total = 0;
    for (const no of input.cdcrnos) {
      const r = await db.one('cdcrtbl', { cdcrno: no });
      if (!r) fail(`CDCR ${no} was not found.`);
      if (r.status !== 'Open') fail(`CDCR ${no} is already ${r.status}.`);
      const amt = r2(num(r.cashamt) + num(r.checkamt) + num(r.onlineamt));
      total = r2(total + amt);
      await db.insert('bankdepdettbl', { depno, cdcrno: no, cashamt: num(r.cashamt), checkamt: r2(num(r.checkamt) + num(r.onlineamt)), acctno: input.acctno, transid: `${depno}-${no}` });
      await db.update('cdcrtbl', { cdcrno: no }, { status: 'Deposited', depno });
      await db.update('colhdrtbl', { cdcrno: no }, { cdcrstat: 'Deposited' });
    }
    await writeGl(c, { tc: TC.BANK_DEPOSIT, docno: depno, transdate: input.transdate, source: 'DEPOSIT' }, [
      { acctno: input.acctno, dramt: total },
      { acctno: GL.CASH_ON_HAND, cramt: total },
    ]);
    await audit(c, { form: FORM.CDCR, docno: depno, trans: `Bank deposit to ${bank.bankname}`, table: 'bankdephdrtbl' });
    return { depno, message: `Deposit ${depno} of ${fmtPeso(total)} to ${bank.bankname} recorded.` };
  });
}

export async function listDeposits(ctx: Ctx) {
  await requireRight(ctx, FORM.CDCR, ACTION.VIEW, 'view deposits');
  const heads = await ctx.db.all('bankdephdrtbl', { orderBy: [['transdate', 'desc'], ['depno', 'desc']] });
  const banks = await ctx.db.all('banktbl');
  const out: Row[] = [];
  for (const h of heads) {
    const d = await ctx.db.all('bankdepdettbl', { where: { depno: h.depno } });
    out.push({ ...h, cdcrs: d.map((x) => x.cdcrno), bank: banks.find((b) => b.acctno === d[0]?.acctno)?.bankname ?? d[0]?.acctno, total: sum(d, (x) => num(x.cashamt) + num(x.checkamt)) });
  }
  return out;
}

// ===========================================================================
// Customer credit / debit memos (CustDMCM.aspx, forms 070 / 013, tc 90 / 92)
// ===========================================================================
function memoService(kind: 'cm' | 'dm'): DocService {
  const isCm = kind === 'cm';
  const tc = isCm ? TC.CREDIT_MEMO : TC.DEBIT_MEMO;
  const title = isCm ? 'Credit Memo' : 'Debit Memo';
  return {
    type: kind,
    title,
    form: isCm ? FORM.CREDIT_MEMO : FORM.DEBIT_MEMO,
    tc,
    table: 'custdmcmhdrtbl',
    noColumn: 'dmcmno',

    async list(ctx, params) {
      const heads = await ctx.db.all('custdmcmhdrtbl', { where: { tc }, orderBy: [['transdate', 'desc'], ['dmcmno', 'desc']] });
      const custs = await ctx.db.all('custmasttbl');
      const rows = heads.map((h) => ({ ...h, no: h.dmcmno, party: custs.find((c) => c.custno === h.custno)?.bussname ?? h.custno, amount: num(h.totamt) }));
      return { rows: filterList(rows, params, ['dmcmno', 'party', 'reasons', 'remarks']), counts: countBy(rows) };
    },

    async load(ctx, no) {
      const h = await ctx.db.one('custdmcmhdrtbl', { dmcmno: no, tc });
      if (!h) return null;
      return { h, lines: await ctx.db.all('custdmcmdettbl', { where: { dmcmno: no }, orderBy: [['itmno', 'asc']] }) };
    },

    async view(ctx, { h, lines }) {
      const cust = await ctx.db.one('custmasttbl', { custno: h.custno });
      return {
        no: h.dmcmno,
        status: h.status,
        title: `${title} ${h.dmcmno}`,
        subtitle: `${cust?.bussname ?? h.custno} · ${h.reasons}`,
        header: { ...h, bussname: cust?.bussname },
        lines,
        totals: [{ label: `${title} total`, value: num(h.totamt), strong: true }],
        info: h.apprvdby ? [{ label: 'Approved by', value: `${h.apprvdby} on ${h.dateapp}` }] : [],
        links: lines.filter((l) => l.invno).map((l) => ({ label: `Invoice ${l.invno}`, type: 'si', no: l.invno })),
        editable: h.status === 'Open',
      };
    },

    actionDefs(_ctx, { h }) {
      const defs: ActionDef[] = [];
      if (h.status === 'Open') defs.push({ ...STD.approve(undefined, `Approve ${title.toLowerCase()}`), hint: isCm ? 'Reduces the invoice balance and books the adjustment.' : 'Adds the charge to the invoice balance.' }, STD.void());
      if (h.status === 'Approved') defs.push(STD.void('Reverses the adjustment.'));
      return defs;
    },

    async perform(ctx, { h, lines }, action) {
      if (action === 'approve') {
        await assertOpenPeriod(ctx.db, h.transdate, tc);
        const entries: GlEntry[] = [];
        for (const l of lines) {
          if (isCm) {
            const inv = await ctx.db.one('saleshdrtbl', { invno: l.invno, tc: { in: INVOICE_TCS } });
            if (!inv) fail(`Invoice ${l.invno} was not found.`);
            const b = await invoiceBalance(ctx.db, inv);
            if (num(l.amt) > b.balance + 0.009) fail(`Credit for ${l.invno} is more than its ${fmtPeso(b.balance)} balance.`);
            entries.push({ acctno: l.glacct1 || GL.SALES_RETURNS, ccno: l.ccno, dramt: num(l.amt) }, { acctno: GL.AR_TRADE, cramt: num(l.amt) });
          } else {
            entries.push({ acctno: GL.AR_TRADE, dramt: num(l.amt) }, { acctno: l.glacct1 || GL.SALES, ccno: l.ccno, cramt: num(l.amt) });
          }
        }
        await writeGl(ctx, { tc, docno: h.dmcmno, transdate: h.transdate, source: kind.toUpperCase() }, entries);
        await ctx.db.update('custdmcmhdrtbl', { dmcmno: h.dmcmno, tc }, { status: 'Approved', apprvdby: ctx.user, dateapp: today(), glstat: 'Posted', webapp: ctx.user });
        return `${title} ${h.dmcmno} approved.`;
      }
      if (action === 'void') {
        if (h.status === 'Approved') await reverseGl(ctx, tc, h.dmcmno, today());
        await ctx.db.update('custdmcmhdrtbl', { dmcmno: h.dmcmno, tc }, { status: 'Void' });
        return `${title} ${h.dmcmno} voided.`;
      }
      fail('Unknown action');
    },

    async defaults() {
      return { transdate: today(), lines: [{}] };
    },

    async save(ctx, input) {
      const transdate = need(str(input.transdate), 'Enter the memo date.');
      const c = await customer(ctx.db, need(str(input.custno), 'Choose the customer.'));
      const reasons = need(str(input.reasons), `Give the reason for this ${title.toLowerCase()}.`);
      const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.invno) || num(l.amt));
      if (!raw.length) fail('Add at least one invoice line.');
      const lines: Row[] = [];
      for (const [i, l] of raw.entries()) {
        const invno = need(str(l.invno), `Line ${i + 1}: choose the invoice.`);
        const inv = await ctx.db.one('saleshdrtbl', { invno, tc: { in: INVOICE_TCS } });
        if (!inv || inv.custno !== c.custno || inv.status !== 'Posted') fail(`Line ${i + 1}: ${invno} is not a posted invoice of ${c.bussname}.`);
        const amt = r2(num(l.amt));
        if (amt <= 0) fail(`Line ${i + 1}: enter the amount.`);
        lines.push({ invno, invamt: num(inv.netamt), amt, cmamt: isCm ? amt : 0, glacct1: str(l.glacct1) || (isCm ? GL.SALES_RETURNS : GL.SALES), ccno: str(l.ccno), custno: c.custno, tc });
      }
      let dmcmno = str(input.no);
      const header = { tc, transdate, custno: c.custno, smnno: c.smnno, reasons, remarks: str(input.remarks), totamt: sum(lines, (l) => l.amt), status: 'Open', glstat: 'Open', user: ctx.user, branch: 'MAIN' };
      if (dmcmno) {
        const h = await ctx.db.one('custdmcmhdrtbl', { dmcmno, tc });
        if (!h) fail(`${title} ${dmcmno} was not found.`);
        if (h.status !== 'Open') fail(`${title} ${dmcmno} is ${h.status} and can no longer be edited.`);
        await ctx.db.update('custdmcmhdrtbl', { dmcmno, tc }, header);
        await ctx.db.remove('custdmcmdettbl', { dmcmno });
      } else {
        dmcmno = await nextDocNo(ctx.db, 'custdmcmhdrtbl', 'dmcmno', yearPrefix(kind.toUpperCase(), transdate));
        await ctx.db.insert('custdmcmhdrtbl', { dmcmno, docno: dmcmno, ...header });
      }
      for (const l of numberLines(lines, 'itmno')) await ctx.db.insert('custdmcmdettbl', { dmcmno, docno: dmcmno, ...l, transid: `${dmcmno}-${l.itmno}` });
      return { no: dmcmno };
    },
  };
}
registerDoc(memoService('cm'));
registerDoc(memoService('dm'));

// ===========================================================================
// Customer creditable withholding tax / BIR 2307 tracking (CustEWT.aspx, form 066)
// ===========================================================================
export async function cwtList(ctx: Ctx, f: { year: number; quarter?: number; status?: 'received' | 'missing' | 'all' }) {
  await requireRight(ctx, FORM.CUSTOMER_EWT, ACTION.VIEW, "view customers' withholding tax");
  const heads = await ctx.db.all('colhdrtbl', { where: { tc: TC.COLLECTION, status: 'Posted' } });
  const out: Row[] = [];
  for (const h of heads) {
    const d = new Date(h.transdate + 'T00:00:00');
    if (d.getFullYear() !== f.year) continue;
    const q = Math.floor(d.getMonth() / 3) + 1;
    if (f.quarter && q !== f.quarter) continue;
    for (const l of await ctx.db.all('coldettbl', { where: { orno: h.orno, ewt: { gt: 0 } } })) {
      const received = String(l.ewtform).toUpperCase() === 'Y';
      if (f.status === 'received' && !received) continue;
      if (f.status === 'missing' && received) continue;
      out.push({ orno: h.orno, transdate: h.transdate, quarter: q, custno: h.custno, bussname: h.bussname, invno: l.invno, ewt: num(l.ewt), base: r2(num(l.oramt) + num(l.ewt)), received });
    }
  }
  return out.sort((a, b) => String(a.transdate).localeCompare(String(b.transdate)));
}

export async function markCwtReceived(ctx: Ctx, orno: string, invno: string, received: boolean): Promise<string> {
  await requireRight(ctx, FORM.CUSTOMER_EWT, ACTION.EDIT, 'update 2307 certificates');
  return ctx.db.tx(async (db) => {
    const n = await db.update('coldettbl', { orno, invno }, { ewtform: received ? 'Y' : 'N' });
    if (!n) fail('That receipt line was not found.');
    await audit({ ...ctx, db }, { form: FORM.CUSTOMER_EWT, tc: TC.COLLECTION, docno: orno, trans: `2307 for ${invno} ${received ? 'received' : 'marked missing'}`, table: 'coldettbl' });
    return received ? `BIR 2307 for invoice ${invno} marked as received.` : `BIR 2307 for invoice ${invno} marked as still missing.`;
  });
}

// ===========================================================================
// A/R reports (ARreports.aspx, form 014)
// ===========================================================================
export async function arAging(ctx: Ctx, asOf = today()) {
  await requireRight(ctx, FORM.AR_REPORTS, ACTION.VIEW, 'view A/R reports');
  const inv = await openInvoices(ctx.db);
  const custs = new Map<string, Row>();
  for (const i of inv) {
    const days = daysBetween(i.duedate, asOf);
    const bucket = days <= 0 ? 'current' : days <= 30 ? 'd30' : days <= 60 ? 'd60' : days <= 90 ? 'd90' : days <= 120 ? 'd120' : 'over120';
    const c = custs.get(i.custno) ?? { custno: i.custno, bussname: i.bussname, current: 0, d30: 0, d60: 0, d90: 0, d120: 0, over120: 0, total: 0, invoices: [] as Row[] };
    c[bucket] = r2(c[bucket] + i.balance);
    c.total = r2(c.total + i.balance);
    c.invoices.push({ ...i, days: Math.max(0, days), bucket });
    custs.set(i.custno, c);
  }
  const rows = [...custs.values()].sort((a, b) => b.total - a.total);
  const totals: Row = { current: 0, d30: 0, d60: 0, d90: 0, d120: 0, over120: 0, total: 0 };
  for (const r of rows) for (const k of Object.keys(totals)) totals[k] = r2(totals[k] + r[k]);
  return { asOf, rows, totals };
}

export async function statementOfAccount(ctx: Ctx, custno: string) {
  await requireRight(ctx, FORM.AR_REPORTS, ACTION.VIEW, 'view statements of account');
  const c = await customer(ctx.db, custno);
  const inv = await openInvoices(ctx.db, custno);
  const exposure = await customerExposure(ctx.db, custno);
  const deposits = await ctx.db.all('colhdrtbl', { where: { custno, tc: TC.COLLECTION, status: 'Posted' } });
  let unapplied = 0;
  for (const d of deposits) {
    const lines = await ctx.db.all('coldettbl', { where: { orno: d.orno } });
    unapplied = r2(unapplied + num(d.colamt) - sum(lines, (l) => num(l.oramt)));
  }
  return { customer: { custno: c.custno, bussname: c.bussname, address: c.address, term: num(c.term), crlimit: num(c.crlimit) }, invoices: inv, total: sum(inv, (i) => i.balance), unapplied, exposure };
}

export async function openInvoicesFor(ctx: Ctx, custno: string) {
  const c = await customer(ctx.db, custno);
  const inv = await openInvoices(ctx.db, custno);
  return { invoices: inv, ewtRate: num(c.ewt) };
}

export type { Loaded };
