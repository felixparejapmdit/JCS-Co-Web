// Deposit Application (legacy DepApp.aspx, form 012): applies the unapplied part of an issued
// official receipt (kept as a customer deposit) to the customer's open invoices.
// depapptbl keeps the application; on posting its lines are added to the receipt in coldettbl
// with depapp = the application number, as the legacy page does, so invoice balances, the
// statement of account and the 2307 list all see the payment.
import type { Db, Row } from '../db';
import { FORM, INVOICE_TCS, TC } from '@/shared/codes';
import { today } from '@/shared/dates';
import { fmtPeso, r2, sum } from '@/shared/money';
import { Ctx, assertOpenPeriod, fail, need, nextDocNo, num, str, yearPrefix } from './context';
import { ActionDef, DocService, STD, countBy, filterList, registerDoc } from './docs';
import { GL, GlEntry, reverseGl, writeGl } from './gl';
import { invoiceBalance, openInvoices } from './receivables';

/** Amount of an issued receipt not yet applied to any invoice. */
export async function depositLeft(db: Db, orno: string, exceptTransid = ''): Promise<number> {
  const h = await db.one('colhdrtbl', { orno, tc: TC.COLLECTION });
  if (!h || h.status !== 'Posted') return 0;
  const lines = await db.all('coldettbl', { where: { orno, status: { ne: 'Void' } } });
  const applied = sum(lines.filter((l) => !exceptTransid || l.depapp !== exceptTransid), (l) => num(l.oramt));
  return r2(num(h.colamt) - applied);
}

/** Receipts that still hold a customer deposit, optionally for one customer. */
export async function openDeposits(db: Db, custno?: string): Promise<Row[]> {
  const heads = await db.all('colhdrtbl', { where: { tc: TC.COLLECTION, status: 'Posted', ...(custno ? { custno } : {}) }, orderBy: [['transdate', 'asc']] });
  const out: Row[] = [];
  for (const h of heads) {
    const left = await depositLeft(db, h.orno);
    if (left > 0.004) out.push({ orno: h.orno, custno: h.custno, bussname: h.bussname, transdate: h.transdate, colamt: num(h.colamt), left });
  }
  return out;
}

const daService: DocService = {
  type: 'da',
  title: 'Deposit Application',
  form: FORM.DEPOSIT_APPLICATION,
  tc: TC.COLLECTION,
  table: 'depapptbl',
  noColumn: 'transid',

  async list(ctx, params) {
    const rows = await ctx.db.all('depapptbl');
    const heads = new Map<string, Row>();
    for (const r of rows) {
      const h = heads.get(r.transid) ?? { transid: r.transid, no: r.transid, orno: r.orno, custno: r.custno, transdate: r.transdate, ordate: r.ordate, status: statusOf(r.savestat), amount: 0, invoices: 0 };
      h.amount = r2(h.amount + num(r.oramt) + num(r.ewt));
      h.invoices += 1;
      heads.set(r.transid, h);
    }
    const custs = await ctx.db.all('custmasttbl');
    const list = [...heads.values()].map((h): Row => ({ ...h, party: custs.find((c) => c.custno === h.custno)?.bussname ?? h.custno })).sort((a, b) => String(b.transdate).localeCompare(String(a.transdate)) || String(b.transid).localeCompare(String(a.transid)));
    return { rows: filterList(list, params, ['transid', 'orno', 'party']), counts: countBy(list) };
  },

  async load(ctx, no) {
    const lines = await ctx.db.all('depapptbl', { where: { transid: no }, orderBy: [['itemno', 'asc']] });
    if (!lines.length) return null;
    const f = lines[0];
    const c = await ctx.db.one('custmasttbl', { custno: f.custno });
    return { h: { transid: no, orno: f.orno, custno: f.custno, bussname: c?.bussname ?? f.custno, transdate: f.transdate, ordate: f.ordate, status: statusOf(f.savestat), user: f.user, remarks: f.remarks ?? '' }, lines };
  },

  async view(ctx, { h, lines }) {
    const applied = sum(lines, (l) => num(l.oramt));
    const ewt = sum(lines, (l) => num(l.ewt));
    const left = await depositLeft(ctx.db, h.orno, h.status === 'Posted' ? '' : h.transid);
    return {
      no: h.transid,
      status: h.status,
      title: `Deposit Application ${h.transid}`,
      subtitle: `${h.bussname} · deposit from receipt ${h.orno}`,
      header: { ...h, colamt: r2(applied) },
      lines: lines.map((l): Row => ({ ...l, invno: l.refno, ewtform: num(l.ewt) > 0 ? (String(l.ewtform).toUpperCase() === 'Y' ? 'Received' : 'Not yet received') : 'No tax withheld' })),
      totals: [
        { label: 'Deposit applied', value: applied, strong: true },
        { label: 'Tax withheld (2307)', value: ewt },
        { label: 'Invoices settled', value: r2(applied + ewt) },
        { label: h.status === 'Posted' ? 'Deposit still unapplied' : 'Deposit available after this', value: h.status === 'Posted' ? left : r2(left - applied) },
      ],
      info: [{ label: 'Receipt', value: `${h.orno}, dated ${h.ordate}` }],
      links: [{ label: `Official receipt ${h.orno}`, type: 'or', no: h.orno }, ...lines.map((l) => ({ label: `Invoice ${l.refno}`, type: 'si', no: l.refno }))],
      editable: h.status === 'Open',
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open') defs.push({ ...STD.post(undefined, 'Apply deposit'), hint: 'Settles the invoices from the customer deposit and books it: debit customer deposits, credit receivables.' }, STD.void('The draft application is cancelled. Nothing was booked yet.'));
    if (h.status === 'Posted') defs.push(STD.void('Takes the payment off the invoices and returns the amount to the customer deposit.'));
    return defs;
  },

  async perform(ctx, { h, lines }, action) {
    if (action === 'post') {
      await assertOpenPeriod(ctx.db, h.transdate, TC.COLLECTION);
      const left = await depositLeft(ctx.db, h.orno);
      const applied = r2(sum(lines, (l) => num(l.oramt)));
      if (applied > left + 0.009) fail(`Receipt ${h.orno} only has ${fmtPeso(left)} of deposit left.`);
      const or = (await ctx.db.one('colhdrtbl', { orno: h.orno, tc: TC.COLLECTION }))!;
      const entries: GlEntry[] = [{ acctno: GL.CUSTOMER_DEPOSITS, dramt: applied }];
      const ewt = r2(sum(lines, (l) => num(l.ewt)));
      if (ewt) entries.push({ acctno: GL.CWT_RECEIVABLE, dramt: ewt });
      const items = await ctx.db.all('coldettbl', { where: { orno: h.orno } });
      let itemno = Math.max(0, ...items.map((i) => num(i.itemno)));
      for (const l of lines) {
        const inv = await ctx.db.one('saleshdrtbl', { invno: l.refno, tc: { in: INVOICE_TCS } });
        if (!inv || inv.status !== 'Posted') fail(`Invoice ${l.refno} is not posted.`);
        const b = await invoiceBalance(ctx.db, inv);
        if (num(l.oramt) + num(l.ewt) > b.balance + 0.009) fail(`Invoice ${l.refno} only has ${fmtPeso(b.balance)} outstanding.`);
        const pc = inv.pc ? await ctx.db.one('pctrtbl', { pc: inv.pc }) : null;
        entries.push({ acctno: str(pc?.aracctno) || GL.AR_TRADE, pc: inv.pc, cramt: r2(num(l.oramt) + num(l.ewt)) });
        itemno += 1;
        await ctx.db.insert('coldettbl', {
          orno: h.orno,
          docno: h.orno,
          itemno,
          daitmno: l.itemno,
          invno: l.refno,
          refno: l.refno,
          tc: TC.COLLECTION,
          origamt: num(inv.netamt),
          oramt: num(l.oramt),
          ewt: num(l.ewt),
          netcolamt: num(l.oramt),
          ewtform: num(l.ewt) > 0 ? 'N' : '',
          pdc: 'N',
          custno: h.custno,
          pc: inv.pc,
          coltype: 'Trade',
          depapp: h.transid,
          status: 'Posted',
          user: ctx.user,
          web: 'Y',
          transid: `${h.orno}-${itemno}`,
        });
      }
      await writeGl(ctx, { tc: TC.COLLECTION, docno: h.transid, transdate: h.transdate, source: 'DA' }, entries);
      await ctx.db.update('depapptbl', { transid: h.transid }, { savestat: 'Applied' });
      return `${fmtPeso(applied)} of the deposit on receipt ${or.orno} applied to ${lines.length} invoice(s).`;
    }
    if (action === 'void') {
      if (h.status === 'Posted') {
        await assertOpenPeriod(ctx.db, today(), TC.COLLECTION);
        await reverseGl(ctx, TC.COLLECTION, h.transid, today());
        await ctx.db.update('coldettbl', { orno: h.orno, depapp: h.transid }, { status: 'Void' });
      }
      await ctx.db.update('depapptbl', { transid: h.transid }, { savestat: 'Void' });
      return h.status === 'Posted' ? `Application ${h.transid} voided; the amount is back on the customer deposit.` : `Application ${h.transid} cancelled.`;
    }
    fail('Unknown action');
  },

  async defaults() {
    return { transdate: today(), lines: [] };
  },

  async sources(ctx, source) {
    if (source !== 'deposit') return [];
    return (await openDeposits(ctx.db)).map((d) => ({ no: d.orno, date: d.transdate, party: d.bussname, amount: d.left, note: `Receipt of ${fmtPeso(d.colamt)}` }));
  },

  async prefill(ctx, source, orno) {
    if (source !== 'deposit') fail('Unknown source.');
    const h = await ctx.db.one('colhdrtbl', { orno, tc: TC.COLLECTION });
    if (!h) fail(`Receipt ${orno} was not found.`);
    return { orno, custno: h.custno, colamt: await depositLeft(ctx.db, orno), transdate: today(), lines: [] };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the application date.');
    await assertOpenPeriod(ctx.db, transdate, TC.COLLECTION);
    const orno = need(str(input.orno), 'Choose the receipt that holds the deposit.');
    const or = await ctx.db.one('colhdrtbl', { orno, tc: TC.COLLECTION });
    if (!or) fail(`Receipt ${orno} was not found.`);
    if (or.status !== 'Posted') fail(`Receipt ${orno} is ${or.status}; only issued receipts can be applied.`);
    if (transdate < or.transdate) fail('The application cannot be dated before the receipt.');
    let transid = str(input.no);
    const left = await depositLeft(ctx.db, orno);
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.invno) && (num(l.oramt) || num(l.ewt)));
    if (!raw.length) fail('Choose at least one invoice to apply the deposit to.');
    const open = await openInvoices(ctx.db, or.custno);
    const lines: Row[] = [];
    for (const [i, l] of raw.entries()) {
      const inv = open.find((x) => x.invno === str(l.invno));
      if (!inv) fail(`Line ${i + 1}: invoice ${l.invno} is not open for ${or.bussname}.`);
      const oramt = r2(num(l.oramt));
      const ewt = r2(num(l.ewt));
      if (oramt < 0 || ewt < 0) fail(`Line ${i + 1}: amounts cannot be negative.`);
      if (oramt + ewt > inv.balance + 0.009) fail(`Line ${i + 1}: invoice ${inv.invno} only has ${fmtPeso(inv.balance)} outstanding.`);
      lines.push({ refno: inv.invno, reftc: str(inv.tc) || TC.SALES_INVOICE, oramt, ewt, netcolamt: oramt, ewtform: ewt > 0 ? 'N' : 'No EWT' });
    }
    const applied = r2(sum(lines, (l) => l.oramt));
    if (applied > left + 0.009) fail(`You applied ${fmtPeso(applied)} but receipt ${orno} only has ${fmtPeso(left)} of deposit left.`);
    if (transid) {
      const cur = await ctx.db.one('depapptbl', { transid });
      if (!cur) fail(`Application ${transid} was not found.`);
      if (statusOf(cur.savestat) !== 'Open') fail(`Application ${transid} is ${statusOf(cur.savestat)} and can no longer be edited.`);
      await ctx.db.remove('depapptbl', { transid });
    } else {
      transid = await nextDocNo(ctx.db, 'depapptbl', 'transid', yearPrefix('DA', transdate));
    }
    let itemno = 0;
    for (const l of lines) await ctx.db.insert('depapptbl', { transid, itemno: ++itemno, orno, custno: or.custno, ordate: or.transdate, transdate, ...l, note: 'Y', savestat: 'Open', branch: 'MAIN', user: ctx.user });
    return { no: transid, message: `Application ${transid} saved: ${fmtPeso(applied)} of the deposit on ${orno}.` };
  },
};
registerDoc(daService);

function statusOf(savestat: unknown): string {
  const s = String(savestat ?? '').toLowerCase();
  return s === 'applied' ? 'Posted' : s === 'void' ? 'Void' : 'Open';
}
