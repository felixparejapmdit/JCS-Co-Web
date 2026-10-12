import type { Row } from '../db';
import { ACTION, FORM } from '@/shared/codes';
import { nowStamp, today } from '@/shared/dates';
import { Ctx, audit, fail, isAllowed, nextDocNo, num, requireRight, str } from './context';

export type FieldType = 'text' | 'number' | 'money' | 'select' | 'lookup' | 'textarea' | 'email' | 'tel' | 'yesno' | 'date';

export interface MasterField {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  lookup?: string;
  help?: string;
  keyField?: boolean; // the record's code; read-only after creation
  width?: 'full' | 'half' | 'third';
  default?: unknown;
  list?: boolean; // show in the list table
}

export interface MasterSpec {
  id: string;
  title: string;
  singular: string;
  description: string;
  table: string;
  key: string;
  form: string;
  fields: MasterField[];
  search: string[];
  autoKey?: { prefix: string; width: number };
  order?: [string, 'asc' | 'desc'];
  validate?: (ctx: Ctx, row: Row, isNew: boolean) => Promise<void>;
  extend?: (ctx: Ctx, rows: Row[]) => Promise<Row[]>; // adds computed list columns
}

const STATUS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];
const YESNO = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' },
];
const VAT = [
  { value: 'VAT', label: 'VAT registered' },
  { value: 'NONVAT', label: 'Non-VAT' },
  { value: 'ZERO', label: 'Zero-rated' },
];

export const MASTERS: Record<string, MasterSpec> = {
  vendors: {
    id: 'vendors',
    title: 'Vendors',
    singular: 'Vendor',
    description: 'Suppliers and payees. Their TIN, terms and withholding tax code fill in automatically on purchase orders and vouchers.',
    table: 'venmasttbl',
    key: 'venno',
    form: FORM.VENDOR,
    autoKey: { prefix: 'V', width: 5 },
    order: ['venname', 'asc'],
    search: ['venno', 'venname', 'tin', 'address'],
    fields: [
      { key: 'venno', label: 'Vendor no.', keyField: true, list: true, help: 'Leave blank to number automatically.' },
      { key: 'venname', label: 'Vendor name', required: true, list: true, width: 'full' },
      { key: 'address', label: 'Address', width: 'full' },
      { key: 'tin', label: 'TIN', list: true, help: 'Format 000-000-000-000' },
      { key: 'vat', label: 'VAT status', type: 'select', options: VAT, default: 'VAT' },
      { key: 'ewtcode', label: 'Withholding tax (ATC)', type: 'lookup', lookup: 'ewtCodes', list: true },
      { key: 'terms', label: 'Payment terms (days)', type: 'number', default: 30, list: true },
      { key: 'ventype', label: 'Vendor type', type: 'select', options: [{ value: 'Trade', label: 'Trade' }, { value: 'Non-trade', label: 'Non-trade' }, { value: 'Employee', label: 'Employee' }], default: 'Trade' },
      { key: 'poreq', label: 'PO required', type: 'yesno', default: 'Y' },
      { key: 'mmrrreq', label: 'Receiving report required', type: 'yesno', default: 'Y' },
      { key: 'pcfcust', label: 'Petty cash / revolving fund custodian', type: 'yesno', default: 'N', help: 'Employees who hold a fund; their replenishments are paid to them.' },
      { key: 'conper', label: 'Contact person' },
      { key: 'telno', label: 'Phone', type: 'tel' },
      { key: 'emailadd', label: 'Email', type: 'email' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS, default: 'Active', list: true },
    ],
    async validate(_ctx, row) {
      if (row.tin && !/^\d{3}-\d{3}-\d{3}-\d{3,5}$/.test(row.tin)) fail('TIN must look like 000-000-000-000.');
    },
  },
  customers: {
    id: 'customers',
    title: 'Customers',
    singular: 'Customer',
    description: 'Debtors with their credit limit, terms, salesman and price group. Sales orders check the credit limit automatically.',
    table: 'custmasttbl',
    key: 'custno',
    form: FORM.CUSTOMER,
    autoKey: { prefix: 'C', width: 5 },
    order: ['bussname', 'asc'],
    search: ['custno', 'bussname', 'tin', 'address', 'searchname'],
    fields: [
      { key: 'custno', label: 'Customer no.', keyField: true, list: true, help: 'Leave blank to number automatically.' },
      { key: 'bussname', label: 'Business name', required: true, list: true, width: 'full' },
      { key: 'address', label: 'Address', width: 'full' },
      { key: 'tin', label: 'TIN' },
      { key: 'areano', label: 'Area', type: 'lookup', lookup: 'areas', list: true },
      { key: 'smnno', label: 'Salesman', type: 'lookup', lookup: 'salesmen', list: true },
      { key: 'paytype', label: 'Payment type', type: 'select', options: [{ value: 'Charge', label: 'Charge (on account)' }, { value: 'Cash', label: 'Cash' }], default: 'Charge' },
      { key: 'term', label: 'Terms (days)', type: 'number', default: 30 },
      { key: 'crlimit', label: 'Credit limit', type: 'money', default: 0, list: true },
      { key: 'vat', label: 'VAT status', type: 'select', options: VAT, default: 'VAT' },
      { key: 'ewt', label: 'Withholds EWT (%)', type: 'number', default: 1, help: 'Rate the customer withholds on payments (BIR 2307). 0 if none.' },
      { key: 'contactno', label: 'Contact no.', type: 'tel' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS, default: 'Active', list: true },
    ],
  },
  materials: {
    id: 'materials',
    title: 'Materials',
    singular: 'Material',
    description: 'Raw materials, packaging and finished goods, with unit, selling price and reorder level.',
    table: 'mmasttbl',
    key: 'codeno',
    form: FORM.INVENTORY_REPORTS,
    order: ['codeno', 'asc'],
    search: ['codeno', 'mmdesc', 'mmgrp'],
    fields: [
      { key: 'codeno', label: 'Material code', keyField: true, required: true, list: true },
      { key: 'mmdesc', label: 'Description', required: true, list: true, width: 'full' },
      {
        key: 'mmtype',
        label: 'Type',
        type: 'select',
        list: true,
        options: [
          { value: 'RM', label: 'Raw material' },
          { value: 'PM', label: 'Packaging material' },
          { value: 'FG', label: 'Finished good' },
          { value: 'SP', label: 'Supplies / spare parts' },
        ],
        default: 'RM',
      },
      { key: 'mmgrp', label: 'Material group', list: true },
      { key: 'um', label: 'Unit of measure', required: true, default: 'KG', list: true },
      { key: 'wtfr', label: 'Weight per unit (kg)', type: 'number', default: 1 },
      { key: 'sp', label: 'Selling price (VAT incl.)', type: 'money', default: 0, list: true },
      { key: 'vat', label: 'Subject to VAT', type: 'yesno', default: 'Y' },
      { key: 'glacct', label: 'Sales account', type: 'lookup', lookup: 'accounts', help: 'Used when this material is invoiced.' },
      { key: 'invlevel', label: 'Reorder level', type: 'number', default: 0, help: 'You are alerted when stock falls below this.' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS, default: 'Active', list: true },
    ],
  },
  plants: {
    id: 'plants',
    title: 'Plants & Warehouses',
    singular: 'Plant / warehouse',
    description: 'Every plant, warehouse and farm that holds stock, with its inventory accounts. Stock is tracked per plant.',
    table: 'plnttbl',
    key: 'plntno',
    form: FORM.INVENTORY_REPORTS,
    order: ['plntno', 'asc'],
    search: ['plntno', 'plntname'],
    fields: [
      { key: 'plntno', label: 'Plant code', keyField: true, required: true, list: true },
      { key: 'plntname', label: 'Plant / warehouse name', required: true, list: true, width: 'full' },
      { key: 'invset', label: 'Track inventory', type: 'yesno', default: 'Y', list: true, help: "The legacy 'invset' switch. Plants set to No accept documents without stock checks." },
      { key: 'prodnplnt', label: 'Production plant', type: 'yesno', default: 'N', list: true },
      { key: 'ownertype', label: 'Ownership', type: 'select', options: [{ value: 'Company', label: 'Company-owned' }, { value: 'Consignee', label: 'Consignee / third party' }], default: 'Company' },
      { key: 'rminv', label: 'Raw material inventory account', type: 'lookup', lookup: 'accounts', default: '1140100' },
      { key: 'fginv', label: 'Finished goods inventory account', type: 'lookup', lookup: 'accounts', default: '1140200' },
      { key: 'rmcos', label: 'Cost of sales account', type: 'lookup', lookup: 'accounts', default: '5100100' },
      { key: 'ccno', label: 'Cost center', type: 'lookup', lookup: 'costCenters' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS, default: 'Active', list: true },
    ],
  },
  accounts: {
    id: 'accounts',
    title: 'Chart of Accounts',
    singular: 'Account',
    description: 'General ledger accounts. The first digit sets the class: 1 assets, 2 liabilities, 3 equity, 4 revenue, 5 cost of sales, 6 expenses.',
    table: 'acctcharttbl',
    key: 'acctno',
    form: FORM.JOURNAL_VOUCHER,
    order: ['acctno', 'asc'],
    search: ['acctno', 'acctdesc'],
    fields: [
      { key: 'acctno', label: 'Account no.', keyField: true, required: true, list: true, help: '7 digits, e.g. 6200100' },
      { key: 'acctdesc', label: 'Account title', required: true, list: true, width: 'full' },
      { key: 'upperacct', label: 'Parent account', type: 'lookup', lookup: 'accounts' },
      { key: 'subacct', label: 'Requires sub-account', type: 'yesno', default: 'N' },
      { key: 'cv', label: 'Allowed on cheque vouchers', type: 'yesno', default: 'N' },
      { key: 'taxitm', label: 'Tax item', type: 'yesno', default: 'N' },
    ],
    async validate(_ctx, row) {
      if (!/^\d{7}$/.test(row.acctno)) fail('Account numbers have 7 digits.');
    },
    async extend(_ctx, rows) {
      const cls: Record<string, string> = { '1': 'Asset', '2': 'Liability', '3': 'Equity', '4': 'Revenue', '5': 'Cost of sales', '6': 'Expense', '7': 'Other income', '8': 'Other expense' };
      return rows.map((r) => ({ ...r, class: cls[String(r.acctno)[0]] ?? 'Expense' }));
    },
  },
  costCenters: {
    id: 'costCenters',
    title: 'Cost Centers',
    singular: 'Cost center',
    description: 'Departments and plants that carry expenses. Expense lines and payroll are charged to a cost center.',
    table: 'cctrnotbl',
    key: 'ccno',
    form: FORM.JOURNAL_VOUCHER,
    order: ['ccno', 'asc'],
    search: ['ccno', 'ccdesc', 'ccnogrp'],
    fields: [
      { key: 'ccno', label: 'Cost center', keyField: true, required: true, list: true },
      { key: 'ccdesc', label: 'Description', required: true, list: true, width: 'full' },
      { key: 'ccnogrp', label: 'Group', list: true },
      { key: 'cosexp', label: 'Charged to', type: 'select', options: [{ value: 'E', label: 'Operating expense' }, { value: 'C', label: 'Cost of sales / production' }], default: 'E' },
      { key: 'currstat', label: 'Status', type: 'select', options: STATUS, default: 'Active', list: true },
    ],
  },
  profitCenters: {
    id: 'profitCenters',
    title: 'Profit Centers',
    singular: 'Profit center',
    description: 'Business lines that earn revenue. Each has its own accounts receivable account.',
    table: 'pctrtbl',
    key: 'pc',
    form: FORM.JOURNAL_VOUCHER,
    order: ['pc', 'asc'],
    search: ['pc', 'pclass', 'tradetype'],
    fields: [
      { key: 'pc', label: 'Profit center', keyField: true, required: true, list: true },
      { key: 'pclass', label: 'Class / description', required: true, list: true },
      { key: 'tradetype', label: 'Trade type', list: true },
      { key: 'aracctno', label: 'Receivable account', type: 'lookup', lookup: 'accounts', default: '1130100' },
      { key: 'ccno', label: 'Cost center', type: 'lookup', lookup: 'costCenters' },
      { key: 'stat', label: 'Status', type: 'select', options: STATUS, default: 'Active', list: true },
    ],
  },
  banks: {
    id: 'banks',
    title: 'Bank Accounts',
    singular: 'Bank account',
    description: "Company checking and savings accounts. The account number is the bank's GL account; cheque numbers continue automatically.",
    table: 'banktbl',
    key: 'acctno',
    form: FORM.CHECK_VOUCHER,
    order: ['acctno', 'asc'],
    search: ['acctno', 'bankname', 'depository'],
    fields: [
      { key: 'acctno', label: 'GL account', keyField: true, required: true, type: 'lookup', lookup: 'accounts', list: true },
      { key: 'bankname', label: 'Bank', required: true, list: true },
      { key: 'depository', label: 'Bank account no.', list: true },
      { key: 'accttype', label: 'Account type', type: 'select', options: [{ value: 'CA', label: 'Checking' }, { value: 'SA', label: 'Savings' }], default: 'CA', list: true },
    ],
  },
  ewtCodes: {
    id: 'ewtCodes',
    title: 'Withholding Tax Codes',
    singular: 'Withholding tax code',
    description: 'BIR expanded withholding tax ATCs and rates. Vouchers compute EWT from these automatically.',
    table: 'bir_ewttbl',
    key: 'ewtcode',
    form: FORM.VOUCHER_PAYABLE,
    order: ['ewtcode', 'asc'],
    search: ['ewtcode', 'ewtdesc'],
    fields: [
      { key: 'ewtcode', label: 'ATC', keyField: true, required: true, list: true },
      { key: 'ewtdesc', label: 'Description', required: true, list: true, width: 'full' },
      { key: 'rate', label: 'Rate (%)', type: 'number', required: true, list: true },
      { key: 'cotype', label: 'Payee type', type: 'select', options: [{ value: 'C', label: 'Corporation' }, { value: 'I', label: 'Individual' }], default: 'C', list: true },
    ],
  },
  priceList: {
    id: 'priceList',
    title: 'Price List',
    singular: 'Price',
    description: 'Current selling price per material. Sales orders pick prices from here automatically.',
    table: 'plsttbl',
    key: 'codeno',
    form: FORM.CUSTOMER,
    order: ['codeno', 'asc'],
    search: ['codeno'],
    fields: [
      { key: 'codeno', label: 'Material', keyField: true, required: true, type: 'lookup', lookup: 'materials', list: true },
      { key: 'currprc', label: 'Current price (VAT incl.)', type: 'money', required: true, list: true },
      { key: 'prvdate', label: 'Effective from', type: 'date', default: today(), list: true },
    ],
    async extend(ctx, rows) {
      const mats = await ctx.db.all('mmasttbl');
      return rows.map((r) => ({ ...r, mmdesc: mats.find((m) => m.codeno === r.codeno)?.mmdesc ?? '' }));
    },
  },
  salesmen: {
    id: 'salesmen',
    title: 'Salesmen',
    singular: 'Salesman',
    description: 'Sales representatives and their areas.',
    table: 'smnmtbl',
    key: 'smnno',
    form: FORM.CUSTOMER,
    autoKey: { prefix: 'S', width: 3 },
    order: ['smnno', 'asc'],
    search: ['smnno', 'fullname'],
    fields: [
      { key: 'smnno', label: 'Salesman no.', keyField: true, list: true },
      { key: 'fullname', label: 'Full name', required: true, list: true },
      { key: 'shrtname', label: 'Short name' },
      { key: 'areano', label: 'Area', type: 'lookup', lookup: 'areas', list: true },
      { key: 'status', label: 'Status', type: 'select', options: STATUS, default: 'Active', list: true },
    ],
  },
  areas: {
    id: 'areas',
    title: 'Sales Areas',
    singular: 'Area',
    description: 'Territories used to group customers and salesmen.',
    table: 'areatbl',
    key: 'areano',
    form: FORM.CUSTOMER,
    order: ['areano', 'asc'],
    search: ['areano', 'areaname'],
    fields: [
      { key: 'areano', label: 'Area code', keyField: true, required: true, list: true },
      { key: 'areaname', label: 'Area name', required: true, list: true },
      { key: 'covarea', label: 'Coverage', width: 'full', list: true },
    ],
  },
  departments: {
    id: 'departments',
    title: 'Departments',
    singular: 'Department',
    description: 'Requesting departments for requisitions and their approvers.',
    table: 'depttbl',
    key: 'dept',
    form: FORM.RIV,
    order: ['dept', 'asc'],
    search: ['dept', 'deptname'],
    fields: [
      { key: 'dept', label: 'Department code', keyField: true, required: true, list: true },
      { key: 'deptname', label: 'Department name', required: true, list: true },
      { key: 'appby1', label: 'Approver', type: 'lookup', lookup: 'users', list: true },
    ],
  },
};

export function masterSpec(id: string): MasterSpec {
  const spec = MASTERS[id];
  if (!spec) fail(`Unknown master file: ${id}`, 404);
  return spec;
}

/** Field metadata for the browser (functions stripped). */
export function masterMeta(id: string) {
  const s = masterSpec(id);
  return { id: s.id, title: s.title, singular: s.singular, description: s.description, key: s.key, form: s.form, fields: s.fields, autoKey: Boolean(s.autoKey) };
}

export async function listMaster(ctx: Ctx, id: string): Promise<{ rows: Row[]; canInsert: boolean; canEdit: boolean }> {
  const s = masterSpec(id);
  await requireRight(ctx, s.form, ACTION.VIEW, `view ${s.title.toLowerCase()}`);
  let rows = await ctx.db.all(s.table, { orderBy: s.order ? [s.order] : [[s.key, 'asc']] });
  if (s.extend) rows = await s.extend(ctx, rows);
  return {
    rows,
    canInsert: await isAllowed(ctx.db, ctx.group, s.form, ACTION.INSERT),
    canEdit: await isAllowed(ctx.db, ctx.group, s.form, ACTION.EDIT),
  };
}

export async function saveMaster(ctx: Ctx, id: string, input: Row, isNew: boolean): Promise<{ key: string; message: string }> {
  const s = masterSpec(id);
  await requireRight(ctx, s.form, isNew ? ACTION.INSERT : ACTION.EDIT, `${isNew ? 'add' : 'change'} ${s.title.toLowerCase()}`);
  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    const row: Row = {};
    for (const f of s.fields) {
      let v = input[f.key];
      if (v === undefined || v === null || v === '') v = isNew ? f.default ?? '' : input[f.key] ?? '';
      if (f.type === 'number' || f.type === 'money') v = num(v);
      else v = str(v);
      if (f.required && (v === '' || v === null)) fail(`${f.label} is required.`);
      row[f.key] = v;
    }
    let key = str(row[s.key]);
    if (isNew) {
      if (!key) {
        if (!s.autoKey) fail(`${s.fields.find((f) => f.key === s.key)?.label ?? s.key} is required.`);
        key = await nextDocNo(db, s.table, s.key, s.autoKey.prefix, {}, s.autoKey.width);
        row[s.key] = key;
      }
      if (await db.one(s.table, { [s.key]: key })) fail(`${s.singular} ${key} already exists.`);
    } else {
      key = need(str(input[s.key]), `Missing ${s.key}`);
      if (!(await db.one(s.table, { [s.key]: key }))) fail(`${s.singular} ${key} was not found.`);
    }
    if (s.validate) await s.validate(c, row, isNew);
    // Fields shared with legacy screens that NextGen keeps filled.
    if (s.table === 'venmasttbl' || s.table === 'custmasttbl') {
      row.datechange = nowStamp();
      row.updateby = ctx.user;
      if (isNew) row.user = ctx.user;
    }
    if (s.table === 'custmasttbl') row.searchname = str(row.bussname).toUpperCase();
    const before = isNew ? null : await db.one(s.table, { [s.key]: key });
    if (isNew) await db.insert(s.table, row);
    else await db.update(s.table, { [s.key]: key }, row);
    if (s.table === 'custmasttbl') {
      await db.insert('custmasttbl_update', { ...pick(row, ['custno', 'bussname', 'address', 'areano', 'smnno', 'crlimit', 'term', 'status', 'tin', 'vat', 'ewt', 'paytype']), updatetype: isNew ? 'NEW' : 'EDIT', user: ctx.user, datecreated: nowStamp() });
    }
    await audit(c, { form: s.form, docno: key, trans: `${isNew ? 'Add' : 'Edit'} ${s.singular}`, table: s.table, before, after: row });
    return { key, message: `${s.singular} ${key} ${isNew ? 'added' : 'updated'}.` };
  });
}

function need(v: string, msg: string): string {
  if (!v) fail(msg);
  return v;
}

function pick(row: Row, cols: string[]): Row {
  const out: Row = {};
  for (const c of cols) out[c] = row[c];
  return out;
}

// ---------------------------------------------------------------------------
// Lookups for type-ahead fields
// ---------------------------------------------------------------------------
export interface LookupItem {
  value: string;
  label: string;
  sub?: string;
  data?: Row;
}

export async function lookup(ctx: Ctx, name: string): Promise<LookupItem[]> {
  const db = ctx.db;
  const active = (r: Row, col = 'status') => !r[col] || String(r[col]).toLowerCase() === 'active';
  switch (name) {
    case 'vendors':
      return (await db.all('venmasttbl', { orderBy: [['venname', 'asc']] }))
        .filter((r) => active(r))
        .map((r) => ({ value: r.venno, label: r.venname, sub: `${r.venno}${r.tin ? ' · TIN ' + r.tin : ''}`, data: { terms: num(r.terms), ewtcode: r.ewtcode, vat: r.vat, address: r.address, tin: r.tin } }));
    case 'customers':
      return (await db.all('custmasttbl', { orderBy: [['bussname', 'asc']] }))
        .filter((r) => active(r))
        .map((r) => ({ value: r.custno, label: r.bussname, sub: `${r.custno} · ${r.term} days · limit ₱${num(r.crlimit).toLocaleString('en-PH')}`, data: { term: num(r.term), crlimit: num(r.crlimit), smnno: r.smnno, ewt: num(r.ewt), vat: r.vat, address: r.address, tin: r.tin, areano: r.areano } }));
    case 'materials': {
      const prices = await db.all('plsttbl');
      return (await db.all('mmasttbl', { orderBy: [['codeno', 'asc']] }))
        .filter((r) => active(r))
        .map((r) => {
          const p = prices.find((x) => x.codeno === r.codeno);
          return { value: r.codeno, label: r.mmdesc, sub: `${r.codeno} · ${r.mmtype} · ${r.um}`, data: { um: r.um, sp: p ? num(p.currprc) : num(r.sp), mmtype: r.mmtype, vat: r.vat, wtfr: num(r.wtfr) || 1, glacct: r.glacct } };
        });
    }
    case 'plants':
      return (await db.all('plnttbl', { orderBy: [['plntno', 'asc']] }))
        .filter((r) => active(r))
        .map((r) => ({ value: r.plntno, label: r.plntname, sub: r.plntno + (r.invset === 'N' ? ' · inventory off' : ''), data: { invset: r.invset, prodnplnt: r.prodnplnt } }));
    case 'accounts':
      return (await db.all('acctcharttbl', { orderBy: [['acctno', 'asc']] })).map((r) => ({ value: r.acctno, label: r.acctdesc, sub: r.acctno }));
    case 'costCenters':
      return (await db.all('cctrnotbl', { orderBy: [['ccno', 'asc']] })).filter((r) => active(r, 'currstat')).map((r) => ({ value: r.ccno, label: r.ccdesc, sub: r.ccno }));
    case 'profitCenters':
      return (await db.all('pctrtbl', { orderBy: [['pc', 'asc']] })).map((r) => ({ value: r.pc, label: r.pclass, sub: r.pc, data: { aracctno: r.aracctno } }));
    case 'banks':
      return (await db.all('banktbl', { orderBy: [['acctno', 'asc']] })).map((r) => ({ value: r.acctno, label: r.bankname, sub: `${r.depository ?? ''} · GL ${r.acctno}` }));
    case 'ewtCodes':
      return (await db.all('bir_ewttbl', { orderBy: [['ewtcode', 'asc']] })).map((r) => ({ value: r.ewtcode, label: `${r.ewtcode} · ${num(r.rate)}%`, sub: r.ewtdesc, data: { rate: num(r.rate) } }));
    case 'salesmen':
      return (await db.all('smnmtbl', { orderBy: [['fullname', 'asc']] })).filter((r) => active(r)).map((r) => ({ value: r.smnno, label: r.fullname, sub: r.smnno }));
    case 'areas':
      return (await db.all('areatbl', { orderBy: [['areano', 'asc']] })).map((r) => ({ value: r.areano, label: r.areaname, sub: r.areano }));
    case 'departments':
      return (await db.all('depttbl', { orderBy: [['dept', 'asc']] })).map((r) => ({ value: r.dept, label: r.deptname, sub: r.dept }));
    case 'movements':
      return (await db.all('movtbl', { orderBy: [['mov', 'asc']] })).map((r) => ({ value: r.mov, label: r.movdesc, sub: `${r.mov} · ${r.ttype}`, data: { ttype: r.ttype, soporeq: r.soporeq } }));
    case 'employees':
      return (await db.all('payemployeetbl', { orderBy: [['lastname', 'asc']] }))
        .filter((r) => String(r.empstat ?? '').toLowerCase() !== 'resigned')
        .map((r) => ({ value: r.empno, label: `${r.lastname}, ${r.firstname}`, sub: `${r.empno} · ${r.ccno}` }));
    case 'groups':
      return (await db.all('sys_usergroup', { orderBy: [['ug_code', 'asc']] })).map((r) => ({ value: r.ug_code, label: r.ug_name, sub: r.ug_code }));
    case 'users':
      return (await db.all('sys_userrecords', { orderBy: [['username', 'asc']] })).map((r) => ({ value: r.username, label: r.userfullname, sub: r.username }));
    case 'custodians':
      return (await db.all('venmasttbl', { where: { pcfcust: 'Y' }, orderBy: [['venname', 'asc']] })).map((r) => ({ value: r.venno, label: r.venname, sub: `${r.venno} · fund custodian` }));
    case 'payrollIds':
      return (await db.all('payidtbl', { orderBy: [['payidno', 'desc']] })).map((r) => ({ value: r.payidno, label: `${r.payidno} · ${r.pdatefr} to ${r.pdateto}`, sub: `${r.paytype} · ${r.paystat}` }));
    default:
      fail(`Unknown lookup: ${name}`, 404);
  }
}
