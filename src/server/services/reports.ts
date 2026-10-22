// Report library: the registers and summaries of the legacy report pages (APReports,
// CashierReports, SD / FI report viewers), each one a query over the legacy tables that the
// shared report viewer shows as cards or a list, prints with the company header and exports.
import type { Row, Where } from '../db';
import { ACTION, FORM, INVOICE_TCS, TC, TC_NAMES } from '@/shared/codes';
import { monthStart, today } from '@/shared/dates';
import { r2, r4, sum } from '@/shared/money';
import { Ctx, fail, isAllowed, num, requireRight, str } from './context';

export type ColKind = 'text' | 'mono' | 'date' | 'money' | 'qty' | 'int' | 'status';

export interface RCol {
  key: string;
  label: string;
  kind?: ColKind;
  total?: boolean;
  card?: 'title' | 'subtitle' | 'amount' | 'badge' | 'meta' | 'hide';
}

export interface RParam {
  key: string;
  label: string;
  type: 'date' | 'select' | 'text';
  def?: string; // 'monthStart' | 'today' | 'yearStart' or a literal
  options?: { value: string; label: string }[];
  optionsFrom?: 'banks' | 'salesmen' | 'areas';
}

export interface ReportDef {
  id: string; // module/slug
  module: 'gl' | 'ap' | 'ar' | 'sd';
  title: string;
  description: string;
  legacy: string; // where it was in the legacy system
  form: string;
  params: RParam[];
  columns: RCol[];
  link?: { type: string; key: string }; // open the source document from a row (a row's own _href wins)
  run(ctx: Ctx, p: Record<string, string>): Promise<Row[]>;
}

const FROM: RParam = { key: 'from', label: 'From', type: 'date', def: 'monthStart' };
const TO: RParam = { key: 'to', label: 'To', type: 'date', def: 'today' };
const STATUS = (opts: string[]): RParam => ({ key: 'status', label: 'Status', type: 'select', def: 'all', options: [{ value: 'all', label: 'All' }, ...opts.map((o) => ({ value: o, label: o }))] });
const SEARCH = (label: string): RParam => ({ key: 'q', label, type: 'text', def: '' });

const inRange = (p: Record<string, string>, col = 'transdate'): Where => ({ [col]: { gte: p.from || '0000-01-01', lte: p.to || '9999-12-31' } });
const statusOk = (p: Record<string, string>, s: unknown) => !p.status || p.status === 'all' || String(s ?? '').toLowerCase() === p.status.toLowerCase();
const notVoid = (s: unknown) => String(s ?? '').toLowerCase() !== 'void';
const has = (q: string | undefined, ...vals: unknown[]) => !q || vals.some((v) => String(v ?? '').toLowerCase().includes(q.toLowerCase()));
const byDate = (a: Row, b: Row, col = 'transdate', no = 'docno') => String(a[col]).localeCompare(String(b[col])) || String(a[no]).localeCompare(String(b[no]), undefined, { numeric: true });

async function names(ctx: Ctx) {
  const [vens, custs, smns, areas, banks, accts] = await Promise.all([
    ctx.db.all('venmasttbl'),
    ctx.db.all('custmasttbl'),
    ctx.db.all('smnmtbl'),
    ctx.db.all('areatbl'),
    ctx.db.all('banktbl'),
    ctx.db.all('acctcharttbl'),
  ]);
  const map = (rows: Row[], k: string, v: string) => new Map(rows.map((r) => [String(r[k]), String(r[v] ?? r[k])]));
  return {
    ven: map(vens, 'venno', 'venname'),
    venTin: map(vens, 'venno', 'tin'),
    venTerms: map(vens, 'venno', 'terms'),
    cust: map(custs, 'custno', 'bussname'),
    smn: map(smns, 'smnno', 'fullname'),
    area: map(areas, 'areano', 'areaname'),
    bank: map(banks, 'acctno', 'bankname'),
    acct: map(accts, 'acctno', 'acctdesc'),
  };
}

const label = (m: Map<string, string>, k: unknown) => (k ? m.get(String(k)) ?? String(k) : '');
const tcName = (tc: unknown) => TC_NAMES[String(tc)]?.document ?? `TC ${tc}`;

function groupSum(rows: Row[], keyOf: (r: Row) => string, init: (r: Row) => Row, add: (g: Row, r: Row) => void): Row[] {
  const m = new Map<string, Row>();
  for (const r of rows) {
    const k = keyOf(r);
    const g = m.get(k) ?? init(r);
    add(g, r);
    m.set(k, g);
  }
  return [...m.values()];
}

// ---------------------------------------------------------------------------
// Payables (legacy APReports.aspx, FIreportViewer registers)
// ---------------------------------------------------------------------------
const AP: ReportDef[] = [
  {
    id: 'ap/vp-register',
    module: 'ap',
    title: 'Voucher Payable Register',
    description: 'Every voucher payable in the period with its supplier invoice, amount and unpaid balance.',
    legacy: 'APReports › Registers › Voucher Payables',
    form: FORM.AP_REPORTS,
    params: [FROM, TO, STATUS(['Open', 'Approved', 'Posted', 'Void']), SEARCH('Vendor or invoice')],
    columns: [
      { key: 'docno', label: 'VP no.', kind: 'mono', card: 'title' },
      { key: 'vendor', label: 'Vendor', card: 'subtitle' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'refdoc', label: 'Invoice' },
      { key: 'cvstat', label: 'Payment' },
      { key: 'docamt', label: 'Amount', kind: 'money', total: true, card: 'amount' },
      { key: 'vpbals', label: 'Unpaid', kind: 'money', total: true },
      { key: 'status', label: 'Status', kind: 'status', card: 'badge' },
    ],
    link: { type: 'vp', key: 'docno' },
    async run(ctx, p) {
      const n = await names(ctx);
      const heads = await ctx.db.all('exphdrtbl', { where: { tc: TC.VOUCHER_PAYABLE, ...inRange(p) } });
      return heads
        .map((h): Row => ({ ...h, vendor: label(n.ven, h.venno), docamt: num(h.docamt), vpbals: notVoid(h.status) ? num(h.vpbals) : 0 }))
        .filter((r) => statusOk(p, r.status) && has(p.q, r.vendor, r.refdoc, r.docno))
        .sort((a, b) => byDate(a, b));
    },
  },
  {
    id: 'ap/cv-register',
    module: 'ap',
    title: 'Check Voucher Register',
    description: 'Cheques written in the period by bank, with payee, cheque number and release status.',
    legacy: 'APReports › Registers › Check Voucher (rptFI_CVregDet)',
    form: FORM.AP_REPORTS,
    params: [FROM, TO, { key: 'bank', label: 'Bank', type: 'select', def: 'all', optionsFrom: 'banks' }, STATUS(['Open', 'Approved', 'Posted', 'Void'])],
    columns: [
      { key: 'docno', label: 'CV no.', kind: 'mono', card: 'title' },
      { key: 'payeename', label: 'Payee', card: 'subtitle' },
      { key: 'chdate', label: 'Cheque date', kind: 'date' },
      { key: 'chno', label: 'Cheque no.', kind: 'mono' },
      { key: 'bankname', label: 'Bank' },
      { key: 'relstat', label: 'Release' },
      { key: 'docamt', label: 'Amount', kind: 'money', total: true, card: 'amount' },
      { key: 'status', label: 'Status', kind: 'status', card: 'badge' },
    ],
    link: { type: 'cv', key: 'docno' },
    async run(ctx, p) {
      const n = await names(ctx);
      const heads = await ctx.db.all('cvhdrtbl', { where: inRange(p) });
      return heads
        .filter((h) => (p.bank === 'all' || !p.bank || h.bank === p.bank) && statusOk(p, h.status))
        .map((h): Row => ({ ...h, bankname: label(n.bank, h.bank), docamt: notVoid(h.status) ? num(h.docamt) : 0 }))
        .sort((a, b) => byDate(a, b, 'chdate'));
    },
  },
  {
    id: 'ap/fund-register',
    module: 'ap',
    title: 'Petty Cash & Revolving Fund Register',
    description: 'Fund vouchers paid in the period and whether they have been replenished.',
    legacy: 'APReports › Registers › Revolving Fund / All Expenses (rptFI_FundReplDet)',
    form: FORM.AP_REPORTS,
    params: [FROM, TO, { key: 'fund', label: 'Fund', type: 'select', def: 'all', options: [{ value: 'all', label: 'Both funds' }, { value: TC.PETTY_CASH, label: 'Petty cash' }, { value: TC.REVOLVING_FUND, label: 'Revolving fund' }] }, STATUS(['Open', 'Posted', 'Void'])],
    columns: [
      { key: 'docno', label: 'Voucher', kind: 'mono', card: 'title' },
      { key: 'payee', label: 'Paid to', card: 'subtitle' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'fund', label: 'Fund' },
      { key: 'remarks', label: 'Purpose', card: 'hide' },
      { key: 'replno', label: 'Replenishment', kind: 'mono' },
      { key: 'docamt', label: 'Amount', kind: 'money', total: true, card: 'amount' },
      { key: 'status', label: 'Status', kind: 'status', card: 'badge' },
    ],
    link: { type: 'fund', key: 'docno' },
    async run(ctx, p) {
      const n = await names(ctx);
      const tcs = p.fund && p.fund !== 'all' ? [p.fund] : [TC.PETTY_CASH, TC.REVOLVING_FUND];
      const heads = await ctx.db.all('exphdrtbl', { where: { tc: { in: tcs }, ...inRange(p) } });
      return heads
        .filter((h) => statusOk(p, h.status))
        .map((h): Row => ({ ...h, type: h.tc === TC.PETTY_CASH ? 'pcv' : 'rfv', payee: label(n.ven, h.venno), fund: h.tc === TC.PETTY_CASH ? 'Petty cash' : 'Revolving fund', docamt: notVoid(h.status) ? num(h.docamt) : 0, replno: str(h.replno) || (h.cvstat === 'repl' ? 'Yes' : '') }))
        .sort((a, b) => byDate(a, b));
    },
  },
  {
    id: 'ap/payment-monitoring',
    module: 'ap',
    title: 'Payment Monitoring',
    description: 'Each receiving report followed through to its voucher payable and cheque, so nothing received is left unpaid.',
    legacy: 'APReports › Payment Monitoring',
    form: FORM.AP_REPORTS,
    params: [FROM, TO, { key: 'state', label: 'Show', type: 'select', def: 'all', options: ['all', 'No VP', 'No check yet', 'Partly paid', 'Paid'].map((v) => ({ value: v, label: v === 'all' ? 'All' : v })) }, SEARCH('Vendor')],
    columns: [
      { key: 'mmrrno', label: 'MMRR', kind: 'mono', card: 'title' },
      { key: 'vendor', label: 'Vendor', card: 'subtitle' },
      { key: 'transdate', label: 'Received', kind: 'date' },
      { key: 'terms', label: 'Terms' },
      { key: 'vpno', label: 'VP no.', kind: 'mono' },
      { key: 'cheques', label: 'Cheques' },
      { key: 'amount', label: 'Received value', kind: 'money', total: true },
      { key: 'paid', label: 'Paid', kind: 'money', total: true, card: 'amount' },
      { key: 'state', label: 'State', kind: 'status', card: 'badge' },
    ],
    link: { type: 'mmrr', key: 'mmrrno' },
    async run(ctx, p) {
      const n = await names(ctx);
      const mmrrs = await ctx.db.all('invhdrtbl', { where: { tc: TC.RECEIVING, status: 'Posted', ...inRange(p) } });
      const vps = await ctx.db.all('exphdrtbl', { where: { tc: TC.VOUCHER_PAYABLE, status: { ne: 'Void' } } });
      const cvh = await ctx.db.all('cvhdrtbl', { where: { status: { ne: 'Void' } } });
      const cvd = await ctx.db.all('cvdettbl', { where: { vpno: { ne: '' } } });
      const out: Row[] = [];
      for (const m of mmrrs) {
        const vp = vps.find((v) => v.mmrrno === m.docno) ?? (m.vpno ? vps.find((v) => v.docno === m.vpno) : undefined);
        const pays = vp ? cvd.filter((d) => d.vpno === vp.docno && cvh.some((h) => h.docno === d.docno)) : [];
        const paid = r2(sum(pays, (d) => num(d.dramt)));
        const state = !vp ? 'No VP' : !pays.length ? 'No check yet' : num(vp.vpbals) > 0.009 ? 'Partly paid' : 'Paid';
        const terms = n.venTerms.get(String(m.venno));
        out.push({ mmrrno: m.docno, transdate: m.transdate, vendor: label(n.ven, m.venno), terms: terms && terms !== 'undefined' ? `${terms} days` : 'No term', vpno: vp?.docno ?? '', cheques: [...new Set(pays.map((d) => cvh.find((h) => h.docno === d.docno)?.chno).filter(Boolean))].join(', '), amount: num(m.netamt), paid, state });
      }
      return out.filter((r) => (p.state === 'all' || !p.state || r.state === p.state) && has(p.q, r.vendor)).sort((a, b) => byDate(a, b, 'transdate', 'mmrrno'));
    },
  },
  {
    id: 'ap/expense-query',
    module: 'ap',
    title: 'Expense Query',
    description: 'Expense lines of vouchers payable, fund vouchers and liquidations in the period, filtered by account or cost center.',
    legacy: 'APReports › Expense Query (All / Cash Expense Only)',
    form: FORM.AP_REPORTS,
    params: [FROM, TO, { key: 'scope', label: 'Expenses', type: 'select', def: 'all', options: [{ value: 'all', label: 'All expenses' }, { value: 'cash', label: 'Cash expense only (petty cash, revolving fund)' }] }, SEARCH('Account, cost center or vendor')],
    columns: [
      { key: 'account', label: 'Account', card: 'title' },
      { key: 'vendor', label: 'Vendor / payee', card: 'subtitle' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'docno', label: 'Document', kind: 'mono' },
      { key: 'source', label: 'Source' },
      { key: 'ccno', label: 'Cost center', kind: 'mono' },
      { key: 'remarksline', label: 'Particulars', card: 'hide' },
      { key: 'amount', label: 'Amount', kind: 'money', total: true, card: 'amount' },
    ],
    run: (ctx, p) => expenseLines(ctx, p),
  },
  {
    id: 'ap/expense-by-account',
    module: 'ap',
    title: 'Expenses per Account',
    description: 'Total expense per GL account in the period, the summary behind the expense query.',
    legacy: 'APReports › Expense Query Per Account',
    form: FORM.AP_REPORTS,
    params: [FROM, TO, { key: 'scope', label: 'Expenses', type: 'select', def: 'all', options: [{ value: 'all', label: 'All expenses' }, { value: 'cash', label: 'Cash expense only' }] }],
    columns: [
      { key: 'acctno', label: 'Account', kind: 'mono', card: 'title' },
      { key: 'acctdesc', label: 'Description', card: 'subtitle' },
      { key: 'lines', label: 'Lines', kind: 'int' },
      { key: 'docs', label: 'Documents', kind: 'int' },
      { key: 'amount', label: 'Amount', kind: 'money', total: true, card: 'amount' },
    ],
    async run(ctx, p) {
      const lines = await expenseLines(ctx, p);
      return groupSum(
        lines,
        (l) => l.acctno,
        (l) => ({ acctno: l.acctno, acctdesc: l.acctdesc, lines: 0, docs: new Set<string>(), amount: 0 }),
        (g, l) => {
          g.lines += 1;
          g.docs.add(l.docno);
          g.amount = r2(g.amount + l.amount);
        }
      )
        .map((g): Row => ({ ...g, docs: g.docs.size }))
        .sort((a, b) => b.amount - a.amount);
    },
  },
  {
    id: 'ap/ewt-summary',
    module: 'ap',
    title: 'Withholding Tax (EWT) Summary',
    description: 'Expanded withholding tax per vendor and ATC for BIR 1601-EQ and the 2307 certificates.',
    legacy: 'FIreportViewer › EWT schedules',
    form: FORM.AP_REPORTS,
    params: [FROM, TO],
    columns: [
      { key: 'vendor', label: 'Vendor', card: 'title' },
      { key: 'ewtcode', label: 'ATC', kind: 'mono', card: 'subtitle' },
      { key: 'tin', label: 'TIN', kind: 'mono' },
      { key: 'rate', label: 'Rate %', kind: 'qty' },
      { key: 'docs', label: 'Vouchers', kind: 'int' },
      { key: 'base', label: 'Tax base', kind: 'money', total: true },
      { key: 'tax', label: 'Tax withheld', kind: 'money', total: true, card: 'amount' },
    ],
    async run(ctx, p) {
      const n = await names(ctx);
      const heads = await ctx.db.all('exphdrtbl', { where: { tc: { in: [TC.VOUCHER_PAYABLE, TC.PETTY_CASH, TC.REVOLVING_FUND] }, status: { ne: 'Void' }, ...inRange(p) } });
      const keep = new Map(heads.map((h) => [`${h.tc}|${h.docno}`, h]));
      const lines = (await ctx.db.all('expdettbl', { where: { ewtcode: { ne: '' }, ...inRange(p) } })).filter((l) => keep.has(`${l.tc}|${l.docno}`) && num(l.ewtbase) > 0);
      return groupSum(
        lines,
        (l) => `${l.venno}|${l.ewtcode}`,
        (l) => ({ vendor: label(n.ven, l.venno), tin: n.venTin.get(String(l.venno)) ?? '', ewtcode: l.ewtcode, rate: num(l.ewtrate), docs: new Set<string>(), base: 0, tax: 0 }),
        (g, l) => {
          g.docs.add(l.docno);
          g.base = r2(g.base + num(l.ewtbase));
          g.tax = r2(g.tax + r2((num(l.ewtbase) * num(l.ewtrate)) / 100));
        }
      )
        .map((g): Row => ({ ...g, docs: g.docs.size, tin: g.tin === 'undefined' ? '' : g.tin }))
        .sort((a, b) => String(a.vendor).localeCompare(String(b.vendor)) || String(a.ewtcode).localeCompare(String(b.ewtcode)));
    },
  },
];

async function expenseLines(ctx: Ctx, p: Record<string, string>): Promise<Row[]> {
  const n = await names(ctx);
  const tcs = p.scope === 'cash' ? [TC.PETTY_CASH, TC.REVOLVING_FUND] : [TC.VOUCHER_PAYABLE, TC.PETTY_CASH, TC.REVOLVING_FUND, TC.CA_LIQUIDATION];
  const heads = await ctx.db.all('exphdrtbl', { where: { tc: { in: tcs }, status: { ne: 'Void' }, ...inRange(p) } });
  const keep = new Map(heads.map((h) => [`${h.tc}|${h.docno}`, h]));
  const lines = (await ctx.db.all('expdettbl', { where: { tc: { in: tcs }, entryfr: 'MANUAL', ...inRange(p) } })).filter((l) => keep.has(`${l.tc}|${l.docno}`));
  return lines
    .map((l): Row => {
      const h = keep.get(`${l.tc}|${l.docno}`)!;
      return { acctno: l.acctno, acctdesc: label(n.acct, l.acctno), account: `${l.acctno} ${label(n.acct, l.acctno)}`, vendor: label(n.ven, h.venno), transdate: l.transdate, docno: l.docno, source: tcName(l.tc), ccno: str(l.ccno), remarksline: str(l.remarksline) || str(h.remarks), amount: r2(num(l.dramt) - num(l.cramt)) };
    })
    .filter((r) => has(p.q, r.account, r.ccno, r.vendor))
    .sort((a, b) => byDate(a, b));
}

// ---------------------------------------------------------------------------
// Cashiering (legacy CashierReports.aspx: collection and deposit registers / summaries)
// ---------------------------------------------------------------------------
const AR: ReportDef[] = [
  {
    id: 'ar/collection-register',
    module: 'ar',
    title: 'Collection Register',
    description: 'Official receipts issued in the period with customer, salesman, payment type and CDCR.',
    legacy: 'CashierReports › Collections › Collection Register',
    form: FORM.CASHIER_REPORTS,
    params: [FROM, TO, { key: 'smnno', label: 'Salesman', type: 'select', def: 'all', optionsFrom: 'salesmen' }, { key: 'coltype', label: 'Paid by', type: 'select', def: 'all', options: ['all', 'Cash', 'Check', 'Online'].map((v) => ({ value: v, label: v === 'all' ? 'All' : v })) }, SEARCH('Customer or OR no.')],
    columns: [
      { key: 'orno', label: 'OR no.', kind: 'mono', card: 'title' },
      { key: 'customer', label: 'Customer', card: 'subtitle' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'salesman', label: 'Salesman' },
      { key: 'coltype', label: 'Paid by' },
      { key: 'chno', label: 'Cheque no.', kind: 'mono' },
      { key: 'cdcrno', label: 'CDCR', kind: 'mono' },
      { key: 'colamt', label: 'Collected', kind: 'money', total: true, card: 'amount' },
      { key: 'ewt', label: 'CWT', kind: 'money', total: true },
      { key: 'status', label: 'Status', kind: 'status', card: 'badge' },
    ],
    link: { type: 'or', key: 'orno' },
    async run(ctx, p) {
      const n = await names(ctx);
      const heads = await ctx.db.all('colhdrtbl', { where: { tc: TC.COLLECTION, ...inRange(p) } });
      const dets = await ctx.db.all('coldettbl', { where: { orno: { in: heads.map((h) => h.orno) } } });
      return heads
        .filter((h) => (!p.smnno || p.smnno === 'all' || h.smnno === p.smnno) && (!p.coltype || p.coltype === 'all' || h.coltype === p.coltype))
        .map((h): Row => ({ ...h, chno: str(h.chno), cdcrno: str(h.cdcrno), customer: label(n.cust, h.custno), salesman: label(n.smn, h.smnno), colamt: notVoid(h.status) ? num(h.colamt) : 0, ewt: notVoid(h.status) ? r2(sum(dets.filter((d) => d.orno === h.orno), (d) => num(d.ewt))) : 0 }))
        .filter((r) => has(p.q, r.customer, r.orno))
        .sort((a, b) => byDate(a, b, 'transdate', 'orno'));
    },
  },
  {
    id: 'ar/collection-summary',
    module: 'ar',
    title: 'Collection Summary',
    description: 'Collections per salesman and customer, with tax withheld and net received.',
    legacy: 'CashierReports › Collections › Collection Summary',
    form: FORM.CASHIER_REPORTS,
    params: [FROM, TO, { key: 'by', label: 'Group by', type: 'select', def: 'salesman', options: [{ value: 'salesman', label: 'Salesman' }, { value: 'customer', label: 'Salesman and customer' }] }],
    columns: [
      { key: 'salesman', label: 'Salesman', card: 'title' },
      { key: 'customer', label: 'Customer', card: 'subtitle' },
      { key: 'receipts', label: 'Receipts', kind: 'int' },
      { key: 'colamt', label: 'Applied', kind: 'money', total: true },
      { key: 'ewt', label: 'CWT', kind: 'money', total: true },
      { key: 'gross', label: 'Invoices settled', kind: 'money', total: true, card: 'amount' },
    ],
    async run(ctx, p) {
      const n = await names(ctx);
      const heads = (await ctx.db.all('colhdrtbl', { where: { tc: TC.COLLECTION, ...inRange(p) } })).filter((h) => notVoid(h.status));
      const dets = await ctx.db.all('coldettbl', { where: { orno: { in: heads.map((h) => h.orno) } } });
      const byCust = p.by === 'customer';
      return groupSum(
        heads,
        (h) => (byCust ? `${h.smnno}|${h.custno}` : String(h.smnno)),
        (h) => ({ salesman: label(n.smn, h.smnno) || '(no salesman)', customer: byCust ? label(n.cust, h.custno) : 'All customers', receipts: 0, colamt: 0, ewt: 0, gross: 0 }),
        (g, h) => {
          const d = dets.filter((x) => x.orno === h.orno);
          g.receipts += 1;
          g.colamt = r2(g.colamt + sum(d, (x) => num(x.oramt)));
          g.ewt = r2(g.ewt + sum(d, (x) => num(x.ewt)));
          g.gross = r2(g.colamt + g.ewt);
        }
      ).sort((a, b) => String(a.salesman).localeCompare(String(b.salesman)) || b.gross - a.gross);
    },
  },
  {
    id: 'ar/deposit-register',
    module: 'ar',
    title: 'Deposit Register',
    description: 'Bank deposits made in the period, CDCR by CDCR, split into cash and cheques.',
    legacy: 'CashierReports › Deposits › Deposit Register',
    form: FORM.CASHIER_REPORTS,
    params: [FROM, TO, { key: 'bank', label: 'Bank', type: 'select', def: 'all', optionsFrom: 'banks' }],
    columns: [
      { key: 'depno', label: 'Deposit', kind: 'mono', card: 'title' },
      { key: 'bankname', label: 'Bank account', card: 'subtitle' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'cdcrno', label: 'CDCR', kind: 'mono' },
      { key: 'cashamt', label: 'Cash', kind: 'money', total: true },
      { key: 'checkamt', label: 'Cheques & online', kind: 'money', total: true },
      { key: 'total', label: 'Total', kind: 'money', total: true, card: 'amount' },
    ],
    async run(ctx, p) {
      const n = await names(ctx);
      const heads = await ctx.db.all('bankdephdrtbl', { where: inRange(p) });
      const dets = await ctx.db.all('bankdepdettbl', { where: { depno: { in: heads.map((h) => h.depno) } } });
      return dets
        .filter((d) => !p.bank || p.bank === 'all' || d.acctno === p.bank)
        .map((d): Row => {
          const h = heads.find((x) => x.depno === d.depno)!;
          return { depno: d.depno, transdate: h.transdate, cdcrno: d.cdcrno, bankname: `${label(n.bank, d.acctno)}`, cashamt: num(d.cashamt), checkamt: num(d.checkamt), total: r2(num(d.cashamt) + num(d.checkamt)) };
        })
        .sort((a, b) => byDate(a, b, 'transdate', 'depno'));
    },
  },
  {
    id: 'ar/deposit-summary',
    module: 'ar',
    title: 'Deposit Summary',
    description: 'Total deposited per bank account in the period (legacy prtDepSum).',
    legacy: 'CashierReports › Deposits › Deposit Summary',
    form: FORM.CASHIER_REPORTS,
    params: [FROM, TO],
    columns: [
      { key: 'bankname', label: 'Bank account', card: 'title' },
      { key: 'acctno', label: 'GL account', kind: 'mono', card: 'subtitle' },
      { key: 'deposits', label: 'Deposits', kind: 'int' },
      { key: 'cashamt', label: 'Cash', kind: 'money', total: true },
      { key: 'checkamt', label: 'Cheques & online', kind: 'money', total: true },
      { key: 'total', label: 'Total', kind: 'money', total: true, card: 'amount' },
    ],
    async run(ctx, p) {
      const rows = await AR[2].run(ctx, { ...p, bank: 'all' });
      const dets = await ctx.db.all('bankdepdettbl', { where: { depno: { in: rows.map((r) => r.depno) } } });
      return groupSum(
        rows,
        (r) => r.bankname,
        (r) => ({ bankname: r.bankname, acctno: dets.find((d) => d.depno === r.depno)?.acctno ?? '', deposits: new Set<string>(), cashamt: 0, checkamt: 0, total: 0 }),
        (g, r) => {
          g.deposits.add(r.depno);
          g.cashamt = r2(g.cashamt + r.cashamt);
          g.checkamt = r2(g.checkamt + r.checkamt);
          g.total = r2(g.total + r.total);
        }
      ).map((g): Row => ({ ...g, deposits: g.deposits.size }));
    },
  },
  {
    id: 'ar/cdcr-register',
    module: 'ar',
    title: 'CDCR Register',
    description: "Cashier's daily collection reports with cash, cheques, online and post-dated cheques held.",
    legacy: 'FIreportViewer › rptCDCRreg',
    form: FORM.CASHIER_REPORTS,
    params: [FROM, TO, STATUS(['Open', 'Deposited'])],
    columns: [
      { key: 'cdcrno', label: 'CDCR', kind: 'mono', card: 'title' },
      { key: 'remarks', label: 'Receipts', card: 'subtitle' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'cashamt', label: 'Cash', kind: 'money', total: true },
      { key: 'checkamt', label: 'Cheques', kind: 'money', total: true },
      { key: 'onlineamt', label: 'Online', kind: 'money', total: true },
      { key: 'pdcamt', label: 'PDC held', kind: 'money', total: true },
      { key: 'total', label: 'For deposit', kind: 'money', total: true, card: 'amount' },
      { key: 'depno', label: 'Deposit', kind: 'mono' },
      { key: 'status', label: 'Status', kind: 'status', card: 'badge' },
    ],
    async run(ctx, p) {
      const rows = await ctx.db.all('cdcrtbl', { where: inRange(p) });
      return rows
        .filter((r) => statusOk(p, r.status))
        .map((r): Row => ({ ...r, cashamt: num(r.cashamt), checkamt: num(r.checkamt), onlineamt: num(r.onlineamt), pdcamt: num(r.pdcamt), total: r2(num(r.cashamt) + num(r.checkamt) + num(r.onlineamt)) }))
        .sort((a, b) => byDate(a, b, 'transdate', 'cdcrno'));
    },
  },
];

// ---------------------------------------------------------------------------
// Sales (legacy SDrepViewer registers)
// ---------------------------------------------------------------------------
async function postedSales(ctx: Ctx, p: Record<string, string>) {
  const heads = await ctx.db.all('saleshdrtbl', { where: { tc: { in: INVOICE_TCS }, status: 'Posted', ...inRange(p) } });
  const custs = await ctx.db.all('custmasttbl');
  return heads.map((h): Row => {
    const c = custs.find((x) => x.custno === h.custno);
    // Van sales invoices (ETCSI / ETCI) are kept on their daily sales report, not as sales invoices.
    const href = h.tc !== TC.SALES_INVOICE && h.dsrno ? `/dashboard/sd/dsr/${encodeURIComponent(String(h.dsrno))}` : undefined;
    return { ...h, areano: h.areano || c?.areano || '', smnno: h.smnno || c?.smnno || '', total: num(h.netamt), vat: num(h.vat), net: r2(num(h.netamt) - num(h.vat)), _href: href };
  });
}

const SD: ReportDef[] = [
  {
    id: 'sd/sales-register',
    module: 'sd',
    title: 'Sales Invoice Register',
    description: 'Posted sales invoices in the period with salesman, area, VAT and total.',
    legacy: 'SDrepViewer › Sales Register',
    form: FORM.SALES_ORDER,
    params: [FROM, TO, { key: 'smnno', label: 'Salesman', type: 'select', def: 'all', optionsFrom: 'salesmen' }, { key: 'areano', label: 'Area', type: 'select', def: 'all', optionsFrom: 'areas' }, SEARCH('Customer or invoice')],
    columns: [
      { key: 'invno', label: 'Invoice', kind: 'mono', card: 'title' },
      { key: 'customer', label: 'Customer', card: 'subtitle' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'salesman', label: 'Salesman' },
      { key: 'area', label: 'Area' },
      { key: 'net', label: 'Net of VAT', kind: 'money', total: true },
      { key: 'vat', label: 'VAT', kind: 'money', total: true },
      { key: 'total', label: 'Total', kind: 'money', total: true, card: 'amount' },
    ],
    link: { type: 'si', key: 'invno' },
    async run(ctx, p) {
      const n = await names(ctx);
      return (await postedSales(ctx, p))
        .filter((h) => (!p.smnno || p.smnno === 'all' || h.smnno === p.smnno) && (!p.areano || p.areano === 'all' || h.areano === p.areano))
        .map((h): Row => ({ ...h, customer: label(n.cust, h.custno), salesman: label(n.smn, h.smnno), area: label(n.area, h.areano) }))
        .filter((r) => has(p.q, r.customer, r.invno))
        .sort((a, b) => byDate(a, b, 'transdate', 'invno'));
    },
  },
  {
    id: 'sd/sales-by-salesman',
    module: 'sd',
    title: 'Sales per Salesman',
    description: 'Invoiced sales per salesman with the number of customers served.',
    legacy: 'SDrepViewer › Sales per Salesman',
    form: FORM.SALES_ORDER,
    params: [FROM, TO],
    columns: [
      { key: 'salesman', label: 'Salesman', card: 'title' },
      { key: 'smnno', label: 'Code', kind: 'mono', card: 'subtitle' },
      { key: 'customers', label: 'Customers', kind: 'int' },
      { key: 'invoices', label: 'Invoices', kind: 'int' },
      { key: 'net', label: 'Net of VAT', kind: 'money', total: true },
      { key: 'total', label: 'Total', kind: 'money', total: true, card: 'amount' },
    ],
    async run(ctx, p) {
      const n = await names(ctx);
      return groupSum(
        await postedSales(ctx, p),
        (h) => String(h.smnno),
        (h) => ({ smnno: h.smnno, salesman: label(n.smn, h.smnno) || '(no salesman)', customers: new Set<string>(), invoices: 0, net: 0, total: 0 }),
        (g, h) => {
          g.customers.add(h.custno);
          g.invoices += 1;
          g.net = r2(g.net + h.net);
          g.total = r2(g.total + h.total);
        }
      )
        .map((g): Row => ({ ...g, customers: g.customers.size }))
        .sort((a, b) => b.total - a.total);
    },
  },
  {
    id: 'sd/sales-by-area',
    module: 'sd',
    title: 'Sales per Area',
    description: 'Invoiced sales per sales area.',
    legacy: 'SDrepViewer › Sales per Area',
    form: FORM.SALES_ORDER,
    params: [FROM, TO],
    columns: [
      { key: 'area', label: 'Area', card: 'title' },
      { key: 'areano', label: 'Code', kind: 'mono', card: 'subtitle' },
      { key: 'customers', label: 'Customers', kind: 'int' },
      { key: 'invoices', label: 'Invoices', kind: 'int' },
      { key: 'total', label: 'Total', kind: 'money', total: true, card: 'amount' },
    ],
    async run(ctx, p) {
      const n = await names(ctx);
      return groupSum(
        await postedSales(ctx, p),
        (h) => String(h.areano),
        (h) => ({ areano: h.areano, area: label(n.area, h.areano) || '(no area)', customers: new Set<string>(), invoices: 0, total: 0 }),
        (g, h) => {
          g.customers.add(h.custno);
          g.invoices += 1;
          g.total = r2(g.total + h.total);
        }
      )
        .map((g): Row => ({ ...g, customers: g.customers.size }))
        .sort((a, b) => b.total - a.total);
    },
  },
  {
    id: 'sd/sales-by-material',
    module: 'sd',
    title: 'Sales per Product',
    description: 'Quantity and value sold per material, with the average selling price.',
    legacy: 'SDrepViewer › Sales per Material',
    form: FORM.SALES_ORDER,
    params: [FROM, TO, SEARCH('Product')],
    columns: [
      { key: 'mmdesc', label: 'Product', card: 'title' },
      { key: 'codeno', label: 'Code', kind: 'mono', card: 'subtitle' },
      { key: 'qty', label: 'Quantity', kind: 'qty', total: true },
      { key: 'um', label: 'Unit' },
      { key: 'asp', label: 'Average price', kind: 'money' },
      { key: 'total', label: 'Sales', kind: 'money', total: true, card: 'amount' },
    ],
    async run(ctx, p) {
      const heads = await postedSales(ctx, p);
      const mats = await ctx.db.all('mmasttbl');
      const lines = await ctx.db.all('salesdettbl', { where: { invno: { in: heads.map((h) => h.invno) } } });
      return groupSum(
        lines,
        (l) => String(l.codeno),
        (l) => {
          const m = mats.find((x) => x.codeno === l.codeno);
          return { codeno: l.codeno, mmdesc: m?.mmdesc ?? l.codeno, um: l.um || m?.um || '', qty: 0, total: 0 };
        },
        (g, l) => {
          g.qty = r4(g.qty + num(l.qty));
          g.total = r2(g.total + num(l.itmamt));
        }
      )
        .map((g): Row => ({ ...g, asp: g.qty ? r2(g.total / g.qty) : 0 }))
        .filter((r) => has(p.q, r.mmdesc, r.codeno))
        .sort((a, b) => b.total - a.total);
    },
  },
  {
    id: 'sd/open-orders',
    module: 'sd',
    title: 'Open Sales Orders',
    description: 'Sales orders not yet fully delivered or closed, oldest first.',
    legacy: 'SDrepViewer › SO Monitoring',
    form: FORM.SALES_ORDER,
    params: [{ ...FROM, def: 'yearStart' }, TO, SEARCH('Customer or SO')],
    columns: [
      { key: 'sono', label: 'SO no.', kind: 'mono', card: 'title' },
      { key: 'customer', label: 'Customer', card: 'subtitle' },
      { key: 'transdate', label: 'Ordered', kind: 'date' },
      { key: 'salesman', label: 'Salesman' },
      { key: 'age', label: 'Days open', kind: 'int' },
      { key: 'soamt', label: 'Amount', kind: 'money', total: true, card: 'amount' },
      { key: 'status', label: 'Status', kind: 'status', card: 'badge' },
    ],
    link: { type: 'so', key: 'sono' },
    async run(ctx, p) {
      const n = await names(ctx);
      const heads = await ctx.db.all('sohdrtbl', { where: inRange(p) });
      const now = Date.parse(today());
      return heads
        .filter((h) => !['void', 'closed', 'served', 'invoiced', 'delivered'].includes(String(h.status ?? '').toLowerCase()))
        .map((h): Row => ({ ...h, customer: label(n.cust, h.custno), salesman: label(n.smn, h.smnno), soamt: num(h.soamt), age: Math.max(0, Math.round((now - Date.parse(String(h.transdate))) / 86400000)) }))
        .filter((r) => has(p.q, r.customer, r.sono))
        .sort((a, b) => byDate(a, b, 'transdate', 'sono'));
    },
  },
];

// ---------------------------------------------------------------------------
// General ledger (legacy FIreportViewer: rptGLtrans, rptGLtransAcct, rptChartofAcct)
// ---------------------------------------------------------------------------
const GLR: ReportDef[] = [
  {
    id: 'gl/gl-transactions',
    module: 'gl',
    title: 'GL Transactions',
    description: 'Every general ledger entry in the period by document, with debit and credit.',
    legacy: 'FIreportViewer › rptGLtrans / rptGLtransAcct',
    form: FORM.GL_REPORTS,
    params: [FROM, TO, { key: 'status', label: 'Posting', type: 'select', def: 'all', options: [{ value: 'all', label: 'All' }, { value: 'OPEN', label: 'Waiting for JV posting' }, { value: 'POSTED', label: 'Posted' }] }, SEARCH('Account, document or cost center')],
    columns: [
      { key: 'docno', label: 'Document', kind: 'mono', card: 'title' },
      { key: 'account', label: 'Account', card: 'subtitle' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'source', label: 'Source' },
      { key: 'ccno', label: 'Cost center', kind: 'mono' },
      { key: 'dramt', label: 'Debit', kind: 'money', total: true, card: 'amount' },
      { key: 'cramt', label: 'Credit', kind: 'money', total: true },
      { key: 'glstatus', label: 'Posting', kind: 'status', card: 'badge' },
    ],
    async run(ctx, p) {
      const n = await names(ctx);
      const rows = await ctx.db.all('gltranstbl', { where: inRange(p) });
      return rows
        .filter((r) => !p.status || p.status === 'all' || String(r.glstatus ?? '').toUpperCase() === p.status)
        .map((r): Row => ({ ...r, account: `${r.acctno} ${label(n.acct, r.acctno)}`, source: tcName(r.tc), dramt: num(r.dramt), cramt: num(r.cramt) }))
        .filter((r) => has(p.q, r.account, r.docno, r.ccno))
        .sort((a, b) => byDate(a, b));
    },
  },
  {
    id: 'gl/chart-of-accounts',
    module: 'gl',
    title: 'Chart of Accounts',
    description: 'The accounts of the company with their parent account and flags.',
    legacy: 'FIreportViewer › rptChartofAcct',
    form: FORM.GL_REPORTS,
    params: [SEARCH('Account')],
    columns: [
      { key: 'acctno', label: 'Account', kind: 'mono', card: 'title' },
      { key: 'acctdesc', label: 'Description', card: 'subtitle' },
      { key: 'upperacct', label: 'Parent', kind: 'mono' },
      { key: 'kind', label: 'Used for' },
    ],
    async run(ctx, p) {
      const rows = await ctx.db.all('acctcharttbl', { orderBy: [['acctno', 'asc']] });
      return rows
        .map((r): Row => ({ ...r, kind: [r.cv === 'Y' && 'Cash / bank', r.taxitm === 'Y' && 'Tax', r.invcos === 'Y' && 'Inventory / cost'].filter(Boolean).join(', ') }))
        .filter((r) => has(p.q, r.acctno, r.acctdesc));
    },
  },
];

export const REPORTS: ReportDef[] = [...GLR, ...AP, ...AR, ...SD];

function paramDefault(def?: string): string {
  if (def === 'monthStart') return monthStart(Number(today().slice(0, 4)), Number(today().slice(5, 7)));
  if (def === 'today') return today();
  if (def === 'yearStart') return `${today().slice(0, 4)}-01-01`;
  return def ?? '';
}

/** Reports the user may open, with their parameters ready to show. */
export async function reportCatalog(ctx: Ctx) {
  const visible: ReportDef[] = [];
  for (const r of REPORTS) if (await isAllowed(ctx.db, ctx.group, r.form, ACTION.VIEW)) visible.push(r);
  const needs = new Set(visible.flatMap((r) => r.params.map((p) => p.optionsFrom).filter(Boolean)));
  const lists: Record<string, { value: string; label: string }[]> = {};
  if (needs.has('banks')) lists.banks = (await ctx.db.all('banktbl')).map((b) => ({ value: String(b.acctno), label: String(b.bankname ?? b.acctno) }));
  if (needs.has('salesmen')) lists.salesmen = (await ctx.db.all('smnmtbl')).map((s) => ({ value: String(s.smnno), label: `${s.fullname} (${s.smnno})` }));
  if (needs.has('areas')) lists.areas = (await ctx.db.all('areatbl')).map((a) => ({ value: String(a.areano), label: String(a.areaname ?? a.areano) }));
  return visible.map(({ run: _run, ...r }) => ({
    ...r,
    params: r.params.map((p) => ({ ...p, def: paramDefault(p.def), options: p.optionsFrom ? [{ value: 'all', label: 'All' }, ...(lists[p.optionsFrom] ?? [])] : p.options })),
  }));
}

export async function runReport(ctx: Ctx, id: string, params: Record<string, unknown>) {
  const def = REPORTS.find((r) => r.id === id);
  if (!def) fail('That report does not exist.', 404);
  await requireRight(ctx, def.form, ACTION.VIEW, `open the ${def.title}`);
  const p: Record<string, string> = {};
  for (const prm of def.params) p[prm.key] = str(params?.[prm.key]) || paramDefault(prm.def);
  if (p.from && p.to && p.from > p.to) fail('The start date is after the end date.');
  const rows = await def.run(ctx, p);
  const totals: Row = {};
  for (const c of def.columns) if (c.total) totals[c.key] = c.kind === 'qty' ? r4(sum(rows, (r) => num(r[c.key]))) : r2(sum(rows, (r) => num(r[c.key])));
  return { rows, totals, params: p, count: rows.length };
}
