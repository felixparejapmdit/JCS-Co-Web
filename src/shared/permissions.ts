// Access Matrix catalog: every page and button of Cloud AOS, grouped by module, mapped
// to the legacy rights it is checked against (sys_usergrouprights: form code x action).
// Actions: 1 view, 2 edit, 3 add, 4 void / delete, 5 approve / post / release.

export type ActionNo = 1 | 2 | 3 | 4 | 5;

export interface PermForm {
  form: string;
  name: string; // what the user works on, e.g. "vouchers payable"
  slug: string; // readable key, e.g. "payables.vouchers"
  actions: Partial<Record<ActionNo, string>>; // label per action this page uses
}

export interface PermSection {
  id: string; // matches the side-menu group id
  label: string;
  forms: PermForm[];
}

const std = (name: string, extra: Partial<Record<ActionNo, string>> = {}): Partial<Record<ActionNo, string>> => ({
  1: `View ${name}`,
  3: `Create ${name}`,
  2: `Edit ${name}`,
  4: `Void ${name}`,
  ...extra,
});

export const PERMISSIONS: PermSection[] = [
  {
    id: 'gl',
    label: 'General Ledger',
    forms: [
      { form: '052', name: 'journal vouchers', slug: 'gl.journal', actions: std('journal vouchers', { 5: 'Approve journal vouchers', 2: 'Edit journal vouchers and automatic JV entries' }) },
      { form: '038', name: 'JV posting', slug: 'gl.posting', actions: { 1: 'View JV posting and cash advance liquidations', 3: 'Create liquidations', 2: 'Edit liquidations', 4: 'Void liquidations', 5: 'Post entries to the ledger and post liquidations' } },
      { form: '006', name: 'period closing', slug: 'gl.periods', actions: { 1: 'View accounting periods', 5: 'Close and reopen periods' } },
      { form: '063', name: 'financial statements', slug: 'gl.statements', actions: { 1: 'View financial statements and schedules' } },
      { form: '079', name: 'budgets', slug: 'gl.budget', actions: { 1: 'View budget monitoring', 2: 'Enter and change budgets' } },
    ],
  },
  {
    id: 'ap',
    label: 'Payables',
    forms: [
      { form: '023', name: 'vouchers payable', slug: 'payables.vouchers', actions: std('vouchers payable') },
      { form: '027', name: 'document posting', slug: 'payables.posting', actions: { 1: 'View document posting', 5: 'Approve and post vouchers payable' } },
      { form: '024', name: 'check vouchers', slug: 'payables.cheques', actions: std('check vouchers', { 2: 'Edit check vouchers and cheque layouts', 5: 'Approve and release cheques' }) },
      { form: '026', name: 'petty cash and revolving fund vouchers', slug: 'payables.funds', actions: std('fund vouchers', { 5: 'Post fund vouchers' }) },
      { form: '028', name: 'fund replenishments', slug: 'payables.replenishment', actions: std('fund replenishments') },
      { form: '030', name: 'vendors', slug: 'payables.vendors', actions: { 1: 'View vendors', 3: 'Add vendors', 2: 'Edit vendors', 4: 'Deactivate vendors' } },
      { form: '032', name: 'A/P reports', slug: 'payables.reports', actions: { 1: 'View A/P aging and reports' } },
    ],
  },
  {
    id: 'ar',
    label: 'Cashiering & Receivables',
    forms: [
      { form: '010', name: 'official receipts', slug: 'cashier.receipts', actions: std('official receipts', { 5: 'Issue (post) official receipts' }) },
      { form: '011', name: 'CDCR and deposits', slug: 'cashier.cdcr', actions: { 1: 'View CDCR and bank deposits', 3: 'Prepare the CDCR', 5: 'Record bank deposits' } },
      { form: '012', name: 'deposit applications', slug: 'cashier.depapp', actions: std('deposit applications', { 5: 'Post deposit applications' }) },
      { form: '013', name: 'debit memos', slug: 'ar.debitmemo', actions: std('debit memos', { 5: 'Approve debit memos' }) },
      { form: '070', name: 'credit memos', slug: 'ar.creditmemo', actions: std('credit memos', { 5: 'Approve credit memos' }) },
      { form: '066', name: 'customer 2307', slug: 'ar.cwt', actions: { 1: "View customers' BIR 2307", 2: 'Mark 2307 certificates received' } },
      { form: '014', name: 'A/R reports', slug: 'ar.reports', actions: { 1: 'View A/R aging and statements of account' } },
      { form: '047', name: "cashier's reports", slug: 'cashier.reports', actions: { 1: 'View collection and deposit registers' } },
    ],
  },
  {
    id: 'sd',
    label: 'Sales & Distribution',
    forms: [
      { form: '020', name: 'customers', slug: 'sales.customers', actions: { 1: 'View customers, price lists and salesmen', 3: 'Add customers and import from Excel', 2: 'Edit customers and request changes', 4: 'Deactivate customers', 5: 'Approve customer change requests' } },
      { form: '017', name: 'sales orders', slug: 'sales.orders', actions: std('sales orders', { 1: 'View sales orders and sales reports' }) },
      { form: '018', name: 'sales order approval', slug: 'sales.approval', actions: { 1: 'View orders waiting for approval', 5: 'Approve sales orders' } },
      { form: '019', name: 'sales invoices', slug: 'sales.invoices', actions: std('sales invoices', { 5: 'Post sales invoices' }) },
      { form: '095', name: 'daily sales reports', slug: 'sales.dsr', actions: std('daily sales reports (van sales)', { 5: 'Close daily sales reports' }) },
      { form: '076', name: "salesman's access", slug: 'sales.salesman', actions: { 1: "Open the salesman's workspace", 3: 'Send order requests' } },
      { form: '077', name: "sales manager's access", slug: 'sales.manager', actions: { 1: "Open the sales manager's workspace", 5: 'Turn order requests into sales orders' } },
    ],
  },
  {
    id: 'mm',
    label: 'Inventory & Plants',
    forms: [
      { form: '050', name: 'receiving reports', slug: 'inventory.receiving', actions: std('receiving reports (MMRR)', { 5: 'Post receiving reports' }) },
      { form: '007', name: 'deliveries and transfers', slug: 'inventory.issues', actions: std('deliveries, issuances and transfers', { 5: 'Post deliveries and transfers' }) },
      { form: '034', name: 'stock', slug: 'inventory.stock', actions: { 1: 'View stock, registers, materials and plants', 3: 'Create physical counts', 2: 'Edit materials and plants', 4: 'Void physical counts', 5: 'Post physical counts' } },
      { form: '087', name: 'lab monitoring', slug: 'inventory.lab', actions: { 1: 'View lots on lab hold', 2: 'Record lab results' } },
    ],
  },
  {
    id: 'pur',
    label: 'Purchasing',
    forms: [
      { form: '054', name: 'requisitions', slug: 'purchasing.riv', actions: std('requisitions (RIV)') },
      { form: '058', name: 'requisition approval', slug: 'purchasing.rivapproval', actions: { 1: 'View requisitions waiting for approval', 5: 'Approve requisitions' } },
      { form: '035', name: 'purchase orders', slug: 'purchasing.po', actions: std('purchase orders') },
      { form: '036', name: 'purchase order approval', slug: 'purchasing.poapproval', actions: { 1: 'View POs waiting for approval', 5: 'Approve purchase orders' } },
      { form: '037', name: 'PO reports', slug: 'purchasing.reports', actions: { 1: 'View PO monitoring' } },
    ],
  },
  {
    id: 'pp',
    label: 'Production & Costing',
    forms: [
      { form: '033', name: 'production worksheets', slug: 'production.worksheet', actions: std('production worksheets', { 5: 'Post production runs' }) },
      { form: '040', name: 'costing', slug: 'production.costing', actions: { 1: 'View production costing' } },
      { form: '059', name: 'COS vs ASP', slug: 'production.cosasp', actions: { 1: 'View COS vs ASP analysis' } },
    ],
  },
  {
    id: 'hr',
    label: 'HR & Payroll',
    forms: [
      { form: '100', name: 'employees', slug: 'hr.employees', actions: { 1: 'View employees', 3: 'Add employees', 2: 'Edit employees', 4: 'Deactivate employees' } },
      { form: '301', name: 'attendance', slug: 'hr.attendance', actions: { 1: 'View attendance', 3: 'Upload DTR', 2: 'Enter attendance exceptions' } },
      { form: '204', name: 'monthly payroll', slug: 'hr.payroll', actions: { 1: 'View payroll and payslips', 3: 'Create payroll IDs', 2: 'Compute payroll', 4: 'Delete unused payroll IDs', 5: 'Post payroll to the ledger' } },
      { form: '205', name: 'weekly payroll', slug: 'hr.weekly', actions: { 1: 'View weekly payroll', 3: 'Create weekly payroll IDs', 2: 'Compute weekly payroll', 5: 'Post weekly payroll' } },
      { form: '210', name: 'payroll adjustments', slug: 'hr.adjustments', actions: { 1: 'View payroll adjustments', 3: 'Add payroll adjustments', 2: 'Edit payroll adjustments', 4: 'Delete payroll adjustments' } },
      { form: '088', name: 'clinic', slug: 'hr.clinic', actions: { 1: 'View clinic records', 3: 'Record consultations', 2: 'Manage clinic supplies', 4: 'Void clinic records' } },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    forms: [
      { form: '001', name: 'users and settings', slug: 'admin.users', actions: { 1: 'View users, company settings and the audit trail', 3: 'Add users', 2: 'Edit users, company branding and document setup', 4: 'Deactivate users', 5: 'Unlock accounts and switch maintenance mode' } },
      { form: '002', name: 'group access', slug: 'admin.groups', actions: { 1: 'View the access matrix', 2: 'Change group access' } },
      { form: '003', name: 'void requests', slug: 'admin.voids', actions: { 1: 'View void requests', 3: 'Request a void', 5: 'Approve or reject void requests' } },
      { form: '045', name: 'approval limits', slug: 'admin.limits', actions: { 1: 'View approval limits', 2: 'Change approval limits' } },
    ],
  },
];

export const ACTION_VERB: Record<ActionNo, string> = { 1: 'view', 2: 'edit', 3: 'create', 4: 'void', 5: 'approve' };

/** Every (form, action) pair the matrix shows. */
export function permissionPairs(): { form: string; action: ActionNo }[] {
  return PERMISSIONS.flatMap((s) => s.forms.flatMap((f) => (Object.keys(f.actions) as unknown as string[]).map((a) => ({ form: f.form, action: Number(a) as ActionNo }))));
}

export function matrixForms(): string[] {
  return [...new Set(PERMISSIONS.flatMap((s) => s.forms.map((f) => f.form)))];
}
