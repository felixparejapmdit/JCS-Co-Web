// Legacy permission form codes (checked with IsAllowed(group, form, action) against
// sys_usergrouprights) and transaction codes (tc) written on documents. Form codes come
// from the legacy menus (PLAN.md section 2.7). Transaction codes come from the legacy VB
// source (DocQuery, FundRepl, JournalVoucher, APReports, BudgetMonitor, DeliveryOrder,
// Collection); the few marked "not found" must be confirmed against tccodestbl in Phase 1.

export const ACTION = { VIEW: 1, EDIT: 2, INSERT: 3, DELETE: 4, RELEASE: 5 } as const;
export type ActionNo = (typeof ACTION)[keyof typeof ACTION];

export const FORM = {
  USERS: '001',
  APP_CONTROL: '001',
  GROUP_ACCESS: '002',
  VOID: '003',
  AUTH_CONFIG: '045',
  PETTY_CASH: '026',
  FUND_REPLENISHMENT: '028',
  CA_LIQUIDATION: '038', // legacy menu uses the JV Posting code for CA Liquidation
  CLINIC: '088',
  EVENT_SALES: '095', // Daily / Event Sales Report (DSR)
  SALESMAN: '076', // Salesman's Access
  SALES_MANAGER: '077', // Sales Manager's Access
  PERIOD_CLOSING: '006',
  JOURNAL_VOUCHER: '052',
  JV_POSTING: '038',
  GL_REPORTS: '052',
  FINANCIAL_REPORTS: '063',
  BUDGET: '079',
  VENDOR: '030',
  VOUCHER_PAYABLE: '023',
  DOCUMENT_POSTING: '027',
  CHECK_VOUCHER: '024',
  AP_REPORTS: '032',
  COLLECTION: '010',
  CDCR: '011',
  DEPOSIT_APPLICATION: '012',
  DEBIT_MEMO: '013',
  CREDIT_MEMO: '070',
  CUSTOMER_EWT: '066',
  AR_REPORTS: '014',
  CASHIER_REPORTS: '047',
  CUSTOMER: '020',
  SALES_ORDER: '017',
  SO_APPROVAL: '018',
  SALES_INVOICE: '019',
  DELIVERY_ORDER: '007',
  RECEIVING: '050',
  INVENTORY_REPORTS: '034',
  LAB_MONITORING: '087',
  PO: '035',
  PO_APPROVAL: '036',
  PO_REPORTS: '037',
  RIV: '054',
  RIV_APPROVAL: '058',
  PROD_WORKSHEET: '033',
  COSTING: '040',
  COS_VS_ASP: '059',
  PAYROLL_MONTHLY: '204',
  PAYROLL_WEEKLY: '205',
  PAYROLL_ADJUSTMENT: '210',
  ATTENDANCE: '301',
  EMPLOYEE_MASTER: '100',
} as const;

export const TC = {
  JOURNAL_VOUCHER: '00', // DocQuery "Journal Voucher"
  RECEIVING: '10', // MMRR / goods receipt (invhdrtbl)
  OPENING: '11', // opening stock entry (demo data only)
  TRANSFER_IN: '20', // plant transfer receipt (invhdrtbl); legacy also uses 20 on production inputs - confirm
  DELIVERY: '30', // DocQuery "Delivery Order" (isshdrtbl)
  PROD_RECEIPT: '31', // finished goods from production (invhdrtbl, mov 801) - not found in legacy code, confirm
  PETTY_CASH: '40', // Petty Cash Fund voucher (exphdrtbl)
  WEEKLY_EXPENSE: '41', // Weekly Expense Report (exphdrtbl)
  VOUCHER_PAYABLE: '42',
  CHECK_VOUCHER: '43',
  REVOLVING_FUND: '44', // Revolving Fund voucher (exphdrtbl)
  PAYROLL: '45', // payroll GL entries (BudgetMonitor)
  CA_LIQUIDATION: '46', // cash advance liquidation (exphdrtbl)
  SALES_INVOICE: '53', // charge sales invoice (saleshdrtbl)
  COLLECTION: '60',
  BANK_DEPOSIT: '64',
  EVENT_CASH_INVOICE: '84', // ETCSI: van / event cash sales invoice of a DSR (saleshdrtbl)
  EVENT_CHARGE_INVOICE: '85', // ETCI: van / event charge invoice of a DSR (saleshdrtbl)
  RETURN_IN: '88', // warehouse return receipt of a DSR (wrrhdrtbl, mov 409)
  CREDIT_MEMO: '90',
  DEBIT_MEMO: '92',
  ADJUSTMENT: '72', // inventory adjustment (invadjhdrtbl) - not found in legacy code, confirm
  REQUISITION: '54', // not found in legacy code, confirm
  PURCHASE_ORDER: '35', // not found in legacy code, confirm
  SALES_ORDER: '17', // not found in legacy code, confirm
} as const;

/** Invoice types collected on official receipts (legacy Collection.aspx: Case "53", "84", "85"). */
export const INVOICE_TCS: string[] = [TC.SALES_INVOICE, TC.EVENT_CASH_INVOICE, TC.EVENT_CHARGE_INVOICE];

/** Display names written to tccodestbl in the demo data. */
export const TC_NAMES: Record<string, { module: string; document: string }> = {
  [TC.RECEIVING]: { module: 'MM', document: 'Material Receiving Report' },
  [TC.OPENING]: { module: 'MM', document: 'Opening Stock Entry' },
  [TC.TRANSFER_IN]: { module: 'MM', document: 'Plant Transfer Receipt' },
  [TC.PROD_RECEIPT]: { module: 'MM', document: 'Production Receipt' },
  [TC.RETURN_IN]: { module: 'SD', document: 'Warehouse Return Receipt' },
  [TC.EVENT_CASH_INVOICE]: { module: 'SD', document: 'Event Cash Sales Invoice (ETCSI)' },
  [TC.EVENT_CHARGE_INVOICE]: { module: 'SD', document: 'Event Charge Invoice (ETCI)' },
  [TC.JOURNAL_VOUCHER]: { module: 'FI', document: 'Journal Voucher' },
  [TC.PETTY_CASH]: { module: 'FI', document: 'Petty Cash Fund Voucher' },
  [TC.WEEKLY_EXPENSE]: { module: 'FI', document: 'Weekly Expense Report' },
  [TC.REVOLVING_FUND]: { module: 'FI', document: 'Revolving Fund Voucher' },
  [TC.CA_LIQUIDATION]: { module: 'FI', document: 'Cash Advance Liquidation' },
  [TC.BANK_DEPOSIT]: { module: 'FI', document: 'Bank Deposit' },
  [TC.VOUCHER_PAYABLE]: { module: 'FI', document: 'Voucher Payable' },
  [TC.CHECK_VOUCHER]: { module: 'FI', document: 'Check Voucher' },
  [TC.DELIVERY]: { module: 'MM', document: 'Delivery Order / Issuance' },
  [TC.COLLECTION]: { module: 'FI', document: 'Official Receipt' },
  [TC.SALES_INVOICE]: { module: 'SD', document: 'Sales Invoice' },
  [TC.CREDIT_MEMO]: { module: 'FI', document: 'Customer Credit Memo' },
  [TC.DEBIT_MEMO]: { module: 'FI', document: 'Customer Debit Memo' },
  [TC.ADJUSTMENT]: { module: 'MM', document: 'Inventory Adjustment' },
  [TC.PAYROLL]: { module: 'HR', document: 'Payroll' },
  [TC.REQUISITION]: { module: 'MM', document: 'Requisition (RIV)' },
  [TC.PURCHASE_ORDER]: { module: 'MM', document: 'Purchase Order' },
  [TC.SALES_ORDER]: { module: 'SD', document: 'Sales Order' },
};

/** sys_forms rows: every form code the rights matrix can grant. */
export const FORM_CATALOG: Array<{ code: string; description: string; group: string }> = [
  { code: '001', description: 'User Manager / App Control', group: 'Administration' },
  { code: '002', description: 'Group Access', group: 'Administration' },
  { code: '003', description: 'Void Request / Void Approval', group: 'Administration' },
  { code: '045', description: 'Authorization Configuration', group: 'Administration' },
  { code: '026', description: 'Petty Cash / Revolving Fund Voucher', group: 'Payables' },
  { code: '028', description: 'Fund Replenishment', group: 'Payables' },
  { code: '006', description: 'Period Closing', group: 'General Ledger' },
  { code: '052', description: 'Journal Voucher / GL Reports', group: 'General Ledger' },
  { code: '038', description: 'JV Posting / CA Liquidation', group: 'General Ledger' },
  { code: '063', description: 'Financial Reports', group: 'General Ledger' },
  { code: '079', description: 'Budget Monitoring', group: 'General Ledger' },
  { code: '030', description: 'Vendor Master', group: 'Payables' },
  { code: '023', description: 'Voucher Payable', group: 'Payables' },
  { code: '027', description: 'Document Posting', group: 'Payables' },
  { code: '024', description: 'Check Voucher', group: 'Payables' },
  { code: '032', description: 'A/P Reports', group: 'Payables' },
  { code: '010', description: 'Collection', group: 'Cashiering & Receivables' },
  { code: '011', description: "Cashier's Daily Collection Report / Bank Deposit", group: 'Cashiering & Receivables' },
  { code: '012', description: 'Deposit Application', group: 'Cashiering & Receivables' },
  { code: '013', description: 'Customer Debit Memo', group: 'Cashiering & Receivables' },
  { code: '070', description: 'Customer Credit Memo', group: 'Cashiering & Receivables' },
  { code: '066', description: "Customer's EWT (BIR 2307)", group: 'Cashiering & Receivables' },
  { code: '014', description: 'A/R Reports', group: 'Cashiering & Receivables' },
  { code: '047', description: "Cashier's Reports", group: 'Cashiering & Receivables' },
  { code: '020', description: 'Customer Master', group: 'Sales & Distribution' },
  { code: '017', description: 'Sales Order / SD Reports', group: 'Sales & Distribution' },
  { code: '018', description: 'SO Approval', group: 'Sales & Distribution' },
  { code: '019', description: 'Sales Invoice', group: 'Sales & Distribution' },
  { code: '007', description: 'Issuance / Delivery Order', group: 'Materials & Plants' },
  { code: '050', description: 'Receiving (MMRR)', group: 'Materials & Plants' },
  { code: '034', description: 'Inventory Reports / Registers', group: 'Materials & Plants' },
  { code: '087', description: 'Lab Monitoring', group: 'Materials & Plants' },
  { code: '054', description: 'RIV Processing', group: 'Purchasing' },
  { code: '058', description: 'RIV Approval', group: 'Purchasing' },
  { code: '035', description: 'PO Processing', group: 'Purchasing' },
  { code: '036', description: 'PO Approval', group: 'Purchasing' },
  { code: '037', description: 'PO Reports', group: 'Purchasing' },
  { code: '095', description: 'Event / Daily Sales Report (DSR)', group: 'Sales & Distribution' },
  { code: '076', description: "Salesman's Access", group: 'Sales & Distribution' },
  { code: '077', description: "Sales Manager's Access", group: 'Sales & Distribution' },
  { code: '033', description: 'Production Worksheet', group: 'Production & Costing' },
  { code: '040', description: 'Costing Module', group: 'Production & Costing' },
  { code: '059', description: 'COS vs ASP Analysis', group: 'Production & Costing' },
  { code: '100', description: 'Employee Masterfile', group: 'HR & Payroll' },
  { code: '301', description: 'Attendance (Manual Entry)', group: 'HR & Payroll' },
  { code: '204', description: 'Payroll Processing - Monthly', group: 'HR & Payroll' },
  { code: '205', description: 'Payroll Processing - Weekly', group: 'HR & Payroll' },
  { code: '210', description: 'Payroll Adjustment', group: 'HR & Payroll' },
  { code: '088', description: 'Clinic Monitoring', group: 'HR & Payroll' },
];

/** Which document page opens for a GL entry of a given transaction code. */
export const TC_DOC: Record<string, string> = {
  [TC.JOURNAL_VOUCHER]: 'jv',
  [TC.RECEIVING]: 'mmrr',
  [TC.DELIVERY]: 'do',
  [TC.PROD_RECEIPT]: 'prod',
  [TC.PETTY_CASH]: 'pcv',
  [TC.REVOLVING_FUND]: 'rfv',
  [TC.VOUCHER_PAYABLE]: 'vp',
  [TC.CHECK_VOUCHER]: 'cv',
  [TC.CA_LIQUIDATION]: 'liq',
  [TC.SALES_INVOICE]: 'si',
  [TC.COLLECTION]: 'or',
  [TC.CREDIT_MEMO]: 'cm',
  [TC.DEBIT_MEMO]: 'dm',
  [TC.ADJUSTMENT]: 'adj',
};

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent';

export function statusTone(status: string | null | undefined): StatusTone {
  const s = String(status ?? '').toLowerCase();
  if (['posted', 'released', 'served', 'delivered', 'paid', 'passed', 'deposited', 'closed', 'processed', 'active', 'completed', 'received'].includes(s)) return 'success';
  if (['approved', 'for posting', 'partial', 'billed'].includes(s)) return 'info';
  if (['open', 'draft', 'pending', 'for approval', 'unserved', 'unpaid', 'undelivered', 'lab hold'].includes(s)) return 'warning';
  if (['void', 'rejected', 'cancelled', 'locked', 'failed', 'inactive', 'over limit'].includes(s)) return 'danger';
  return 'neutral';
}
