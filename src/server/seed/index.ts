import type { Db, Row } from '../db';
import { isActiveCompany } from '../db';
import { ACTION, FORM, FORM_CATALOG, TC, TC_NAMES } from '@/shared/codes';
import { addDays, monthEnd, monthStart, nowStamp, parseIso, today, toIso } from '@/shared/dates';
import { r2, r4 } from '@/shared/money';
import { autoApply } from '@/shared/collections';
import { legacyEncode } from '../auth';
import { Ctx } from '../services/context';
import { actOnDoc, docService, saveDoc } from '../services/docs';
import { GL, closePeriod, ensurePeriod, postOpenEntries } from '../services/gl';
import { MOV, balances, setLabStatus } from '../services/inventory';
import { ledgerLines } from '../services/gl';
import '../services/purchasing';
import '../services/sales';
import { createDeposit, generateCdcr, openInvoices } from '../services/receivables';
import '../services/depapp';
import { decideOrderRequest, submitOrderRequest } from '../services/salesman';
import { requestCustomer } from '../services/customers';
import { receiveSupply, saveSupply, saveVisit } from '../services/clinic';
import { closeDsr, dsrInvoice, dsrState, loadVan, openDsr, plantStock, returnFromVan, saveCount } from '../services/dsr';
import '../services/payables';
import { openFundVouchers } from '../services/funds';
import '../services/production';
import { computePayroll, createPayrollPeriod, postPayroll, saveAttendance, uploadDtr } from '../services/payroll';
import { PROFILES, Profile } from './profiles';

export const DEMO_PASSWORD = 'Demo@2026';

// ---------------------------------------------------------------------------
// Users, groups and rights (sys_usergroup / sys_usergrouprights / sys_userrecords)
// ---------------------------------------------------------------------------
const ALL = [1, 2, 3, 4, 5];
const V = [1];
const VE = [1, 2];
const VEI = [1, 2, 3];
const VEID = [1, 2, 3, 4];
const APPROVE = [1, 5];

/** The van salesman of the daily sales report (legacy smnmtbl smntype 'Event') and his cash customer. */
export const VAN = {
  SALESMAN: 'S009',
  CUSTOMER: 'C09999',
  NAMES: { '8100': 'Dante R. Morales (Van 1)', '8200': 'Rico S. Abad (Van 1)', '8300': 'Lito P. Serrano (Van 1)' } as Record<string, string>,
};

const GROUPS: { code: string; name: string; notes: string; rights: Record<string, number[]> | 'all' | 'view' }[] = [
  { code: 'ADMIN', name: 'System Administrator', notes: 'Full access to every module and setting.', rights: 'all' },
  {
    code: 'FINHEAD',
    name: 'Finance Head / CFO',
    notes: 'Approves and posts; closes periods.',
    rights: {
      '006': ALL, '052': ALL, '038': ALL, '063': V, '079': ALL, '030': VEI, '023': ALL, '027': ALL, '024': ALL, '032': V, '026': ALL, '028': ALL,
      '095': ALL, '076': V, '077': [1, 5],
      '010': V, '011': ALL, '012': ALL, '013': ALL, '070': ALL, '066': VE, '014': V, '047': V, '020': VE, '017': V, '018': APPROVE,
      '019': V, '007': V, '050': V, '034': V, '087': V, '054': V, '058': APPROVE, '035': V, '036': APPROVE, '037': V,
      '033': V, '040': V, '059': V, '100': V, '301': V, '204': APPROVE, '205': APPROVE, '210': V, '001': V, '002': V, '003': [1, 3, 5], '045': VE,
    },
  },
  {
    code: 'ACCTG',
    name: 'Accountant',
    notes: 'Prepares journal vouchers, vouchers and cheques for approval.',
    rights: {
      '006': V, '052': VEID, '038': VEI, '063': V, '079': VE, '030': VEI, '023': VEID, '027': V, '024': VEI, '032': V, '010': V, '011': V, '026': ALL, '028': VEID,
      '013': VEI, '070': VEI, '066': VE, '014': V, '047': V, '020': V, '017': V, '019': V, '034': V, '035': V, '037': V, '040': V, '059': V, '003': [1, 3],
    },
  },
  { code: 'CASHIER', name: 'Cashier / Treasury', notes: 'Issues official receipts, prepares the CDCR and deposits.', rights: { '010': ALL, '011': ALL, '012': VEI, '066': VE, '014': V, '047': V, '020': V, '019': V, '024': V, '026': VEI, '028': VEI, '003': [1, 3] } },
  { code: 'PURCH', name: 'Purchasing', notes: 'Raises requisitions and purchase orders.', rights: { '054': VEID, '058': V, '035': VEID, '036': APPROVE, '037': V, '030': VEI, '034': V, '050': V, '003': [1, 3] } },
  { code: 'WHSE', name: 'Warehouse & Plant', notes: 'Receives, issues, transfers and counts stock; runs production.', rights: { '050': ALL, '007': ALL, '034': VEI, '087': V, '054': VEI, '035': V, '037': V, '033': ALL, '040': V, '017': V, '003': [1, 3] } },
  { code: 'SALES', name: 'Sales & Billing', notes: 'Takes orders and bills deliveries.', rights: { '020': VEI, '017': VEID, '018': V, '019': ALL, '095': VEID, '076': [1, 3], '007': V, '014': V, '034': V, '059': V, '010': V, '003': [1, 3] } },
  { code: 'HR', name: 'HR & Payroll', notes: 'Maintains employees, attendance and payroll.', rights: { '100': ALL, '301': ALL, '204': VEID, '205': VEI, '210': ALL, '088': ALL } },
  { code: 'LAB', name: 'QA Laboratory', notes: 'Records inspection results of received and produced lots.', rights: { '087': VE, '034': V, '050': V, '033': V } },
  { code: 'AUDIT', name: 'Internal Audit', notes: 'Read-only access to every module.', rights: 'view' },
];

const USERS: { username: string; name: string; group: string; companies: string[]; email: string }[] = [
  { username: 'admin', name: 'System Administrator', group: 'ADMIN', companies: ['8100', '8200', '8300'], email: 'it@jcsgroup.example' },
  { username: 'finance', name: 'Maria C. Santos', group: 'FINHEAD', companies: ['8100', '8200', '8300'], email: 'msantos@jcsgroup.example' },
  { username: 'accountant', name: 'Juan Dela Cruz', group: 'ACCTG', companies: ['8100', '8200', '8300'], email: 'jdelacruz@jcsgroup.example' },
  { username: 'cashier', name: 'Elena Gomez', group: 'CASHIER', companies: ['8100', '8300'], email: 'egomez@jcsgroup.example' },
  { username: 'purchasing', name: 'Dennis Navarro', group: 'PURCH', companies: ['8100', '8300'], email: 'dnavarro@jcsgroup.example' },
  { username: 'warehouse', name: 'Carlos Reyes', group: 'WHSE', companies: ['8100', '8200', '8300'], email: 'creyes@jcsgroup.example' },
  { username: 'sales', name: 'Rhea Aquino', group: 'SALES', companies: ['8100', '8300'], email: 'raquino@jcsgroup.example' },
  { username: 'hr', name: 'Teresa Lim', group: 'HR', companies: ['8100', '8200', '8300'], email: 'tlim@jcsgroup.example' },
  { username: 'lab', name: 'Liza Garcia', group: 'LAB', companies: ['8100', '8200', '8300'], email: 'lgarcia@jcsgroup.example' },
  { username: 'auditor', name: 'Roberto Tan', group: 'AUDIT', companies: ['8100', '8300'], email: 'rtan@jcsgroup.example' },
];

/** Sample sign-ins shown on the login page of the hosted preview only. */
/** The sample accounts shown at sign-in, with the number of active companies each can open (read live, as companies can be switched off). */
export function demoAccounts() {
  return USERS.map((u) => ({ username: u.username, name: u.name, group: GROUPS.find((g) => g.code === u.group)?.name ?? u.group, companies: u.companies.filter(isActiveCompany).length })).filter((a) => a.companies > 0);
}

async function seedSecurity(db: Db, p: Profile) {
  await db.insertMany('sys_forms', FORM_CATALOG.map((f) => ({ code: f.code, description: f.description, tc: '', inused: 'Y' })));
  for (const g of GROUPS) {
    await db.insert('sys_usergroup', { ug_code: g.code, ug_name: g.name, ug_notes: g.notes });
    const rights: Record<string, number[]> =
      g.rights === 'all' ? Object.fromEntries(FORM_CATALOG.map((f) => [f.code, ALL])) : g.rights === 'view' ? Object.fromEntries(FORM_CATALOG.map((f) => [f.code, V])) : g.rights;
    for (const [form, acts] of Object.entries(rights)) {
      await db.insert('sys_usergrouprights', {
        gr_groupcode: g.code,
        gr_formcode: form,
        gr_viewrights: acts.includes(ACTION.VIEW) ? 1 : 0,
        gr_editrights: acts.includes(ACTION.EDIT) ? 1 : 0,
        gr_insertrights: acts.includes(ACTION.INSERT) ? 1 : 0,
        gr_deleterights: acts.includes(ACTION.DELETE) ? 1 : 0,
        gr_releaserights: acts.includes(ACTION.RELEASE) ? 1 : 0,
        gr_autosave: 0,
        gr_remember: 0,
      });
    }
  }
  for (const u of USERS.filter((x) => x.companies.includes(p.ba))) {
    await db.insert('sys_userrecords', {
      username: u.username,
      user: u.username,
      userfullname: u.name,
      usergroup: u.group,
      userpassword: legacyEncode(DEMO_PASSWORD),
      idstat: 'Open',
      stat: 'Active',
      useremailaddress: u.email,
      userloc: 'MAIN',
      pdate: today(),
    });
  }
  for (const pl of p.plants) await db.insert('userplnttbl', { user: 'warehouse', userid: 'warehouse', plntno: pl.plntno });
  await db.insertMany('authtbl', [
    { userid: 'finance', user: 'finance', form: 'PurcApp', module: 'Purchase orders', maxamt: 10_000_000, appstat: 'POST', tc: '' },
    { userid: 'finance', user: 'finance', form: 'APapp', module: 'Vouchers payable', maxamt: 10_000_000, appstat: 'POST', tc: '' },
    { userid: 'purchasing', user: 'purchasing', form: 'PurcApp', module: 'Purchase orders', maxamt: 250_000, appstat: 'POST', tc: '' },
  ]);
}

// ---------------------------------------------------------------------------
// Company, chart of accounts and reference data
// ---------------------------------------------------------------------------
const CHART: [string, string][] = [
  ['1110100', 'Cash on Hand / Undeposited Collections'],
  ['1110200', 'Post-dated Cheques on Hand'],
  ['1110300', 'Petty Cash Fund'],
  ['1110400', 'Revolving Fund'],
  ['1120100', 'Cash in Bank - BDO Current Account'],
  ['1120200', 'Cash in Bank - Metrobank Current Account'],
  ['1120300', 'Cash in Bank - BPI Payroll Account'],
  ['1130100', 'Accounts Receivable - Trade'],
  ['1140100', 'Inventory - Raw Materials'],
  ['1140200', 'Inventory - Finished Goods'],
  ['1140300', 'Inventory - Packaging Materials'],
  ['1140400', 'Work in Process'],
  ['1140500', 'Inventory - Salesmen Vans'],
  ['1150100', 'Input VAT'],
  ['1150200', 'Creditable Withholding Tax (BIR 2307)'],
  ['1160100', 'Advances to Employees'],
  ['1170100', 'Prepaid Expenses'],
  ['1510100', 'Land'],
  ['1520100', 'Buildings and Improvements'],
  ['1530100', 'Machinery and Equipment'],
  ['1540100', 'Transportation Equipment'],
  ['1590100', 'Accumulated Depreciation'],
  ['2110100', 'Accounts Payable - Trade'],
  ['2110200', 'Goods Received Not Invoiced'],
  ['2120100', 'Expanded Withholding Tax Payable'],
  ['2120200', 'Output VAT Payable'],
  ['2130100', 'SSS Contributions Payable'],
  ['2130200', 'PhilHealth Contributions Payable'],
  ['2130300', 'Pag-IBIG Contributions Payable'],
  ['2130400', 'Withholding Tax on Compensation Payable'],
  ['2130500', 'Salaries and Wages Payable'],
  ['2140100', 'Customer Deposits and Advances'],
  ['2150100', 'Accrued Expenses Payable'],
  ['2210100', 'Bank Loans Payable - Long Term'],
  ['3100100', 'Capital Stock'],
  ['3200100', 'Retained Earnings'],
  ['4100100', 'Sales - Products'],
  ['4100200', 'Sales Returns and Allowances'],
  ['4100300', 'Sales Discounts'],
  ['5100100', 'Cost of Sales'],
  ['5200100', 'Applied Labor and Overhead'],
  ['6100100', 'Salaries and Wages'],
  ['6100200', 'Overtime and Premium Pay'],
  ['6100300', 'Employer Contributions (SSS, PhilHealth, Pag-IBIG)'],
  ['6200100', 'Power and Electricity'],
  ['6200110', 'Transportation and Travel'],
  ['6200120', 'Meals and Representation'],
  ['6200130', 'Fuel and Oil'],
  ['6200140', 'Postage and Courier'],
  ['6200200', 'Freight and Trucking'],
  ['6200300', 'Professional Fees'],
  ['6200400', 'Repairs and Maintenance'],
  ['6200500', 'Depreciation Expense'],
  ['6200600', 'Rent Expense'],
  ['6200700', 'Office Supplies'],
  ['6200800', 'Loss on Scrapped Inventory'],
  ['6200900', 'Inventory Count Variance'],
  ['6300100', 'Taxes and Licenses'],
  ['7100100', 'Interest Income'],
  ['8100100', 'Interest Expense'],
];

const COST_CENTERS: [string, string, string, string][] = [
  ['ADM', 'Administration', 'G&A', 'E'],
  ['ACC', 'Accounting & Finance', 'G&A', 'E'],
  ['PUR', 'Purchasing', 'G&A', 'E'],
  ['SLS', 'Sales & Marketing', 'Selling', 'E'],
  ['LOG', 'Logistics & Warehouse', 'Selling', 'E'],
  ['PRD', 'Production', 'Manufacturing', 'C'],
  ['QA', 'Quality Assurance Laboratory', 'Manufacturing', 'C'],
];

const PROFIT_CENTERS: Record<string, [string, string, string][]> = {
  '8100': [['IND', 'Industrial Chemicals', 'Trade'], ['HSH', 'Household & Sanitation', 'Trade']],
  '8200': [['SWN', 'Swine Feeds', 'Trade'], ['PLT', 'Poultry Feeds', 'Trade']],
  '8300': [['FRT', 'Fertilizers', 'Trade'], ['CPR', 'Crop Protection', 'Trade']],
};

async function seedReference(db: Db, p: Profile) {
  await db.insert('batbl', {
    ba: p.ba,
    bussname: p.company.bussname,
    shrtname: p.company.shrtname,
    address: p.company.address,
    zip: p.company.zip,
    cotin1: p.company.tin,
    bir_sign: p.company.signatory,
    bir_sign_poss: p.company.position,
    apprvdby: 'finance',
    poapprby: 'finance',
    ccadmin: 'ADM',
    ccprod: 'PRD',
    ccsales: 'SLS',
    cclogis: 'LOG',
    stat: 'Active',
    dloadstat: 'Open',
  });
  await db.insert('ng_company_branding', { ba: p.ba, ...p.branding, logo_data: null, show_code: 'Y', updated_by: 'system', updated_at: nowStamp() });
  for (const [tc, n] of Object.entries(TC_NAMES)) await db.insert('tccodestbl', { tc, module: n.module, document: n.document, modlongname: n.module });
  await db.insertMany('acctcharttbl', CHART.map(([acctno, acctdesc]) => ({ acctno, acctdesc, upperacct: acctno.slice(0, 1) + '000000', subacct: 'N', cv: acctno.startsWith('112') ? 'Y' : 'N', taxitm: acctno.startsWith('115') || acctno.startsWith('212') ? 'Y' : 'N', invcos: acctno.startsWith('114') || acctno.startsWith('51') ? 'Y' : 'N' })));
  await db.insertMany('cctrnotbl', COST_CENTERS.map(([ccno, ccdesc, grp, cosexp]) => ({ ccno, ccdesc, ccnogrp: grp, cosexp, currstat: 'Active', ba: p.ba, branch: 'MAIN' })));
  await db.insertMany('depttbl', COST_CENTERS.map(([dept, deptname]) => ({ dept, deptname, ba: p.ba, appby1: 'finance' })));
  await db.insertMany('pctrtbl', PROFIT_CENTERS[p.ba].map(([pc, pclass, tradetype]) => ({ pc, pclass, tradetype, aracctno: GL.AR_TRADE, ccno: 'SLS', stat: 'Active', ba: p.ba })));
  await db.insertMany('banktbl', [
    { acctno: '1120100', bankname: 'BDO Unibank - Current', depository: '0012-3456-7890', accttype: 'CA' },
    { acctno: '1120200', bankname: 'Metrobank - Current', depository: '245-7-24589-2', accttype: 'CA' },
    { acctno: '1120300', bankname: 'BPI - Payroll', depository: '3011-0456-78', accttype: 'SA' },
  ]);
  await db.insertMany('ng_cheque_layouts', [
    { acctno: '1120100', date_x_mm: 142, date_y_mm: 9, payee_x_mm: 26, payee_y_mm: 21, amount_x_mm: 148, amount_y_mm: 21, amount_words_x_mm: 18, amount_words_y_mm: 30, updated_by: 'system' },
    { acctno: '1120200', date_x_mm: 140, date_y_mm: 11, payee_x_mm: 24, payee_y_mm: 23, amount_x_mm: 150, amount_y_mm: 23, amount_words_x_mm: 20, amount_words_y_mm: 32, updated_by: 'system' },
  ]);
  await db.insertMany('bir_ewttbl', [
    { ewtcode: 'WC158', ewtdesc: 'Purchase of goods by top withholding agents - corporate supplier', rate: 1, cotype: 'C' },
    { ewtcode: 'WC160', ewtdesc: 'Purchase of services by top withholding agents - corporate supplier', rate: 2, cotype: 'C' },
    { ewtcode: 'WC100', ewtdesc: 'Rentals - corporation', rate: 5, cotype: 'C' },
    { ewtcode: 'WC120', ewtdesc: 'Income payments to contractors - corporation', rate: 2, cotype: 'C' },
    { ewtcode: 'WI010', ewtdesc: 'Professional fees - individual (gross income up to P3M)', rate: 5, cotype: 'I' },
    { ewtcode: 'WI011', ewtdesc: 'Professional fees - individual (gross income above P3M)', rate: 10, cotype: 'I' },
  ]);
  await db.insertMany('areatbl', p.areas.map((a) => ({ ...a, branch: 'MAIN' })));
  await db.insertMany('smnmtbl', p.salesmen.map((s) => ({ ...s, shrtname: s.fullname.split(' ')[0], status: 'Active', smntype: 'Regular' })));
  // One van (event) salesman per company for the daily sales report; cash sales go to the walk-in customer.
  await db.insert('custmasttbl', { custno: VAN.CUSTOMER, bussname: 'Walk-in / Van Cash Sales', searchname: 'WALK-IN / VAN CASH SALES', address: 'Various', areano: p.salesmen[0].areano, smnno: VAN.SALESMAN, term: 0, crlimit: 0, ewt: 0, status: 'Active', paytype: 'Cash', vat: 'VAT', custtype: 'Walk-in', accttype: 'main', user: 'system', datecreated: nowStamp(), datechange: nowStamp(), updateby: 'system' });
  await db.insert('smnmtbl', { smnno: VAN.SALESMAN, fullname: VAN.NAMES[p.ba] ?? 'Van Salesman', shrtname: 'Van', areano: p.salesmen[0].areano, status: 'Active', smntype: 'Event', custno: VAN.CUSTOMER });
  await db.insertMany('venmasttbl', p.vendors.map((v) => ({ ...v, status: 'Active', conper: 'Accounts Department', telno: '(02) 8700-0000', emailadd: '', user: 'system', datechange: nowStamp(), updateby: 'system' })));
  const people = FUND_PEOPLE[p.ba];
  const emp = (no: string) => p.employees.find((e) => e.empno === no)!;
  const employeeVendor = (venno: string, no: string, custodian: boolean) => ({
    venno,
    venname: `${emp(no).firstname} ${emp(no).lastname}`,
    address: p.company.address,
    tin: '',
    terms: 0,
    ewtcode: '',
    vat: 'NONVAT',
    ventype: 'Employee',
    poreq: 'N',
    mmrrreq: 'N',
    pcfcust: custodian ? 'Y' : 'N',
    status: 'Active',
    conper: `${emp(no).firstname} ${emp(no).lastname}`,
    telno: '',
    emailadd: '',
    user: 'system',
    datechange: nowStamp(),
    updateby: 'system',
  });
  await db.insertMany('venmasttbl', [
    employeeVendor(VEN.CUSTODIAN, people.custodian, true),
    employeeVendor(VEN.EMPLOYEE_A, people.advances[0], false),
    employeeVendor(VEN.EMPLOYEE_B, people.advances[1], false),
    { venno: VEN.VARIOUS, venname: 'Various Suppliers (Petty Cash)', address: 'Various', tin: '', terms: 0, ewtcode: '', vat: 'NONVAT', ventype: 'Non-trade', poreq: 'N', mmrrreq: 'N', pcfcust: 'N', status: 'Active', conper: '', telno: '', emailadd: '', user: 'system', datechange: nowStamp(), updateby: 'system' },
  ]);
  await db.insertMany('custmasttbl', p.customers.map((c) => ({ ...c, searchname: c.bussname.toUpperCase(), status: 'Active', paytype: 'Charge', vat: 'VAT', custtype: 'Dealer', user: 'system', datecreated: nowStamp(), datechange: nowStamp(), updateby: 'system' })));
  for (const pl of p.plants) {
    await db.insert('plnttbl', { ...pl, ba: p.ba, status: 'Active', rminv: GL.INV_RAW, fginv: GL.INV_FG, rmcos: GL.COST_OF_SALES, pc: PROFIT_CENTERS[p.ba][0][0] });
    await db.insert('sloctbl', { plntno: pl.plntno, sloc: 'MAIN', slocdesc: 'Main storage' });
  }
  await db.insertMany('movtbl', [
    { mov: '101', movdesc: 'Goods receipt from vendor', ttype: 'IN', form: 'MMRR', soporeq: 'N' },
    { mov: '201', movdesc: 'Delivery to customer', ttype: 'OUT', form: 'DO', soporeq: 'Y' },
    { mov: '261', movdesc: 'Issue to production', ttype: 'OUT', form: 'DO', soporeq: 'N' },
    { mov: '311', movdesc: 'Plant-to-plant transfer', ttype: 'TRANSFER', form: 'DO', soporeq: 'N' },
    { mov: '551', movdesc: 'Scrapping / write-off', ttype: 'OUT', form: 'DO', soporeq: 'N' },
    { mov: '561', movdesc: 'Opening stock entry', ttype: 'IN', form: 'MMRR', soporeq: 'N' },
    { mov: '603', movdesc: 'Issue to salesman (van load)', ttype: 'OUT', form: 'DO', soporeq: 'N' },
    { mov: '409', movdesc: 'Return from salesman (van)', ttype: 'IN', form: 'WRR', soporeq: 'N' },
  ]);
  for (const pl of p.plants.filter((x) => x.prodnplnt === 'Y')) await db.insert('movplnttbl', { mov: MOV.PRODUCTION, plntno: pl.plntno });
  for (const m of p.materials) {
    await db.insert('mmasttbl', {
      codeno: m.codeno,
      mmdesc: m.mmdesc,
      mmtype: m.mmtype,
      mmgrp: m.mmgrp,
      um: m.um,
      wtfr: m.wtfr,
      sp: m.sp ?? 0,
      vat: m.vatExempt ? 'N' : 'Y',
      glacct: m.mmtype === 'FG' ? GL.SALES : '',
      invlevel: m.invlevel,
      status: 'Active',
      trade: m.mmtype === 'FG' ? 'Y' : 'N',
      pc: PROFIT_CENTERS[p.ba][m.mmgrp && /sanit|deterg|swine|fertil/i.test(m.mmgrp) ? 1 % PROFIT_CENTERS[p.ba].length : 0][0],
      transdate: today(),
    });
    if (m.sp) await db.insert('plsttbl', { codeno: m.codeno, currprc: m.sp, prvdate: monthStart(parseIso(today()).getFullYear(), 1) });
  }
}

// ---------------------------------------------------------------------------
// Payroll reference tables: SSS / PhilHealth / Pag-IBIG brackets and BIR withholding tax
// ---------------------------------------------------------------------------
async function seedPayrollTables(db: Db, p: Profile) {
  const sss: Row[] = [];
  for (let msc = 5000; msc <= 35000; msc += 500) {
    sss.push({ ratetype: 'SSS', ratelabel: `MSC ${msc}`, payfrom: msc === 5000 ? 0 : msc - 250, payto: msc === 35000 ? 999999999 : msc + 249.99, sssprem: r2(msc * 0.05), emp: r2(msc * 0.1), empexp: msc < 15000 ? 10 : 30 });
  }
  await db.insertMany('paygovtphtbl', sss);
  await db.insertMany('paygovtphtbl', [
    { ratetype: 'PHIC', ratelabel: '5% premium shared equally', payfrom: 10000, payto: 100000, sssprem: 2.5, emp: 2.5, empexp: 0 },
    { ratetype: 'HDMF', ratelabel: 'Up to 1,500', payfrom: 0, payto: 1500, sssprem: 1, emp: 2, empexp: 0 },
    { ratetype: 'HDMF', ratelabel: 'Over 1,500 (fund salary capped at 10,000)', payfrom: 1500.01, payto: 999999999, sssprem: 2, emp: 2, empexp: 0 },
  ]);
  const tables: Record<string, [number, number, number, number][]> = {
    'Semi-monthly': [[0, 10416.99, 0, 0], [10417, 16666.99, 0, 15], [16667, 33332.99, 937.5, 20], [33333, 83332.99, 4270.7, 25], [83333, 333332.99, 16770.7, 30], [333333, 999999999, 91770.7, 35]],
    Weekly: [[0, 4807.99, 0, 0], [4808, 7691.99, 0, 15], [7692, 15384.99, 432.6, 20], [15385, 38461.99, 1971.2, 25], [38462, 153845.99, 7740.45, 30], [153846, 999999999, 42355.65, 35]],
    Monthly: [[0, 20832.99, 0, 0], [20833, 33332.99, 0, 15], [33333, 66666.99, 1875, 20], [66667, 166666.99, 8541.8, 25], [166667, 666666.99, 33541.8, 30], [666667, 999999999, 183541.8, 35]],
  };
  for (const [paytype, rows] of Object.entries(tables)) {
    await db.insertMany('paygovtbirtbl', rows.map(([payfrom, payto, basic, excesrate]) => ({ paytype, payfrom, payto, basic, excesrate, excempcode: 'TRAIN' })));
  }
  for (const e of p.employees) {
    await db.insert('payemployeetbl', { empno: e.empno, lastname: e.lastname, firstname: e.firstname, empstat: 'Regular', ccno: e.ccno, paytype: 'Monthly' });
    const rate = r2((e.basicpay * 12) / 261 / 8);
    await db.insert('payfintbl', { empno: e.empno, basicpay: e.basicpay, ratetype: 'Monthly', rateperhr: rate, hrrate: rate, paymode: 'ATM', transallow: e.allowance, ccno: e.ccno, paytype: 'Monthly', paystat: 'Active' });
  }
  const borrower = p.employees[Math.min(3, p.employees.length - 1)];
  await db.insert('payloanmasttbl', { empno: borrower.empno, loanrefno: `SSL-${borrower.empno}`, paycodeno: 'SSSLOAN', loanamt: 28800, amortamt: 1200, terms: 24, loanstat: 'Active', datestart: monthStart(parseIso(today()).getFullYear(), 1), dateend: '', user: 'hr', pdate: today() });
}

// ---------------------------------------------------------------------------
// Scenario helpers. Dates are relative to the day the demo data is generated:
// month 2 = two months ago, month 1 = last month, month 0 = this month (up to today).
// ---------------------------------------------------------------------------
interface Clock {
  date(monthsAgo: number, day: number): string;
  monthEnd(monthsAgo: number): string;
  month(monthsAgo: number): { y: number; m: number };
}

function clock(): Clock {
  const t = parseIso(today());
  const month = (k: number) => {
    const d = new Date(t.getFullYear(), t.getMonth() - k, 1);
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  };
  return {
    month,
    date(k, day) {
      const { y, m } = month(k);
      const last = Number(monthEnd(y, m).slice(8, 10));
      let d = Math.min(day, last);
      if (k === 0) d = Math.min(d, t.getDate());
      return toIso(new Date(y, m - 1, d));
    },
    monthEnd(k) {
      const { y, m } = month(k);
      return k === 0 ? today() : monthEnd(y, m);
    },
  };
}

type Who = 'admin' | 'finance' | 'accountant' | 'cashier' | 'purchasing' | 'warehouse' | 'sales' | 'hr' | 'lab';

function as(db: Db, who: Who): Ctx {
  // Seeding runs with full rights; the user name is kept so the audit trail looks real.
  const exists = USERS.some((u) => u.username === who && u.companies.includes(db.ba));
  const user = exists ? who : 'admin';
  return { db, ba: db.ba, user, fullName: user, group: 'ADMIN', ip: 'seed' };
}

async function doc(ctx: Ctx, type: string, input: Row): Promise<string> {
  return (await saveDoc(ctx, type, input)).no;
}

async function act(ctx: Ctx, type: string, no: string, action: string, payload: Row = {}) {
  await actOnDoc(ctx, type, no, action, payload);
}

async function prefill(ctx: Ctx, type: string, source: string, no: string): Promise<Row> {
  return docService(type).prefill!(ctx, source, no);
}

async function openingStock(db: Db, p: Profile, date: string) {
  const values = { raw: 0, pack: 0, fg: 0 };
  let n = 0;
  for (const pl of p.plants) {
    const items = p.materials.filter((m) => m.opening[pl.plntno]);
    if (!items.length) continue;
    const docno = `OB-${date.slice(2, 4)}-${String(++n).padStart(5, '0')}`;
    let total = 0;
    let i = 0;
    for (const m of items) {
      const qty = m.opening[pl.plntno];
      const amt = r2(qty * m.cost);
      total = r2(total + amt);
      if (m.mmtype === 'FG') values.fg = r2(values.fg + amt);
      else if (m.mmtype === 'PM') values.pack = r2(values.pack + amt);
      else values.raw = r2(values.raw + amt);
      i++;
      await db.insert('invdettbl', { mmrrno: docno, itemno: i, codeno: m.codeno, lotno: `OB${date.slice(2, 4)}${date.slice(5, 7)}-${String(i).padStart(2, '0')}`, qty, wt: r4(qty * m.wtfr), uc: m.cost, itmamt: amt, expdate: addDays(date, m.mmtype === 'FG' ? 540 : 300), plntno: pl.plntno, transdate: date, user: 'admin', transid: `${docno}-${i}` });
    }
    await db.insert('invhdrtbl', { docno, mmrrno: docno, tc: TC.OPENING, mov: '561', transdate: date, plntno: pl.plntno, remarks: 'Opening stock carried over from AOS100', status: 'Posted', labstat: 'Passed', netamt: total, user: 'admin', branch: 'MAIN' });
  }
  return values;
}

async function buy(ctx: (w: Who) => Ctx, o: { date: string; vendor: string; plant: string; dept: string; lines: [string, number, number][]; viaRiv?: boolean; approve?: boolean }) {
  let rivno = '';
  if (o.viaRiv !== false) {
    rivno = await doc(ctx('purchasing'), 'riv', { transdate: addDays(o.date, -1), dept: o.dept, plntno: o.plant, datereq: addDays(o.date, 7), remarks: 'Replenishment for production', lines: o.lines.map(([codeno, qty, uc]) => ({ codeno, qty, uc })) });
    await act(ctx('finance'), 'riv', rivno, 'approve');
  }
  const pono = await doc(ctx('purchasing'), 'po', { transdate: o.date, venno: o.vendor, plntno: o.plant, rivno, dept: o.dept, remarks: rivno ? `Per requisition ${rivno}` : 'Direct purchase', lines: o.lines.map(([codeno, qty, uc]) => ({ codeno, qty, uc })) });
  if (o.approve !== false) await act(ctx('finance'), 'po', pono, 'approve');
  return pono;
}

async function receive(ctx: (w: Who) => Ctx, pono: string, date: string, opts: { share?: number; lab?: 'pass' | 'pending'; drNo: string }) {
  const pre = await prefill(ctx('warehouse'), 'mmrr', 'po', pono);
  const lines = pre.lines.map((l: Row) => ({ ...l, qty: r4(l.qty * (opts.share ?? 1)), expdate: addDays(date, 365) }));
  const rr = await doc(ctx('warehouse'), 'mmrr', { ...pre, transdate: date, formno: opts.drNo, lines });
  await act(ctx('warehouse'), 'mmrr', rr, 'post');
  if (opts.lab !== 'pending') {
    const h = await ctx('lab').db.one('invhdrtbl', { docno: rr, tc: TC.RECEIVING });
    if (h?.labstat === 'Pending') await setLabStatus(ctx('lab'), rr, 'Passed', 'Within specification');
  }
  return rr;
}

async function voucherFromRr(ctx: (w: Who) => Ctx, rr: string, date: string, refdoc: string, post = true) {
  const pre = await prefill(ctx('accountant'), 'vp', 'mmrr', rr);
  const vp = await doc(ctx('accountant'), 'vp', { ...pre, transdate: date, refdoc });
  if (post) await act(ctx('finance'), 'vp', vp, 'post');
  return vp;
}

async function expense(ctx: (w: Who) => Ctx, o: { date: string; vendor: string; refdoc: string; remarks: string; lines: [string, string, number, string][]; post?: boolean }) {
  const vp = await doc(ctx('accountant'), 'vp', {
    transdate: o.date,
    invdate: o.date,
    venno: o.vendor,
    refdoc: o.refdoc,
    remarks: o.remarks,
    lines: o.lines.map(([acctno, ccno, amount, ewtcode]) => ({ acctno, ccno, amount, vatable: 'Y', ewtcode, remarksline: o.remarks })),
  });
  if (o.post !== false) await act(ctx('finance'), 'vp', vp, 'post');
  return vp;
}

async function pay(ctx: (w: Who) => Ctx, o: { date: string; vendor: string; vps: string[]; bank?: string; release?: boolean }) {
  const db = ctx('accountant').db;
  const lines: Row[] = [];
  for (const vp of o.vps) {
    const h = await db.one('exphdrtbl', { docno: vp });
    lines.push({ vpno: vp, dramt: Number(h?.vpbals ?? 0) });
  }
  const cv = await doc(ctx('accountant'), 'cv', { transdate: o.date, chdate: o.date, venno: o.vendor, bank: o.bank ?? '1120100', remarks: `Payment of ${o.vps.join(', ')}`, lines });
  await act(ctx('finance'), 'cv', cv, 'approve');
  if (o.release !== false) await act(ctx('finance'), 'cv', cv, 'release', { reldate: o.date });
  return cv;
}

// Fund custodian and the employees who take cash advances, per company.
const FUND_PEOPLE: Record<string, { custodian: string; advances: [string, string] }> = {
  '8100': { custodian: 'E00004', advances: ['E00003', 'E00010'] },
  '8200': { custodian: 'E00001', advances: ['E00005', 'E00006'] },
  '8300': { custodian: 'E00006', advances: ['E00003', 'E00004'] },
};
const VEN = { CUSTODIAN: 'V00901', EMPLOYEE_A: 'V00902', EMPLOYEE_B: 'V00903', VARIOUS: 'V00909' };

type FundLine = [acctno: string, ccno: string, amount: number, vatable?: 'Y' | 'N'];

async function fundVoucher(ctx: (w: Who) => Ctx, type: 'pcv' | 'rfv', o: { date: string; payee?: string; receipt: string; remarks: string; lines: FundLine[]; post?: boolean }) {
  const no = await doc(ctx('cashier'), type, {
    transdate: o.date,
    venno: o.payee ?? VEN.VARIOUS,
    refdoc: o.receipt,
    remarks: o.remarks,
    lines: o.lines.map(([acctno, ccno, amount, vatable]) => ({ acctno, ccno, amount, vatable: vatable ?? 'Y', ewtcode: '', remarksline: o.remarks })),
  });
  if (o.post !== false) await act(ctx('accountant'), type, no, 'post');
  return no;
}

/** Replenishes all of the custodian's posted vouchers of a fund; optionally vouchers and pays it. */
async function replenish(ctx: (w: Who) => Ctx, o: { date: string; tc: string; voucher?: string; pay?: string }) {
  const custodian = ctx('cashier').user;
  const open = await openFundVouchers(ctx('cashier'), o.tc, custodian);
  if (!open.length) return '';
  const fr = await doc(ctx('cashier'), 'fr', { transdate: o.date, tc: o.tc, user: custodian, venno: VEN.CUSTODIAN, lines: open.map((v) => ({ docno: v.docno })) });
  if (!o.voucher) return fr;
  const pre = await prefill(ctx('accountant'), 'vp', 'fr', fr);
  const vp = await doc(ctx('accountant'), 'vp', { ...pre, transdate: o.voucher });
  await act(ctx('finance'), 'vp', vp, 'post');
  if (o.pay) await pay(ctx, { date: o.pay, vendor: VEN.CUSTODIAN, vps: [vp] });
  return fr;
}

async function cashAdvance(ctx: (w: Who) => Ctx, o: { date: string; employee: string; amount: number; purpose: string; pay?: boolean }) {
  const vp = await doc(ctx('accountant'), 'vp', {
    transdate: o.date,
    invdate: o.date,
    venno: o.employee,
    refdoc: `CA-${o.date.slice(5, 7)}${o.date.slice(8, 10)}-${o.employee.slice(-3)}`,
    remarks: o.purpose,
    lines: [{ acctno: GL.ADVANCES_EMPLOYEES, ccno: '', amount: o.amount, vatable: 'N', ewtcode: '', remarksline: o.purpose }],
  });
  await act(ctx('finance'), 'vp', vp, 'post');
  if (o.pay !== false) await pay(ctx, { date: o.date, vendor: o.employee, vps: [vp] });
  return vp;
}

async function liquidate(ctx: (w: Who) => Ctx, o: { date: string; advance: string; lines: FundLine[]; post?: boolean }) {
  const pre = await prefill(ctx('accountant'), 'liq', 'ca', o.advance);
  const no = await doc(ctx('accountant'), 'liq', { ...pre, transdate: o.date, lines: o.lines.map(([acctno, ccno, amount, vatable]) => ({ acctno, ccno, amount, vatable: vatable ?? 'Y' })) });
  if (o.post !== false) await act(ctx('finance'), 'liq', no, 'post');
  return no;
}

/** Petty cash, revolving fund, replenishments, cash advances and liquidations for every company. */
async function fundsHistory(db: Db, k: Clock) {
  const ctx = (w: Who) => as(db, w);
  const D = k.date;
  // Two months ago: an advance that is still not liquidated (shows as overdue).
  await cashAdvance(ctx, { date: D(2, 20), employee: VEN.EMPLOYEE_B, amount: 8000, purpose: 'Customer visits in Batangas and Laguna' });
  await postOpenEntries(ctx('finance'), k.monthEnd(2));
  // Last month
  const caA = await cashAdvance(ctx, { date: D(1, 4), employee: VEN.EMPLOYEE_A, amount: 25000, purpose: 'Travel to the Cebu depot for the inventory count' });
  await fundVoucher(ctx, 'pcv', { date: D(1, 3), receipt: 'OR 10422', remarks: 'Office supplies and photocopying', lines: [['6200700', 'ADM', 2350], ['6200110', 'LOG', 850, 'N']] });
  await fundVoucher(ctx, 'pcv', { date: D(1, 8), receipt: 'OR 55190', remarks: 'Courier of BIR forms and bank documents', lines: [['6200140', 'ACC', 1280]] });
  await fundVoucher(ctx, 'rfv', { date: D(1, 9), receipt: 'SI 77812', remarks: 'Diesel for delivery trucks; minor repair of forklift', lines: [['6200130', 'LOG', 12500], ['6200400', 'PRD', 8900]] });
  await fundVoucher(ctx, 'pcv', { date: D(1, 12), receipt: 'OR 30117', remarks: 'Fuel and meals - sales field visit', lines: [['6200130', 'SLS', 3200], ['6200120', 'SLS', 1640]] });
  await liquidate(ctx, { date: D(1, 14), advance: caA, lines: [['6200110', 'LOG', 9800, 'N'], ['6200120', 'LOG', 4350], ['6200110', 'LOG', 7200]] });
  await replenish(ctx, { date: D(1, 15), tc: TC.PETTY_CASH, voucher: D(1, 16), pay: D(1, 18) });
  await fundVoucher(ctx, 'pcv', { date: D(1, 22), receipt: 'OR 10588', remarks: 'Pantry and cleaning supplies', lines: [['6200700', 'ADM', 1980]] });
  // This month
  const caC = await cashAdvance(ctx, { date: D(0, 3), employee: VEN.EMPLOYEE_A, amount: 18000, purpose: 'Supplier audit trip to Bulacan' });
  await fundVoucher(ctx, 'pcv', { date: D(0, 2), receipt: 'OR 10641', remarks: 'Printer ink and bond paper', lines: [['6200700', 'ACC', 2760]] });
  await fundVoucher(ctx, 'pcv', { date: D(0, 5), receipt: 'OR 31002', remarks: 'Grab rides to banks and BIR office', lines: [['6200110', 'ACC', 1420, 'N']] });
  await fundVoucher(ctx, 'rfv', { date: D(0, 6), receipt: 'SI 78109', remarks: 'Diesel for delivery trucks', lines: [['6200130', 'LOG', 14800]] });
  await replenish(ctx, { date: D(0, 10), tc: TC.PETTY_CASH });
  await fundVoucher(ctx, 'pcv', { date: D(0, 9), receipt: 'OR 10702', remarks: 'Snacks for the quarterly safety meeting', lines: [['6200120', 'PRD', 1850]], post: false });
  await fundVoucher(ctx, 'pcv', { date: D(0, 11), receipt: 'OR 31188', remarks: 'Courier of signed contracts to customers', lines: [['6200140', 'SLS', 960]] });
  await fundVoucher(ctx, 'rfv', { date: D(0, 11), receipt: 'SI 78230', remarks: 'Tire repair - delivery truck 3', lines: [['6200400', 'LOG', 4300]] });
  await liquidate(ctx, { date: D(0, 11), advance: caC, lines: [['6200110', 'PUR', 11250, 'N'], ['6200120', 'PUR', 8000]] });
}

/** Customer deposits: an advance payment applied to an open invoice, and one still waiting. */
async function depositsHistory(db: Db, k: Clock) {
  const ctx = (w: Who) => as(db, w);
  const D = k.date;
  const custs = await db.all('custmasttbl', { orderBy: [['custno', 'asc']] });
  let made = 0;
  for (const c of custs) {
    const open = await openInvoices(db, c.custno);
    if (!open.length) continue;
    const amount = r2(Math.ceil(open[0].balance / 1000) * 1000 + (made ? 15000 : 30000));
    const or = await doc(ctx('cashier'), 'or', { transdate: D(0, made ? 9 : 4), custno: c.custno, coltype: 'Online', bank: 'InstaPay', colamt: amount, remarks: 'Advance payment for the next orders', lines: [] });
    await act(ctx('cashier'), 'or', or, 'post');
    if (!made) {
      const { lines } = autoApply([open[0]], 1e12, Number(c.ewt ?? 0));
      const da = await doc(ctx('cashier'), 'da', { ...(await prefill(ctx('cashier'), 'da', 'deposit', or)), transdate: D(0, 8), remarks: 'Advance applied to the open invoice', lines });
      await act(ctx('finance'), 'da', da, 'post');
    }
    if (++made === 2) break;
  }
}

/** Van sales: a closed daily sales report (with a small shortage, cash remitted) and today's open one. */
async function dsrHistory(db: Db, k: Clock) {
  const c = as(db, 'sales');
  const D = k.date;
  let src = '';
  let stock: Row[] = [];
  for (const p of await db.all('plnttbl', { orderBy: [['plntno', 'asc']] })) {
    const s = (await plantStock(c, p.plntno)).filter((m) => m.available >= 5);
    if (s.length >= 2) {
      src = p.plntno;
      stock = s.slice(0, 3);
      break;
    }
  }
  if (!src) return;
  const loadQty = (m: Row) => Math.max(2, Math.floor(Math.min(m.available * 0.15, 40)));
  const onVan = async (dsrno: string, codeno: string) => (await dsrState(db, dsrno)).recon.find((r) => r.codeno === codeno)?.expected ?? 0;
  const firstDay = D(0, 6);
  const today0 = D(0, 12);
  if (firstDay < today0) {
    const dsrno = await openDsr(c, { smnno: VAN.SALESMAN, transdate: firstDay });
    await loadVan(c, dsrno, { plntno: src, lines: stock.map((m) => ({ codeno: m.codeno, qty: loadQty(m) })) });
    await dsrInvoice(c, dsrno, { tc: TC.EVENT_CASH_INVOICE, refno: 'Town fiesta booth', lines: [{ codeno: stock[0].codeno, qty: Math.max(1, Math.floor((await onVan(dsrno, stock[0].codeno)) * 0.4)) }] });
    await dsrInvoice(c, dsrno, { tc: TC.EVENT_CASH_INVOICE, lines: [{ codeno: stock[1].codeno, qty: Math.max(1, Math.floor((await onVan(dsrno, stock[1].codeno)) * 0.3)) }] });
    const firstCust = (await db.all('custmasttbl', { orderBy: [['custno', 'asc']] }))[0];
    await dsrInvoice(c, dsrno, { tc: TC.EVENT_CHARGE_INVOICE, custno: firstCust.custno, lines: [{ codeno: stock[0].codeno, qty: 1 }] });
    if (stock[2]) await returnFromVan(c, dsrno, { plntno: src, lines: [{ codeno: stock[2].codeno, qty: Math.max(1, Math.floor((await onVan(dsrno, stock[2].codeno)) / 2)) }] });
    const st = await dsrState(db, dsrno);
    await saveCount(c, dsrno, { lines: st.recon.map((r, i) => ({ codeno: r.codeno, qty: i === 0 && r.expected >= 1 ? r.expected - 1 : r.expected })) });
    await closeDsr(as(db, 'finance'), dsrno, { note: 'One piece damaged while unloading at the event.' });
    const cashInv = st.invoices.filter((i) => i.tc === TC.EVENT_CASH_INVOICE).map((i) => i.invno);
    await collect((w) => as(db, w), { date: firstDay, cust: VAN.CUSTOMER, invoices: cashInv, type: 'Cash' });
  }
  const dsrno = await openDsr(c, { smnno: VAN.SALESMAN, transdate: today0 });
  await loadVan(c, dsrno, { plntno: src, lines: [{ codeno: stock[0].codeno, qty: loadQty(stock[0]) }] });
  await dsrInvoice(c, dsrno, { tc: TC.EVENT_CASH_INVOICE, lines: [{ codeno: stock[0].codeno, qty: Math.max(1, Math.floor((await onVan(dsrno, stock[0].codeno)) * 0.25)) }] });
}

/** Order requests from a salesman: one waiting for the sales manager, one already a sales order. */
async function requestsHistory(db: Db) {
  const c = as(db, 'sales');
  const custs = await db.all('custmasttbl', { where: { smnno: 'S001' }, orderBy: [['custno', 'asc']] });
  const fg = (await db.all('mmasttbl', { where: { mmtype: 'FG' }, orderBy: [['codeno', 'asc']] })).slice(0, 2);
  if (!custs.length || !fg.length) return;
  await submitOrderRequest(c, { smnno: 'S001', custno: custs[0].custno, remarks: 'Restock before the weekend promo', lines: fg.map((m, i) => ({ codeno: m.codeno, qty: 20 + i * 10 })) });
  const second = custs[1] ?? custs[0];
  await submitOrderRequest(c, { smnno: 'S001', custno: second.custno, lines: [{ codeno: fg[0].codeno, qty: 15 }] });
  const req = (await db.all('reqsohdrtbl', { orderBy: [['sono', 'desc']] }))[0];
  const plant = (await db.all('plnttbl', { orderBy: [['plntno', 'asc']] }))[0];
  await decideOrderRequest(as(db, 'finance'), { reqno: req.sono, approve: true, plntno: plant.plntno });
  await requestCustomer(c, { reqname: 'Sunrise Hardware & Sanitation Supply', type1: 'Dealer', type2: 'Charge', remarks: 'New dealer in Antipolo; owner met at the trade fair' });
}

/** Company clinic: medicines and first-aid supplies, receipts and the consultations of two months. */
async function clinicHistory(db: Db, p: Profile, k: Clock) {
  const nurse = as(db, 'hr');
  const D = k.date;
  const SUPPLIES: [string, string, number, string][] = [
    ['Paracetamol 500 mg tablet', 'tab', 50, 'Medicine'],
    ['Mefenamic acid 500 mg capsule', 'cap', 40, 'Medicine'],
    ['Loperamide 2 mg capsule', 'cap', 20, 'Medicine'],
    ['Cetirizine 10 mg tablet', 'tab', 20, 'Medicine'],
    ['Aluminum hydroxide antacid tablet', 'tab', 30, 'Medicine'],
    ['Povidone-iodine 15 ml', 'bottle', 3, 'First aid'],
    ['Sterile gauze pad 4x4', 'pc', 50, 'First aid'],
    ['Elastic bandage 3 in', 'roll', 5, 'First aid'],
  ];
  const codes: string[] = [];
  for (const [name, unit, reorder, kind] of SUPPLIES) {
    await saveSupply(nurse, { name, unit, reorder, kind });
    codes.push((await db.all('ng_clinic_supply', { orderBy: [['code', 'desc']] }))[0].code);
  }
  const stock = [500, 200, 60, 60, 100, 4, 120, 6];
  for (const [i, code] of codes.entries()) await receiveSupply(nurse, { code, qty: stock[i], transdate: D(1, 2), remarks: 'Quarterly purchase, Mercury Drug' });
  const emp = (i: number) => p.employees[i % p.employees.length].empno;
  const visits: [number, number, number, Row][] = [
    [1, 5, 0, { complaint: 'Headache', bp: '120/80', temp: 36.8, diagnosis: 'Tension headache', treatment: 'Rest, paracetamol', disposition: 'Back to work', supplies: [{ code: codes[0], qty: 2 }] }],
    [1, 9, 1, { complaint: 'Fever, body pain', bp: '110/70', temp: 38.4, diagnosis: 'Viral syndrome', treatment: 'Paracetamol every 4 hours, fluids', disposition: 'Sent home', restdays: 2, supplies: [{ code: codes[0], qty: 6 }] }],
    [1, 14, 2, { complaint: 'Cut on left hand', bp: '120/80', temp: 36.6, diagnosis: 'Laceration, 2 cm, while opening a drum', treatment: 'Wound cleaning and dressing', disposition: 'Back to work', supplies: [{ code: codes[5], qty: 1 }, { code: codes[6], qty: 2 }] }],
    [1, 20, 3, { complaint: 'Stomach pain', bp: '118/76', temp: 36.9, diagnosis: 'Hyperacidity', treatment: 'Antacid', disposition: 'Rest in clinic', supplies: [{ code: codes[4], qty: 2 }] }],
    [0, 3, 4, { complaint: 'Allergy, itchy skin', bp: '120/80', temp: 36.7, diagnosis: 'Contact dermatitis (cleaning chemicals)', treatment: 'Cetirizine; use gloves', disposition: 'Back to work', supplies: [{ code: codes[3], qty: 3 }] }],
    [0, 7, 1, { complaint: 'Headache', bp: '130/90', temp: 36.8, diagnosis: 'Elevated BP, for monitoring', treatment: 'Rest, recheck BP after 30 minutes', disposition: 'Referred to hospital', supplies: [] }],
    [0, 10, 5, { complaint: 'Diarrhea', bp: '110/70', temp: 37.2, diagnosis: 'Acute gastroenteritis', treatment: 'Loperamide, oral rehydration', disposition: 'Sent home', restdays: 1, supplies: [{ code: codes[2], qty: 2 }] }],
  ];
  for (const [m, day, e, v] of visits) {
    const date = D(m, day);
    if (date > today()) continue;
    await saveVisit(nurse, { ptype: 'Employee', empno: emp(e), transdate: date, timein: `${String(8 + ((day * 3) % 9)).padStart(2, '0')}:${String((day * 7) % 60).padStart(2, '0')}`, attendedby: 'R. Dizon, RN', ...v });
  }
  await saveVisit(nurse, { ptype: 'Visitor / contractor', patient: 'Truck helper (Mercado Trucking)', transdate: D(0, 2), timein: '13:40', complaint: 'Dizziness', bp: '100/60', temp: 36.5, diagnosis: 'Dehydration', treatment: 'Oral fluids, rest', disposition: 'Rest in clinic', attendedby: 'R. Dizon, RN', supplies: [] });
}

/** Budgets around the actual spending of each month, so the monitor shows a realistic mix. */
async function seedBudgets(db: Db, k: Clock) {
  const factors = [1.15, 1.08, 0.93, 1.25, 1.02, 1.1, 0.97, 1.3];
  let i = 0;
  const lastMonth = new Map<string, number>();
  for (const m of [2, 1, 0]) {
    const { y, m: mon } = k.month(m);
    const datefr = monthStart(y, mon);
    const dateto = monthEnd(y, mon);
    const gl = (await ledgerLines(db, { from: datefr, to: dateto, includeUnposted: true })).filter((l) => String(l.tc) >= '40' && String(l.tc) <= '48' && l.ccno);
    const actual = new Map<string, number>();
    for (const l of gl) {
      const key = `${l.ccno}|${l.acctno}`;
      actual.set(key, (actual.get(key) ?? 0) + Number(l.dramt) - Number(l.cramt));
    }
    const keys = m === 0 ? new Set([...lastMonth.keys(), ...actual.keys()]) : new Set(actual.keys());
    for (const key of keys) {
      const [ccno, acctno] = key.split('|');
      const base = m === 0 ? lastMonth.get(key) ?? (actual.get(key) ?? 0) * 2 : (actual.get(key) ?? 0) * factors[i++ % factors.length];
      const budamt = Math.max(500, Math.round(base / 500) * 500);
      if (m !== 0) lastMonth.set(key, budamt);
      await db.insert('buddettbl', { year: y, datefr, dateto, ccno, acctno, budamt, currstat: 'Open' });
    }
  }
}

async function produce(ctx: (w: Who) => Ctx, p: Profile, o: { date: string; plant: string; fg: string; qty: number; dl: number; oh: number; pass?: boolean }) {
  const f = p.formula?.find((x) => x.fg === o.fg);
  if (!f) throw new Error(`No formula for ${o.fg}`);
  const wip = await doc(ctx('warehouse'), 'prod', { transdate: o.date, plntno: o.plant, codeno: o.fg, qty: o.qty, noofbatch: Math.ceil(o.qty / 100), remarks: 'Scheduled production run', lines: f.inputs.map(([codeno, perUnit]) => ({ codeno, qty: r4(perUnit * o.qty) })) });
  await act(ctx('warehouse'), 'prod', wip, 'post', { dlcost: o.dl, ohcost: o.oh });
  if (o.pass !== false) {
    const rcpt = await ctx('lab').db.one('invhdrtbl', { batchno: wip, tc: TC.PROD_RECEIPT });
    if (rcpt) await setLabStatus(ctx('lab'), rcpt.docno, 'Passed', 'Released by QA');
  }
  return wip;
}

async function transfer(ctx: (w: Who) => Ctx, o: { date: string; from: string; to: string; lines: [string, number][] }) {
  const no = await doc(ctx('warehouse'), 'do', { transdate: o.date, mov: MOV.TRANSFER, plntno: o.from, plntdest: o.to, remarks: `Stock transfer to ${o.to}`, driver: 'R. Santos', plateno: 'NBC 4521', lines: o.lines.map(([codeno, qty]) => ({ codeno, qty })) });
  await act(ctx('warehouse'), 'do', no, 'post');
  return no;
}

async function sell(
  ctx: (w: Who) => Ctx,
  o: { date: string; cust: string; plant: string; lines: [string, number][]; approve?: boolean | string; deliver?: string | false; deliverShare?: number; postDelivery?: boolean; invoice?: string | false; postInvoice?: boolean }
) {
  const so = await doc(ctx('sales'), 'so', { transdate: o.date, custno: o.cust, plntno: o.plant, deldate: addDays(o.date, 2), pono: `PO-${o.cust}-${o.date.slice(5, 7)}${o.date.slice(8, 10)}`, lines: o.lines.map(([codeno, qty]) => ({ codeno, qty })) });
  if (o.approve === false) return { so };
  await act(ctx('finance'), 'so', so, 'approve', { apprem: typeof o.approve === 'string' ? o.approve : '' });
  if (!o.deliver) return { so };
  const pre = await prefill(ctx('warehouse'), 'do', 'so', so);
  const lines = pre.lines.map((l: Row) => ({ ...l, qty: r4(l.qty * (o.deliverShare ?? 1)) }));
  const dono = await doc(ctx('warehouse'), 'do', { ...pre, transdate: o.deliver, driver: 'A. Mercado', plateno: 'WTU 882', lines });
  if (o.postDelivery === false) return { so, dono };
  await act(ctx('warehouse'), 'do', dono, 'post');
  if (!o.invoice) return { so, dono };
  const si = await doc(ctx('sales'), 'si', { ...(await prefill(ctx('sales'), 'si', 'do', dono)), transdate: o.invoice });
  if (o.postInvoice !== false) await act(ctx('sales'), 'si', si, 'post');
  return { so, dono, si };
}

async function collect(ctx: (w: Who) => Ctx, o: { date: string; cust: string; invoices?: string[]; share?: number; type: 'Cash' | 'Check' | 'Online'; bank?: string; pdate?: string }) {
  const c = ctx('cashier');
  const cust = await c.db.one('custmasttbl', { custno: o.cust });
  const open = (await openInvoices(c.db, o.cust)).filter((i) => !o.invoices || o.invoices.includes(i.invno));
  if (!open.length) return '';
  const rate = Number(cust?.ewt ?? 0);
  const full = autoApply(open, 1e12, rate).lines.reduce((s, l) => s + l.oramt, 0);
  const amount = r2(full * (o.share ?? 1));
  const { lines } = autoApply(open, amount, rate);
  const or = await doc(c, 'or', {
    transdate: o.date,
    custno: o.cust,
    coltype: o.type,
    bank: o.type === 'Check' ? o.bank ?? 'BDO' : o.type === 'Online' ? 'InstaPay' : '',
    chno: o.type === 'Check' ? String(400000 + Math.floor(Math.random() * 99999)) : '',
    pdate: o.pdate ?? o.date,
    colamt: amount,
    remarks: 'Payment of account',
    lines,
  });
  await act(c, 'or', or, 'post');
  return or;
}

/** Physical count that differs from the system by the given quantities (positive = more counted). */
async function countStock(c: Ctx, plntno: string, date: string, diff: Record<string, number>) {
  const lines: Row[] = [];
  for (const [codeno, d] of Object.entries(diff)) {
    const b = (await balances(c.db, { plntno, codeno })).get(`${plntno}|${codeno}`);
    const lot = b?.lots.find((l) => l.qty > Math.abs(d));
    if (!lot) continue;
    lines.push({ codeno, lotno: lot.lotno, counted: r4(lot.qty + d) });
  }
  if (lines.length) await doc(c, 'adj', { transdate: date, plntno, remarks: 'Monthly cycle count', lines });
}

async function jv(ctx: (w: Who) => Ctx, o: { date: string; remarks: string; lines: [string, string, number, number][]; stage?: 'open' | 'approved' | 'posted' }) {
  const no = await doc(ctx('accountant'), 'jv', { transdate: o.date, remarks: o.remarks, lines: o.lines.map(([acctno, ccno, dramt, cramt]) => ({ acctno, ccno, dramt, cramt })) });
  if (o.stage === 'open') return no;
  await act(ctx('finance'), 'jv', no, 'approve');
  if (o.stage === 'approved') return no;
  await act(ctx('finance'), 'jv', no, 'post');
  return no;
}

async function payrollRun(ctx: (w: Who) => Ctx, p: Profile, o: { from: string; to: string; stage: 'attendance' | 'computed' | 'posted' }) {
  const hr = ctx('hr');
  await createPayrollPeriod(hr, { pdatefr: o.from, pdateto: o.to, paytype: 'Monthly' });
  const payid = (await hr.db.all('payidtbl', { where: { pdatefr: o.from } }))[0].payidno;
  const rows = p.employees.map((e, i) => ({ empno: e.empno, absent_hrs: i === 2 ? 8 : 0, late_dhrs: i % 4 === 1 ? 1.5 : 0, otime_dhrs: e.ccno === 'PRD' || e.ccno === 'LOG' ? 6 + i : 0, nightdiffhrs: e.ccno === 'PRD' ? 4 : 0, holidayhrs: 0 }));
  await saveAttendance(hr, payid, rows);
  if (o.stage === 'attendance') {
    // Biometric time records of the days already worked, for the DTR upload screen.
    const dtr: Row[] = [];
    for (let d = o.from; d <= o.to && d <= today(); d = addDays(d, 1)) {
      const wd = parseIso(d).getDay();
      if (wd === 0 || wd === 6) continue;
      p.employees.forEach((e, i) => {
        if (i === 2 && d.endsWith('3')) return; // one absence
        dtr.push({ empno: e.empno, transdate: d, timein: i % 4 === 1 && d.endsWith('5') ? '08:24' : '07:5' + (i % 10), timeout: i === 0 && d.endsWith('6') ? '16:30' : '17:0' + (i % 10) });
      });
    }
    if (dtr.length) await uploadDtr(hr, payid, dtr);
    return payid;
  }
  await computePayroll(hr, payid);
  if (o.stage === 'posted') await postPayroll(ctx('finance'), payid);
  return payid;
}

// ---------------------------------------------------------------------------
// Company histories
// ---------------------------------------------------------------------------
async function history(db: Db, p: Profile, k: Clock) {
  const ctx = (w: Who) => as(db, w);
  const D = k.date;

  if (p.ba === '8100') {
    // Two months ago
    const po1 = await buy(ctx, { date: D(2, 3), vendor: 'V00003', plant: 'P100', dept: 'PRD', lines: [['RM-1003', 6000, 95.5]] });
    const po2 = await buy(ctx, { date: D(2, 4), vendor: 'V00001', plant: 'P100', dept: 'PRD', lines: [['RM-1001', 5000, 38.2], ['RM-1005', 3000, 30.5]] });
    const s1 = await sell(ctx, { date: D(2, 5), cust: 'C00001', plant: 'W110', lines: [['FG-3001', 360], ['FG-3002', 450]], deliver: D(2, 6), invoice: D(2, 7) });
    await produce(ctx, p, { date: D(2, 6), plant: 'P100', fg: 'FG-3001', qty: 300, dl: 45000, oh: 60000 });
    const rr1 = await receive(ctx, po1, D(2, 10), { drNo: 'DR-55120' });
    const rr2 = await receive(ctx, po2, D(2, 11), { drNo: 'DR-10871' });
    const s2 = await sell(ctx, { date: D(2, 12), cust: 'C00003', plant: 'W110', lines: [['FG-3004', 600], ['FG-3002', 300]], deliver: D(2, 13), invoice: D(2, 13) });
    const vp1 = await voucherFromRr(ctx, rr1, D(2, 14), 'SA-88123');
    const vp2 = await voucherFromRr(ctx, rr2, D(2, 14), 'PAT-20931');
    const vp3 = await expense(ctx, { date: D(2, 15), vendor: 'V00005', refdoc: `MER-${D(2, 15).slice(0, 7)}`, remarks: 'Power consumption - plant and office', lines: [['6200100', 'PRD', 412350, 'WC160'], ['6200100', 'ADM', 38420, 'WC160']] });
    await produce(ctx, p, { date: D(2, 18), plant: 'P100', fg: 'FG-3002', qty: 400, dl: 30000, oh: 40000 });
    const s3 = await sell(ctx, { date: D(2, 19), cust: 'C00002', plant: 'W120', lines: [['FG-3001', 240], ['FG-3004', 300]], deliver: D(2, 20), invoice: D(2, 21) });
    await pay(ctx, { date: D(2, 22), vendor: 'V00003', vps: [vp1] });
    await pay(ctx, { date: D(2, 22), vendor: 'V00005', vps: [vp3], bank: '1120200' });
    await transfer(ctx, { date: D(2, 25), from: 'P100', to: 'W110', lines: [['FG-3001', 250], ['FG-3002', 380]] });
    await collect(ctx, { date: D(2, 28), cust: 'C00001', invoices: [s1.si!], type: 'Check', bank: 'BPI' });
    await jv(ctx, { date: k.monthEnd(2), remarks: 'Monthly depreciation of plant, buildings and vehicles', lines: [['6200500', 'PRD', 210000, 0], ['6200500', 'ADM', 75000, 0], ['1590100', '', 0, 285000]] });

    // Last month
    const po3 = await buy(ctx, { date: D(1, 3), vendor: 'V00002', plant: 'P100', dept: 'PRD', lines: [['RM-1002', 8000, 14.1], ['RM-1004', 10000, 18.6]] });
    const s4 = await sell(ctx, { date: D(1, 4), cust: 'C00004', plant: 'W110', lines: [['FG-3002', 900], ['FG-3003', 60]], deliver: D(1, 5), invoice: D(1, 6) });
    await collect(ctx, { date: D(1, 5), cust: 'C00002', invoices: [s3.si!], share: 0.5, type: 'Online' });
    const c1 = await generateCdcr(ctx('cashier'), D(1, 5));
    await createDeposit(ctx('cashier'), { cdcrnos: [c1.cdcrno], acctno: '1120100', transdate: D(1, 6) });
    const rr3 = await receive(ctx, po3, D(1, 8), { drNo: 'LAC-7781', share: 0.6 });
    const vp4 = await voucherFromRr(ctx, rr3, D(1, 9), 'LAC-SI-3392');
    await produce(ctx, p, { date: D(1, 10), plant: 'P100', fg: 'FG-3004', qty: 300, dl: 22000, oh: 28000 });
    const s5 = await sell(ctx, { date: D(1, 11), cust: 'C00006', plant: 'W110', lines: [['FG-3002', 360], ['FG-3001', 120]], deliver: D(1, 12), invoice: D(1, 12) });
    await transfer(ctx, { date: D(1, 13), from: 'P100', to: 'W110', lines: [['FG-3004', 300]] });
    const vp5 = await expense(ctx, { date: D(1, 14), vendor: 'V00005', refdoc: `MER-${D(1, 14).slice(0, 7)}`, remarks: 'Power consumption - plant and office', lines: [['6200100', 'PRD', 398760, 'WC160'], ['6200100', 'ADM', 36950, 'WC160']] });
    await pay(ctx, { date: D(1, 15), vendor: 'V00001', vps: [vp2] });
    const s6 = await sell(ctx, { date: D(1, 15), cust: 'C00005', plant: 'W110', lines: [['FG-3004', 450], ['FG-3002', 300]], deliver: D(1, 16), invoice: D(1, 16) });
    await payrollRun(ctx, p, { from: D(1, 1), to: D(1, 15), stage: 'posted' });
    const s7 = await sell(ctx, { date: D(1, 22), cust: 'C00001', plant: 'W110', lines: [['FG-3001', 450], ['FG-3004', 360]], deliver: D(1, 23), deliverShare: 0.6, invoice: D(1, 24) });
    await collect(ctx, { date: D(1, 25), cust: 'C00006', invoices: [s5.si!], type: 'Cash' });
    await pay(ctx, { date: D(1, 25), vendor: 'V00005', vps: [vp5], bank: '1120200' });
    const c2 = await generateCdcr(ctx('cashier'), D(1, 25));
    await createDeposit(ctx('cashier'), { cdcrnos: [c2.cdcrno], acctno: '1120100', transdate: D(1, 26) });
    await expense(ctx, { date: D(1, 26), vendor: 'V00007', refdoc: `RPL-${D(1, 26).slice(0, 7)}`, remarks: 'Legal retainer', lines: [['6200300', 'ADM', 56000, 'WI010']] });
    await collect(ctx, { date: D(1, 29), cust: 'C00005', invoices: [s6.si!], type: 'Check', bank: 'Security Bank', pdate: addDays(D(1, 29), 21) });
    await payrollRun(ctx, p, { from: D(1, 16), to: k.monthEnd(1), stage: 'posted' });
    const cm = await doc(ctx('accountant'), 'cm', { transdate: D(1, 20), custno: 'C00003', reasons: 'Damaged carboys on delivery', remarks: 'Per delivery receipt annotation', lines: [{ invno: s2.si!, amt: 9800, glacct1: GL.SALES_RETURNS }] });
    await act(ctx('finance'), 'cm', cm, 'approve');
    await countStock(ctx('warehouse'), 'W120', D(1, 27), { 'FG-3002': -2, 'FG-3004': 1 });
    await jv(ctx, { date: k.monthEnd(1), remarks: 'Monthly depreciation of plant, buildings and vehicles', lines: [['6200500', 'PRD', 210000, 0], ['6200500', 'ADM', 75000, 0], ['1590100', '', 0, 285000]] });
    await jv(ctx, { date: k.monthEnd(1), remarks: 'Accrual of trucking charges not yet billed', lines: [['6200200', 'LOG', 48500, 0], ['2150100', '', 0, 48500]] });

    // This month (to date) - leaves real work waiting in everyone's task list.
    await postOpenEntries(ctx('finance'), k.monthEnd(1));
    await receive(ctx, po3, D(0, 2), { drNo: 'LAC-7840', lab: 'pending' });
    await buy(ctx, { date: D(0, 2), vendor: 'V00004', plant: 'P100', dept: 'PUR', lines: [['PM-2001', 2000, 142]], viaRiv: false, approve: false });
    await produce(ctx, p, { date: D(0, 5), plant: 'P100', fg: 'FG-3001', qty: 200, dl: 30000, oh: 40000, pass: false });
    await sell(ctx, { date: D(0, 6), cust: 'C00005', plant: 'W110', lines: [['FG-3001', 450]], approve: false });
    await sell(ctx, { date: D(0, 7), cust: 'C00002', plant: 'W120', lines: [['FG-3002', 270], ['FG-3004', 180]], deliver: D(0, 8), postDelivery: false });
    const rest = await prefill(ctx('warehouse'), 'do', 'so', s7.so);
    const do9 = await doc(ctx('warehouse'), 'do', { ...rest, transdate: D(0, 9) });
    await act(ctx('warehouse'), 'do', do9, 'post');
    const si9 = await doc(ctx('sales'), 'si', { ...(await prefill(ctx('sales'), 'si', 'do', do9)), transdate: D(0, 9) });
    await act(ctx('sales'), 'si', si9, 'post');
    await sell(ctx, { date: D(0, 10), cust: 'C00006', plant: 'W110', lines: [['FG-3002', 24]], deliver: D(0, 10), invoice: D(0, 11), postInvoice: false });
    await expense(ctx, { date: D(0, 9), vendor: 'V00006', refdoc: `SH-${D(0, 9).slice(5, 7)}${D(0, 9).slice(8, 10)}`, remarks: 'Deliveries to Visayas and South Luzon', lines: [['6200200', 'LOG', 56000, 'WC160']], post: false });
    await pay(ctx, { date: D(0, 9), vendor: 'V00002', vps: [vp4], release: false });
    await collect(ctx, { date: D(0, 10), cust: 'C00001', invoices: [s7.si!], type: 'Check', bank: 'BDO' });
    await jv(ctx, { date: D(0, 12), remarks: 'Reclass of office supplies charged to repairs', lines: [['6200700', 'ADM', 12450, 0], ['6200400', 'ADM', 0, 12450]], stage: 'open' });
    await payrollRun(ctx, p, { from: D(0, 1), to: addDays(D(0, 1), 14), stage: 'attendance' });
    await sell(ctx, { date: D(0, 3), cust: 'C00003', plant: 'W110', lines: [['FG-3002', 180], ['FG-3001', 120]], deliver: D(0, 4), invoice: D(0, 4) });
  } else if (p.ba === '8200') {
    const po1 = await buy(ctx, { date: D(2, 2), vendor: 'V00001', plant: 'F200', dept: 'PRD', lines: [['RM-5001', 90000, 17.9], ['RM-5003', 30000, 12.6]] });
    const po2 = await buy(ctx, { date: D(2, 3), vendor: 'V00002', plant: 'F200', dept: 'PRD', lines: [['RM-5002', 40000, 32.1], ['RM-5004', 6000, 67.5]] });
    const rr1 = await receive(ctx, po1, D(2, 6), { drNo: 'CLG-2201' });
    const rr2 = await receive(ctx, po2, D(2, 7), { drNo: 'AAP-9912' });
    await produce(ctx, p, { date: D(2, 8), plant: 'F200', fg: 'FG-7001', qty: 1200, dl: 54000, oh: 96000 });
    await produce(ctx, p, { date: D(2, 9), plant: 'F200', fg: 'FG-7002', qty: 1000, dl: 47000, oh: 85000 });
    const s1 = await sell(ctx, { date: D(2, 10), cust: 'C00001', plant: 'W210', lines: [['FG-7001', 600]], deliver: D(2, 11), invoice: D(2, 11) });
    const s2 = await sell(ctx, { date: D(2, 12), cust: 'C00002', plant: 'W210', lines: [['FG-7002', 700], ['FG-7003', 300]], deliver: D(2, 13), invoice: D(2, 13) });
    await sell(ctx, { date: D(2, 13), cust: 'C00001', plant: 'F200', lines: [['FG-7002', 400], ['FG-7001', 300]], deliver: D(2, 14), invoice: D(2, 14) });
    const vp1 = await voucherFromRr(ctx, rr1, D(2, 14), 'CLG-INV-5521');
    const vp2 = await voucherFromRr(ctx, rr2, D(2, 15), 'AAP-INV-7710');
    await transfer(ctx, { date: D(2, 16), from: 'F200', to: 'W210', lines: [['FG-7001', 900], ['FG-7002', 700]] });
    const vp3 = await expense(ctx, { date: D(2, 18), vendor: 'V00005', refdoc: `MER-${D(2, 18).slice(0, 7)}`, remarks: 'Feedmill power consumption', lines: [['6200100', 'PRD', 655200, 'WC160']] });
    await pay(ctx, { date: D(2, 25), vendor: 'V00001', vps: [vp1] });
    await collect(ctx, { date: D(2, 27), cust: 'C00001', invoices: [s1.si!], type: 'Check', bank: 'Landbank' });
    await jv(ctx, { date: k.monthEnd(2), remarks: 'Monthly depreciation', lines: [['6200500', 'PRD', 180000, 0], ['6200500', 'ADM', 40000, 0], ['1590100', '', 0, 220000]] });
    const s3 = await sell(ctx, { date: D(1, 3), cust: 'C00004', plant: 'W210', lines: [['FG-7003', 400], ['FG-7002', 250]], deliver: D(1, 4), invoice: D(1, 4) });
    await collect(ctx, { date: D(1, 6), cust: 'C00002', invoices: [s2.si!], type: 'Online' });
    const c1 = await generateCdcr(ctx('admin'), D(1, 6));
    await createDeposit(ctx('admin'), { cdcrnos: [c1.cdcrno], acctno: '1120100', transdate: D(1, 7) });
    await produce(ctx, p, { date: D(1, 8), plant: 'F200', fg: 'FG-7003', qty: 800, dl: 36000, oh: 64000 });
    await pay(ctx, { date: D(1, 10), vendor: 'V00002', vps: [vp2] });
    await pay(ctx, { date: D(1, 10), vendor: 'V00005', vps: [vp3], bank: '1120200' });
    const s4 = await sell(ctx, { date: D(1, 14), cust: 'C00003', plant: 'F200', lines: [['FG-7001', 300], ['FG-7003', 200]], deliver: D(1, 15), invoice: D(1, 15) });
    await payrollRun(ctx, p, { from: D(1, 1), to: D(1, 15), stage: 'posted' });
    const po3 = await buy(ctx, { date: D(1, 18), vendor: 'V00004', plant: 'F200', dept: 'PUR', lines: [['PM-6001', 20000, 9.4]] });
    const rr3 = await receive(ctx, po3, D(1, 21), { drNo: 'BWS-4410' });
    await voucherFromRr(ctx, rr3, D(1, 22), 'BWS-SI-1029');
    const s5 = await sell(ctx, { date: D(1, 22), cust: 'C00005', plant: 'W210', lines: [['FG-7001', 250]], deliver: D(1, 23), invoice: D(1, 23) });
    await collect(ctx, { date: D(1, 28), cust: 'C00004', invoices: [s3.si!], share: 0.5, type: 'Check', bank: 'BDO' });
    await payrollRun(ctx, p, { from: D(1, 16), to: k.monthEnd(1), stage: 'posted' });
    await jv(ctx, { date: k.monthEnd(1), remarks: 'Monthly depreciation', lines: [['6200500', 'PRD', 180000, 0], ['6200500', 'ADM', 40000, 0], ['1590100', '', 0, 220000]] });
    await postOpenEntries(ctx('finance'), k.monthEnd(1));
    const po4 = await buy(ctx, { date: D(0, 2), vendor: 'V00001', plant: 'F200', dept: 'PRD', lines: [['RM-5001', 60000, 18.1]] });
    await receive(ctx, po4, D(0, 4), { drNo: 'CLG-2290', lab: 'pending' });
    await sell(ctx, { date: D(0, 5), cust: 'C00002', plant: 'W210', lines: [['FG-7002', 500]], deliver: D(0, 6), invoice: D(0, 6) });
    await sell(ctx, { date: D(0, 7), cust: 'C00005', plant: 'W210', lines: [['FG-7001', 40]], deliver: D(0, 8), invoice: D(0, 8), postInvoice: false });
    await sell(ctx, { date: D(0, 3), cust: 'C00003', plant: 'W210', lines: [['FG-7001', 200], ['FG-7003', 50]], deliver: D(0, 3), invoice: D(0, 3) });
    await expense(ctx, { date: D(0, 8), vendor: 'V00006', refdoc: `NTS-${D(0, 8).slice(5, 7)}${D(0, 8).slice(8, 10)}`, remarks: 'Feeds delivery to Pampanga and Tarlac', lines: [['6200200', 'LOG', 74500, 'WC160']], post: false });
    await payrollRun(ctx, p, { from: D(0, 1), to: addDays(D(0, 1), 14), stage: 'attendance' });
  } else {
    const po1 = await buy(ctx, { date: D(2, 2), vendor: 'V00001', plant: 'W300', dept: 'PUR', lines: [['FG-9001', 2000, 1390], ['FG-9003', 1500, 1515]] });
    const po2 = await buy(ctx, { date: D(2, 3), vendor: 'V00002', plant: 'W300', dept: 'PUR', lines: [['FG-9004', 3000, 262], ['FG-9005', 2000, 305], ['FG-9006', 1500, 285]] });
    const rr1 = await receive(ctx, po1, D(2, 8), { drNo: 'PFI-3301' });
    const rr2 = await receive(ctx, po2, D(2, 9), { drNo: 'AGC-1188' });
    await transfer(ctx, { date: D(2, 10), from: 'W300', to: 'W310', lines: [['FG-9001', 600], ['FG-9004', 900]] });
    const s1 = await sell(ctx, { date: D(2, 11), cust: 'C00001', plant: 'W300', lines: [['FG-9001', 800], ['FG-9002', 400]], deliver: D(2, 12), invoice: D(2, 12) });
    const s2 = await sell(ctx, { date: D(2, 14), cust: 'C00003', plant: 'W310', lines: [['FG-9001', 700], ['FG-9004', 1100]], deliver: D(2, 15), invoice: D(2, 16) });
    const vp1 = await voucherFromRr(ctx, rr1, D(2, 16), 'PFI-INV-80012');
    const vp2 = await voucherFromRr(ctx, rr2, D(2, 17), 'AGC-INV-22710');
    await expense(ctx, { date: D(2, 20), vendor: 'V00003', refdoc: `SSF-${D(2, 20).slice(0, 7)}`, remarks: 'Inter-island shipping to Davao', lines: [['6200200', 'LOG', 128000, 'WC160']] });
    await pay(ctx, { date: D(2, 28), vendor: 'V00002', vps: [vp2] });
    await collect(ctx, { date: D(2, 29), cust: 'C00001', invoices: [s1.si!], type: 'Check', bank: 'Metrobank' });
    const s3 = await sell(ctx, { date: D(1, 4), cust: 'C00002', plant: 'W300', lines: [['FG-9003', 600], ['FG-9005', 500]], deliver: D(1, 5), invoice: D(1, 5) });
    await collect(ctx, { date: D(1, 8), cust: 'C00003', invoices: [s2.si!], share: 0.6, type: 'Online' });
    const c1 = await generateCdcr(ctx('admin'), D(1, 8));
    await createDeposit(ctx('admin'), { cdcrnos: [c1.cdcrno], acctno: '1120100', transdate: D(1, 9) });
    await pay(ctx, { date: D(1, 12), vendor: 'V00001', vps: [vp1] });
    const s4 = await sell(ctx, { date: D(1, 16), cust: 'C00004', plant: 'W300', lines: [['FG-9002', 500], ['FG-9006', 300]], deliver: D(1, 17), invoice: D(1, 17) });
    await payrollRun(ctx, p, { from: D(1, 1), to: D(1, 15), stage: 'posted' });
    const s5 = await sell(ctx, { date: D(1, 21), cust: 'C00005', plant: 'W300', lines: [['FG-9004', 400], ['FG-9005', 300]], deliver: D(1, 22), invoice: D(1, 22) });
    await collect(ctx, { date: D(1, 27), cust: 'C00002', invoices: [s3.si!], type: 'Check', bank: 'BPI' });
    await payrollRun(ctx, p, { from: D(1, 16), to: k.monthEnd(1), stage: 'posted' });
    await jv(ctx, { date: k.monthEnd(1), remarks: 'Monthly depreciation of warehouse and delivery trucks', lines: [['6200500', 'LOG', 95000, 0], ['1590100', '', 0, 95000]] });
    await postOpenEntries(ctx('finance'), k.monthEnd(1));
    await sell(ctx, { date: D(0, 2), cust: 'C00001', plant: 'W300', lines: [['FG-9003', 200], ['FG-9004', 300]], deliver: D(0, 3), invoice: D(0, 4) });
    await expense(ctx, { date: D(0, 5), vendor: 'V00004', refdoc: `CWD-${D(0, 5).slice(0, 7)}`, remarks: 'Water bill - Calamba warehouse', lines: [['6200400', 'LOG', 18650, 'WC160']], post: false });
    const po3 = await buy(ctx, { date: D(0, 3), vendor: 'V00002', plant: 'W310', dept: 'PUR', lines: [['FG-9005', 1200, 304], ['FG-9006', 1000, 284]] });
    await receive(ctx, po3, D(0, 7), { drNo: 'AGC-1240' });
    await sell(ctx, { date: D(0, 8), cust: 'C00003', plant: 'W310', lines: [['FG-9005', 600], ['FG-9006', 400]], approve: 'Long-time customer; payment schedule agreed', deliver: D(0, 9), postDelivery: false });
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
export async function seedCompany(db: Db): Promise<void> {
  const p = PROFILES[db.ba];
  if (!p) throw new Error(`No demo profile for ${db.ba}`);
  const k = clock();
  await seedSecurity(db, p);
  await seedReference(db, p);
  await seedPayrollTables(db, p);

  // Accounting periods from the opening month to the current month.
  const open = k.month(3);
  const now = k.month(0);
  for (let d = new Date(open.y, open.m - 1, 1); d <= new Date(now.y, now.m - 1, 1); d.setMonth(d.getMonth() + 1)) {
    await ensurePeriod(db, d.getFullYear(), d.getMonth() + 1, 'admin');
  }

  // Opening balances at the end of the opening month: stock in the subledger plus one opening JV.
  const openDate = k.monthEnd(3);
  const stock = await openingStock(db, p, openDate);
  const cash = p.openingCash;
  const assets = r2(cash + 85000 + 50000 + 120000 + stock.raw + stock.pack + stock.fg + 15_000_000 + 24_000_000 + 18_500_000 + 6_200_000);
  const liabilities = r2(9_800_000 + 12_000_000 + 30_000_000);
  const ctxAdmin = as(db, 'accountant');
  const openingJv = await doc(ctxAdmin, 'jv', {
    transdate: openDate,
    remarks: 'Opening balances carried over from AOS100',
    sourcedoc: 'AOS100',
    lines: [
      { acctno: '1120100', dramt: r2(cash * 0.7) },
      { acctno: '1120200', dramt: r2(cash * 0.2) },
      { acctno: '1120300', dramt: r2(cash - r2(cash * 0.7) - r2(cash * 0.2)) },
      { acctno: '1110100', dramt: 85000 },
      { acctno: GL.PETTY_CASH_FUND, dramt: 50000 },
      { acctno: GL.REVOLVING_FUND, dramt: 120000 },
      ...(stock.raw ? [{ acctno: GL.INV_RAW, dramt: stock.raw }] : []),
      ...(stock.pack ? [{ acctno: GL.INV_PACKAGING, dramt: stock.pack }] : []),
      ...(stock.fg ? [{ acctno: GL.INV_FG, dramt: stock.fg }] : []),
      { acctno: '1510100', dramt: 15_000_000 },
      { acctno: '1520100', dramt: 24_000_000 },
      { acctno: '1530100', dramt: 18_500_000 },
      { acctno: '1540100', dramt: 6_200_000 },
      { acctno: '1590100', cramt: 9_800_000 },
      { acctno: '2210100', cramt: 12_000_000 },
      { acctno: '3100100', cramt: 30_000_000 },
      { acctno: GL.RETAINED_EARNINGS, cramt: r2(assets - liabilities) },
    ],
  });
  await act(as(db, 'finance'), 'jv', openingJv, 'approve');
  await act(as(db, 'finance'), 'jv', openingJv, 'post');

  await history(db, p, k);
  await fundsHistory(db, k);
  await depositsHistory(db, k);
  await dsrHistory(db, k);
  await requestsHistory(db);
  await clinicHistory(db, p, k);
  await seedBudgets(db, k);

  // Close every month before last month so that, like real life, last month is still being closed.
  for (let d = new Date(open.y, open.m - 1, 1); ; d.setMonth(d.getMonth() + 1)) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const last = k.month(2);
    if (y > last.y || (y === last.y && m > last.m)) break;
    await closePeriod(as(db, 'finance'), y, m);
  }
}
