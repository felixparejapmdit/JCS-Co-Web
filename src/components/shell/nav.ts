import {
  BarChart3,
  Boxes,
  ClipboardList,
  Factory,
  FileText,
  Landmark,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  form: string; // legacy permission form code; the item shows when the group may view it
  keywords?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

/** Menu built from the legacy FI / SD / MM / HRIS / Admin menus (PLAN.md section 2.7), minus empty placeholders. */
export const NAV: NavGroup[] = [
  {
    id: 'gl',
    label: 'General Ledger',
    icon: Landmark,
    items: [
      { label: 'Journal Vouchers', href: '/dashboard/doc/jv', form: '052', keywords: 'jv entry adjustment' },
      { label: 'JV Posting', href: '/dashboard/fi/posting', form: '038', keywords: 'post ledger subledger' },
      { label: 'Edit Auto JV Entries', href: '/dashboard/fi/jv-edit', form: '052', keywords: 'correct gl entry account cost center jvedit' },
      { label: 'Period Closing', href: '/dashboard/fi/periods', form: '006', keywords: 'month end close reopen' },
      { label: 'GL Reports', href: '/dashboard/fi/gl-reports', form: '052', keywords: 'trial balance ledger' },
      { label: 'Financial Statements', href: '/dashboard/fi/statements', form: '063', keywords: 'balance sheet income statement profit loss' },
      { label: 'Budget Monitoring', href: '/dashboard/fi/budget', form: '079', keywords: 'budget actual variance cost center' },
      { label: 'GL Registers', href: '/dashboard/reports/gl', form: '052', keywords: 'gl transactions chart of accounts report viewer fireportviewer' },
      { label: 'Document Query', href: '/dashboard/fi/doc-query', form: '052', keywords: 'docquery find document correct date customer vendor history' },
    ],
  },
  {
    id: 'ap',
    label: 'Payables',
    icon: Wallet,
    items: [
      { label: 'Vouchers Payable', href: '/dashboard/doc/vp', form: '023', keywords: 'vp bills supplier invoice' },
      { label: 'Check Vouchers', href: '/dashboard/doc/cv', form: '024', keywords: 'cheque payment disbursement' },
      { label: 'Petty Cash Vouchers', href: '/dashboard/doc/pcv', form: '026', keywords: 'petty cash pcf disbursement custodian' },
      { label: 'Revolving Fund Vouchers', href: '/dashboard/doc/rfv', form: '026', keywords: 'revolving fund rf' },
      { label: 'Fund Replenishment', href: '/dashboard/doc/fr', form: '028', keywords: 'replenish petty cash revolving fund' },
      { label: 'Cash Advance Liquidation', href: '/dashboard/doc/liq', form: '038', keywords: 'liquidation cash advance ca refund reimburse' },
      { label: 'A/P Aging', href: '/dashboard/fi/ap', form: '032', keywords: 'payables due' },
      { label: 'A/P Reports', href: '/dashboard/reports/ap', form: '032', keywords: 'register payment monitoring expense query ewt apreports' },
      { label: 'Vendors', href: '/dashboard/master/vendors', form: '030', keywords: 'suppliers' },
    ],
  },
  {
    id: 'ar',
    label: 'Cashiering & Receivables',
    icon: Receipt,
    items: [
      { label: 'Official Receipts', href: '/dashboard/doc/or', form: '010', keywords: 'collection payment or' },
      { label: 'CDCR & Bank Deposits', href: '/dashboard/fi/cdcr', form: '011', keywords: 'daily collection deposit' },
      { label: 'Deposit Applications', href: '/dashboard/doc/da', form: '012', keywords: 'customer deposit advance payment unapplied depapp' },
      { label: 'Credit Memos', href: '/dashboard/doc/cm', form: '070', keywords: 'returns allowance' },
      { label: 'Debit Memos', href: '/dashboard/doc/dm', form: '013', keywords: 'charges' },
      { label: 'Customer 2307', href: '/dashboard/fi/cwt', form: '066', keywords: 'bir withholding certificate ewt' },
      { label: 'A/R Aging & Statements', href: '/dashboard/fi/ar', form: '014', keywords: 'receivables soa overdue' },
      { label: "Cashier's Reports", href: '/dashboard/reports/ar', form: '047', keywords: 'collection register deposit summary cdcr cashierreports' },
    ],
  },
  {
    id: 'sd',
    label: 'Sales & Distribution',
    icon: ShoppingCart,
    items: [
      { label: 'Sales Orders', href: '/dashboard/doc/so', form: '017', keywords: 'so order' },
      { label: 'Sales Invoices', href: '/dashboard/doc/si', form: '019', keywords: 'billing invoice' },
      { label: 'Daily Sales Reports (Van)', href: '/dashboard/sd/dsr', form: '095', keywords: 'dsr van event sales etcsi etci am pm stock shrinkage' },
      { label: "Salesman's Workspace", href: '/dashboard/sd/salesman', form: '076', keywords: 'my customers order request salesman module' },
      { label: 'Order Requests', href: '/dashboard/sd/requests', form: '077', keywords: 'sales manager approve request' },
      { label: 'Sales Reports', href: '/dashboard/sd/reports', form: '017', keywords: 'register analysis' },
      { label: 'Sales Registers', href: '/dashboard/reports/sd', form: '017', keywords: 'invoice register salesman area product open orders sdrepviewer' },
      { label: 'Customers', href: '/dashboard/master/customers', form: '020', keywords: 'clients credit limit' },
      { label: 'Customer Tools', href: '/dashboard/sd/customer-tools', form: '020', keywords: 'excel upload bulk update transfer salesman customer request custmast' },
      { label: 'Price List', href: '/dashboard/master/priceList', form: '020', keywords: 'prices' },
      { label: 'Salesmen', href: '/dashboard/master/salesmen', form: '020' },
      { label: 'Sales Areas', href: '/dashboard/master/areas', form: '020' },
    ],
  },
  {
    id: 'mm',
    label: 'Inventory & Plants',
    icon: Boxes,
    items: [
      { label: 'Stock by Plant', href: '/dashboard/mm/stock', form: '034', keywords: 'inventory plant warehouse balance stock card' },
      { label: 'Receiving (MMRR)', href: '/dashboard/doc/mmrr', form: '050', keywords: 'goods receipt' },
      { label: 'Deliveries & Transfers', href: '/dashboard/doc/do', form: '007', keywords: 'issuance delivery order transfer scrap' },
      { label: 'Physical Count', href: '/dashboard/doc/adj', form: '034', keywords: 'adjustment cycle count' },
      { label: 'Lab Monitoring', href: '/dashboard/mm/lab', form: '087', keywords: 'qa quality inspection' },
      { label: 'Registers', href: '/dashboard/mm/registers', form: '034', keywords: 'mm register receipts issues' },
      { label: 'Materials', href: '/dashboard/master/materials', form: '034', keywords: 'items products' },
      { label: 'Plants & Warehouses', href: '/dashboard/master/plants', form: '034', keywords: 'plant warehouse farm' },
    ],
  },
  {
    id: 'pur',
    label: 'Purchasing',
    icon: ClipboardList,
    items: [
      { label: 'Requisitions (RIV)', href: '/dashboard/doc/riv', form: '054', keywords: 'request purchase requisition' },
      { label: 'Purchase Orders', href: '/dashboard/doc/po', form: '035', keywords: 'po' },
      { label: 'PO Monitoring', href: '/dashboard/mm/po-monitor', form: '037', keywords: 'po reports open' },
    ],
  },
  {
    id: 'pp',
    label: 'Production & Costing',
    icon: Factory,
    items: [
      { label: 'Production Worksheets', href: '/dashboard/doc/prod', form: '033', keywords: 'production lot batch costing' },
      { label: 'COS vs ASP', href: '/dashboard/pp/cos-asp', form: '059', keywords: 'margin cost selling price' },
    ],
  },
  {
    id: 'hr',
    label: 'HR & Payroll',
    icon: Users,
    items: [
      { label: 'Employees', href: '/dashboard/hr/employees', form: '100', keywords: 'staff personnel' },
      { label: 'Payroll', href: '/dashboard/hr/payroll', form: '204', keywords: 'attendance payslip sss philhealth pagibig tax' },
      { label: 'Payroll IDs', href: '/dashboard/hr/payroll-ids', form: '204', keywords: 'payroll period cutoff open close payrollid' },
      { label: 'DTR Upload', href: '/dashboard/hr/dtr', form: '301', keywords: 'biometric time keeping attendance late undertime absent' },
      { label: 'Clinic', href: '/dashboard/hr/clinic', form: '088', keywords: 'nurse consultation medicine supplies sick clinicmonitoring' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    items: [
      { label: 'Financial Statements', href: '/dashboard/fi/statements', form: '063' },
      { label: 'Trial Balance & Ledgers', href: '/dashboard/fi/gl-reports', form: '052' },
      { label: 'A/R Aging', href: '/dashboard/fi/ar', form: '014' },
      { label: 'A/P Aging', href: '/dashboard/fi/ap', form: '032' },
      { label: 'Stock by Plant', href: '/dashboard/mm/stock', form: '034' },
      { label: 'Sales Reports', href: '/dashboard/sd/reports', form: '017' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Settings,
    items: [
      { label: 'Company & Branding', href: '/dashboard/admin/company', form: '001', keywords: 'logo header profile settings' },
      { label: 'Users', href: '/dashboard/admin/users', form: '001', keywords: 'accounts unlock password' },
      { label: 'Group Access', href: '/dashboard/admin/groups', form: '002', keywords: 'rights roles permissions' },
      { label: 'Approval Limits', href: '/dashboard/admin/limits', form: '045', keywords: 'authorization' },
      { label: 'Void Requests', href: '/dashboard/admin/voids', form: '003', keywords: 'cancel' },
      { label: 'Audit Trail', href: '/dashboard/admin/audit', form: '001', keywords: 'log history translog' },
      { label: 'Document Setup', href: '/dashboard/admin/doc-setup', form: '001', keywords: 'numbering series docconfig upload download hold app' },
      { label: 'Maintenance Mode', href: '/dashboard/admin/maintenance', form: '001', keywords: 'downtime server note offline' },
      { label: 'Data Source', href: '/dashboard/admin/data-source', form: '001', keywords: 'mysql memory memorystore sample data database storage local' },
      { label: 'Chart of Accounts', href: '/dashboard/master/accounts', form: '052', keywords: 'gl accounts coa' },
      { label: 'Cost Centers', href: '/dashboard/master/costCenters', form: '052' },
      { label: 'Profit Centers', href: '/dashboard/master/profitCenters', form: '052' },
      { label: 'Bank Accounts', href: '/dashboard/master/banks', form: '024' },
      { label: 'Cheque Printing Setup', href: '/dashboard/admin/cheques', form: '024', keywords: 'calibration layout' },
      { label: 'Withholding Tax Codes', href: '/dashboard/master/ewtCodes', form: '023', keywords: 'atc ewt bir' },
      { label: 'Departments', href: '/dashboard/master/departments', form: '054' },
    ],
  },
];

export function findNav(pathname: string): { group?: NavGroup; item?: NavItem } {
  let best: { group?: NavGroup; item?: NavItem; len: number } = { len: 0 };
  for (const g of NAV) {
    if (g.id === 'reports') continue;
    for (const i of g.items) {
      if ((pathname === i.href || pathname.startsWith(i.href + '/')) && i.href.length > best.len) best = { group: g, item: i, len: i.href.length };
    }
  }
  return best;
}

export const DOC_ICON = FileText;
