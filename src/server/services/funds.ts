import type { Db, Row } from '../db';
import { ACTION, FORM, TC } from '@/shared/codes';
import { daysBetween, today } from '@/shared/dates';
import { fmtPeso, r2, sum } from '@/shared/money';
import { Ctx, assertOpenPeriod, fail, need, nextDocNo, num, requireRight, str, yearPrefix } from './context';
import { ActionDef, DocService, STD, countBy, filterList, registerDoc } from './docs';
import { GL, GlEntry, reverseGl, writeGl } from './gl';
import { computeVoucher } from './payables';

// ===========================================================================
// Petty cash and revolving fund vouchers (CashDisb.aspx form 026; exphdrtbl tc 40 / 44)
//
// The custodian pays small expenses from the fund. Posting charges the expenses and
// reduces the fund account; Fund Replenishment (form 028) later turns a batch of these
// vouchers into one voucher payable to the custodian, which restores the fund.
// ===========================================================================
export interface FundDef {
  type: 'pcv' | 'rfv';
  tc: string;
  title: string;
  plural: string;
  fundName: string;
  prefix: string;
  account: string;
  source: string;
}

export const FUNDS: Record<string, FundDef> = {
  [TC.PETTY_CASH]: { type: 'pcv', tc: TC.PETTY_CASH, title: 'Petty Cash Voucher', plural: 'Petty cash vouchers', fundName: 'Petty Cash Fund', prefix: 'PCV', account: GL.PETTY_CASH_FUND, source: 'PCF Voucher' },
  [TC.REVOLVING_FUND]: { type: 'rfv', tc: TC.REVOLVING_FUND, title: 'Revolving Fund Voucher', plural: 'Revolving fund vouchers', fundName: 'Revolving Fund', prefix: 'RFV', account: GL.REVOLVING_FUND, source: 'RF Voucher' },
};

export function fundOf(tc: string): FundDef {
  const f = FUNDS[tc];
  if (!f) fail('Choose the fund: Petty Cash Fund or Revolving Fund.');
  return f;
}

/** Cash left in the fund: the fund account balance less vouchers not yet posted. */
export async function fundPosition(db: Db, tc: string, exceptDocno = '') {
  const f = fundOf(tc);
  const gl = await db.all('gltranstbl', { where: { acctno: f.account, glstatus: { in: ['OPEN', 'POSTED'] } } });
  const balance = r2(gl.reduce((s, l) => s + num(l.dramt) - num(l.cramt), 0));
  const drafts = await db.all('exphdrtbl', { where: { tc, status: 'Open' } });
  const pending = sum(drafts.filter((d) => d.docno !== exceptDocno), (d) => num(d.docamt));
  const unreplenished = await db.all('exphdrtbl', { where: { tc, status: 'Posted', cvstat: { isNull: true } } });
  return { fund: f.fundName, account: f.account, balance, pending, available: r2(balance - pending), unreplenished: sum(unreplenished, (d) => num(d.docamt)), unreplenishedCount: unreplenished.length };
}

function fundVoucherService(f: FundDef): DocService {
  return {
    type: f.type,
    title: f.title,
    form: FORM.PETTY_CASH,
    tc: f.tc,
    table: 'exphdrtbl',
    noColumn: 'docno',

    async list(ctx, params) {
      const heads = await ctx.db.all('exphdrtbl', { where: { tc: f.tc }, orderBy: [['transdate', 'desc'], ['docno', 'desc']] });
      const vens = await ctx.db.all('venmasttbl');
      const rows = heads.map((h) => ({
        ...h,
        no: h.docno,
        party: vens.find((v) => v.venno === h.venno)?.venname ?? h.venno,
        amount: num(h.docamt),
        repl: h.replno ? `In replenishment ${h.replno}` : h.status === 'Posted' ? 'To replenish' : '',
      }));
      return { rows: filterList(rows, params, ['docno', 'party', 'refdoc', 'remarks', 'replno']), counts: countBy(rows) };
    },

    async load(ctx, no) {
      const h = await ctx.db.one('exphdrtbl', { docno: no, tc: f.tc });
      if (!h) return null;
      return { h, lines: await ctx.db.all('expdettbl', { where: { docno: no, tc: f.tc }, orderBy: [['itemno', 'asc']] }) };
    },

    async view(ctx, { h, lines }) {
      const ven = await ctx.db.one('venmasttbl', { venno: h.venno });
      const accts = await ctx.db.all('acctcharttbl');
      const userLines = lines.filter((l) => (l.entryfr ?? 'MANUAL') === 'MANUAL');
      const vat = sum(lines.filter((l) => l.entryfr === 'VAT'), (l) => num(l.dramt));
      const ewt = sum(lines.filter((l) => l.entryfr === 'EWT'), (l) => num(l.cramt));
      const net = sum(userLines, (l) => num(l.dramt));
      const repl = h.replno ? await ctx.db.one('fundrepltbl', { replno: h.replno }) : null;
      return {
        no: h.docno,
        status: h.status,
        title: `${f.title} ${h.docno}`,
        subtitle: `${ven?.venname ?? h.venno} · paid from the ${f.fundName.toLowerCase()} by ${h.user}`,
        header: { ...h, venname: ven?.venname, fundname: f.fundName },
        lines: userLines.map((l) => ({ ...l, acctdesc: accts.find((a) => a.acctno === l.acctno)?.acctdesc, amount: num(l.uc) || num(l.dramt), net: num(l.dramt) })),
        totals: [
          { label: 'Expense (net of VAT)', value: net },
          { label: 'Input VAT', value: vat },
          ...(ewt ? [{ label: 'Less: withholding tax', value: ewt }] : []),
          { label: `Paid from the ${f.fundName.toLowerCase()}`, value: num(h.docamt), strong: true },
        ],
        info: [
          { label: 'Fund', value: f.fundName },
          { label: 'Replenishment', value: repl ? `${repl.replno} (${repl.status})` : h.status === 'Posted' ? 'Waiting to be replenished' : 'Post the voucher first' },
          ...(h.auditby ? [{ label: 'Posted by', value: `${h.auditby} on ${h.dateaudit}` }] : []),
        ],
        links: repl ? [{ label: `Fund replenishment ${repl.replno}`, type: 'fr', no: repl.replno }] : [],
        editable: h.status === 'Open',
        print: { kind: 'vp' },
      };
    },

    actionDefs(_ctx, { h }) {
      const defs: ActionDef[] = [];
      if (h.status === 'Open') defs.push({ ...STD.post(undefined, 'Post'), hint: `Charges the expenses and takes the amount out of the ${f.fundName.toLowerCase()}.` }, STD.void());
      if (h.status === 'Posted' && !h.replno) defs.push(STD.void('Reverses the entry and puts the amount back into the fund.'));
      return defs;
    },

    async perform(ctx, { h, lines }, action) {
      if (action === 'post') {
        await assertOpenPeriod(ctx.db, h.transdate, f.tc);
        const pos = await fundPosition(ctx.db, f.tc, h.docno);
        if (num(h.docamt) > pos.balance + 0.009) fail(`Only ${fmtPeso(pos.balance)} is left in the ${f.fundName.toLowerCase()}. Replenish the fund first.`);
        const entries: GlEntry[] = lines.map((l) => ({ acctno: l.acctno, ccno: l.ccno, dramt: num(l.dramt), cramt: num(l.cramt) }));
        await writeGl(ctx, { tc: f.tc, docno: h.docno, transdate: h.transdate, source: f.source }, entries);
        await ctx.db.update('exphdrtbl', { docno: h.docno, tc: f.tc }, { status: 'Posted', auditby: ctx.user, dateaudit: today(), webapp: ctx.user });
        await ctx.db.update('expdettbl', { docno: h.docno, tc: f.tc }, { status: 'Posted', glstat: 'Posted' });
        return `${f.title} ${h.docno} posted. ${fmtPeso(num(h.docamt))} is now waiting to be replenished.`;
      }
      if (action === 'void') {
        if (h.replno) fail(`${h.docno} is on fund replenishment ${h.replno}. Remove it from the replenishment first.`);
        if (h.status === 'Posted') await reverseGl(ctx, f.tc, h.docno, today());
        await ctx.db.update('exphdrtbl', { docno: h.docno, tc: f.tc }, { status: 'Void' });
        await ctx.db.update('expdettbl', { docno: h.docno, tc: f.tc }, { status: 'Void' });
        return `${f.title} ${h.docno} voided.`;
      }
      fail('Unknown action');
    },

    async defaults(ctx) {
      const pos = await fundPosition(ctx.db, f.tc);
      return { transdate: today(), lines: [{ vatable: 'Y' }], _fund: pos };
    },

    async save(ctx, input) {
      const transdate = need(str(input.transdate), 'Enter the voucher date.');
      await assertOpenPeriod(ctx.db, transdate, f.tc);
      const venno = need(str(input.venno), 'Choose who was paid.');
      const v = await ctx.db.one('venmasttbl', { venno });
      if (!v) fail(`Payee ${venno} does not exist.`);
      const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.acctno) || num(l.amount));
      if (!raw.length) fail('Add at least one expense line.');
      for (const [i, l] of raw.entries()) {
        if (!str(l.acctno)) fail(`Line ${i + 1}: choose the expense account.`);
        if (!(await ctx.db.one('acctcharttbl', { acctno: str(l.acctno) }))) fail(`Line ${i + 1}: account ${l.acctno} does not exist.`);
        if (num(l.amount) <= 0) fail(`Line ${i + 1}: enter the amount.`);
      }
      const calc = await computeVoucher(ctx.db, raw);
      let docno = str(input.no);
      const pos = await fundPosition(ctx.db, f.tc, docno);
      if (calc.payable > pos.available + 0.009) fail(`Only ${fmtPeso(Math.max(0, pos.available))} is available in the ${f.fundName.toLowerCase()}. Replenish the fund or reduce the amount.`);
      const header = {
        tc: f.tc,
        transdate,
        venno,
        refdoc: str(input.refdoc),
        invdate: str(input.invdate) || transdate,
        dept: str(input.dept),
        remarks: str(input.remarks),
        docamt: calc.payable,
        vpbals: 0,
        status: 'Open',
        updateby: ctx.user,
        datechange: today(),
        web: 'Y',
        ba: ctx.ba,
        branch: 'MAIN',
      };
      if (docno) {
        const h = await ctx.db.one('exphdrtbl', { docno, tc: f.tc });
        if (!h) fail(`${f.title} ${docno} was not found.`);
        if (h.status !== 'Open') fail(`${docno} is ${h.status} and can no longer be edited.`);
        await ctx.db.update('exphdrtbl', { docno, tc: f.tc }, header);
        await ctx.db.remove('expdettbl', { docno, tc: f.tc });
      } else {
        docno = await nextDocNo(ctx.db, 'exphdrtbl', 'docno', yearPrefix(f.prefix, transdate));
        // The custodian is the user who records the voucher, as in the legacy system.
        await ctx.db.insert('exphdrtbl', { docno, ...header, user: ctx.user });
      }
      const base = { docno, tc: f.tc, venno, transdate, transyear: Number(transdate.slice(0, 4)), transmon: Number(transdate.slice(5, 7)), status: 'Open', glstat: 'Open', ba: ctx.ba, updateby: ctx.user };
      let item = 0;
      for (const l of calc.lines) {
        await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: str(l.acctno), ccno: str(l.ccno), dept: str(input.dept), dramt: l.net, cramt: 0, ewtcode: str(l.ewtcode), ewtrate: l.ewtrate, ewtbase: l.ewt ? l.ewtbase : 0, remarksline: str(l.remarksline), entryfr: 'MANUAL', qty: 1, uc: l.amount, id: `${docno}-${item}` });
      }
      if (calc.vat) await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: GL.INPUT_VAT, dramt: calc.vat, cramt: 0, entryfr: 'VAT', remarksline: 'Input VAT', id: `${docno}-${item}` });
      if (calc.ewt) await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: GL.EWT_PAYABLE, dramt: 0, cramt: calc.ewt, entryfr: 'EWT', remarksline: 'Expanded withholding tax', id: `${docno}-${item}` });
      await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: f.account, dramt: 0, cramt: calc.payable, entryfr: 'FUND', remarksline: `Paid from the ${f.fundName.toLowerCase()}`, id: `${docno}-${item}` });
      return { no: docno };
    },
  };
}
registerDoc(fundVoucherService(FUNDS[TC.PETTY_CASH]));
registerDoc(fundVoucherService(FUNDS[TC.REVOLVING_FUND]));

// ===========================================================================
// Fund replenishment (FundRepl.aspx form 028; fundrepltbl)
// ===========================================================================
const REPL_START = 900000000001;

async function nextReplNo(db: Db): Promise<string> {
  const rows = await db.all('fundrepltbl');
  let max = 0;
  for (const r of rows) max = Math.max(max, Number(String(r.replno).replace(/\D/g, '')) || 0);
  return String(max ? max + 1 : REPL_START).padStart(12, '0');
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Remarks as the legacy page writes them: a range when the whole series is replenished, else a list. */
export function replenishmentRemarks(fundName: string, docnos: string[], series: string[]): string {
  const sorted = [...docnos].sort();
  if (!sorted.length) return '';
  if (sorted.length === 1) return `Representing ${fundName} replenishment from Doc. No ${sorted[0]}`;
  const all = [...series].sort();
  const whole = all.length === sorted.length && all.every((d, i) => d === sorted[i]);
  return whole ? `Representing ${fundName} replenishment from Doc. Nos ${sorted[0]} to ${sorted[sorted.length - 1]}` : `Representing ${fundName} replenishment for Doc. Nos ${sorted.join(', ')}`;
}

/** Posted vouchers of a custodian that are not on any replenishment yet (plus those already on `replno`). */
export async function openFundVouchers(ctx: Ctx, tc: string, custodian: string, replno = '') {
  fundOf(tc);
  const heads = await ctx.db.all('exphdrtbl', { where: { tc, status: 'Posted' }, orderBy: [['docno', 'asc']] });
  const vens = await ctx.db.all('venmasttbl');
  return heads
    .filter((h) => (!h.replno && !h.cvstat && str(h.user).toLowerCase() === custodian.toLowerCase()) || (replno && h.replno === replno))
    .map((h) => ({ docno: h.docno, transdate: h.transdate, payee: vens.find((v) => v.venno === h.venno)?.venname ?? h.venno, amount: num(h.docamt), remarks: h.remarks, user: h.user }));
}

/** Users holding unreplenished vouchers of a fund (the custodians who can be replenished). */
export async function fundCustodians(ctx: Ctx, tc: string) {
  const heads = await ctx.db.all('exphdrtbl', { where: { tc, status: 'Posted', cvstat: { isNull: true } } });
  const users = await ctx.db.all('sys_userrecords');
  const map = new Map<string, { username: string; name: string; count: number; amount: number }>();
  for (const h of heads) {
    const k = str(h.user);
    const g = map.get(k) ?? { username: k, name: users.find((u) => u.username === k)?.userfullname ?? k, count: 0, amount: 0 };
    g.count += 1;
    g.amount = r2(g.amount + num(h.docamt));
    map.set(k, g);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

const frService: DocService = {
  type: 'fr',
  title: 'Fund Replenishment',
  form: FORM.FUND_REPLENISHMENT,
  table: 'fundrepltbl',
  noColumn: 'replno',

  async list(ctx, params) {
    const heads = await ctx.db.all('fundrepltbl', { orderBy: [['transdate', 'desc'], ['replno', 'desc']] });
    const vens = await ctx.db.all('venmasttbl');
    const rows = heads.map((h) => ({
      ...h,
      no: h.replno,
      status: cap(str(h.status)),
      party: vens.find((v) => v.venno === h.venno)?.venname ?? h.venno,
      fundname: FUNDS[h.tc]?.fundName ?? h.tc,
      amount: num(h.totalamt),
      voucher: h.vpno && h.vpno !== '0' ? h.vpno : 'Not yet',
    }));
    return { rows: filterList(rows, params, ['replno', 'party', 'remarks', 'fundname', 'voucher']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('fundrepltbl', { replno: no });
    if (!h) return null;
    return { h, lines: await ctx.db.all('exphdrtbl', { where: { replno: no, tc: h.tc }, orderBy: [['docno', 'asc']] }) };
  },

  async view(ctx, { h, lines }) {
    const f = fundOf(h.tc);
    const vens = await ctx.db.all('venmasttbl');
    const custodian = await ctx.db.one('sys_userrecords', { username: h.user });
    const hasVp = Boolean(h.vpno && h.vpno !== '0');
    const vp = hasVp ? await ctx.db.one('exphdrtbl', { docno: h.vpno, tc: TC.VOUCHER_PAYABLE }) : null;
    return {
      no: h.replno,
      status: cap(str(h.status)),
      title: `Fund Replenishment ${h.replno}`,
      subtitle: `${f.fundName} · ${lines.length} voucher(s) of ${custodian?.userfullname ?? h.user}`,
      header: { ...h, fundname: f.fundName, venname: vens.find((v) => v.venno === h.venno)?.venname ?? h.venno, custodian: custodian?.userfullname ?? h.user },
      lines: lines.map((l) => ({ docno: l.docno, transdate: l.transdate, payee: vens.find((v) => v.venno === l.venno)?.venname ?? l.venno, amount: num(l.docamt), remarks: l.remarks })),
      totals: [
        { label: 'Vouchers', value: lines.length, kind: 'qty' },
        { label: 'Amount to replenish', value: num(h.totalamt), strong: true },
      ],
      info: [
        { label: 'Voucher payable', value: hasVp ? `${h.vpno}${vp ? ` (${vp.status}${vp.cvstat ? ', ' + vp.cvstat : ''})` : ''}` : 'Not created yet' },
        ...(h.postingdate ? [{ label: 'Paid on', value: String(h.postingdate) }] : []),
        ...(h.changeby ? [{ label: 'Last changed by', value: String(h.changeby) }] : []),
      ],
      links: [...(hasVp ? [{ label: `Voucher payable ${h.vpno}`, type: 'vp', no: h.vpno }] : []), ...lines.map((l) => ({ label: l.docno, type: f.type, no: l.docno }))],
      editable: str(h.status) === 'unpaid' && !hasVp,
    };
  },

  actionDefs(_ctx, { h }) {
    const hasVp = Boolean(h.vpno && h.vpno !== '0');
    return str(h.status) === 'unpaid' && !hasVp ? [STD.void('The vouchers return to the custodian and can be replenished again.')] : [];
  },

  async perform(ctx, { h }, action) {
    if (action !== 'void') fail('Unknown action');
    await ctx.db.update('exphdrtbl', { replno: h.replno, tc: h.tc }, { cvstat: null, replno: null, postedby: null, datepost: null });
    await ctx.db.update('fundrepltbl', { replno: h.replno }, { status: 'void', changeby: ctx.user });
    return `Replenishment ${h.replno} voided. Its vouchers can be replenished again.`;
  },

  async defaults(ctx) {
    const custodians = await ctx.db.all('venmasttbl', { where: { pcfcust: 'Y' } });
    const waitingPcf = await fundCustodians(ctx, TC.PETTY_CASH);
    const waitingRf = await fundCustodians(ctx, TC.REVOLVING_FUND);
    const tc = waitingPcf.length || !waitingRf.length ? TC.PETTY_CASH : TC.REVOLVING_FUND;
    const user = (tc === TC.PETTY_CASH ? waitingPcf : waitingRf)[0]?.username ?? ctx.user;
    return { transdate: today(), tc, user, venno: custodians.length === 1 ? custodians[0].venno : '', lines: [] };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the replenishment date.');
    const f = fundOf(str(input.tc));
    const custodian = need(str(input.user), 'Choose whose vouchers to replenish.');
    const venno = need(str(input.venno), 'Choose the custodian to be paid (an employee vendor marked as fund custodian).');
    const ven = await ctx.db.one('venmasttbl', { venno });
    if (!ven) fail(`Vendor ${venno} does not exist.`);
    if (str(ven.pcfcust).toUpperCase() !== 'Y') fail(`${ven.venname} is not marked as a fund custodian in the vendor master.`);
    let replno = str(input.no);
    if (replno) {
      const h = await ctx.db.one('fundrepltbl', { replno });
      if (!h) fail(`Replenishment ${replno} was not found.`);
      if (str(h.status) !== 'unpaid' || (h.vpno && h.vpno !== '0')) fail(`Replenishment ${replno} already has a voucher payable and can no longer be changed.`);
    }
    const open = await openFundVouchers(ctx, f.tc, custodian, replno);
    const picked: string[] = [...new Set<string>((input.lines ?? []).map((l: Row) => str(l.docno)).filter(Boolean))];
    if (!picked.length) fail('Select at least one voucher to replenish.');
    const chosen = picked.map((d) => open.find((o) => o.docno === d) ?? fail(`Voucher ${d} is not waiting for replenishment.`));
    const total = sum(chosen, (c) => c.amount);
    const remarks = str(input.remarks) || replenishmentRemarks(f.fundName, picked, open.map((o) => o.docno));
    const sorted = [...picked].sort();
    const header = { tc: f.tc, transdate, docnofr: sorted[0], docnoto: sorted[sorted.length - 1], totalamt: total, remarks: remarks.slice(0, 250), user: custodian, ba: ctx.ba, venno, branch: 'MAIN' };
    if (replno) {
      await ctx.db.update('exphdrtbl', { replno, tc: f.tc }, { cvstat: null, replno: null, postedby: null, datepost: null });
      await ctx.db.update('fundrepltbl', { replno }, { ...header, changeby: ctx.user });
    } else {
      replno = await nextReplNo(ctx.db);
      await ctx.db.insert('fundrepltbl', { replno, ...header, status: 'unpaid', vpno: '0' });
    }
    for (const d of picked) await ctx.db.update('exphdrtbl', { docno: d, tc: f.tc }, { cvstat: 'repl', replno, postedby: ctx.user, datepost: today() });
    return { no: replno, message: `Replenishment ${replno} saved: ${fmtPeso(total)} for ${picked.length} voucher(s). Next, create the voucher payable.` };
  },
};
registerDoc(frService);

// ===========================================================================
// Cash advance liquidation (Liquidation.aspx "CA Liquidation", form 038; exphdrtbl tc 46)
//
// A cash advance is a voucher payable (tc 42) charged to Advances to Employees. The
// liquidation books what was actually spent, clears the advance, and settles the
// difference: a refund returned to the cashier, or an extra reimbursement payable.
// ===========================================================================
async function advanceAmount(db: Db, vpno: string): Promise<number> {
  const lines = await db.all('expdettbl', { where: { docno: vpno, tc: TC.VOUCHER_PAYABLE, acctno: GL.ADVANCES_EMPLOYEES } });
  return sum(lines, (l) => num(l.dramt) - num(l.cramt));
}

/** Posted cash advances not yet liquidated. */
export async function openAdvances(db: Db) {
  const lines = await db.all('expdettbl', { where: { tc: TC.VOUCHER_PAYABLE, acctno: GL.ADVANCES_EMPLOYEES, dramt: { gt: 0 } } });
  const docnos = [...new Set(lines.map((l) => l.docno))];
  const vens = await db.all('venmasttbl');
  const out: Row[] = [];
  for (const d of docnos) {
    const h = await db.one('exphdrtbl', { docno: d, tc: TC.VOUCHER_PAYABLE });
    if (!h || h.status !== 'Posted' || (h.liqstat && h.liqstat !== 'Open')) continue;
    out.push({ docno: d, transdate: h.transdate, venno: h.venno, payee: vens.find((v) => v.venno === h.venno)?.venname ?? h.venno, amount: await advanceAmount(db, d), remarks: h.remarks, days: daysBetween(h.transdate, today()), paid: h.cvstat === 'Paid' });
  }
  return out.sort((a, b) => String(a.transdate).localeCompare(String(b.transdate)));
}

const liqService: DocService = {
  type: 'liq',
  title: 'Cash Advance Liquidation',
  form: FORM.CA_LIQUIDATION,
  tc: TC.CA_LIQUIDATION,
  table: 'exphdrtbl',
  noColumn: 'docno',

  async list(ctx, params) {
    const heads = await ctx.db.all('exphdrtbl', { where: { tc: TC.CA_LIQUIDATION }, orderBy: [['transdate', 'desc'], ['docno', 'desc']] });
    const vens = await ctx.db.all('venmasttbl');
    const spentLines = await ctx.db.all('expdettbl', { where: { tc: TC.CA_LIQUIDATION, entryfr: 'MANUAL' } });
    const rows = heads.map((h) => ({
      ...h,
      no: h.docno,
      party: vens.find((v) => v.venno === h.venno)?.venname ?? h.venno,
      advance: h.refdoc,
      amount: sum(spentLines.filter((l) => l.docno === h.docno), (l) => num(l.uc) || num(l.dramt)),
      reimburse: num(h.docamt),
    }));
    return { rows: filterList(rows, params, ['docno', 'party', 'refdoc', 'remarks']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('exphdrtbl', { docno: no, tc: TC.CA_LIQUIDATION });
    if (!h) return null;
    return { h, lines: await ctx.db.all('expdettbl', { where: { docno: no, tc: TC.CA_LIQUIDATION }, orderBy: [['itemno', 'asc']] }) };
  },

  async view(ctx, { h, lines }) {
    const ven = await ctx.db.one('venmasttbl', { venno: h.venno });
    const accts = await ctx.db.all('acctcharttbl');
    const userLines = lines.filter((l) => (l.entryfr ?? 'MANUAL') === 'MANUAL');
    const spent = sum(userLines, (l) => num(l.uc) || num(l.dramt));
    const advance = sum(lines.filter((l) => l.entryfr === 'CA'), (l) => num(l.cramt));
    const refund = sum(lines.filter((l) => l.entryfr === 'REFUND'), (l) => num(l.dramt));
    const reimburse = sum(lines.filter((l) => l.entryfr === 'AP'), (l) => num(l.cramt));
    const cvs = await ctx.db.all('cvdettbl', { where: { vpno: h.docno, tcref: TC.CA_LIQUIDATION } });
    return {
      no: h.docno,
      status: h.status,
      title: `Liquidation ${h.docno}`,
      subtitle: `${ven?.venname ?? h.venno} · cash advance ${h.refdoc}`,
      header: { ...h, venname: ven?.venname, caamt: advance },
      lines: userLines.map((l) => ({ ...l, acctdesc: accts.find((a) => a.acctno === l.acctno)?.acctdesc, amount: num(l.uc) || num(l.dramt), net: num(l.dramt) })),
      totals: [
        { label: 'Spent (VAT incl.)', value: spent },
        { label: 'Cash advance', value: advance },
        ...(refund ? [{ label: 'Refund returned to the cashier', value: refund, strong: true }] : []),
        ...(reimburse ? [{ label: 'Reimbursement to the employee', value: reimburse, strong: true }] : []),
        ...(!refund && !reimburse ? [{ label: 'Difference', value: 0, strong: true }] : []),
        ...(h.status === 'Posted' && reimburse ? [{ label: 'Reimbursement unpaid', value: num(h.vpbals), strong: true }] : []),
      ],
      info: [
        { label: 'Settlement', value: refund ? `${fmtPeso(refund)} refund to the cashier` : reimburse ? `${fmtPeso(reimburse)} to be paid to the employee` : 'Spent exactly the advance' },
        ...(h.auditby ? [{ label: 'Posted by', value: `${h.auditby} on ${h.dateaudit}` }] : []),
      ],
      links: [{ label: `Cash advance ${h.refdoc}`, type: 'vp', no: h.refdoc }, ...[...new Set(cvs.map((c) => c.docno))].map((c) => ({ label: `Check voucher ${c}`, type: 'cv', no: c }))],
      editable: h.status === 'Open',
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open') defs.push({ ...STD.post(undefined, 'Post liquidation'), hint: 'Books the expenses, clears the advance and records the refund or reimbursement.' }, STD.void());
    if (h.status === 'Posted' && num(h.vpbals) >= num(h.docamt) - 0.009) defs.push(STD.void('Reverses the liquidation and reopens the cash advance.'));
    return defs;
  },

  async perform(ctx, { h, lines }, action) {
    if (action === 'post') {
      await assertOpenPeriod(ctx.db, h.transdate, TC.CA_LIQUIDATION);
      const adv = await ctx.db.one('exphdrtbl', { docno: h.refdoc, tc: TC.VOUCHER_PAYABLE });
      if (!adv || adv.status !== 'Posted') fail(`Cash advance ${h.refdoc} is no longer posted.`);
      if (adv.liqstat && adv.liqstat !== 'Open') fail(`Cash advance ${h.refdoc} is already liquidated.`);
      await writeGl(ctx, { tc: TC.CA_LIQUIDATION, docno: h.docno, transdate: h.transdate, source: 'CA Liquidation' }, lines.map((l) => ({ acctno: l.acctno, ccno: l.ccno, dramt: num(l.dramt), cramt: num(l.cramt) })));
      const reimburse = num(h.docamt);
      await ctx.db.update('exphdrtbl', { docno: h.docno, tc: TC.CA_LIQUIDATION }, { status: 'Posted', auditby: ctx.user, dateaudit: today(), webapp: ctx.user, vpbals: reimburse, cvstat: reimburse > 0 ? 'Unpaid' : 'Paid' });
      await ctx.db.update('expdettbl', { docno: h.docno, tc: TC.CA_LIQUIDATION }, { status: 'Posted', glstat: 'Posted' });
      await ctx.db.update('exphdrtbl', { docno: h.refdoc, tc: TC.VOUCHER_PAYABLE }, { liqstat: 'Liquidated', replno: h.docno });
      return reimburse > 0 ? `Liquidation posted. ${fmtPeso(reimburse)} is ready to be paid to the employee.` : `Liquidation posted and cash advance ${h.refdoc} is cleared.`;
    }
    if (action === 'void') {
      if (h.status === 'Posted') {
        const paid = await ctx.db.all('cvdettbl', { where: { vpno: h.docno, tcref: TC.CA_LIQUIDATION } });
        for (const c of paid) {
          const cv = await ctx.db.one('cvhdrtbl', { docno: c.docno });
          if (cv && cv.status !== 'Void') fail(`The reimbursement is on check voucher ${cv.docno}. Void the check voucher first.`);
        }
        await reverseGl(ctx, TC.CA_LIQUIDATION, h.docno, today());
        await ctx.db.update('exphdrtbl', { docno: h.refdoc, tc: TC.VOUCHER_PAYABLE }, { liqstat: 'Open', replno: null });
      }
      await ctx.db.update('exphdrtbl', { docno: h.docno, tc: TC.CA_LIQUIDATION }, { status: 'Void', vpbals: 0 });
      await ctx.db.update('expdettbl', { docno: h.docno, tc: TC.CA_LIQUIDATION }, { status: 'Void' });
      return `Liquidation ${h.docno} voided${h.status === 'Posted' ? ` and cash advance ${h.refdoc} reopened` : ''}.`;
    }
    fail('Unknown action');
  },

  async defaults() {
    return { transdate: today(), lines: [{ vatable: 'Y' }] };
  },

  async sources(ctx, source) {
    if (source !== 'ca') return [];
    return (await openAdvances(ctx.db)).map((a) => ({ no: a.docno, date: a.transdate, party: a.payee, amount: a.amount, note: `${a.days} day(s) old${a.paid ? '' : ' · advance not yet released'}${a.remarks ? ' · ' + a.remarks : ''}` }));
  },

  async prefill(ctx, source, vpno) {
    if (source !== 'ca') fail('Unknown source');
    const adv = (await openAdvances(ctx.db)).find((a) => a.docno === vpno);
    if (!adv) fail(`Cash advance ${vpno} is not open for liquidation.`);
    return { transdate: today(), refdoc: vpno, venno: adv.venno, caamt: adv.amount, remarks: `Liquidation of cash advance ${vpno}${adv.remarks ? ' - ' + adv.remarks : ''}`, lines: [{ vatable: 'Y' }] };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the liquidation date.');
    await assertOpenPeriod(ctx.db, transdate, TC.CA_LIQUIDATION);
    const refdoc = need(str(input.refdoc), 'Choose the cash advance to liquidate ("Liquidate a cash advance").');
    const adv = await ctx.db.one('exphdrtbl', { docno: refdoc, tc: TC.VOUCHER_PAYABLE });
    if (!adv || adv.status !== 'Posted') fail(`Cash advance ${refdoc} is not posted.`);
    const advance = await advanceAmount(ctx.db, refdoc);
    if (advance <= 0) fail(`${refdoc} is not a cash advance (it is not charged to Advances to Employees).`);
    let docno = str(input.no);
    const other = (await ctx.db.all('exphdrtbl', { where: { tc: TC.CA_LIQUIDATION, refdoc, status: { ne: 'Void' } } })).find((d) => d.docno !== docno);
    if (other) fail(`Cash advance ${refdoc} is already being liquidated on ${other.docno}.`);
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.acctno) || num(l.amount));
    if (!raw.length) fail('Add what the advance was spent on.');
    for (const [i, l] of raw.entries()) {
      if (!str(l.acctno)) fail(`Line ${i + 1}: choose the expense account.`);
      if (!(await ctx.db.one('acctcharttbl', { acctno: str(l.acctno) }))) fail(`Line ${i + 1}: account ${l.acctno} does not exist.`);
      if (num(l.amount) <= 0) fail(`Line ${i + 1}: enter the amount.`);
    }
    const calc = await computeVoucher(ctx.db, raw.map((l) => ({ ...l, ewtcode: '' })));
    const diff = r2(advance - calc.gross);
    const reimburse = diff < 0 ? -diff : 0;
    const refund = diff > 0 ? diff : 0;
    const header = { tc: TC.CA_LIQUIDATION, transdate, venno: adv.venno, refdoc, reflabel: 'CA Liquidation', remarks: str(input.remarks), docamt: reimburse, vpbals: 0, status: 'Open', updateby: ctx.user, datechange: today(), web: 'Y', ba: ctx.ba, branch: 'MAIN' };
    if (docno) {
      const h = await ctx.db.one('exphdrtbl', { docno, tc: TC.CA_LIQUIDATION });
      if (!h) fail(`Liquidation ${docno} was not found.`);
      if (h.status !== 'Open') fail(`Liquidation ${docno} is ${h.status} and can no longer be edited.`);
      await ctx.db.update('exphdrtbl', { docno, tc: TC.CA_LIQUIDATION }, header);
      await ctx.db.remove('expdettbl', { docno, tc: TC.CA_LIQUIDATION });
    } else {
      docno = await nextDocNo(ctx.db, 'exphdrtbl', 'docno', yearPrefix('LIQ', transdate));
      await ctx.db.insert('exphdrtbl', { docno, ...header, user: ctx.user, liqstat: '' });
    }
    const base = { docno, tc: TC.CA_LIQUIDATION, venno: adv.venno, transdate, transyear: Number(transdate.slice(0, 4)), transmon: Number(transdate.slice(5, 7)), status: 'Open', glstat: 'Open', ba: ctx.ba, updateby: ctx.user };
    let item = 0;
    for (const l of calc.lines) await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: str(l.acctno), ccno: str(l.ccno), dramt: l.net, cramt: 0, remarksline: str(l.remarksline), entryfr: 'MANUAL', qty: 1, uc: l.amount, id: `${docno}-${item}` });
    if (calc.vat) await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: GL.INPUT_VAT, dramt: calc.vat, cramt: 0, entryfr: 'VAT', remarksline: 'Input VAT', id: `${docno}-${item}` });
    await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: GL.ADVANCES_EMPLOYEES, dramt: 0, cramt: advance, entryfr: 'CA', remarksline: `Clears cash advance ${refdoc}`, id: `${docno}-${item}` });
    if (refund) await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: GL.CASH_ON_HAND, dramt: refund, cramt: 0, entryfr: 'REFUND', remarksline: 'Unspent cash returned to the cashier', id: `${docno}-${item}` });
    if (reimburse) await ctx.db.insert('expdettbl', { ...base, itemno: ++item, acctno: GL.AP_TRADE, dramt: 0, cramt: reimburse, entryfr: 'AP', remarksline: 'Additional reimbursement to the employee', id: `${docno}-${item}` });
    return { no: docno, message: refund ? `Liquidation ${docno} saved. ${fmtPeso(refund)} is to be returned to the cashier.` : reimburse ? `Liquidation ${docno} saved. ${fmtPeso(reimburse)} will be reimbursed to the employee.` : `Liquidation ${docno} saved.` };
  },
};
registerDoc(liqService);

// ---------------------------------------------------------------------------
// Summary blocks shown above the document lists
// ---------------------------------------------------------------------------
export async function fundSummary(ctx: Ctx, type: string) {
  if (type === 'pcv' || type === 'rfv') {
    const tc = type === 'pcv' ? TC.PETTY_CASH : TC.REVOLVING_FUND;
    await requireRight(ctx, FORM.PETTY_CASH, ACTION.VIEW, 'view fund vouchers');
    const p = await fundPosition(ctx.db, tc);
    return [
      { label: `${p.fund} on hand`, value: p.balance, sub: p.pending ? `${fmtPeso(p.pending)} in vouchers not yet posted` : 'After all posted vouchers', tone: p.balance < 0.2 * (p.balance + p.unreplenished) ? 'amber' : 'emerald' },
      { label: 'Waiting to be replenished', value: p.unreplenished, sub: `${p.unreplenishedCount} posted voucher(s)`, tone: 'blue', href: '/dashboard/doc/fr/new' },
      { label: 'Available for new vouchers', value: Math.max(0, p.available), sub: 'Fund on hand less draft vouchers', tone: 'violet' },
    ];
  }
  if (type === 'fr') {
    await requireRight(ctx, FORM.FUND_REPLENISHMENT, ACTION.VIEW, 'view fund replenishments');
    const rows = await ctx.db.all('fundrepltbl', { where: { status: 'unpaid' } });
    const noVp = rows.filter((r) => !r.vpno || r.vpno === '0');
    const pcf = await fundPosition(ctx.db, TC.PETTY_CASH);
    const rf = await fundPosition(ctx.db, TC.REVOLVING_FUND);
    return [
      { label: 'Ready to replenish', value: r2(pcf.unreplenished + rf.unreplenished), sub: `${pcf.unreplenishedCount + rf.unreplenishedCount} posted voucher(s) not yet on a replenishment`, tone: 'blue', href: '/dashboard/doc/fr/new' },
      { label: 'Need a voucher payable', value: sum(noVp, (r) => num(r.totalamt)), sub: `${noVp.length} replenishment(s)`, tone: noVp.length ? 'amber' : 'emerald' },
      { label: 'Unpaid replenishments', value: sum(rows, (r) => num(r.totalamt)), sub: `${rows.length} waiting for the cheque`, tone: 'violet' },
    ];
  }
  if (type === 'liq') {
    await requireRight(ctx, FORM.CA_LIQUIDATION, ACTION.VIEW, 'view liquidations');
    const adv = await openAdvances(ctx.db);
    const old = adv.filter((a) => a.days > 30);
    const due = await ctx.db.all('exphdrtbl', { where: { tc: TC.CA_LIQUIDATION, status: 'Posted', vpbals: { gt: 0 } } });
    return [
      { label: 'Open cash advances', value: sum(adv, (a) => a.amount), sub: `${adv.length} advance(s) to liquidate`, tone: adv.length ? 'blue' : 'emerald' },
      { label: 'Older than 30 days', value: sum(old, (a) => a.amount), sub: old.length ? `${old.length} overdue for liquidation` : 'None overdue', tone: old.length ? 'rose' : 'emerald' },
      { label: 'Reimbursements to pay', value: sum(due, (d) => num(d.vpbals)), sub: `${due.length} liquidation(s)`, tone: 'violet' },
    ];
  }
  return [];
}
