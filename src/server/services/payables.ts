import type { Db, Row } from '../db';
import { ACTION, FORM, TC } from '@/shared/codes';
import { addDays, daysBetween, today } from '@/shared/dates';
import { ewtOn, fmtPeso, numToEng, r2, splitVat, sum } from '@/shared/money';
import { Ctx, assertOpenPeriod, audit, fail, need, nextDocNo, num, requireRight, str, yearPrefix } from './context';
import { ActionDef, DocService, STD, countBy, filterList, registerDoc } from './docs';
import { GL, GlEntry, reverseGl, writeGl } from './gl';
import { assertWithinLimit } from './purchasing';

async function vendor(db: Db, venno: string): Promise<Row> {
  const v = await db.one('venmasttbl', { venno });
  if (!v) fail(`Vendor ${venno} does not exist.`);
  return v;
}

async function ewtRate(db: Db, code: string): Promise<number> {
  if (!code) return 0;
  const r = await db.one('bir_ewttbl', { ewtcode: code });
  if (!r) fail(`Withholding tax code ${code} does not exist.`);
  return num(r.rate);
}

/** Computes a voucher from its expense lines: VAT is split out, EWT applies to the VAT-exclusive base. */
export async function computeVoucher(db: Db, lines: Row[]) {
  const out: Row[] = [];
  for (const l of lines) {
    const amount = r2(num(l.amount));
    const vatable = String(l.vatable ?? 'Y').toUpperCase() !== 'N';
    const { net, vat } = splitVat(amount, vatable);
    const rate = await ewtRate(db, str(l.ewtcode));
    out.push({ ...l, amount, vatable: vatable ? 'Y' : 'N', net, vat, ewtrate: rate, ewtbase: net, ewt: ewtOn(net, rate) });
  }
  const gross = sum(out, (l) => l.amount);
  const vat = sum(out, (l) => l.vat);
  const ewt = sum(out, (l) => l.ewt);
  return { lines: out, gross, vat, ewt, net: r2(gross - vat), payable: r2(gross - ewt) };
}

// ===========================================================================
// Voucher payables (VoucherPayables.aspx form 023, posting APapp.aspx form 027, tc 42)
// ===========================================================================
const vpService: DocService = {
  type: 'vp',
  title: 'Voucher Payable',
  form: FORM.VOUCHER_PAYABLE,
  tc: TC.VOUCHER_PAYABLE,
  table: 'exphdrtbl',
  noColumn: 'docno',

  async list(ctx, params) {
    const heads = await ctx.db.all('exphdrtbl', { where: { tc: TC.VOUCHER_PAYABLE }, orderBy: [['transdate', 'desc'], ['docno', 'desc']] });
    const vens = await ctx.db.all('venmasttbl');
    const rows = heads.map((h) => ({ ...h, no: h.docno, party: vens.find((v) => v.venno === h.venno)?.venname ?? h.venno, amount: num(h.docamt), balance: num(h.vpbals) }));
    return { rows: filterList(rows, params, ['docno', 'party', 'refdoc', 'remarks', 'mmrrno', 'cvstat']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('exphdrtbl', { docno: no, tc: TC.VOUCHER_PAYABLE });
    if (!h) return null;
    return { h, lines: await ctx.db.all('expdettbl', { where: { docno: no, tc: TC.VOUCHER_PAYABLE }, orderBy: [['itemno', 'asc']] }) };
  },

  async view(ctx, { h, lines }) {
    const ven = await ctx.db.one('venmasttbl', { venno: h.venno });
    const accts = await ctx.db.all('acctcharttbl');
    const userLines = lines.filter((l) => (l.entryfr ?? 'MANUAL') === 'MANUAL');
    const vat = sum(lines.filter((l) => l.entryfr === 'VAT'), (l) => num(l.dramt));
    const ewt = sum(lines.filter((l) => l.entryfr === 'EWT'), (l) => num(l.cramt));
    const net = sum(userLines, (l) => num(l.dramt));
    const cvs = await ctx.db.all('cvdettbl', { where: { vpno: h.docno, tcref: TC.VOUCHER_PAYABLE } });
    const cvnos = [...new Set(cvs.map((c) => c.docno))];
    return {
      no: h.docno,
      status: h.status,
      title: `Voucher Payable ${h.docno}`,
      subtitle: `${ven?.venname ?? h.venno}${h.refdoc ? ' · invoice ' + h.refdoc : ''}`,
      header: { ...h, venname: ven?.venname, ventin: ven?.tin, venaddress: ven?.address, duedate: addDays(h.invdate || h.transdate, num(ven?.terms)) },
      // The VAT-inclusive invoice amount of each line is kept as qty 1 x uc; dramt holds the net.
      lines: userLines.map((l) => ({
        ...l,
        acctdesc: accts.find((a) => a.acctno === l.acctno)?.acctdesc,
        amount: num(l.uc) || num(l.dramt),
        vatable: num(l.uc) > num(l.dramt) + 0.001 ? 'Y' : 'N',
        net: num(l.dramt),
        ewt: ewtOn(num(l.ewtbase), num(l.ewtrate)),
      })),
      totals: [
        { label: 'Expense (net of VAT)', value: net },
        { label: 'Input VAT', value: vat },
        { label: 'Gross invoice amount', value: r2(net + vat) },
        { label: 'Less: withholding tax', value: ewt },
        { label: 'Net payable to vendor', value: num(h.docamt), strong: true },
        ...(h.status === 'Posted' ? [{ label: 'Balance unpaid', value: num(h.vpbals), strong: true }] : []),
      ],
      info: [
        { label: 'Payment status', value: h.cvstat || 'Unpaid' },
        { label: 'Due date', value: addDays(h.invdate || h.transdate, num(ven?.terms)) },
        ...(h.postedby ? [{ label: 'Posted by', value: `${h.postedby} on ${h.datepost}` }] : []),
      ],
      links: [
        ...(h.mmrrno ? [{ label: `Receiving report ${h.mmrrno}`, type: 'mmrr', no: h.mmrrno }] : []),
        ...(h.pono ? [{ label: `Purchase order ${h.pono}`, type: 'po', no: h.pono }] : []),
        ...cvnos.map((c) => ({ label: `Check voucher ${c}`, type: 'cv', no: c })),
      ],
      editable: h.status === 'Open',
      print: { kind: 'vp' },
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open')
      defs.push({ ...STD.post(FORM.DOCUMENT_POSTING, 'Approve & post'), hint: 'Checks your approval limit, then books the expense, input VAT, withholding tax and the payable.' }, STD.void());
    if (h.status === 'Posted' && num(h.vpbals) >= num(h.docamt) - 0.009) defs.push(STD.void('Reverses the payable. Not allowed once a cheque was issued.'));
    return defs;
  },

  async perform(ctx, { h, lines }, action) {
    if (action === 'post') {
      await assertOpenPeriod(ctx.db, h.transdate, TC.VOUCHER_PAYABLE);
      await assertWithinLimit(ctx, 'APapp', num(h.docamt), 'voucher');
      const entries: GlEntry[] = lines.map((l) => ({ acctno: l.acctno, ccno: l.ccno, dramt: num(l.dramt), cramt: num(l.cramt) }));
      await writeGl(ctx, { tc: TC.VOUCHER_PAYABLE, docno: h.docno, transdate: h.transdate, source: 'VP' }, entries);
      await ctx.db.update('exphdrtbl', { docno: h.docno, tc: TC.VOUCHER_PAYABLE }, { status: 'Posted', postedby: ctx.user, datepost: today(), auditby: ctx.user, dateaudit: today(), webapp: ctx.user, vpbals: num(h.docamt), cvstat: 'Unpaid' });
      await ctx.db.update('expdettbl', { docno: h.docno, tc: TC.VOUCHER_PAYABLE }, { status: 'Posted', glstat: 'Posted' });
      return `Voucher ${h.docno} posted. ${fmtPeso(num(h.docamt))} is ready for payment.`;
    }
    if (action === 'void') {
      if (h.status === 'Posted') {
        const open = await ctx.db.all('cvdettbl', { where: { vpno: h.docno, tcref: TC.VOUCHER_PAYABLE } });
        for (const c of open) {
          const cv = await ctx.db.one('cvhdrtbl', { docno: c.docno });
          if (cv && cv.status !== 'Void') fail(`Voucher ${h.docno} is on check voucher ${cv.docno}. Void the check voucher first.`);
        }
        await reverseGl(ctx, TC.VOUCHER_PAYABLE, h.docno, today());
      }
      if (h.mmrrno) await ctx.db.update('invhdrtbl', { docno: h.mmrrno }, { vpno: '' });
      await ctx.db.update('exphdrtbl', { docno: h.docno, tc: TC.VOUCHER_PAYABLE }, { status: 'Void', vpbals: 0 });
      await ctx.db.update('expdettbl', { docno: h.docno, tc: TC.VOUCHER_PAYABLE }, { status: 'Void' });
      return `Voucher ${h.docno} voided.`;
    }
    fail('Unknown action');
  },

  async defaults() {
    return { transdate: today(), invdate: today(), lines: [{ vatable: 'Y' }] };
  },

  async sources(ctx, source) {
    if (source !== 'mmrr') return [];
    const rr = await ctx.db.all('invhdrtbl', { where: { tc: TC.RECEIVING, status: 'Posted', vpno: { isNull: true } }, orderBy: [['transdate', 'asc']] });
    const vens = await ctx.db.all('venmasttbl');
    return rr.map((r) => ({ no: r.docno, date: r.transdate, party: vens.find((v) => v.venno === r.venno)?.venname ?? r.venno, amount: num(r.netamt), note: r.pono ? `PO ${r.pono}` : '' }));
  },

  async prefill(ctx, source, mmrrno) {
    if (source !== 'mmrr') fail('Unknown source');
    const rr = await ctx.db.one('invhdrtbl', { docno: mmrrno, tc: TC.RECEIVING });
    if (!rr || rr.status !== 'Posted') fail(`Receiving report ${mmrrno} is not posted.`);
    if (rr.vpno) fail(`Receiving report ${mmrrno} is already on voucher ${rr.vpno}.`);
    const v = await vendor(ctx.db, rr.venno);
    const vatable = v.vat === 'VAT';
    return {
      transdate: today(),
      venno: rr.venno,
      invdate: rr.transdate,
      refdoc: rr.formno || '',
      mmrrno,
      pono: rr.pono,
      remarks: `Purchases per receiving report ${mmrrno}`,
      lines: [{ acctno: GL.GRNI, ccno: '', amount: r2(num(rr.netamt) * (vatable ? 1.12 : 1)), vatable: vatable ? 'Y' : 'N', ewtcode: v.ewtcode || '', remarksline: `Goods received ${mmrrno}` }],
    };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the voucher date.');
    await assertOpenPeriod(ctx.db, transdate, TC.VOUCHER_PAYABLE);
    const v = await vendor(ctx.db, need(str(input.venno), 'Choose the vendor.'));
    const refdoc = need(str(input.refdoc), "Enter the vendor's invoice / billing number.");
    const dup = await ctx.db.all('exphdrtbl', { where: { venno: v.venno, refdoc, tc: TC.VOUCHER_PAYABLE, status: { ne: 'Void' } } });
    const other = dup.find((d) => d.docno !== str(input.no));
    if (other) fail(`Invoice ${refdoc} of ${v.venname} is already recorded on voucher ${other.docno}.`);
    const mmrrno = str(input.mmrrno);
    if (mmrrno) {
      const rr = await ctx.db.one('invhdrtbl', { docno: mmrrno, tc: TC.RECEIVING });
      if (!rr || rr.status !== 'Posted') fail(`Receiving report ${mmrrno} is not posted.`);
      if (rr.venno !== v.venno) fail(`Receiving report ${mmrrno} is from another vendor.`);
      if (rr.vpno && rr.vpno !== str(input.no)) fail(`Receiving report ${mmrrno} is already on voucher ${rr.vpno}.`);
    } else if (String(v.mmrrreq).toUpperCase() === 'Y' && String(v.ventype) === 'Trade') {
      fail(`${v.venname} requires a receiving report. Use "Create from receiving report".`);
    }
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.acctno) || num(l.amount));
    if (!raw.length) fail('Add at least one expense line.');
    for (const [i, l] of raw.entries()) {
      if (!str(l.acctno)) fail(`Line ${i + 1}: choose the expense account.`);
      if (!(await ctx.db.one('acctcharttbl', { acctno: str(l.acctno) }))) fail(`Line ${i + 1}: account ${l.acctno} does not exist.`);
      if (num(l.amount) <= 0) fail(`Line ${i + 1}: enter the amount.`);
    }
    const calc = await computeVoucher(ctx.db, raw);
    let docno = str(input.no);
    const header = {
      tc: TC.VOUCHER_PAYABLE,
      transdate,
      venno: v.venno,
      refdoc,
      invdate: str(input.invdate) || transdate,
      pono: str(input.pono),
      mmrrno,
      dept: str(input.dept),
      remarks: str(input.remarks),
      docamt: calc.payable,
      vpbals: calc.payable,
      status: 'Open',
      cvstat: 'Unpaid',
      user: ctx.user,
      updateby: ctx.user,
      datechange: today(),
      web: 'Y',
      ba: ctx.ba,
      branch: 'MAIN',
    };
    if (docno) {
      const h = await ctx.db.one('exphdrtbl', { docno, tc: TC.VOUCHER_PAYABLE });
      if (!h) fail(`Voucher ${docno} was not found.`);
      if (h.status !== 'Open') fail(`Voucher ${docno} is ${h.status} and can no longer be edited.`);
      if (h.mmrrno && h.mmrrno !== mmrrno) await ctx.db.update('invhdrtbl', { docno: h.mmrrno }, { vpno: '' });
      await ctx.db.update('exphdrtbl', { docno, tc: TC.VOUCHER_PAYABLE }, header);
      await ctx.db.remove('expdettbl', { docno, tc: TC.VOUCHER_PAYABLE });
    } else {
      docno = await nextDocNo(ctx.db, 'exphdrtbl', 'docno', yearPrefix('VP', transdate));
      await ctx.db.insert('exphdrtbl', { docno, ...header });
    }
    const { transyear, transmon } = { transyear: Number(transdate.slice(0, 4)), transmon: Number(transdate.slice(5, 7)) };
    const base = { docno, tc: TC.VOUCHER_PAYABLE, venno: v.venno, transdate, transyear, transmon, status: 'Open', glstat: 'Open', ba: ctx.ba, updateby: ctx.user };
    let item = 0;
    for (const l of calc.lines) {
      await ctx.db.insert('expdettbl', {
        ...base,
        itemno: ++item,
        acctno: str(l.acctno),
        ccno: str(l.ccno),
        dept: str(input.dept),
        dramt: l.net,
        cramt: 0,
        ewtcode: str(l.ewtcode),
        ewtrate: l.ewtrate,
        ewtbase: l.ewt ? l.ewtbase : 0,
        remarksline: str(l.remarksline),
        entryfr: 'MANUAL',
        qty: 1,
        uc: l.amount,
        id: `${docno}-${item}`,
      });
    }
    if (calc.vat) await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: GL.INPUT_VAT, dramt: calc.vat, cramt: 0, entryfr: 'VAT', remarksline: 'Input VAT', id: `${docno}-${item}` });
    if (calc.ewt) await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: GL.EWT_PAYABLE, dramt: 0, cramt: calc.ewt, entryfr: 'EWT', remarksline: 'Expanded withholding tax', id: `${docno}-${item}` });
    await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: GL.AP_TRADE, dramt: 0, cramt: calc.payable, entryfr: 'AP', remarksline: `Payable to ${v.venname}`, id: `${docno}-${item}` });
    if (mmrrno) await ctx.db.update('invhdrtbl', { docno: mmrrno }, { vpno: docno });
    return { no: docno };
  },
};
registerDoc(vpService);

// ===========================================================================
// Check vouchers and cheque printing (CheckVoucher.aspx form 024, tc 43)
// ===========================================================================
async function nextCheque(db: Db, bank: string): Promise<string> {
  const rows = await db.all('cvhdrtbl', { where: { bank } });
  let max = 0;
  for (const r of rows) max = Math.max(max, Number(String(r.chno).replace(/\D/g, '')) || 0);
  return String(max ? max + 1 : 100001).padStart(6, '0');
}

export async function openVouchers(db: Db, venno: string) {
  const heads = await db.all('exphdrtbl', { where: { venno, tc: TC.VOUCHER_PAYABLE, status: 'Posted', vpbals: { gt: 0 } }, orderBy: [['transdate', 'asc']] });
  const v = await db.one('venmasttbl', { venno });
  return heads.map((h) => ({ vpno: h.docno, transdate: h.transdate, refdoc: h.refdoc, docamt: num(h.docamt), balance: num(h.vpbals), duedate: addDays(h.invdate || h.transdate, num(v?.terms)) }));
}

async function applyPayment(db: Db, vpno: string, amount: number) {
  const vp = await db.one('exphdrtbl', { docno: vpno, tc: TC.VOUCHER_PAYABLE });
  if (!vp) return;
  const bal = r2(num(vp.vpbals) - amount);
  await db.update('exphdrtbl', { docno: vpno, tc: TC.VOUCHER_PAYABLE }, { vpbals: bal, cvstat: bal <= 0.004 ? 'Paid' : bal < num(vp.docamt) ? 'Partial' : 'Unpaid' });
}

const cvService: DocService = {
  type: 'cv',
  title: 'Check Voucher',
  form: FORM.CHECK_VOUCHER,
  tc: TC.CHECK_VOUCHER,
  table: 'cvhdrtbl',
  noColumn: 'docno',

  async list(ctx, params) {
    const heads = await ctx.db.all('cvhdrtbl', { orderBy: [['transdate', 'desc'], ['docno', 'desc']] });
    const banks = await ctx.db.all('banktbl');
    const rows = heads.map((h) => ({ ...h, no: h.docno, party: h.payeename, amount: num(h.docamt), bankname: banks.find((b) => b.acctno === h.bank)?.bankname ?? h.bank }));
    return { rows: filterList(rows, params, ['docno', 'party', 'chno', 'remarks', 'bankname']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('cvhdrtbl', { docno: no });
    if (!h) return null;
    return { h, lines: await ctx.db.all('cvdettbl', { where: { docno: no }, orderBy: [['itemno', 'asc']] }) };
  },

  async view(ctx, { h, lines }) {
    const bank = await ctx.db.one('banktbl', { acctno: h.bank });
    const layout = await ctx.db.one('ng_cheque_layouts', { acctno: h.bank });
    const vpLines = lines.filter((l) => l.entryfr === 'VP');
    const printed = await ctx.db.one('prttbl', { docno: h.docno, tc: TC.CHECK_VOUCHER });
    return {
      no: h.docno,
      status: h.status,
      title: `Check Voucher ${h.docno}`,
      subtitle: `${h.payeename} · ${bank?.bankname ?? h.bank} cheque #${h.chno}`,
      header: { ...h, bankname: bank?.bankname },
      lines: vpLines,
      totals: [{ label: 'Cheque amount', value: num(h.docamt), strong: true }],
      info: [
        { label: 'Amount in words', value: numToEng(num(h.docamt)) },
        { label: 'Release status', value: h.relstat || 'Unreleased' },
        { label: 'Printed', value: printed ? `${num(printed.reprtcounter) + 1} time(s), last ${printed.datereprt || printed.transdate}` : 'Not yet' },
      ],
      links: vpLines.map((l) => ({ label: `Voucher ${l.vpno}`, type: 'vp', no: l.vpno })),
      editable: h.status === 'Open',
      print: {
        kind: 'cheque',
        payee: h.payeename,
        date: h.chdate,
        amount: num(h.docamt),
        words: numToEng(num(h.docamt)),
        bank: bank?.bankname,
        layout: layout ?? { date_x_mm: 140, date_y_mm: 10, payee_x_mm: 25, payee_y_mm: 22, amount_x_mm: 150, amount_y_mm: 22, amount_words_x_mm: 20, amount_words_y_mm: 31 },
      },
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open') defs.push({ ...STD.approve(undefined, 'Approve cheque'), hint: 'Locks the cheque details so the cheque can be printed and released.' }, STD.void());
    if (h.status === 'Approved') {
      defs.push({ id: 'release', label: 'Release cheque', right: ACTION.RELEASE, tone: 'primary', hint: 'Marks the cheque as handed to the payee, settles the vouchers and books the payment.', input: [{ key: 'reldate', label: 'Release date', type: 'date', required: true, default: today() }] });
      defs.push(STD.void());
    }
    if (h.status === 'Released') defs.push(STD.void('Cancels the cheque, reverses the payment and reopens the vouchers.'));
    return defs;
  },

  async perform(ctx, { h, lines }, action, payload) {
    const vpLines = lines.filter((l) => l.entryfr === 'VP');
    if (action === 'approve') {
      for (const l of vpLines) {
        const vp = await ctx.db.one('exphdrtbl', { docno: l.vpno, tc: TC.VOUCHER_PAYABLE });
        if (!vp || vp.status !== 'Posted') fail(`Voucher ${l.vpno} is no longer posted.`);
        if (num(l.dramt) > num(vp.vpbals) + 0.009) fail(`Voucher ${l.vpno} only has ${fmtPeso(num(vp.vpbals))} unpaid.`);
      }
      await ctx.db.update('cvhdrtbl', { docno: h.docno }, { status: 'Approved', webapp: ctx.user, dateupdate: today() });
      return `Check voucher ${h.docno} approved. Print the cheque, then release it.`;
    }
    if (action === 'release') {
      const reldate = str(payload.reldate) || today();
      await assertOpenPeriod(ctx.db, reldate, TC.CHECK_VOUCHER);
      for (const l of vpLines) await applyPayment(ctx.db, l.vpno, num(l.dramt));
      await writeGl(
        ctx,
        { tc: TC.CHECK_VOUCHER, docno: h.docno, transdate: reldate, source: 'CV' },
        lines.map((l) => ({ acctno: l.acctno, ccno: l.ccno, dramt: num(l.dramt), cramt: num(l.cramt) }))
      );
      await ctx.db.update('cvhdrtbl', { docno: h.docno }, { status: 'Released', relstat: 'Released', reldate, postingdate: reldate, updateby: ctx.user });
      for (const l of vpLines) await ctx.db.update('exphdrtbl', { docno: l.vpno, tc: TC.VOUCHER_PAYABLE }, { cvno: h.docno, cvdate: reldate, cvby: ctx.user });
      return `Cheque #${h.chno} released to ${h.payeename}.`;
    }
    if (action === 'void') {
      if (h.status === 'Released') {
        await reverseGl(ctx, TC.CHECK_VOUCHER, h.docno, today());
        for (const l of vpLines) await applyPayment(ctx.db, l.vpno, -num(l.dramt));
      }
      await ctx.db.update('cvhdrtbl', { docno: h.docno }, { status: 'Void', relstat: 'Cancelled' });
      await ctx.db.update('cvdettbl', { docno: h.docno }, { status: 'Void' });
      return `Check voucher ${h.docno} voided${h.status === 'Released' ? ' and the vouchers reopened' : ''}.`;
    }
    fail('Unknown action');
  },

  async defaults(ctx) {
    const banks = await ctx.db.all('banktbl', { orderBy: [['acctno', 'asc']], limit: 1 });
    return { transdate: today(), chdate: today(), bank: banks[0]?.acctno ?? '', lines: [] };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the voucher date.');
    await assertOpenPeriod(ctx.db, transdate, TC.CHECK_VOUCHER);
    const v = await vendor(ctx.db, need(str(input.venno), 'Choose the payee (vendor).'));
    const bankAcct = need(str(input.bank), 'Choose the bank account the cheque is drawn on.');
    const bank = await ctx.db.one('banktbl', { acctno: bankAcct });
    if (!bank) fail('That bank account does not exist.');
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.vpno) && num(l.dramt) > 0);
    if (!raw.length) fail('Select at least one voucher to pay.');
    const open = await openVouchers(ctx.db, v.venno);
    const lines: Row[] = [];
    for (const [i, l] of raw.entries()) {
      const vp = open.find((o) => o.vpno === str(l.vpno));
      if (!vp) fail(`Line ${i + 1}: voucher ${l.vpno} is not open for ${v.venname}.`);
      const amt = r2(num(l.dramt));
      if (amt > vp.balance + 0.009) fail(`Line ${i + 1}: voucher ${vp.vpno} only has ${fmtPeso(vp.balance)} unpaid.`);
      lines.push({ vpno: vp.vpno, vpdate: vp.transdate, tcref: TC.VOUCHER_PAYABLE, acctno: GL.AP_TRADE, dramt: amt, cramt: 0, entryfr: 'VP' });
    }
    const total = sum(lines, (l) => l.dramt);
    let docno = str(input.no);
    const chno = str(input.chno) || (await nextCheque(ctx.db, bankAcct));
    const clash = await ctx.db.one('cvhdrtbl', { bank: bankAcct, chno, status: { ne: 'Void' } });
    if (clash && clash.docno !== docno) fail(`Cheque #${chno} of ${bank.bankname} is already used on ${clash.docno}.`);
    const header = {
      tc: TC.CHECK_VOUCHER,
      transdate,
      venno: v.venno,
      payeename: str(input.payeename) || v.chname || v.venname,
      payeetype: 'Vendor',
      bank: bankAcct,
      chno,
      chdate: str(input.chdate) || transdate,
      docamt: total,
      remarks: str(input.remarks),
      status: 'Open',
      relstat: 'Unreleased',
      user: ctx.user,
      web: 'Y',
      ba: ctx.ba,
      branch: 'MAIN',
    };
    if (docno) {
      const h = await ctx.db.one('cvhdrtbl', { docno });
      if (!h) fail(`Check voucher ${docno} was not found.`);
      if (h.status !== 'Open') fail(`Check voucher ${docno} is ${h.status} and can no longer be edited.`);
      await ctx.db.update('cvhdrtbl', { docno }, header);
      await ctx.db.remove('cvdettbl', { docno });
    } else {
      docno = await nextDocNo(ctx.db, 'cvhdrtbl', 'docno', yearPrefix('CV', transdate));
      await ctx.db.insert('cvhdrtbl', { docno, ...header });
    }
    const { transyear, transmon } = { transyear: Number(transdate.slice(0, 4)), transmon: Number(transdate.slice(5, 7)) };
    let item = 0;
    for (const l of lines) await ctx.db.insert('cvdettbl', { docno, itemno: ++item, ...l, tc: TC.CHECK_VOUCHER, transdate, transyear, transmon, status: 'Open', user: ctx.user, ba: ctx.ba, pk: `${docno}-${item}` });
    await ctx.db.insert('cvdettbl', { docno, itemno: ++item, acctno: bankAcct, dramt: 0, cramt: total, entryfr: 'BANK', tc: TC.CHECK_VOUCHER, transdate, transyear, transmon, status: 'Open', user: ctx.user, ba: ctx.ba, pk: `${docno}-${item}` });
    return { no: docno, message: `Check voucher ${docno} saved with cheque #${chno}.` };
  },
};
registerDoc(cvService);

/** Records a cheque print in the legacy print log (prttbl) and returns the print counter. */
export async function recordPrint(ctx: Ctx, docno: string, tc: string): Promise<number> {
  return ctx.db.tx(async (db) => {
    const row = await db.one('prttbl', { docno, tc });
    if (row) {
      const n = num(row.reprtcounter) + 1;
      await db.update('prttbl', { docno, tc }, { reprtcounter: n, datereprt: today(), reprtstat: 'Reprint', user: ctx.user });
      await audit({ ...ctx, db }, { form: FORM.CHECK_VOUCHER, tc, docno, trans: `Reprint #${n}`, table: 'prttbl' });
      return n;
    }
    await db.insert('prttbl', { docno, tc, transdate: today(), stat: 'Printed', reprtcounter: 0, user: ctx.user });
    await audit({ ...ctx, db }, { form: FORM.CHECK_VOUCHER, tc, docno, trans: 'Print', table: 'prttbl' });
    return 0;
  });
}

export async function saveChequeLayout(ctx: Ctx, acctno: string, layout: Row): Promise<string> {
  await requireRight(ctx, FORM.CHECK_VOUCHER, ACTION.EDIT, 'calibrate cheque printing');
  const fields = ['date_x_mm', 'date_y_mm', 'payee_x_mm', 'payee_y_mm', 'amount_x_mm', 'amount_y_mm', 'amount_words_x_mm', 'amount_words_y_mm'];
  const row: Row = { acctno, updated_by: ctx.user };
  for (const f of fields) {
    const v = Number(layout[f]);
    if (!Number.isFinite(v) || v < 0 || v > 250) fail(`${f.replace(/_/g, ' ')} must be between 0 and 250 mm.`);
    row[f] = r2(v);
  }
  return ctx.db.tx(async (db) => {
    if (await db.one('ng_cheque_layouts', { acctno })) await db.update('ng_cheque_layouts', { acctno }, row);
    else await db.insert('ng_cheque_layouts', row);
    await audit({ ...ctx, db }, { form: FORM.CHECK_VOUCHER, docno: acctno, trans: 'Calibrate cheque layout', table: 'ng_cheque_layouts', after: row });
    return 'Cheque layout saved.';
  });
}

// ===========================================================================
// A/P reports (APReports.aspx, form 032)
// ===========================================================================
export async function apAging(ctx: Ctx, asOf = today()) {
  await requireRight(ctx, FORM.AP_REPORTS, ACTION.VIEW, 'view A/P reports');
  const heads = await ctx.db.all('exphdrtbl', { where: { tc: TC.VOUCHER_PAYABLE, status: 'Posted', vpbals: { gt: 0 } } });
  const vens = await ctx.db.all('venmasttbl');
  const map = new Map<string, Row>();
  for (const h of heads) {
    const v = vens.find((x) => x.venno === h.venno);
    const due = addDays(h.invdate || h.transdate, num(v?.terms));
    const days = daysBetween(due, asOf);
    const bucket = days <= 0 ? 'current' : days <= 30 ? 'd30' : days <= 60 ? 'd60' : days <= 90 ? 'd90' : days <= 120 ? 'd120' : 'over120';
    const g = map.get(h.venno) ?? { venno: h.venno, venname: v?.venname ?? h.venno, current: 0, d30: 0, d60: 0, d90: 0, d120: 0, over120: 0, total: 0, vouchers: [] as Row[] };
    g[bucket] = r2(g[bucket] + num(h.vpbals));
    g.total = r2(g.total + num(h.vpbals));
    g.vouchers.push({ docno: h.docno, refdoc: h.refdoc, transdate: h.transdate, duedate: due, balance: num(h.vpbals), days: Math.max(0, days) });
    map.set(h.venno, g);
  }
  const rows = [...map.values()].sort((a, b) => b.total - a.total);
  const totals: Row = { current: 0, d30: 0, d60: 0, d90: 0, d120: 0, over120: 0, total: 0 };
  for (const r of rows) for (const k of Object.keys(totals)) totals[k] = r2(totals[k] + r[k]);
  const dueThisWeek = sum(rows.flatMap((r) => r.vouchers).filter((v: Row) => v.duedate <= addDays(asOf, 7)), (v: Row) => v.balance);
  return { asOf, rows, totals, dueThisWeek };
}
