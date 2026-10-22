import {
  Activity,
  ArrowRightLeft,
  BadgeCheck,
  BadgeDollarSign,
  Ban,
  Banknote,
  BarChart3,
  BookOpenText,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  ClipboardPen,
  Cog,
  Coins,
  Database,
  Factory,
  FileBarChart,
  FileCheck,
  FileCog,
  FileMinus,
  FilePen,
  FilePlus,
  FileSearch,
  FileText,
  Fingerprint,
  FlaskConical,
  Forklift,
  Gauge,
  HandCoins,
  Handshake,
  Hash,
  History,
  Hourglass,
  KeyRound,
  Landmark,
  ListPlus,
  ListTree,
  MapPin,
  Network,
  NotebookPen,
  Package,
  PackageCheck,
  Palette,
  Percent,
  PieChart,
  PiggyBank,
  Printer,
  Receipt,
  ReceiptText,
  RefreshCcw,
  Scale,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Stamp,
  Stethoscope,
  Tag,
  Target,
  TrendingUp,
  Truck,
  UserCog,
  UserRoundCheck,
  Users,
  UsersRound,
  Wallet,
  Warehouse,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tone } from '@/components/ui/tone';

export interface NavItem {
  label: string;
  href: string;
  form: string; // legacy permission form code; the item shows when the group may view it
  keywords?: string;
  /** Sub-heading the item is listed under inside its group (items of one category stay together). */
  category?: string;
  /** Icon shown before the label, coloured by its meaning. */
  icon?: LucideIcon;
  tone?: Tone;
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
      { label: 'Journal Vouchers', href: '/dashboard/doc/jv', form: '052', icon: NotebookPen, tone: 'indigo', keywords: 'jv entry adjustment' },
      { label: 'JV Posting', href: '/dashboard/fi/posting', form: '038', icon: Stamp, tone: 'violet', keywords: 'post ledger subledger' },
      { label: 'Edit Auto JV Entries', href: '/dashboard/fi/jv-edit', form: '052', icon: FilePen, tone: 'amber', keywords: 'correct gl entry account cost center jvedit' },
      { label: 'Period Closing', href: '/dashboard/fi/periods', form: '006', icon: CalendarCheck, tone: 'emerald', keywords: 'month end close reopen' },
      { label: 'GL Reports', href: '/dashboard/fi/gl-reports', form: '052', icon: BookOpenText, tone: 'sky', keywords: 'trial balance ledger' },
      { label: 'Financial Statements', href: '/dashboard/fi/statements', form: '063', icon: FileBarChart, tone: 'indigo', keywords: 'balance sheet income statement profit loss' },
      { label: 'Budget Monitoring', href: '/dashboard/fi/budget', form: '079', icon: Gauge, tone: 'orange', keywords: 'budget actual variance cost center' },
      { label: 'GL Registers', href: '/dashboard/reports/gl', form: '052', icon: ScrollText, tone: 'slate', keywords: 'gl transactions chart of accounts report viewer fireportviewer' },
      { label: 'Document Query', href: '/dashboard/fi/doc-query', form: '052', icon: FileSearch, tone: 'cyan', keywords: 'docquery find document correct date customer vendor history' },
    ],
  },
  {
    id: 'ap',
    label: 'Payables',
    icon: Wallet,
    items: [
      { label: 'Vouchers Payable', href: '/dashboard/doc/vp', form: '023', icon: Receipt, tone: 'amber', keywords: 'vp bills supplier invoice' },
      { label: 'Check Vouchers', href: '/dashboard/doc/cv', form: '024', icon: FileCheck, tone: 'emerald', keywords: 'cheque payment disbursement' },
      { label: 'Petty Cash Vouchers', href: '/dashboard/doc/pcv', form: '026', icon: Coins, tone: 'amber', keywords: 'petty cash pcf disbursement custodian' },
      { label: 'Revolving Fund Vouchers', href: '/dashboard/doc/rfv', form: '026', icon: RefreshCcw, tone: 'sky', keywords: 'revolving fund rf' },
      { label: 'Fund Replenishment', href: '/dashboard/doc/fr', form: '028', icon: PiggyBank, tone: 'pink', keywords: 'replenish petty cash revolving fund' },
      { label: 'Cash Advance Liquidation', href: '/dashboard/doc/liq', form: '038', icon: HandCoins, tone: 'orange', keywords: 'liquidation cash advance ca refund reimburse' },
      { label: 'A/P Aging', href: '/dashboard/fi/ap', form: '032', icon: Hourglass, tone: 'rose', keywords: 'payables due' },
      { label: 'A/P Reports', href: '/dashboard/reports/ap', form: '032', icon: BarChart3, tone: 'indigo', keywords: 'register payment monitoring expense query ewt apreports' },
      { label: 'Vendors', href: '/dashboard/master/vendors', form: '030', icon: Handshake, tone: 'cyan', keywords: 'suppliers' },
    ],
  },
  {
    id: 'ar',
    label: 'Cashiering & Receivables',
    icon: Receipt,
    items: [
      { label: 'Official Receipts', href: '/dashboard/doc/or', form: '010', icon: ReceiptText, tone: 'emerald', keywords: 'collection payment or' },
      { label: 'CDCR & Bank Deposits', href: '/dashboard/fi/cdcr', form: '011', icon: Landmark, tone: 'indigo', keywords: 'daily collection deposit' },
      { label: 'Deposit Applications', href: '/dashboard/doc/da', form: '012', icon: ArrowRightLeft, tone: 'sky', keywords: 'customer deposit advance payment unapplied depapp' },
      { label: 'Credit Memos', href: '/dashboard/doc/cm', form: '070', icon: FileMinus, tone: 'teal', keywords: 'returns allowance' },
      { label: 'Debit Memos', href: '/dashboard/doc/dm', form: '013', icon: FilePlus, tone: 'amber', keywords: 'charges' },
      { label: 'Customer 2307', href: '/dashboard/fi/cwt', form: '066', icon: FileText, tone: 'violet', keywords: 'bir withholding certificate ewt' },
      { label: 'A/R Aging & Statements', href: '/dashboard/fi/ar', form: '014', icon: CalendarClock, tone: 'orange', keywords: 'receivables soa overdue' },
      { label: "Cashier's Reports", href: '/dashboard/reports/ar', form: '047', keywords: 'collection register deposit summary cdcr cashierreports' },
    ],
  },
  {
    id: 'sd',
    label: 'Sales & Distribution',
    icon: ShoppingCart,
    items: [
      { label: 'Sales Orders', href: '/dashboard/doc/so', form: '017', icon: ClipboardList, tone: 'violet', keywords: 'so order' },
      { label: 'Sales Invoices', href: '/dashboard/doc/si', form: '019', icon: BadgeDollarSign, tone: 'emerald', keywords: 'billing invoice' },
      { label: 'Daily Sales Reports (Van)', href: '/dashboard/sd/dsr', form: '095', icon: Truck, tone: 'orange', keywords: 'dsr van event sales etcsi etci am pm stock shrinkage' },
      { label: "Salesman's Workspace", href: '/dashboard/sd/salesman', form: '076', icon: BriefcaseBusiness, tone: 'emerald', keywords: 'my customers order request salesman module' },
      { label: 'Order Requests', href: '/dashboard/sd/requests', form: '077', icon: ClipboardPen, tone: 'sky', keywords: 'sales manager approve request' },
      { label: 'Sales Reports', href: '/dashboard/sd/reports', form: '017', icon: TrendingUp, tone: 'emerald', keywords: 'register analysis' },
      { label: 'Sales Registers', href: '/dashboard/reports/sd', form: '017', icon: ScrollText, tone: 'slate', keywords: 'invoice register salesman area product open orders sdrepviewer' },
      { label: 'Customers', href: '/dashboard/master/customers', form: '020', icon: Users, tone: 'sky', keywords: 'clients credit limit' },
      { label: 'Customer Tools', href: '/dashboard/sd/customer-tools', form: '020', icon: SlidersHorizontal, tone: 'violet', keywords: 'excel upload bulk update transfer salesman customer request custmast' },
      { label: 'Price List', href: '/dashboard/master/priceList', form: '020', icon: Tag, tone: 'amber', keywords: 'prices' },
      { label: 'Salesmen', href: '/dashboard/master/salesmen', form: '020', icon: UserRoundCheck, tone: 'pink' },
      { label: 'Sales Areas', href: '/dashboard/master/areas', form: '020', icon: MapPin, tone: 'rose' },
    ],
  },
  {
    id: 'mm',
    label: 'Inventory & Plants',
    icon: Boxes,
    items: [
      { label: 'Stock by Plant', href: '/dashboard/mm/stock', form: '034', icon: Warehouse, tone: 'cyan', keywords: 'inventory plant warehouse balance stock card' },
      { label: 'Receiving (MMRR)', href: '/dashboard/doc/mmrr', form: '050', icon: PackageCheck, tone: 'emerald', keywords: 'goods receipt' },
      { label: 'Deliveries & Transfers', href: '/dashboard/doc/do', form: '007', icon: Forklift, tone: 'orange', keywords: 'issuance delivery order transfer scrap' },
      { label: 'Physical Count', href: '/dashboard/doc/adj', form: '034', icon: ClipboardCheck, tone: 'violet', keywords: 'adjustment cycle count' },
      { label: 'Lab Monitoring', href: '/dashboard/mm/lab', form: '087', icon: FlaskConical, tone: 'pink', keywords: 'qa quality inspection' },
      { label: 'Registers', href: '/dashboard/mm/registers', form: '034', icon: ScrollText, tone: 'slate', keywords: 'mm register receipts issues' },
      { label: 'Materials', href: '/dashboard/master/materials', form: '034', icon: Package, tone: 'amber', keywords: 'items products' },
      { label: 'Plants & Warehouses', href: '/dashboard/master/plants', form: '034', icon: Factory, tone: 'indigo', keywords: 'plant warehouse farm' },
    ],
  },
  {
    id: 'pur',
    label: 'Purchasing',
    icon: ClipboardList,
    items: [
      { label: 'Requisitions (RIV)', href: '/dashboard/doc/riv', form: '054', icon: ListPlus, tone: 'sky', keywords: 'request purchase requisition' },
      { label: 'Purchase Orders', href: '/dashboard/doc/po', form: '035', icon: ShoppingCart, tone: 'violet', keywords: 'po' },
      { label: 'PO Monitoring', href: '/dashboard/mm/po-monitor', form: '037', icon: Activity, tone: 'emerald', keywords: 'po reports open' },
    ],
  },
  {
    id: 'pp',
    label: 'Production & Costing',
    icon: Factory,
    items: [
      { label: 'Production Worksheets', href: '/dashboard/doc/prod', form: '033', icon: Cog, tone: 'orange', keywords: 'production lot batch costing' },
      { label: 'COS vs ASP', href: '/dashboard/pp/cos-asp', form: '059', icon: Scale, tone: 'indigo', keywords: 'margin cost selling price' },
    ],
  },
  {
    id: 'hr',
    label: 'HR & Payroll',
    icon: Users,
    items: [
      { label: 'Employees', href: '/dashboard/hr/employees', form: '100', icon: UsersRound, tone: 'pink', keywords: 'staff personnel' },
      { label: 'Payroll', href: '/dashboard/hr/payroll', form: '204', icon: Wallet, tone: 'emerald', keywords: 'attendance payslip sss philhealth pagibig tax' },
      { label: 'Payroll IDs', href: '/dashboard/hr/payroll-ids', form: '204', icon: Hash, tone: 'violet', keywords: 'payroll period cutoff open close payrollid' },
      { label: 'DTR Upload', href: '/dashboard/hr/dtr', form: '301', icon: Fingerprint, tone: 'sky', keywords: 'biometric time keeping attendance late undertime absent' },
      { label: 'Clinic', href: '/dashboard/hr/clinic', form: '088', icon: Stethoscope, tone: 'rose', keywords: 'nurse consultation medicine supplies sick clinicmonitoring' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    items: [
      { label: 'Financial Statements', href: '/dashboard/fi/statements', form: '063', icon: FileBarChart, tone: 'indigo' },
      { label: 'Trial Balance & Ledgers', href: '/dashboard/fi/gl-reports', form: '052', icon: BookOpenText, tone: 'sky' },
      { label: 'A/R Aging', href: '/dashboard/fi/ar', form: '014', icon: CalendarClock, tone: 'orange' },
      { label: 'A/P Aging', href: '/dashboard/fi/ap', form: '032', icon: Hourglass, tone: 'rose' },
      { label: 'Stock by Plant', href: '/dashboard/mm/stock', form: '034', icon: Warehouse, tone: 'cyan' },
      { label: 'Sales Reports', href: '/dashboard/sd/reports', form: '017', icon: TrendingUp, tone: 'emerald' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Settings,
    items: [
      // Organization
      { label: 'Company & Branding', href: '/dashboard/admin/company', form: '001', category: 'Organization', icon: Palette, tone: 'fuchsia', keywords: 'logo header profile settings' },
      { label: 'Departments', href: '/dashboard/master/departments', form: '054', category: 'Organization', icon: Network, tone: 'cyan' },
      // Users & Access
      { label: 'Users', href: '/dashboard/admin/users', form: '001', category: 'Users & Access', icon: UserCog, tone: 'sky', keywords: 'accounts unlock password' },
      { label: 'Group Access', href: '/dashboard/admin/groups', form: '002', category: 'Users & Access', icon: ShieldCheck, tone: 'violet', keywords: 'rights roles permissions' },
      { label: 'Approval Limits', href: '/dashboard/admin/limits', form: '045', category: 'Users & Access', icon: BadgeCheck, tone: 'emerald', keywords: 'authorization' },
      { label: 'Void Requests', href: '/dashboard/admin/voids', form: '003', category: 'Users & Access', icon: Ban, tone: 'rose', keywords: 'cancel' },
      { label: 'Audit Trail', href: '/dashboard/admin/audit', form: '001', category: 'Users & Access', icon: History, tone: 'amber', keywords: 'log history translog' },
      // Finance Setup
      { label: 'Chart of Accounts', href: '/dashboard/master/accounts', form: '052', category: 'Finance Setup', icon: ListTree, tone: 'indigo', keywords: 'gl accounts coa' },
      { label: 'Cost Centers', href: '/dashboard/master/costCenters', form: '052', category: 'Finance Setup', icon: Target, tone: 'orange' },
      { label: 'Profit Centers', href: '/dashboard/master/profitCenters', form: '052', category: 'Finance Setup', icon: PieChart, tone: 'teal' },
      { label: 'Bank Accounts', href: '/dashboard/master/banks', form: '024', category: 'Finance Setup', icon: Banknote, tone: 'emerald' },
      { label: 'Withholding Tax Codes', href: '/dashboard/master/ewtCodes', form: '023', category: 'Finance Setup', icon: Percent, tone: 'amber', keywords: 'atc ewt bir' },
      { label: 'Cheque Printing Setup', href: '/dashboard/admin/cheques', form: '024', category: 'Finance Setup', icon: Printer, tone: 'slate', keywords: 'calibration layout' },
      // System
      { label: 'Companies', href: '/dashboard/admin/companies', form: '001', category: 'System', icon: Building2, tone: 'emerald', keywords: 'company active disable enable dissolved business area' },
      { label: 'Document Setup', href: '/dashboard/admin/doc-setup', form: '001', category: 'System', icon: FileCog, tone: 'blue', keywords: 'numbering series docconfig upload download hold app' },
      { label: 'Maintenance Mode', href: '/dashboard/admin/maintenance', form: '001', category: 'System', icon: Wrench, tone: 'orange', keywords: 'downtime server note offline' },
      { label: 'Data Source', href: '/dashboard/admin/data-source', form: '001', category: 'System', icon: Database, tone: 'cyan', keywords: 'mysql memory memorystore sample data database storage local' },
      { label: 'API Keys', href: '/dashboard/admin/api-keys', form: '001', category: 'System', icon: KeyRound, tone: 'amber', keywords: 'api key token integration rest v1 external system' },
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
