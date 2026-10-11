import type { Db, Row } from '../db';
import { ACTION, FORM, TC } from '@/shared/codes';
import { addDays, today } from '@/shared/dates';
import { fmtPeso, fmtQty, r2, r4, splitVat, sum } from '@/shared/money';
import { Ctx, assertOpenPeriod, fail, need, nextDocNo, num, numberLines, str, yearPrefix } from './context';
import { ActionDef, DocService, STD, countBy, filterList, registerDoc } from './docs';
import { GL, GlEntry, reverseGl, writeGl } from './gl';
import { balanceOf } from './inventory';
import { customerExposure } from './receivables';

async function priceOf(db: Db, codeno: string): Promise<number> {
  const p = await db.one('plsttbl', { codeno });
  if (p) return num(p.currprc);
  const m = await db.one('mmasttbl', { codeno });
  return num(m?.sp);
}

// ===========================================================================
// Sales orders (SalesOrder.aspx form 017, approval SOapp.aspx form 018)
// ===========================================================================
async function soChecks(db: Db, h: Row, lines: Row[]) {
  const cust = await db.one('custmasttbl', { custno: h.custno });
  const exposure = await customerExposure(db, h.custno, h.sono);
  const limit = num(cust?.crlimit);
  const after = r2(exposure.openAr + exposure.openOrders + num(h.soamt));
  const checks: { label: string; ok: boolean; detail?: string }[] = [];
  if (cust?.paytype !== 'Cash') {
    checks.push({
      label: 'Credit limit',
      ok: limit <= 0 || after <= limit,
      detail: `Open A/R ${fmtPeso(exposure.openAr)} + open orders ${fmtPeso(exposure.openOrders)} + this order ${fmtPeso(num(h.soamt))} = ${fmtPeso(after)} of ${limit > 0 ? fmtPeso(limit) : 'no limit set'}`,
    });
    if (exposure.overdue > 0) checks.push({ label: 'No overdue invoices', ok: false, detail: `${fmtPeso(exposure.overdue)} is past due` });
  }
  const plant = await db.one('plnttbl', { plntno: h.plntno });
  if (String(plant?.invset ?? 'Y').toUpperCase() === 'Y') {
    const byCode = new Map<string, number>();
    for (const l of lines) byCode.set(l.codeno, (byCode.get(l.codeno) ?? 0) + num(l.qty) - num(l.issqty));
    for (const [code, q] of byCode) {
      if (q <= 0) continue;
      const b = await balanceOf(db, h.plntno, code);
      const m = await db.one('mmasttbl', { codeno: code });
      checks.push({ label: `Stock: ${m?.mmdesc ?? code}`, ok: b.available + 0.0001 >= q, detail: `${fmtQty(b.available)} ${m?.um ?? ''} available at ${h.plntno}, ${fmtQty(q)} ordered` });
    }
  }
  return { checks, overLimit: limit > 0 && after > limit, exposure };
}

const soService: DocService = {
  type: 'so',
  title: 'Sales Order',
  form: FORM.SALES_ORDER,
  tc: TC.SALES_ORDER,
  table: 'sohdrtbl',
  noColumn: 'sono',

  async list(ctx, params) {
    const heads = await ctx.db.all('sohdrtbl', { orderBy: [['transdate', 'desc'], ['sono', 'desc']] });
    const custs = await ctx.db.all('custmasttbl');
    const rows = heads.map((h) => ({ ...h, no: h.sono, party: custs.find((c) => c.custno === h.custno)?.bussname ?? h.custno, amount: num(h.soamt) }));
    return { rows: filterList(rows, params, ['sono', 'party', 'pono', 'remarks', 'delstat', 'plntno']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('sohdrtbl', { sono: no });
    if (!h) return null;
    return { h, lines: await ctx.db.all('sodettbl', { where: { sono: no }, orderBy: [['itmno', 'asc']] }) };
  },

  async view(ctx, { h, lines }) {
    const cust = await ctx.db.one('custmasttbl', { custno: h.custno });
    const smn = h.smnno ? await ctx.db.one('smnmtbl', { smnno: h.smnno }) : null;
    const mats = await ctx.db.all('mmasttbl');
    const { checks } = h.status === 'Open' ? await soChecks(ctx.db, h, lines) : { checks: undefined };
    const dos = await ctx.db.all('isshdrtbl', { where: { sono: h.sono, status: { ne: 'Void' } } });
    return {
      no: h.sono,
      status: h.status,
      title: `Sales Order ${h.sono}`,
      subtitle: `${cust?.bussname ?? h.custno} · deliver ${h.deldate || 'ASAP'} from ${h.plntno}`,
      header: { ...h, bussname: cust?.bussname, smnname: smn?.fullname },
      lines: lines.map((l) => ({ ...l, mmdesc: mats.find((m) => m.codeno === l.codeno)?.mmdesc, delivered: num(l.issqty), open: r4(num(l.qty) - num(l.issqty)) })),
      totals: [
        { label: 'Gross', value: sum(lines, (l) => num(l.itmamt)) },
        { label: 'Discount', value: sum(lines, (l) => num(l.discamt)) },
        { label: 'Order total (VAT incl.)', value: sum(lines, (l) => num(l.netamt)), strong: true },
      ],
      checks,
      info: [
        { label: 'Delivery status', value: h.delstat || 'Undelivered' },
        ...(h.apprvdby ? [{ label: 'Approved by', value: `${h.apprvdby} on ${h.apprdate}${h.apprem ? ' — ' + h.apprem : ''}` }] : []),
        ...(h.pono ? [{ label: 'Customer PO', value: h.pono }] : []),
      ],
      links: dos.map((d) => ({ label: `Delivery ${d.dono}`, type: 'do', no: d.dono })),
      editable: h.status === 'Open',
      print: { kind: 'so' },
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open') {
      defs.push({
        ...STD.approve(FORM.SO_APPROVAL, 'Approve order'),
        hint: 'Credit and stock checks run first. Orders over the credit limit need a reason.',
        input: [{ key: 'apprem', label: 'Approval remarks (required if over credit limit)', type: 'text' }],
      });
      defs.push(STD.void());
    }
    if (h.status === 'Approved' && (h.delstat || 'Undelivered') === 'Undelivered') defs.push(STD.void());
    if (h.status === 'Approved' && h.delstat === 'Partial')
      defs.push({ id: 'close', label: 'Close balance', right: ACTION.RELEASE, form: FORM.SO_APPROVAL, confirm: 'Close the undelivered balance of this order?', hint: 'Marks the order as delivered; the remaining quantity is cancelled.' });
    return defs;
  },

  async perform(ctx, { h, lines }, action, payload) {
    if (action === 'approve') {
      const { overLimit, exposure } = await soChecks(ctx.db, h, lines);
      const remark = str(payload.apprem);
      if (overLimit && !remark) fail('This order is over the customer\'s credit limit. Enter a reason in the approval remarks to approve it anyway.');
      await ctx.db.update('sohdrtbl', { sono: h.sono }, { status: 'Approved', apprvdby: ctx.user, apprdate: today(), apprem: remark, delstat: 'Undelivered', totar: exposure.openAr });
      await ctx.db.update('sodettbl', { sono: h.sono }, { status: 'Approved' });
      return `Sales order ${h.sono} approved. The warehouse can now deliver it.`;
    }
    if (action === 'close') {
      for (const l of lines) await ctx.db.update('sodettbl', { sono: h.sono, itmno: l.itmno }, { qtbal: 0, status: 'Closed' });
      await ctx.db.update('sohdrtbl', { sono: h.sono }, { delstat: 'Delivered' });
      return `The open balance of ${h.sono} was closed.`;
    }
    if (action === 'void') {
      if (lines.some((l) => num(l.issqty) > 0)) fail(`Goods were already delivered on ${h.sono}. Close the balance instead.`);
      await ctx.db.update('sohdrtbl', { sono: h.sono }, { status: 'Void' });
      await ctx.db.update('sodettbl', { sono: h.sono }, { status: 'Void' });
      return `Sales order ${h.sono} voided.`;
    }
    fail('Unknown action');
  },

  async defaults(ctx) {
    const plants = await ctx.db.all('plnttbl', { where: { status: 'Active' }, limit: 1 });
    return { transdate: today(), deldate: addDays(today(), 3), plntno: plants[0]?.plntno ?? '', lines: [{}] };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the order date.');
    const custno = need(str(input.custno), 'Choose the customer.');
    const cust = await ctx.db.one('custmasttbl', { custno });
    if (!cust) fail(`Customer ${custno} does not exist.`);
    if (String(cust.status ?? 'Active').toLowerCase() !== 'active') fail(`${cust.bussname} is inactive.`);
    const plntno = need(str(input.plntno), 'Choose the plant / warehouse that will deliver.');
    if (!(await ctx.db.one('plnttbl', { plntno }))) fail(`Plant ${plntno} does not exist.`);
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.codeno) || num(l.qty));
    if (!raw.length) fail('Add at least one product.');
    const lines: Row[] = [];
    for (const [i, l] of raw.entries()) {
      const m = await ctx.db.one('mmasttbl', { codeno: need(str(l.codeno), `Line ${i + 1}: choose a product.`) });
      if (!m) fail(`Line ${i + 1}: product ${l.codeno} does not exist.`);
      const qty = r4(num(l.qty));
      if (qty <= 0) fail(`Line ${i + 1}: quantity must be more than zero.`);
      const sp = l.sp === '' || l.sp === undefined || l.sp === null ? await priceOf(ctx.db, m.codeno) : r4(num(l.sp));
      if (sp <= 0) fail(`Line ${i + 1}: ${m.mmdesc} has no price. Set it in the price list or type it in.`);
      const itmamt = r2(qty * sp);
      const discamt = r2(num(l.discamt));
      if (discamt > itmamt) fail(`Line ${i + 1}: discount is larger than the line amount.`);
      lines.push({ codeno: m.codeno, um: m.um, qty, wt: r4(qty * (num(m.wtfr) || 1)), sp, itmamt, discamt, netamt: r2(itmamt - discamt), issqty: 0, qtbal: qty, wtbal: r4(qty * (num(m.wtfr) || 1)), status: 'Open' });
    }
    let sono = str(input.no);
    const header = {
      transdate,
      custno,
      shipto: str(input.shipto) || cust.address,
      plntno,
      smnno: str(input.smnno) || cust.smnno,
      pono: str(input.pono),
      deldate: str(input.deldate) || addDays(transdate, 3),
      remarks: str(input.remarks),
      soamt: sum(lines, (l) => l.netamt),
      status: 'Open',
      delstat: 'Undelivered',
      user: ctx.user,
      pdate: today(),
      branch: 'MAIN',
      sysver: 'CloudAOS',
    };
    if (sono) {
      const h = await ctx.db.one('sohdrtbl', { sono });
      if (!h) fail(`Sales order ${sono} was not found.`);
      if (h.status !== 'Open') fail(`Sales order ${sono} is ${h.status} and can no longer be edited.`);
      await ctx.db.update('sohdrtbl', { sono }, header);
      await ctx.db.remove('sodettbl', { sono });
    } else {
      sono = await nextDocNo(ctx.db, 'sohdrtbl', 'sono', yearPrefix('SO', transdate));
      await ctx.db.insert('sohdrtbl', { sono, ...header });
    }
    for (const l of numberLines(lines, 'itmno')) await ctx.db.insert('sodettbl', { sono, ...l, transid: `${sono}-${l.itmno}` });
    return { no: sono };
  },
};
registerDoc(soService);

// ===========================================================================
// Sales invoices (SalesInvoice.aspx form 019, tc 62)
// ===========================================================================
function invoiceLine(l: Row, vatable: boolean) {
  const qty = r4(num(l.qty));
  const sp = r4(num(l.sp));
  const gross = r2(qty * sp);
  const disc = r2(num(l.detdiscamt));
  const amount = r2(gross - disc);
  const { vat } = splitVat(amount, vatable);
  return { qty, sp, detgrossamt: gross, detdiscamt: disc, itmamt: amount, detvat: vat, nv: r2(amount - vat) };
}

const siService: DocService = {
  type: 'si',
  title: 'Sales Invoice',
  form: FORM.SALES_INVOICE,
  tc: TC.SALES_INVOICE,
  table: 'saleshdrtbl',
  noColumn: 'invno',

  async list(ctx, params) {
    const heads = await ctx.db.all('saleshdrtbl', { where: { tc: TC.SALES_INVOICE }, orderBy: [['transdate', 'desc'], ['invno', 'desc']] });
    const custs = await ctx.db.all('custmasttbl');
    const rows = heads.map((h) => ({ ...h, no: h.invno, party: custs.find((c) => c.custno === h.custno)?.bussname ?? h.custno, amount: num(h.netamt) }));
    return { rows: filterList(rows, params, ['invno', 'party', 'dono', 'remarks']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('saleshdrtbl', { invno: no, tc: TC.SALES_INVOICE });
    if (!h) return null;
    return { h, lines: await ctx.db.all('salesdettbl', { where: { invno: no }, orderBy: [['itemno', 'asc']] }) };
  },

  async view(ctx, { h, lines }) {
    const cust = await ctx.db.one('custmasttbl', { custno: h.custno });
    const { invoiceBalance } = await import('./receivables');
    const bal = h.status === 'Posted' ? await invoiceBalance(ctx.db, h) : null;
    const due = addDays(h.transdate, num(cust?.term));
    return {
      no: h.invno,
      status: h.status,
      title: `Sales Invoice ${h.invno}`,
      subtitle: `${cust?.bussname ?? h.custno} · due ${due}`,
      header: { ...h, bussname: cust?.bussname, address: cust?.address, tin: cust?.tin, term: num(cust?.term), duedate: due },
      lines,
      totals: [
        { label: 'Gross sales', value: num(h.grossamt) },
        { label: 'Discount', value: num(h.discamt) },
        { label: 'VATable sales', value: r2(num(h.netamt) - num(h.vat)) },
        { label: 'VAT (12%)', value: num(h.vat) },
        { label: 'Total amount due', value: num(h.netamt), strong: true },
        ...(bal ? [{ label: 'Balance outstanding', value: bal.balance, strong: true }] : []),
      ],
      info: [{ label: 'Terms', value: `${num(cust?.term)} days (due ${due})` }],
      links: [
        ...(h.dono ? [{ label: `Delivery ${h.dono}`, type: 'do', no: h.dono }] : []),
        ...(bal?.receipts ?? []).map((r) => ({ label: `Official receipt ${r}`, type: 'or', no: r })),
      ],
      editable: h.status === 'Open',
      print: { kind: 'si' },
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open') defs.push({ ...STD.post(undefined, 'Post invoice'), hint: 'Books the receivable, sales and output VAT. The invoice then appears in collections and A/R aging.' }, STD.void());
    if (h.status === 'Posted') defs.push(STD.void('Reverses the receivable. Not allowed once a payment or memo is applied.'));
    return defs;
  },

  async perform(ctx, { h, lines }, action) {
    if (action === 'post') {
      await assertOpenPeriod(ctx.db, h.transdate, TC.SALES_INVOICE);
      const pc = h.pc ? await ctx.db.one('pctrtbl', { pc: h.pc }) : null;
      const entries: GlEntry[] = [{ acctno: str(pc?.aracctno) || GL.AR_TRADE, pc: h.pc, dramt: num(h.netamt) }];
      for (const l of lines) {
        const m = await ctx.db.one('mmasttbl', { codeno: l.codeno });
        entries.push({ acctno: str(m?.glacct) || GL.SALES, pc: h.pc, cramt: r2(num(l.itmamt) - num(l.detvat)) });
      }
      entries.push({ acctno: GL.OUTPUT_VAT, cramt: num(h.vat) });
      await writeGl(ctx, { tc: TC.SALES_INVOICE, docno: h.invno, transdate: h.transdate, source: 'SI' }, entries);
      await ctx.db.update('saleshdrtbl', { invno: h.invno, tc: TC.SALES_INVOICE }, { status: 'Posted', glstat: 'Posted', postdate: today(), arflag: 'Y', arflagdate: today(), arflaguser: ctx.user });
      await ctx.db.update('salesdettbl', { invno: h.invno }, { status: 'Posted' });
      return `Invoice ${h.invno} posted. ${fmtPeso(num(h.netamt))} is now receivable.`;
    }
    if (action === 'void') {
      if (h.status === 'Posted') {
        const { invoiceBalance } = await import('./receivables');
        const bal = await invoiceBalance(ctx.db, h);
        if (Math.abs(bal.balance - num(h.netamt)) > 0.009) fail(`Payments or memos are already applied to ${h.invno}. Reverse them first.`);
        await reverseGl(ctx, TC.SALES_INVOICE, h.invno, today());
      }
      if (h.dono) await ctx.db.update('isshdrtbl', { dono: h.dono }, { invno: '' });
      await ctx.db.update('saleshdrtbl', { invno: h.invno, tc: TC.SALES_INVOICE }, { status: 'Void' });
      await ctx.db.update('salesdettbl', { invno: h.invno }, { status: 'Void' });
      return `Invoice ${h.invno} voided.`;
    }
    fail('Unknown action');
  },

  async defaults() {
    return { transdate: today(), lines: [{}] };
  },

  async sources(ctx, source) {
    if (source !== 'do') return [];
    const dos = await ctx.db.all('isshdrtbl', { where: { status: 'Posted', mov: '201', invno: { isNull: true } }, orderBy: [['transdate', 'asc']] });
    const custs = await ctx.db.all('custmasttbl');
    return dos.map((d) => ({ no: d.dono, date: d.transdate, party: custs.find((c) => c.custno === d.custno)?.bussname ?? d.custno, amount: num(d.totqty), note: `${d.sono ? 'SO ' + d.sono + ' · ' : ''}${fmtQty(num(d.totqty))} units delivered` }));
  },

  async prefill(ctx, source, dono) {
    if (source !== 'do') fail('Unknown source');
    const d = await ctx.db.one('isshdrtbl', { dono });
    if (!d || d.status !== 'Posted') fail(`Delivery ${dono} is not posted.`);
    if (d.invno) fail(`Delivery ${dono} is already billed on ${d.invno}.`);
    const lines = await ctx.db.all('issdettbl', { where: { dono } });
    const cust = await ctx.db.one('custmasttbl', { custno: d.custno });
    const pcs = await ctx.db.all('pctrtbl', { limit: 1 });
    return {
      transdate: today(),
      custno: d.custno,
      dono,
      sono: d.sono,
      smnno: d.smnno || cust?.smnno,
      shipto: d.shipto,
      pc: pcs[0]?.pc ?? '',
      remarks: `Billing for delivery ${dono}`,
      lines: lines.map((l) => ({ codeno: l.codeno, lotno: l.lotno, qty: num(l.qty), sp: num(l.sp), detdiscamt: 0 })),
    };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the invoice date.');
    await assertOpenPeriod(ctx.db, transdate, TC.SALES_INVOICE);
    const custno = need(str(input.custno), 'Choose the customer.');
    const cust = await ctx.db.one('custmasttbl', { custno });
    if (!cust) fail(`Customer ${custno} does not exist.`);
    const dono = str(input.dono);
    if (dono) {
      const d = await ctx.db.one('isshdrtbl', { dono });
      if (!d || d.status !== 'Posted') fail(`Delivery ${dono} is not posted.`);
      if (d.custno !== custno) fail(`Delivery ${dono} is for another customer.`);
      if (d.invno && d.invno !== str(input.no)) fail(`Delivery ${dono} is already billed on ${d.invno}.`);
    }
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.codeno) || num(l.qty));
    if (!raw.length) fail('Add at least one product.');
    const lines: Row[] = [];
    for (const [i, l] of raw.entries()) {
      const m = await ctx.db.one('mmasttbl', { codeno: need(str(l.codeno), `Line ${i + 1}: choose a product.`) });
      if (!m) fail(`Line ${i + 1}: product ${l.codeno} does not exist.`);
      if (num(l.qty) <= 0) fail(`Line ${i + 1}: quantity must be more than zero.`);
      const vatable = String(m.vat ?? 'Y').toUpperCase() !== 'N' && cust.vat !== 'ZERO';
      lines.push({ codeno: m.codeno, mmdesc: m.mmdesc, mmgrp: m.mmgrp, lotno: str(l.lotno), wt: r4(num(l.qty) * (num(m.wtfr) || 1)), ...invoiceLine(l, vatable), status: 'Open', transdate, user: ctx.user, pc: str(input.pc) });
    }
    let invno = str(input.no);
    const header = {
      tc: TC.SALES_INVOICE,
      transdate,
      custno,
      dono,
      smnno: str(input.smnno) || cust.smnno,
      shipto: str(input.shipto) || cust.address,
      pc: str(input.pc),
      remarks: str(input.remarks),
      grossamt: sum(lines, (l) => l.detgrossamt),
      discamt: sum(lines, (l) => l.detdiscamt),
      vat: sum(lines, (l) => l.detvat),
      netamt: sum(lines, (l) => l.itmamt),
      status: 'Open',
      glstat: 'Open',
      doctype: 'SI',
      user: ctx.user,
      updateby: ctx.user,
      branch: 'MAIN',
      web: 'Y',
      sysver: 'CloudAOS',
    };
    if (invno) {
      const h = await ctx.db.one('saleshdrtbl', { invno, tc: TC.SALES_INVOICE });
      if (!h) fail(`Invoice ${invno} was not found.`);
      if (h.status !== 'Open') fail(`Invoice ${invno} is ${h.status} and can no longer be edited.`);
      if (h.dono && h.dono !== dono) await ctx.db.update('isshdrtbl', { dono: h.dono }, { invno: '' });
      await ctx.db.update('saleshdrtbl', { invno, tc: TC.SALES_INVOICE }, header);
      await ctx.db.remove('salesdettbl', { invno });
    } else {
      invno = await nextDocNo(ctx.db, 'saleshdrtbl', 'invno', yearPrefix('SI', transdate));
      await ctx.db.insert('saleshdrtbl', { invno, docno: invno, ...header });
    }
    for (const l of numberLines(lines)) await ctx.db.insert('salesdettbl', { invno, ...l, transid: `${invno}-${l.itemno}` });
    if (dono) await ctx.db.update('isshdrtbl', { dono }, { invno });
    return { no: invno };
  },
};
registerDoc(siService);

export async function salesRegister(ctx: Ctx, f: { from: string; to: string; groupBy: 'customer' | 'product' | 'invoice' }) {
  const heads = await ctx.db.all('saleshdrtbl', { where: { tc: TC.SALES_INVOICE, status: 'Posted', transdate: { gte: f.from, lte: f.to } } });
  const custs = await ctx.db.all('custmasttbl');
  const mats = await ctx.db.all('mmasttbl');
  if (f.groupBy === 'invoice') {
    return heads
      .sort((a, b) => String(a.transdate).localeCompare(String(b.transdate)))
      .map((h) => ({ key: h.invno, label: custs.find((c) => c.custno === h.custno)?.bussname ?? h.custno, date: h.transdate, net: r2(num(h.netamt) - num(h.vat)), vat: num(h.vat), total: num(h.netamt) }));
  }
  const map = new Map<string, Row>();
  for (const h of heads) {
    const lines = await ctx.db.all('salesdettbl', { where: { invno: h.invno } });
    for (const l of lines) {
      const key = f.groupBy === 'customer' ? h.custno : l.codeno;
      const label = f.groupBy === 'customer' ? custs.find((c) => c.custno === h.custno)?.bussname ?? h.custno : mats.find((m) => m.codeno === l.codeno)?.mmdesc ?? l.codeno;
      const g = map.get(key) ?? { key, label, qty: 0, net: 0, vat: 0, total: 0 };
      g.qty = r4(g.qty + num(l.qty));
      g.net = r2(g.net + num(l.itmamt) - num(l.detvat));
      g.vat = r2(g.vat + num(l.detvat));
      g.total = r2(g.total + num(l.itmamt));
      map.set(key, g);
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
