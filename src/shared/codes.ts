// Legacy permission form codes (checked with IsAllowed(group, form, action) against
// sys_usergrouprights) and transaction codes (tc) written on documents. Form codes come
// from the legacy menus (PLAN.md section 2.7). Transaction codes follow the values seen in
// the legacy code; confirm them against the client's tccodestbl during Phase 1.

export const ACTION = { VIEW: 1, EDIT: 2, INSERT: 3, DELETE: 4, RELEASE: 5 } as const;
export type ActionNo = (typeof ACTION)[keyof typeof ACTION];

export const FORM = {
  USERS: '001',
  APP_CONTROL: '001',
  GROUP_ACCESS: '002',
  VOID: '003',
  AUTH_CONFIG: '045',
  CLINIC: '088',
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
  RECEIVING: '10', // MMRR / goods receipt (invhdrtbl)
  OPENING: '11', // opening stock entry (demo data only)
  TRANSFER_IN: '20', // plant transfer receipt (invhdrtbl)
  PROD_RECEIPT: '30', // finished goods from production (invhdrtbl)
  RETURN_IN: '84', // customer / salesman return (wrrhdrtbl)
  JOURNAL_VOUCHER: '40',
  CASH_ADVANCE: '41',
  VOUCHER_PAYABLE: '42',
  CHECK_VOUCHER: '43',
  DELIVERY: '53', // issuance / delivery order (isshdrtbl)
  COLLECTION: '60',
  SALES_INVOICE: '62',
  CREDIT_MEMO: '90',
  DEBIT_MEMO: '92',
  ADJUSTMENT: '72', // inventory adjustment (invadjhdrtbl)
  PAYROLL: '88',
  REQUISITION: '54',
  PURCHASE_ORDER: '35',
  SALES_ORDER: '17',
} as const;

/** Display names written to tccodestbl in the demo data. */
export const TC_NAMES: Record<string, { module: string; document: string }> = {
  [TC.RECEIVING]: { module: 'MM', document: 'Material Receiving Report' },
  [TC.OPENING]: { module: 'MM', document: 'Opening Stock Entry' },
  [TC.TRANSFER_IN]: { module: 'MM', document: 'Plant Transfer Receipt' },
  [TC.PROD_RECEIPT]: { module: 'MM', document: 'Production Receipt' },
  [TC.RETURN_IN]: { module: 'SD', document: 'Warehouse Return Receipt' },
  [TC.JOURNAL_VOUCHER]: { module: 'FI', document: 'Journal Voucher' },
  [TC.CASH_ADVANCE]: { module: 'FI', document: 'Cash Advance' },
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
  { code: '006', description: 'Period Closing', group: 'General Ledger' },
  { code: '052', description: 'Journal Voucher / GL Reports', group: 'General Ledger' },
  { code: '038', description: 'JV Posting', group: 'General Ledger' },
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
  { code: '033', description: 'Production Worksheet', group: 'Production & Costing' },
  { code: '040', description: 'Costing Module', group: 'Production & Costing' },
  { code: '059', description: 'COS vs ASP Analysis', group: 'Production & Costing' },
  { code: '100', description: 'Employee Masterfile', group: 'HR & Payroll' },
  { code: '301', description: 'Attendance (Manual Entry)', group: 'HR & Payroll' },
  { code: '204', description: 'Payroll Processing - Monthly', group: 'HR & Payroll' },
  { code: '205', description: 'Payroll Processing - Weekly', group: 'HR & Payroll' },
  { code: '210', description: 'Payroll Adjustment', group: 'HR & Payroll' },
];

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent';

export function statusTone(status: string | null | undefined): StatusTone {
  const s = String(status ?? '').toLowerCase();
  if (['posted', 'released', 'served', 'delivered', 'paid', 'passed', 'deposited', 'closed', 'processed', 'active', 'completed', 'received'].includes(s)) return 'success';
  if (['approved', 'for posting', 'partial', 'billed'].includes(s)) return 'info';
  if (['open', 'draft', 'pending', 'for approval', 'unserved', 'unpaid', 'undelivered', 'lab hold'].includes(s)) return 'warning';
  if (['void', 'rejected', 'cancelled', 'locked', 'failed', 'inactive', 'over limit'].includes(s)) return 'danger';
  return 'neutral';
}
