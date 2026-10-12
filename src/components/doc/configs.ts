import { ewtOn, r2, splitVat, sum } from '@/shared/money';

export type Kind = 'text' | 'date' | 'money' | 'qty' | 'status' | 'mono';

export interface ListCol {
  key: string;
  label: string;
  kind?: Kind;
  hideOnMobile?: boolean;
}

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'money' | 'select' | 'lookup' | 'textarea';
  lookup?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  span?: 1 | 2 | 3;
  when?: (d: Draft) => boolean;
  readOnly?: (d: Draft) => boolean;
  placeholder?: string;
}

export interface LineCol {
  key: string;
  label: string;
  type: 'lookup' | 'number' | 'money' | 'text' | 'date' | 'select' | 'computed';
  lookup?: string;
  options?: { value: string; label: string }[];
  width?: string;
  compute?: (l: Draft, d: Draft) => number | string;
  computeKind?: 'money' | 'qty' | 'text';
  placeholder?: string;
  when?: (d: Draft) => boolean;
}

export type Draft = Record<string, any>;

export interface DocConfig {
  type: string;
  title: string;
  plural: string;
  form: string;
  description: string;
  newLabel: string;
  listCols: ListCol[];
  tabs: string[];
  sources?: { id: string; label: string; help: string }[];
  header: FieldDef[];
  lines?: { cols: LineCol[]; addLabel: string; availability?: boolean };
  custom?: 'apply-invoices' | 'pay-vouchers' | 'count' | 'fund-vouchers';
  /** Show summary blocks (rpc doc.summary) above the list. */
  summary?: boolean;
  totals?: (d: Draft) => { label: string; value: number; strong?: boolean; kind?: 'money' | 'qty'; warn?: boolean }[];
  /** Automation when a header field changes (e.g. picking a customer fills the ship-to address). */
  onHeader?: (key: string, value: any, d: Draft, item?: { data?: Record<string, any>; label?: string }) => Partial<Draft>;
  /** Automation when a line field changes (e.g. picking a material fills its price and unit). */
  onLine?: (key: string, value: any, line: Draft, d: Draft, item?: { data?: Record<string, any>; label?: string }) => Partial<Draft>;
  saveThen?: { action: string; label: string };
  saveLabel?: string;
  viewHeader: { key: string; label: string; kind?: Kind }[];
  viewLines: { key: string; label: string; kind?: Kind }[];
  noEdit?: boolean;
}

const n = (v: unknown) => Number(v) || 0;
const lineTotal = (d: Draft, f: (l: Draft) => number) => sum((d.lines ?? []) as Draft[], f);

const materialPick = (key: string, value: any, line: Draft, _d: Draft, item?: { data?: Record<string, any> }) =>
  key === 'codeno' && item?.data ? { um: item.data.um } : {};

export const DOCS: Record<string, DocConfig> = {
  jv: {
    type: 'jv',
    title: 'Journal Voucher',
    plural: 'Journal Vouchers',
    form: '052',
    description: 'Manual accounting entries. Debits must equal credits before you can save; finance approves and posts them to the ledger.',
    newLabel: 'New journal voucher',
    tabs: ['Open', 'Approved', 'Posted', 'Void'],
    listCols: [
      { key: 'no', label: 'JV no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'remarks', label: 'Description' },
      { key: 'jvtype', label: 'Type', hideOnMobile: true },
      { key: 'amount', label: 'Amount', kind: 'money' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'transdate', label: 'JV date', type: 'date', required: true },
      { key: 'sourcedoc', label: 'Reference', type: 'text', hint: 'Optional: the document this entry relates to.' },
      { key: 'remarks', label: 'Description', type: 'textarea', required: true, span: 3, placeholder: 'What is this entry for?' },
    ],
    lines: {
      addLabel: 'Add line',
      cols: [
        { key: 'acctno', label: 'Account', type: 'lookup', lookup: 'accounts', width: '34%' },
        { key: 'ccno', label: 'Cost center', type: 'lookup', lookup: 'costCenters', width: '22%' },
        { key: 'dramt', label: 'Debit', type: 'money' },
        { key: 'cramt', label: 'Credit', type: 'money' },
      ],
    },
    onLine: (key, value) => (key === 'dramt' && n(value) ? { cramt: '' } : key === 'cramt' && n(value) ? { dramt: '' } : {}),
    totals: (d) => {
      const dr = lineTotal(d, (l) => n(l.dramt));
      const cr = lineTotal(d, (l) => n(l.cramt));
      return [
        { label: 'Total debit', value: dr },
        { label: 'Total credit', value: cr },
        { label: 'Difference', value: r2(dr - cr), strong: true, warn: Math.abs(dr - cr) > 0.005 },
      ];
    },
    viewHeader: [
      { key: 'transdate', label: 'JV date', kind: 'date' },
      { key: 'sourcedoc', label: 'Reference' },
      { key: 'user', label: 'Prepared by' },
      { key: 'postdate', label: 'Posted on', kind: 'date' },
      { key: 'postby', label: 'Posted by' },
    ],
    viewLines: [
      { key: 'acctno', label: 'Account', kind: 'mono' },
      { key: 'acctdesc', label: 'Title' },
      { key: 'ccno', label: 'Cost center' },
      { key: 'dramt', label: 'Debit', kind: 'money' },
      { key: 'cramt', label: 'Credit', kind: 'money' },
    ],
  },

  vp: {
    type: 'vp',
    title: 'Voucher Payable',
    plural: 'Vouchers Payable',
    form: '023',
    description: 'Supplier bills. VAT, withholding tax and the amount payable are computed for you, and duplicate supplier invoices are blocked.',
    newLabel: 'New voucher',
    tabs: ['Open', 'Posted', 'Void'],
    sources: [
      { id: 'mmrr', label: 'Bill a receiving report', help: 'For goods: vendor, amount, VAT and withholding tax come from the posted receipt.' },
      { id: 'fr', label: 'Pay a fund replenishment', help: 'For petty cash and revolving funds: the custodian and the amount come from the replenishment.' },
    ],
    listCols: [
      { key: 'no', label: 'Voucher no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Vendor' },
      { key: 'refdoc', label: 'Vendor invoice', hideOnMobile: true },
      { key: 'amount', label: 'Net payable', kind: 'money' },
      { key: 'balance', label: 'Unpaid', kind: 'money', hideOnMobile: true },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'venno', label: 'Vendor', type: 'lookup', lookup: 'vendors', required: true, span: 2 },
      { key: 'refdoc', label: 'Vendor invoice no.', type: 'text', required: true },
      { key: 'invdate', label: 'Invoice date', type: 'date' },
      { key: 'transdate', label: 'Voucher date', type: 'date', required: true },
      { key: 'mmrrno', label: 'Receiving report', type: 'text', readOnly: () => true, when: (d) => Boolean(d.mmrrno) && d.reflabel !== 'Fund Repl' },
      { key: 'replno', label: 'Fund replenishment', type: 'text', readOnly: () => true, when: (d) => d.reflabel === 'Fund Repl' },
      { key: 'remarks', label: 'Description', type: 'textarea', span: 3 },
    ],
    lines: {
      addLabel: 'Add expense line',
      cols: [
        { key: 'acctno', label: 'Account', type: 'lookup', lookup: 'accounts', width: '24%' },
        { key: 'ccno', label: 'Cost center', type: 'lookup', lookup: 'costCenters', width: '14%' },
        { key: 'amount', label: 'Amount (VAT incl.)', type: 'money' },
        { key: 'vatable', label: 'VAT', type: 'select', options: [{ value: 'Y', label: '12%' }, { value: 'N', label: 'None' }], width: '104px' },
        { key: 'ewtcode', label: 'Withholding', type: 'lookup', lookup: 'ewtCodes', width: '15%' },
        { key: 'ewt', label: 'EWT', type: 'computed', computeKind: 'money', compute: (l) => ewtOn(splitVat(n(l.amount), l.vatable !== 'N').net, n(l.ewtrate)) },
      ],
    },
    onHeader: (key, _v, d, item) => {
      if (key !== 'venno' || !item?.data) return {};
      const ewt = item.data.ewtcode ?? '';
      const vatable = item.data.vat === 'VAT' ? 'Y' : 'N';
      return { lines: (d.lines ?? []).map((l: Draft) => ({ ...l, ewtcode: l.ewtcode || ewt, vatable: l.amount ? l.vatable : vatable })), _ewtDefault: ewt, _vatDefault: vatable };
    },
    onLine: (key, _v, line, d, item) => {
      if (key === 'ewtcode') return { ewtrate: item?.data?.rate ?? 0 };
      if (key === 'acctno' && !line.ewtcode && d._ewtDefault) return { ewtcode: d._ewtDefault, vatable: d._vatDefault ?? 'Y' };
      return {};
    },
    totals: (d) => {
      const rows = (d.lines ?? []) as Draft[];
      const gross = sum(rows, (l) => n(l.amount));
      const vat = sum(rows, (l) => splitVat(n(l.amount), l.vatable !== 'N').vat);
      const ewt = sum(rows, (l) => ewtOn(splitVat(n(l.amount), l.vatable !== 'N').net, n(l.ewtrate)));
      return [
        { label: 'Invoice amount', value: gross },
        { label: 'Input VAT', value: vat },
        { label: 'Withholding tax', value: ewt },
        { label: 'Net payable', value: r2(gross - ewt), strong: true },
      ];
    },
    viewHeader: [
      { key: 'venname', label: 'Vendor' },
      { key: 'ventin', label: 'Vendor TIN' },
      { key: 'refdoc', label: 'Vendor invoice no.' },
      { key: 'invdate', label: 'Invoice date', kind: 'date' },
      { key: 'transdate', label: 'Voucher date', kind: 'date' },
      { key: 'duedate', label: 'Due date', kind: 'date' },
    ],
    viewLines: [
      { key: 'acctno', label: 'Account', kind: 'mono' },
      { key: 'acctdesc', label: 'Title' },
      { key: 'ccno', label: 'Cost center' },
      { key: 'amount', label: 'Amount (VAT incl.)', kind: 'money' },
      { key: 'net', label: 'Net of VAT', kind: 'money' },
      { key: 'ewtcode', label: 'ATC' },
      { key: 'ewt', label: 'EWT', kind: 'money' },
    ],
  },

  cv: {
    type: 'cv',
    title: 'Check Voucher',
    plural: 'Check Vouchers',
    form: '024',
    description: 'Pay one or more posted vouchers with a cheque. The next cheque number and the amount in words are filled in for you.',
    newLabel: 'New check voucher',
    tabs: ['Open', 'Approved', 'Released', 'Void'],
    listCols: [
      { key: 'no', label: 'CV no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Payee' },
      { key: 'bankname', label: 'Bank', hideOnMobile: true },
      { key: 'chno', label: 'Cheque no.', kind: 'mono' },
      { key: 'amount', label: 'Amount', kind: 'money' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'venno', label: 'Pay to (vendor)', type: 'lookup', lookup: 'vendors', required: true, span: 2 },
      { key: 'bank', label: 'Bank account', type: 'lookup', lookup: 'banks', required: true },
      { key: 'chno', label: 'Cheque no.', type: 'text', hint: 'Leave blank to use the next number of this bank.' },
      { key: 'chdate', label: 'Cheque date', type: 'date', required: true },
      { key: 'transdate', label: 'Voucher date', type: 'date', required: true },
      { key: 'payeename', label: 'Payee name on cheque', type: 'text', hint: 'Defaults to the vendor name.', span: 2 },
      { key: 'remarks', label: 'Remarks', type: 'text' },
    ],
    custom: 'pay-vouchers',
    totals: (d) => [{ label: 'Cheque amount', value: lineTotal(d, (l) => n(l.dramt)), strong: true }],
    viewHeader: [
      { key: 'payeename', label: 'Payee' },
      { key: 'bankname', label: 'Bank' },
      { key: 'chno', label: 'Cheque no.' },
      { key: 'chdate', label: 'Cheque date', kind: 'date' },
      { key: 'reldate', label: 'Released on', kind: 'date' },
      { key: 'remarks', label: 'Remarks' },
    ],
    viewLines: [
      { key: 'vpno', label: 'Voucher', kind: 'mono' },
      { key: 'vpdate', label: 'Voucher date', kind: 'date' },
      { key: 'dramt', label: 'Amount paid', kind: 'money' },
    ],
  },

  or: {
    type: 'or',
    title: 'Official Receipt',
    plural: 'Official Receipts',
    form: '010',
    description: "Record a customer's payment. Open invoices are listed for you, applied oldest first, and the 2307 tax withheld is computed from the customer's rate.",
    newLabel: 'Record a payment',
    tabs: ['Open', 'Posted', 'Void'],
    listCols: [
      { key: 'no', label: 'OR no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Customer' },
      { key: 'coltype', label: 'Tender', hideOnMobile: true },
      { key: 'chno', label: 'Cheque no.', hideOnMobile: true },
      { key: 'amount', label: 'Amount', kind: 'money' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'custno', label: 'Customer', type: 'lookup', lookup: 'customers', required: true, span: 2 },
      { key: 'transdate', label: 'Receipt date', type: 'date', required: true },
      { key: 'coltype', label: 'Paid by', type: 'select', required: true, options: [{ value: 'Cash', label: 'Cash' }, { value: 'Check', label: 'Cheque' }, { value: 'Online', label: 'Online / bank transfer' }] },
      { key: 'colamt', label: 'Amount received', type: 'money', required: true },
      { key: 'bank', label: 'Bank', type: 'text', when: (d) => d.coltype !== 'Cash', placeholder: 'e.g. BDO' },
      { key: 'chno', label: 'Cheque no.', type: 'text', when: (d) => d.coltype === 'Check' },
      { key: 'pdate', label: 'Cheque date', type: 'date', when: (d) => d.coltype === 'Check', hint: 'A future date makes it a post-dated cheque; it stays out of the CDCR until then.' },
      { key: 'orno', label: 'OR number', type: 'text', hint: 'Leave blank to number automatically.', when: (d) => !d.no },
      { key: 'remarks', label: 'Remarks', type: 'text', span: 3 },
    ],
    custom: 'apply-invoices',
    saveThen: { action: 'post', label: 'Save & issue receipt' },
    totals: (d) => {
      const applied = lineTotal(d, (l) => n(l.oramt));
      const ewt = lineTotal(d, (l) => n(l.ewt));
      return [
        { label: 'Amount received', value: n(d.colamt) },
        { label: 'Applied to invoices', value: applied },
        { label: 'Tax withheld (2307)', value: ewt },
        { label: 'Unapplied (kept as deposit)', value: r2(n(d.colamt) - applied), strong: true, warn: n(d.colamt) - applied < -0.005 },
      ];
    },
    viewHeader: [
      { key: 'bussname', label: 'Customer' },
      { key: 'transdate', label: 'Receipt date', kind: 'date' },
      { key: 'coltype', label: 'Paid by' },
      { key: 'bank', label: 'Bank' },
      { key: 'chno', label: 'Cheque no.' },
      { key: 'pdate', label: 'Cheque date', kind: 'date' },
    ],
    viewLines: [
      { key: 'invno', label: 'Invoice', kind: 'mono' },
      { key: 'origamt', label: 'Invoice amount', kind: 'money' },
      { key: 'oramt', label: 'Paid', kind: 'money' },
      { key: 'ewt', label: '2307 tax', kind: 'money' },
      { key: 'pdc', label: 'PDC' },
    ],
  },

  pcv: fundVoucher('pcv', 'Petty Cash Voucher', 'Petty Cash Vouchers', 'petty cash fund'),
  rfv: fundVoucher('rfv', 'Revolving Fund Voucher', 'Revolving Fund Vouchers', 'revolving fund'),

  fr: {
    type: 'fr',
    title: 'Fund Replenishment',
    plural: 'Fund Replenishments',
    form: '028',
    description: "Turn a custodian's posted petty cash or revolving fund vouchers into one replenishment. The amount and the remarks are filled in for you; the custodian is then paid through a voucher payable.",
    newLabel: 'Replenish a fund',
    tabs: ['Unpaid', 'Paid', 'Void'],
    summary: true,
    listCols: [
      { key: 'no', label: 'Replenishment no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Custodian' },
      { key: 'fundname', label: 'Fund' },
      { key: 'voucher', label: 'Voucher payable', hideOnMobile: true },
      { key: 'amount', label: 'Amount', kind: 'money' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      {
        key: 'tc',
        label: 'Fund',
        type: 'select',
        required: true,
        options: [
          { value: '40', label: 'Petty Cash Fund' },
          { value: '44', label: 'Revolving Fund' },
        ],
      },
      { key: 'user', label: 'Vouchers prepared by', type: 'lookup', lookup: 'users', required: true, hint: 'The custodian who paid the expenses.' },
      { key: 'venno', label: 'Pay the replenishment to', type: 'lookup', lookup: 'custodians', required: true, hint: 'Employee vendor marked as fund custodian.' },
      { key: 'transdate', label: 'Date', type: 'date', required: true },
      { key: 'remarks', label: 'Remarks', type: 'textarea', span: 2, placeholder: 'Leave blank: written for you from the voucher numbers.' },
    ],
    custom: 'fund-vouchers',
    onHeader: (key) => (key === 'tc' || key === 'user' ? { lines: [] } : {}),
    totals: (d) => [
      { label: 'Vouchers', value: (d.lines ?? []).length, kind: 'qty' },
      { label: 'Amount to replenish', value: lineTotal(d, (l) => n(l.amount)), strong: true },
    ],
    viewHeader: [
      { key: 'fundname', label: 'Fund' },
      { key: 'custodian', label: 'Vouchers prepared by' },
      { key: 'venname', label: 'Paid to' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'docnofr', label: 'From voucher', kind: 'mono' },
      { key: 'docnoto', label: 'To voucher', kind: 'mono' },
      { key: 'remarks', label: 'Remarks' },
    ],
    viewLines: [
      { key: 'docno', label: 'Voucher', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'payee', label: 'Paid to' },
      { key: 'remarks', label: 'For' },
      { key: 'amount', label: 'Amount', kind: 'money' },
    ],
  },

  liq: {
    type: 'liq',
    title: 'Cash Advance Liquidation',
    plural: 'Cash Advance Liquidations',
    form: '038',
    description: 'Account for a cash advance: enter what was spent and the system clears the advance and works out the refund or the extra reimbursement. Cash advances are released as vouchers payable charged to Advances to Employees.',
    newLabel: 'New liquidation',
    tabs: ['Open', 'Posted', 'Void'],
    summary: true,
    sources: [{ id: 'ca', label: 'Liquidate a cash advance', help: 'Pick an open cash advance: the employee and the advance amount are filled in for you.' }],
    listCols: [
      { key: 'no', label: 'Liquidation no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Employee' },
      { key: 'advance', label: 'Cash advance', kind: 'mono' },
      { key: 'reimburse', label: 'To reimburse', kind: 'money', hideOnMobile: true },
      { key: 'amount', label: 'Spent', kind: 'money' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'refdoc', label: 'Cash advance', type: 'text', required: true, readOnly: () => true, placeholder: 'Use "Liquidate a cash advance"' },
      { key: 'venno', label: 'Employee', type: 'lookup', lookup: 'vendors', readOnly: () => true },
      { key: 'caamt', label: 'Advance amount', type: 'money', readOnly: () => true },
      { key: 'transdate', label: 'Liquidation date', type: 'date', required: true },
      { key: 'remarks', label: 'Remarks', type: 'textarea', span: 2 },
    ],
    lines: {
      addLabel: 'Add expense',
      cols: [
        { key: 'acctno', label: 'Account', type: 'lookup', lookup: 'accounts', width: '34%' },
        { key: 'ccno', label: 'Cost center', type: 'lookup', lookup: 'costCenters', width: '22%' },
        { key: 'amount', label: 'Amount (VAT incl.)', type: 'money' },
        { key: 'vatable', label: 'VAT', type: 'select', options: [{ value: 'Y', label: '12%' }, { value: 'N', label: 'None' }], width: '104px' },
      ],
    },
    totals: (d) => {
      const spent = lineTotal(d, (l) => n(l.amount));
      const vat = sum((d.lines ?? []) as Draft[], (l) => splitVat(n(l.amount), l.vatable !== 'N').vat);
      const diff = r2(n(d.caamt) - spent);
      return [
        { label: 'Spent (VAT incl.)', value: spent },
        { label: 'of which input VAT', value: vat },
        { label: 'Cash advance', value: n(d.caamt) },
        diff >= 0 ? { label: 'Refund to the cashier', value: diff, strong: true } : { label: 'Reimburse the employee', value: -diff, strong: true, warn: false },
      ];
    },
    viewHeader: [
      { key: 'venname', label: 'Employee' },
      { key: 'refdoc', label: 'Cash advance', kind: 'mono' },
      { key: 'caamt', label: 'Advance amount', kind: 'money' },
      { key: 'transdate', label: 'Liquidation date', kind: 'date' },
      { key: 'remarks', label: 'Remarks' },
    ],
    viewLines: [
      { key: 'acctno', label: 'Account', kind: 'mono' },
      { key: 'acctdesc', label: 'Title' },
      { key: 'ccno', label: 'Cost center' },
      { key: 'amount', label: 'Amount (VAT incl.)', kind: 'money' },
      { key: 'net', label: 'Net of VAT', kind: 'money' },
    ],
  },

  cm: memo('cm', 'Credit Memo', 'Credit Memos', '070', 'Reduce what a customer owes, for returns, allowances or price adjustments.', '4100200'),
  dm: memo('dm', 'Debit Memo', 'Debit Memos', '013', 'Add a charge to a customer invoice, for example freight or price differences.', '4100100'),

  so: {
    type: 'so',
    title: 'Sales Order',
    plural: 'Sales Orders',
    form: '017',
    description: 'Customer orders. Prices come from the price list; credit limit and stock are checked automatically before approval.',
    newLabel: 'New sales order',
    tabs: ['Open', 'Approved', 'Void'],
    listCols: [
      { key: 'no', label: 'SO no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Customer' },
      { key: 'plntno', label: 'Plant', hideOnMobile: true },
      { key: 'deldate', label: 'Deliver by', kind: 'date', hideOnMobile: true },
      { key: 'amount', label: 'Amount', kind: 'money' },
      { key: 'delstat', label: 'Delivery', kind: 'status', hideOnMobile: true },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'custno', label: 'Customer', type: 'lookup', lookup: 'customers', required: true, span: 2 },
      { key: 'plntno', label: 'Deliver from', type: 'lookup', lookup: 'plants', required: true },
      { key: 'transdate', label: 'Order date', type: 'date', required: true },
      { key: 'deldate', label: 'Delivery date', type: 'date' },
      { key: 'pono', label: 'Customer PO no.', type: 'text' },
      { key: 'shipto', label: 'Ship to', type: 'text', span: 2 },
      { key: 'smnno', label: 'Salesman', type: 'lookup', lookup: 'salesmen' },
      { key: 'remarks', label: 'Remarks', type: 'text', span: 3 },
    ],
    lines: {
      addLabel: 'Add product',
      availability: true,
      cols: [
        { key: 'codeno', label: 'Product', type: 'lookup', lookup: 'materials', width: '34%' },
        { key: 'qty', label: 'Quantity', type: 'number' },
        { key: 'sp', label: 'Price (VAT incl.)', type: 'money' },
        { key: 'discamt', label: 'Discount', type: 'money' },
        { key: 'net', label: 'Amount', type: 'computed', computeKind: 'money', compute: (l) => r2(n(l.qty) * n(l.sp) - n(l.discamt)) },
      ],
    },
    onHeader: (key, _v, d, item) => (key === 'custno' && item?.data ? { shipto: d.shipto || item.data.address || '', smnno: d.smnno || item.data.smnno || '' } : {}),
    onLine: (key, v, line, d, item) => (key === 'codeno' && item?.data ? { sp: item.data.sp || line.sp, um: item.data.um } : materialPick(key, v, line, d, item)),
    totals: (d) => {
      const gross = lineTotal(d, (l) => n(l.qty) * n(l.sp));
      const disc = lineTotal(d, (l) => n(l.discamt));
      return [
        { label: 'Gross', value: gross },
        { label: 'Discount', value: disc },
        { label: 'Order total (VAT incl.)', value: r2(gross - disc), strong: true },
      ];
    },
    viewHeader: [
      { key: 'bussname', label: 'Customer' },
      { key: 'plntno', label: 'Deliver from' },
      { key: 'deldate', label: 'Delivery date', kind: 'date' },
      { key: 'pono', label: 'Customer PO' },
      { key: 'shipto', label: 'Ship to' },
      { key: 'smnname', label: 'Salesman' },
    ],
    viewLines: [
      { key: 'codeno', label: 'Code', kind: 'mono' },
      { key: 'mmdesc', label: 'Product' },
      { key: 'qty', label: 'Ordered', kind: 'qty' },
      { key: 'delivered', label: 'Delivered', kind: 'qty' },
      { key: 'open', label: 'Open', kind: 'qty' },
      { key: 'sp', label: 'Price', kind: 'money' },
      { key: 'netamt', label: 'Amount', kind: 'money' },
    ],
  },

  si: {
    type: 'si',
    title: 'Sales Invoice',
    plural: 'Sales Invoices',
    form: '019',
    description: 'Bill customers for delivered goods. VAT and the amount due are computed; posting creates the receivable.',
    newLabel: 'New invoice',
    tabs: ['Open', 'Posted', 'Void'],
    sources: [{ id: 'do', label: 'Bill a delivery', help: 'Products, quantities and prices come from the posted delivery and its sales order.' }],
    listCols: [
      { key: 'no', label: 'Invoice no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Customer' },
      { key: 'dono', label: 'Delivery', hideOnMobile: true },
      { key: 'amount', label: 'Amount due', kind: 'money' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'custno', label: 'Customer', type: 'lookup', lookup: 'customers', required: true, span: 2 },
      { key: 'transdate', label: 'Invoice date', type: 'date', required: true },
      { key: 'dono', label: 'Delivery', type: 'text', readOnly: () => true, when: (d) => Boolean(d.dono) },
      { key: 'pc', label: 'Profit center', type: 'lookup', lookup: 'profitCenters' },
      { key: 'smnno', label: 'Salesman', type: 'lookup', lookup: 'salesmen' },
      { key: 'shipto', label: 'Ship to', type: 'text', span: 2 },
      { key: 'remarks', label: 'Remarks', type: 'text', span: 3 },
    ],
    lines: {
      addLabel: 'Add product',
      cols: [
        { key: 'codeno', label: 'Product', type: 'lookup', lookup: 'materials', width: '32%' },
        { key: 'lotno', label: 'Lot', type: 'text', width: '12%' },
        { key: 'qty', label: 'Quantity', type: 'number' },
        { key: 'sp', label: 'Price (VAT incl.)', type: 'money' },
        { key: 'detdiscamt', label: 'Discount', type: 'money' },
        { key: 'amt', label: 'Amount', type: 'computed', computeKind: 'money', compute: (l) => r2(n(l.qty) * n(l.sp) - n(l.detdiscamt)) },
      ],
    },
    onLine: (key, _v, line, _d, item) => (key === 'codeno' && item?.data ? { sp: line.sp || item.data.sp } : {}),
    totals: (d) => {
      const total = lineTotal(d, (l) => n(l.qty) * n(l.sp) - n(l.detdiscamt));
      const vat = splitVat(total).vat;
      return [
        { label: 'VATable sales', value: r2(total - vat) },
        { label: 'VAT (12%)', value: vat },
        { label: 'Total amount due', value: total, strong: true },
      ];
    },
    viewHeader: [
      { key: 'bussname', label: 'Customer' },
      { key: 'tin', label: 'Customer TIN' },
      { key: 'transdate', label: 'Invoice date', kind: 'date' },
      { key: 'duedate', label: 'Due date', kind: 'date' },
      { key: 'dono', label: 'Delivery' },
      { key: 'shipto', label: 'Ship to' },
    ],
    viewLines: [
      { key: 'codeno', label: 'Code', kind: 'mono' },
      { key: 'mmdesc', label: 'Product' },
      { key: 'lotno', label: 'Lot' },
      { key: 'qty', label: 'Quantity', kind: 'qty' },
      { key: 'sp', label: 'Price', kind: 'money' },
      { key: 'detvat', label: 'VAT', kind: 'money' },
      { key: 'itmamt', label: 'Amount', kind: 'money' },
    ],
  },

  riv: {
    type: 'riv',
    title: 'Requisition',
    plural: 'Requisitions (RIV)',
    form: '054',
    description: 'Request materials for a plant. Current stock and an estimated cost are filled in automatically; once approved, purchasing turns it into a PO.',
    newLabel: 'New requisition',
    tabs: ['Open', 'Approved', 'Void'],
    sources: [{ id: 'reorder', label: 'Suggest from reorder levels', help: 'Lists every material below its reorder level at a plant, with suggested quantities.' }],
    listCols: [
      { key: 'no', label: 'RIV no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Department' },
      { key: 'plntno', label: 'Plant', hideOnMobile: true },
      { key: 'datereq', label: 'Needed by', kind: 'date', hideOnMobile: true },
      { key: 'amount', label: 'Estimate', kind: 'money' },
      { key: 'servstat', label: 'Ordering', kind: 'status', hideOnMobile: true },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'dept', label: 'Requesting department', type: 'lookup', lookup: 'departments', required: true },
      { key: 'plntno', label: 'For plant', type: 'lookup', lookup: 'plants', required: true },
      { key: 'datereq', label: 'Needed by', type: 'date' },
      { key: 'transdate', label: 'Request date', type: 'date', required: true },
      { key: 'remarks', label: 'Purpose', type: 'text', span: 2 },
    ],
    lines: {
      addLabel: 'Add material',
      availability: true,
      cols: [
        { key: 'codeno', label: 'Material', type: 'lookup', lookup: 'materials', width: '40%' },
        { key: 'qty', label: 'Quantity', type: 'number' },
        { key: 'uc', label: 'Est. unit cost', type: 'money', placeholder: 'auto' },
        { key: 'amt', label: 'Estimate', type: 'computed', computeKind: 'money', compute: (l) => r2(n(l.qty) * n(l.uc)) },
      ],
    },
    onLine: materialPick,
    totals: (d) => [{ label: 'Estimated total', value: lineTotal(d, (l) => n(l.qty) * n(l.uc)), strong: true }],
    viewHeader: [
      { key: 'deptname', label: 'Department' },
      { key: 'plntno', label: 'Plant' },
      { key: 'datereq', label: 'Needed by', kind: 'date' },
      { key: 'remarks', label: 'Purpose' },
      { key: 'user', label: 'Requested by' },
    ],
    viewLines: [
      { key: 'codeno', label: 'Code', kind: 'mono' },
      { key: 'mmdesc', label: 'Material' },
      { key: 'currinv', label: 'Stock when requested', kind: 'qty' },
      { key: 'qty', label: 'Requested', kind: 'qty' },
      { key: 'qtydel', label: 'Ordered', kind: 'qty' },
      { key: 'qtybal', label: 'To order', kind: 'qty' },
      { key: 'amt', label: 'Estimate', kind: 'money' },
    ],
  },

  po: {
    type: 'po',
    title: 'Purchase Order',
    plural: 'Purchase Orders',
    form: '035',
    description: "Orders to suppliers. Create one from an approved requisition; approval checks the approver's limit automatically.",
    newLabel: 'New purchase order',
    tabs: ['Open', 'Approved', 'Void'],
    sources: [{ id: 'riv', label: 'Order an approved requisition', help: 'Copies the requisition lines that still need to be ordered.' }],
    listCols: [
      { key: 'no', label: 'PO no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Vendor' },
      { key: 'plntno', label: 'Deliver to', hideOnMobile: true },
      { key: 'amount', label: 'Amount', kind: 'money' },
      { key: 'servstat', label: 'Receiving', kind: 'status', hideOnMobile: true },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'venno', label: 'Vendor', type: 'lookup', lookup: 'vendors', required: true, span: 2 },
      { key: 'plntno', label: 'Deliver to', type: 'lookup', lookup: 'plants', required: true },
      { key: 'transdate', label: 'PO date', type: 'date', required: true },
      { key: 'datereq', label: 'Delivery date', type: 'date' },
      { key: 'terms', label: 'Terms (days)', type: 'number', hint: "Defaults to the vendor's terms." },
      { key: 'rivno', label: 'Requisition', type: 'text', readOnly: () => true, when: (d) => Boolean(d.rivno) },
      { key: 'dept', label: 'Department', type: 'lookup', lookup: 'departments' },
      { key: 'poremarks', label: 'Notes to vendor', type: 'text', span: 2 },
      { key: 'remarks', label: 'Internal remarks', type: 'text', span: 3 },
    ],
    lines: {
      addLabel: 'Add material',
      cols: [
        { key: 'codeno', label: 'Material', type: 'lookup', lookup: 'materials', width: '42%' },
        { key: 'qty', label: 'Quantity', type: 'number' },
        { key: 'uc', label: 'Unit price', type: 'money' },
        { key: 'amt', label: 'Amount', type: 'computed', computeKind: 'money', compute: (l) => r2(n(l.qty) * n(l.uc)) },
      ],
    },
    onHeader: (key, _v, d, item) => (key === 'venno' && item?.data && (d.terms === '' || d.terms === undefined) ? { terms: item.data.terms } : {}),
    onLine: materialPick,
    totals: (d) => [{ label: 'PO total', value: lineTotal(d, (l) => n(l.qty) * n(l.uc)), strong: true }],
    viewHeader: [
      { key: 'venname', label: 'Vendor' },
      { key: 'ventin', label: 'Vendor TIN' },
      { key: 'plntno', label: 'Deliver to' },
      { key: 'datereq', label: 'Delivery date', kind: 'date' },
      { key: 'poremarks', label: 'Notes to vendor' },
      { key: 'user', label: 'Prepared by' },
    ],
    viewLines: [
      { key: 'codeno', label: 'Code', kind: 'mono' },
      { key: 'mmdesc', label: 'Material' },
      { key: 'qty', label: 'Ordered', kind: 'qty' },
      { key: 'received', label: 'Received', kind: 'qty' },
      { key: 'open', label: 'Open', kind: 'qty' },
      { key: 'uc', label: 'Unit price', kind: 'money' },
      { key: 'amt', label: 'Amount', kind: 'money' },
    ],
  },

  mmrr: {
    type: 'mmrr',
    title: 'Receiving Report',
    plural: 'Receiving Reports (MMRR)',
    form: '050',
    description: 'Goods received from suppliers. Receive against a PO and the open quantities, costs and lot numbers are filled in for you.',
    newLabel: 'Receive goods',
    tabs: ['Open', 'Posted', 'Void'],
    sources: [{ id: 'po', label: 'Receive against a PO', help: 'Fills in the vendor, plant and everything still open on the purchase order.' }],
    listCols: [
      { key: 'no', label: 'RR no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Vendor' },
      { key: 'pono', label: 'PO', hideOnMobile: true },
      { key: 'plntno', label: 'Plant', hideOnMobile: true },
      { key: 'amount', label: 'Cost', kind: 'money' },
      { key: 'labstat', label: 'Lab', kind: 'status', hideOnMobile: true },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'venno', label: 'Vendor', type: 'lookup', lookup: 'vendors', required: true, span: 2 },
      { key: 'plntno', label: 'Received at', type: 'lookup', lookup: 'plants', required: true },
      { key: 'transdate', label: 'Date received', type: 'date', required: true },
      { key: 'formno', label: 'Vendor delivery receipt no.', type: 'text' },
      { key: 'pono', label: 'Purchase order', type: 'text', readOnly: () => true, when: (d) => Boolean(d.pono) },
      { key: 'remarks', label: 'Remarks', type: 'text', span: 3 },
    ],
    lines: {
      addLabel: 'Add material',
      cols: [
        { key: 'codeno', label: 'Material', type: 'lookup', lookup: 'materials', width: '32%' },
        { key: 'qty', label: 'Quantity', type: 'number' },
        { key: 'uc', label: 'Unit cost', type: 'money' },
        { key: 'lotno', label: 'Lot no.', type: 'text', placeholder: 'auto' },
        { key: 'expdate', label: 'Expiry', type: 'date' },
        { key: 'amt', label: 'Cost', type: 'computed', computeKind: 'money', compute: (l) => r2(n(l.qty) * n(l.uc)) },
      ],
    },
    onLine: materialPick,
    totals: (d) => [
      { label: 'Total quantity', value: lineTotal(d, (l) => n(l.qty)), kind: 'qty' },
      { label: 'Total cost', value: lineTotal(d, (l) => n(l.qty) * n(l.uc)), strong: true },
    ],
    viewHeader: [
      { key: 'venname', label: 'Vendor' },
      { key: 'plntname', label: 'Received at' },
      { key: 'transdate', label: 'Date received', kind: 'date' },
      { key: 'formno', label: 'Vendor DR no.' },
      { key: 'labstat', label: 'Lab status', kind: 'status' },
      { key: 'user', label: 'Received by' },
    ],
    viewLines: [
      { key: 'codeno', label: 'Code', kind: 'mono' },
      { key: 'mmdesc', label: 'Material' },
      { key: 'lotno', label: 'Lot', kind: 'mono' },
      { key: 'expdate', label: 'Expiry', kind: 'date' },
      { key: 'qty', label: 'Quantity', kind: 'qty' },
      { key: 'uc', label: 'Unit cost', kind: 'money' },
      { key: 'itmamt', label: 'Cost', kind: 'money' },
    ],
  },

  do: {
    type: 'do',
    title: 'Delivery / Issuance',
    plural: 'Deliveries & Transfers',
    form: '007',
    description: 'Stock leaving a plant: customer deliveries, plant transfers, production issues and scrapping. Lots are picked automatically, earliest expiry first.',
    newLabel: 'New issuance',
    tabs: ['Open', 'Posted', 'Void'],
    sources: [{ id: 'so', label: 'Deliver a sales order', help: 'Fills in the customer, plant and everything still to deliver.' }],
    listCols: [
      { key: 'no', label: 'DO no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'movdesc', label: 'Type', hideOnMobile: true },
      { key: 'party', label: 'Customer / destination' },
      { key: 'plntno', label: 'From', hideOnMobile: true },
      { key: 'amount', label: 'Quantity', kind: 'qty' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'mov', label: 'Type of movement', type: 'lookup', lookup: 'movements', required: true },
      { key: 'plntno', label: 'From plant', type: 'lookup', lookup: 'plants', required: true },
      { key: 'transdate', label: 'Date', type: 'date', required: true },
      { key: 'plntdest', label: 'To plant', type: 'lookup', lookup: 'plants', required: true, when: (d) => d.mov === '311' },
      { key: 'custno', label: 'Customer', type: 'lookup', lookup: 'customers', required: true, when: (d) => d.mov === '201', span: 2 },
      { key: 'sono', label: 'Sales order', type: 'text', readOnly: () => true, when: (d) => d.mov === '201' && Boolean(d.sono) },
      { key: 'shipto', label: 'Ship to', type: 'text', when: (d) => d.mov === '201', span: 2 },
      { key: 'driver', label: 'Driver', type: 'text' },
      { key: 'plateno', label: 'Plate no.', type: 'text' },
      { key: 'remarks', label: 'Remarks', type: 'text', span: 3 },
    ],
    lines: {
      addLabel: 'Add material',
      availability: true,
      cols: [
        { key: 'codeno', label: 'Material', type: 'lookup', lookup: 'materials', width: '38%' },
        { key: 'qty', label: 'Quantity', type: 'number' },
        { key: 'lotno', label: 'Lot', type: 'text', placeholder: 'auto' },
        { key: 'sp', label: 'Price', type: 'money', when: (d) => d.mov === '201' },
      ],
    },
    onHeader: (key, _v, d, item) => (key === 'custno' && item?.data ? { shipto: d.shipto || item.data.address || '' } : {}),
    onLine: (key, v, line, d, item) => (key === 'codeno' && item?.data && d.mov === '201' ? { sp: line.sp || item.data.sp, um: item.data.um } : materialPick(key, v, line, d, item)),
    totals: (d) => [{ label: 'Total quantity', value: lineTotal(d, (l) => n(l.qty)), kind: 'qty', strong: true }],
    viewHeader: [
      { key: 'movdesc', label: 'Movement' },
      { key: 'plntname', label: 'From plant' },
      { key: 'plntdest', label: 'To plant' },
      { key: 'bussname', label: 'Customer' },
      { key: 'shipto', label: 'Ship to' },
      { key: 'transdate', label: 'Date', kind: 'date' },
    ],
    viewLines: [
      { key: 'codeno', label: 'Code', kind: 'mono' },
      { key: 'mmdesc', label: 'Material' },
      { key: 'lotno', label: 'Lot', kind: 'mono' },
      { key: 'qty', label: 'Quantity', kind: 'qty' },
      { key: 'um', label: 'Unit' },
      { key: 'cosamt', label: 'Cost', kind: 'money' },
    ],
  },

  adj: {
    type: 'adj',
    title: 'Physical Count',
    plural: 'Physical Counts',
    form: '034',
    description: 'Record a stock count. The system shows its own quantities, works out the differences and adjusts stock and the ledger when you post.',
    newLabel: 'New count',
    tabs: ['Posted'],
    listCols: [
      { key: 'no', label: 'Count no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'plntno', label: 'Plant' },
      { key: 'lines', label: 'Lines counted', kind: 'qty' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'plntno', label: 'Plant counted', type: 'lookup', lookup: 'plants', required: true },
      { key: 'transdate', label: 'Count date', type: 'date', required: true },
      { key: 'remarks', label: 'Remarks', type: 'text' },
    ],
    custom: 'count',
    saveLabel: 'Post count',
    noEdit: true,
    viewHeader: [
      { key: 'plntno', label: 'Plant' },
      { key: 'transdate', label: 'Count date', kind: 'date' },
    ],
    viewLines: [
      { key: 'codeno', label: 'Code', kind: 'mono' },
      { key: 'mmdesc', label: 'Material' },
      { key: 'lotno', label: 'Lot', kind: 'mono' },
      { key: 'stdqty', label: 'System', kind: 'qty' },
      { key: 'qty', label: 'Counted', kind: 'qty' },
      { key: 'variance', label: 'Difference', kind: 'qty' },
    ],
  },

  prod: {
    type: 'prod',
    title: 'Production Worksheet',
    plural: 'Production Worksheets',
    form: '033',
    description: 'Produce a finished-goods lot. Materials are issued automatically and the cost per unit is calculated when you complete the run.',
    newLabel: 'New production run',
    tabs: ['Open', 'Posted', 'Void'],
    sources: [{ id: 'formula', label: 'Repeat a previous run', help: 'Copies the materials of the last run of a product; change the quantity and they scale automatically.' }],
    listCols: [
      { key: 'no', label: 'Worksheet', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Product' },
      { key: 'lotno', label: 'Lot', kind: 'mono', hideOnMobile: true },
      { key: 'plntno', label: 'Plant', hideOnMobile: true },
      { key: 'amount', label: 'Quantity', kind: 'qty' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'codeno', label: 'Product to make', type: 'lookup', lookup: 'materials', required: true, span: 2 },
      { key: 'qty', label: 'Quantity', type: 'number', required: true },
      { key: 'plntno', label: 'Production plant', type: 'lookup', lookup: 'plants', required: true },
      { key: 'transdate', label: 'Production date', type: 'date', required: true },
      { key: 'noofbatch', label: 'Batches', type: 'number' },
      { key: 'expirydate', label: 'Lot expiry', type: 'date', hint: 'Defaults to one year.' },
      { key: 'remarks', label: 'Remarks', type: 'text', span: 2 },
    ],
    lines: {
      addLabel: 'Add material',
      availability: true,
      cols: [
        { key: 'codeno', label: 'Raw / packaging material', type: 'lookup', lookup: 'materials', width: '50%' },
        { key: 'qty', label: 'Quantity used', type: 'number' },
      ],
    },
    onHeader: (key, v, d) => (key === 'qty' && (d.lines ?? []).some((l: Draft) => l.ratio) ? { lines: d.lines.map((l: Draft) => (l.ratio ? { ...l, qty: Math.round(l.ratio * n(v) * 1000) / 1000 } : l)) } : {}),
    onLine: (key, v, line, d, item) => ({ ...materialPick(key, v, line, d, item), ...(key === 'qty' ? { ratio: undefined } : {}) }),
    totals: (d) => [{ label: 'Materials used (units)', value: lineTotal(d, (l) => n(l.qty)), kind: 'qty' }],
    viewHeader: [
      { key: 'mmdesc', label: 'Product' },
      { key: 'lotno', label: 'Lot', kind: 'mono' },
      { key: 'plntno', label: 'Plant' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'expirydate', label: 'Expiry', kind: 'date' },
    ],
    viewLines: [
      { key: 'codeno', label: 'Code', kind: 'mono' },
      { key: 'mmdesc', label: 'Material' },
      { key: 'qty', label: 'Quantity', kind: 'qty' },
      { key: 'um', label: 'Unit' },
      { key: 'stdcosamt', label: 'Cost', kind: 'money' },
    ],
  },
};

function memo(type: 'cm' | 'dm', title: string, plural: string, form: string, description: string, account: string): DocConfig {
  return {
    type,
    title,
    plural,
    form,
    description,
    newLabel: `New ${title.toLowerCase()}`,
    tabs: ['Open', 'Approved', 'Void'],
    listCols: [
      { key: 'no', label: `${title} no.`, kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Customer' },
      { key: 'reasons', label: 'Reason', hideOnMobile: true },
      { key: 'amount', label: 'Amount', kind: 'money' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'custno', label: 'Customer', type: 'lookup', lookup: 'customers', required: true, span: 2 },
      { key: 'transdate', label: 'Date', type: 'date', required: true },
      { key: 'reasons', label: 'Reason', type: 'text', required: true, span: 2 },
      { key: 'remarks', label: 'Remarks', type: 'text' },
    ],
    lines: {
      addLabel: 'Add invoice',
      cols: [
        { key: 'invno', label: 'Invoice', type: 'lookup', lookup: 'openInvoices', width: '30%' },
        { key: 'amt', label: 'Amount', type: 'money' },
        { key: 'glacct1', label: 'Account', type: 'lookup', lookup: 'accounts', width: '30%' },
        { key: 'ccno', label: 'Cost center', type: 'lookup', lookup: 'costCenters' },
      ],
    },
    onLine: (key, _v, line) => (key === 'invno' && !line.glacct1 ? { glacct1: account } : {}),
    totals: (d) => [{ label: `${title} total`, value: lineTotal(d, (l) => n(l.amt)), strong: true }],
    viewHeader: [
      { key: 'bussname', label: 'Customer' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'reasons', label: 'Reason' },
      { key: 'remarks', label: 'Remarks' },
    ],
    viewLines: [
      { key: 'invno', label: 'Invoice', kind: 'mono' },
      { key: 'invamt', label: 'Invoice amount', kind: 'money' },
      { key: 'amt', label: 'Amount', kind: 'money' },
      { key: 'glacct1', label: 'Account', kind: 'mono' },
    ],
  };
}

function fundVoucher(type: 'pcv' | 'rfv', title: string, plural: string, fund: string): DocConfig {
  return {
    type,
    title,
    plural,
    form: '026',
    description: `Small expenses paid in cash from the ${fund}. The amount comes out of the fund when the voucher is posted; posted vouchers are then replenished in one go.`,
    newLabel: `New ${title.toLowerCase()}`,
    tabs: ['Open', 'Posted', 'Void'],
    summary: true,
    saveThen: { action: 'post', label: 'Save & post' },
    listCols: [
      { key: 'no', label: 'Voucher no.', kind: 'mono' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'party', label: 'Paid to' },
      { key: 'remarks', label: 'For', hideOnMobile: true },
      { key: 'repl', label: 'Replenishment', hideOnMobile: true },
      { key: 'amount', label: 'Amount', kind: 'money' },
      { key: 'status', label: 'Status', kind: 'status' },
    ],
    header: [
      { key: 'venno', label: 'Paid to', type: 'lookup', lookup: 'vendors', required: true, span: 2, hint: 'Use "Various Suppliers" for small stores without a vendor record.' },
      { key: 'refdoc', label: 'Receipt no.', type: 'text', placeholder: 'OR / SI number' },
      { key: 'transdate', label: 'Date', type: 'date', required: true },
      { key: 'remarks', label: 'What was it for?', type: 'textarea', span: 2 },
    ],
    lines: {
      addLabel: 'Add expense',
      cols: [
        { key: 'acctno', label: 'Account', type: 'lookup', lookup: 'accounts', width: '34%' },
        { key: 'ccno', label: 'Cost center', type: 'lookup', lookup: 'costCenters', width: '22%' },
        { key: 'amount', label: 'Amount (VAT incl.)', type: 'money' },
        { key: 'vatable', label: 'VAT', type: 'select', options: [{ value: 'Y', label: '12%' }, { value: 'N', label: 'None' }], width: '104px' },
      ],
    },
    totals: (d) => {
      const gross = lineTotal(d, (l) => n(l.amount));
      const vat = sum((d.lines ?? []) as Draft[], (l) => splitVat(n(l.amount), l.vatable !== 'N').vat);
      const rows: { label: string; value: number; strong?: boolean; warn?: boolean }[] = [
        { label: 'Expense (net of VAT)', value: r2(gross - vat) },
        { label: 'Input VAT', value: vat },
        { label: `Paid from the ${fund}`, value: gross, strong: true },
      ];
      if (d._fund) rows.push({ label: 'Available in the fund', value: n(d._fund.available), warn: gross > n(d._fund.available) });
      return rows;
    },
    viewHeader: [
      { key: 'venname', label: 'Paid to' },
      { key: 'refdoc', label: 'Receipt no.' },
      { key: 'transdate', label: 'Date', kind: 'date' },
      { key: 'user', label: 'Custodian' },
      { key: 'remarks', label: 'For' },
    ],
    viewLines: [
      { key: 'acctno', label: 'Account', kind: 'mono' },
      { key: 'acctdesc', label: 'Title' },
      { key: 'ccno', label: 'Cost center' },
      { key: 'amount', label: 'Amount (VAT incl.)', kind: 'money' },
      { key: 'net', label: 'Net of VAT', kind: 'money' },
    ],
  };
}

export function docConfig(type: string): DocConfig | undefined {
  return DOCS[type];
}
