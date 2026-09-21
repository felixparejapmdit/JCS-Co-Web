import { Account } from '../domain/entities/Account';
import { CostCenter } from '../domain/entities/CostCenter';
import { Vendor } from '../domain/entities/Vendor';
import { Customer } from '../domain/entities/Customer';
import { BankAccount } from '../domain/entities/BankAccount';
import { FiscalPeriod } from '../domain/entities/FiscalPeriod';
import { JournalVoucher } from '../domain/entities/JournalVoucher';
import { Employee, PayrollRunProps } from '../domain/entities/Payroll';
import { GlHeaderRecord, GlLineRecord } from '../domain/services/GeneralLedgerPostingService';
import { Money } from '../domain/value-objects/Money';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
}

export interface UserRecord {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: 'ADMINISTRATOR' | 'FINANCE_HEAD' | 'SENIOR_ACCOUNTANT' | 'CHECKER' | 'CASHIER' | 'MATERIALS_SUPERVISOR' | 'HR_PAYROLL_OFFICER';
  assignedTenants: string[];
  isLocked: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
}

export interface AccessMatrixPermissions {
  view: boolean;
  insert: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
}

export interface AppSettings {
  appName: string;
  tagline: string;
  defaultCurrency: string;
  defaultVatRate: number;
  defaultEwtRate: number;
  currentFiscalYear: number;
  themePreference: 'dark' | 'light' | 'system';
}

export class TenantDataStore {
  // Map<tenantId, Array<T>>
  public accounts: Map<string, Account[]> = new Map();
  public costCenters: Map<string, CostCenter[]> = new Map();
  public vendors: Map<string, Vendor[]> = new Map();
  public customers: Map<string, Customer[]> = new Map();
  public bankAccounts: Map<string, BankAccount[]> = new Map();
  public fiscalPeriods: Map<string, FiscalPeriod[]> = new Map();
  public journalVouchers: Map<string, JournalVoucher[]> = new Map();
  public glHeaders: Map<string, GlHeaderRecord[]> = new Map();
  public glLines: Map<string, GlLineRecord[]> = new Map();
  public employees: Map<string, Employee[]> = new Map();
  public payrollRuns: Map<string, PayrollRunProps[]> = new Map();
  public auditLogs: AuditLogEntry[] = [];

  // System-wide users and settings
  public users: UserRecord[] = [];
  public appSettings: AppSettings = {
    appName: 'AOS100 Web',
    tagline: 'Enterprise Financial Accounting & Multi-Tenant Governance',
    defaultCurrency: 'PHP',
    defaultVatRate: 0.12,
    defaultEwtRate: 0.01,
    currentFiscalYear: 2026,
    themePreference: 'light',
  };

  // Role -> Module -> Permissions
  public accessMatrix: Record<string, Record<string, AccessMatrixPermissions>> = {};

  constructor() {
    this.seedUsers();
    this.seedAccessMatrix();
    this.seedAllTenants();
  }

  public seedUsers(): void {
    this.users = [
      {
        id: 'usr-admin-01',
        username: 'admin',
        password: 'Password123!',
        fullName: 'System Administrator',
        email: 'admin@jcs.ph',
        role: 'ADMINISTRATOR',
        assignedTenants: ['8100', '8200', '8300'],
        isLocked: false,
        status: 'ACTIVE',
        lastLogin: '2026-09-22T01:15:00Z',
      },
      {
        id: 'usr-fin-01',
        username: 'finance',
        password: 'Password123!',
        fullName: 'Maria Santos, CPA',
        email: 'msantos@jcs.ph',
        role: 'FINANCE_HEAD',
        assignedTenants: ['8100', '8200', '8300'],
        isLocked: false,
        status: 'ACTIVE',
        lastLogin: '2026-09-22T01:15:00Z',
      },
      {
        id: 'usr-acct-01',
        username: 'accountant',
        password: 'Password123!',
        fullName: 'Juan Dela Cruz',
        email: 'jdelacruz@jcs.ph',
        role: 'SENIOR_ACCOUNTANT',
        assignedTenants: ['8100', '8200', '8300'],
        isLocked: false,
        status: 'ACTIVE',
        lastLogin: '2026-09-22T01:20:00Z',
      },
      {
        id: 'usr-checker-01',
        username: 'checker',
        password: 'Password123!',
        fullName: 'Roberto Tan',
        email: 'rtan@jcs.ph',
        role: 'CHECKER',
        assignedTenants: ['8100', '8200'],
        isLocked: false,
        status: 'ACTIVE',
      },
      {
        id: 'usr-cash-01',
        username: 'cashier',
        password: 'Password123!',
        fullName: 'Elena Reyes',
        email: 'ereyes@jcs.ph',
        role: 'CASHIER',
        assignedTenants: ['8100'],
        isLocked: false,
        status: 'ACTIVE',
      },
      {
        id: 'usr-whse-01',
        username: 'warehouse',
        password: 'Password123!',
        fullName: 'Carlos Reyes',
        email: 'creyes@jcs.ph',
        role: 'MATERIALS_SUPERVISOR',
        assignedTenants: ['8100', '8200'],
        isLocked: false,
        status: 'ACTIVE',
      },
      {
        id: 'usr-hr-01',
        username: 'hr',
        password: 'Password123!',
        fullName: 'Teresa Lim',
        email: 'tlim@jcs.ph',
        role: 'HR_PAYROLL_OFFICER',
        assignedTenants: ['8100', '8200', '8300'],
        isLocked: false,
        status: 'ACTIVE',
      },
    ];
  }

  public seedAccessMatrix(): void {
    const modules = [
      'general_ledger',
      'fiscal_periods',
      'accounts_payable',
      'check_vouchers',
      'cashiering',
      'materials_management',
      'bir_2307',
      'payroll_hris',
      'financial_statements',
      'settings_management',
    ];

    const roles = [
      'ADMINISTRATOR',
      'FINANCE_HEAD',
      'SENIOR_ACCOUNTANT',
      'CHECKER',
      'CASHIER',
      'MATERIALS_SUPERVISOR',
      'HR_PAYROLL_OFFICER',
    ];

    for (const r of roles) {
      this.accessMatrix[r] = {};
      for (const m of modules) {
        const isAdmin = r === 'ADMINISTRATOR';
        const isFinHead = r === 'FINANCE_HEAD';
        const isAcct = r === 'SENIOR_ACCOUNTANT';
        const isChecker = r === 'CHECKER';
        const isCashier = r === 'CASHIER';
        const isWhse = r === 'MATERIALS_SUPERVISOR';
        const isHr = r === 'HR_PAYROLL_OFFICER';

        let view = false;
        let insert = false;
        let edit = false;
        let del = false;
        let approve = false;

        if (isAdmin) {
          view = true;
          insert = true;
          edit = true;
          del = true;
          approve = true;
        } else if (isFinHead) {
          view = m !== 'materials_management';
          insert = true;
          edit = true;
          del = true;
          approve = true;
        } else if (isAcct) {
          const acctMods = [
            'general_ledger',
            'fiscal_periods',
            'accounts_payable',
            'check_vouchers',
            'cashiering',
            'bir_2307',
            'financial_statements',
          ];
          view = acctMods.includes(m);
          insert = ['general_ledger', 'accounts_payable', 'check_vouchers', 'cashiering'].includes(m);
          edit = ['general_ledger', 'accounts_payable', 'check_vouchers', 'cashiering'].includes(m);
          del = false;
          approve = false;
        } else if (isChecker) {
          view = ['general_ledger', 'accounts_payable', 'check_vouchers', 'financial_statements'].includes(m);
          insert = false;
          edit = false;
          del = false;
          approve = ['general_ledger', 'accounts_payable', 'check_vouchers'].includes(m);
        } else if (isCashier) {
          view = ['cashiering', 'check_vouchers'].includes(m);
          insert = ['cashiering'].includes(m);
          edit = ['cashiering'].includes(m);
          del = false;
          approve = false;
        } else if (isWhse) {
          view = ['materials_management'].includes(m);
          insert = ['materials_management'].includes(m);
          edit = ['materials_management'].includes(m);
          del = false;
          approve = false;
        } else if (isHr) {
          view = ['payroll_hris'].includes(m);
          insert = ['payroll_hris'].includes(m);
          edit = ['payroll_hris'].includes(m);
          del = ['payroll_hris'].includes(m);
          approve = false;
        }

        this.accessMatrix[r][m] = { view, insert, edit, delete: del, approve };
      }
    }
  }

  public seedAllTenants(): void {
    const tenants = ['8100', '8200', '8300'];
    for (const tid of tenants) {
      this.seedTenant(tid);
    }
  }

  public seedTenant(tid: string): void {
    // 1. Chart of Accounts
    const accs = [
      new Account({ id: `${tid}-1000`, accountNumber: '1000-000', accountName: 'Current Assets', accountType: 'Asset', isHeader: true, createdBy: 'system' }),
      new Account({ id: `${tid}-1010`, accountNumber: '1010-000', accountName: 'Cash in Bank - Operating', accountType: 'Asset', createdBy: 'system' }),
      new Account({ id: `${tid}-1020`, accountNumber: '1020-000', accountName: 'Accounts Receivable - Trade', accountType: 'Asset', createdBy: 'system' }),
      new Account({ id: `${tid}-1030`, accountNumber: '1030-000', accountName: 'Creditable Withholding Tax (2307)', accountType: 'Asset', createdBy: 'system' }),
      new Account({ id: `${tid}-1050`, accountNumber: '1050-000', accountName: 'Merchandise Inventory - Chemicals', accountType: 'Asset', createdBy: 'system' }),
      new Account({ id: `${tid}-2000`, accountNumber: '2000-000', accountName: 'Current Liabilities', accountType: 'Liability', isHeader: true, createdBy: 'system' }),
      new Account({ id: `${tid}-2010`, accountNumber: '2010-000', accountName: 'Accounts Payable - Trade', accountType: 'Liability', createdBy: 'system' }),
      new Account({ id: `${tid}-2020`, accountNumber: '2020-000', accountName: 'Withholding Tax Payable - EWT', accountType: 'Liability', createdBy: 'system' }),
      new Account({ id: `${tid}-2030`, accountNumber: '2030-000', accountName: 'Output VAT Payable', accountType: 'Liability', createdBy: 'system' }),
      new Account({ id: `${tid}-2040`, accountNumber: '2040-000', accountName: 'SSS, PhilHealth & Pag-IBIG Premium Payable', accountType: 'Liability', createdBy: 'system' }),
      new Account({ id: `${tid}-3000`, accountNumber: '3000-000', accountName: 'Stockholders Equity', accountType: 'Equity', isHeader: true, createdBy: 'system' }),
      new Account({ id: `${tid}-3010`, accountNumber: '3010-000', accountName: 'Retained Earnings', accountType: 'Equity', createdBy: 'system' }),
      new Account({ id: `${tid}-4000`, accountNumber: '4000-000', accountName: 'Sales Revenue - Products', accountType: 'Revenue', createdBy: 'system' }),
      new Account({ id: `${tid}-5000`, accountNumber: '5000-000', accountName: 'Cost of Goods Sold - Raw Materials', accountType: 'CostOfGoodsSold', createdBy: 'system' }),
      new Account({ id: `${tid}-6000`, accountNumber: '6000-000', accountName: 'Salaries & Wages Expense', accountType: 'Expense', createdBy: 'system' }),
      new Account({ id: `${tid}-6010`, accountNumber: '6010-000', accountName: 'Plant Utilities & Electricity', accountType: 'Expense', createdBy: 'system' }),
    ];
    this.accounts.set(tid, accs);

    // 2. Cost Centers
    const ccs = [
      new CostCenter({ id: `${tid}-cc01`, code: '01-ADM', name: 'General Administrative Division', division: 'Admin', plantLocation: 'Main Complex', createdBy: 'system' }),
      new CostCenter({ id: `${tid}-cc02`, code: '02-SLS', name: 'Commercial Sales & Distribution', division: 'Sales', plantLocation: 'Commercial Center', createdBy: 'system' }),
      new CostCenter({ id: `${tid}-cc03`, code: '03-PRD', name: 'Production & Manufacturing Plant', division: 'Manufacturing', plantLocation: 'Industrial Park', createdBy: 'system' }),
      new CostCenter({ id: `${tid}-cc04`, code: '04-QAC', name: 'Quality Assurance & Chemical Lab', division: 'Operations', plantLocation: 'Tech Complex', createdBy: 'system' }),
    ];
    this.costCenters.set(tid, ccs);

    // 3. Vendors
    const vens = [
      new Vendor({ id: `${tid}-v01`, vendorCode: 'V-PETRON', vendorName: 'Petron Corporation - Industrial Fuel', tradeName: 'Petron Chemicals', tin: '000-112-233-000', registeredAddress: 'San Miguel Complex, Mandaluyong City', defaultAtc: 'WC160', paymentTermsDays: 30, createdBy: 'system' }),
      new Vendor({ id: `${tid}-v02`, vendorCode: 'V-DOWCHEM', vendorName: 'Dow Chemical Philippines Inc.', tradeName: 'Dow Chemicals', tin: '000-445-566-000', registeredAddress: 'BGC, Taguig City', defaultAtc: 'WC160', paymentTermsDays: 45, createdBy: 'system' }),
      new Vendor({ id: `${tid}-v03`, vendorCode: 'V-MERALCO', vendorName: 'Manila Electric Company', tradeName: 'Meralco Industrial', tin: '000-101-500-000', registeredAddress: 'Ortigas Center, Pasig City', defaultAtc: 'WC158', paymentTermsDays: 15, createdBy: 'system' }),
    ];
    this.vendors.set(tid, vens);

    // 4. Customers
    const custs = [
      new Customer({ id: `${tid}-c01`, customerCode: 'C-BOYSEN', customerName: 'Pacific Paint (Boysen) Philippines, Inc.', tradeName: 'Boysen Paints', tin: '000-778-899-000', billingAddress: '292 D. Tuazon St, Quezon City', creditLimit: 2500000, paymentTermsDays: 60, createdBy: 'system' }),
      new Customer({ id: `${tid}-c02`, customerCode: 'C-DAVIES', customerName: 'Charter Chemical & Coating Corp', tradeName: 'Davies Paints', tin: '000-998-112-000', billingAddress: 'Mercedes Ave, Pasig City', creditLimit: 1500000, paymentTermsDays: 30, createdBy: 'system' }),
      new Customer({ id: `${tid}-c03`, customerCode: 'C-METRO', customerName: 'Metro Pacific Resins & Coatings Inc', tradeName: 'Metro Coatings', tin: '000-334-455-000', billingAddress: 'Valenzuela Industrial Park', creditLimit: 800000, paymentTermsDays: 30, createdBy: 'system' }),
    ];
    this.customers.set(tid, custs);

    // 5. Bank Accounts
    const banks = [
      new BankAccount({ id: `${tid}-bk01`, bankCode: 'BDO', bankName: 'Banco De Oro - Operating Account', accountNumber: '00123-45678-9', glAccountNumber: '1010-000', chequeMarginTopMm: 0, chequeMarginLeftMm: 0, createdBy: 'system' }),
      new BankAccount({ id: `${tid}-bk02`, bankCode: 'BPI', bankName: 'Bank of the Philippine Islands - Commercial', accountNumber: '00321-98765-4', glAccountNumber: '1010-000', chequeMarginTopMm: 1.5, chequeMarginLeftMm: 0.5, createdBy: 'system' }),
      new BankAccount({ id: `${tid}-bk03`, bankCode: 'METROBANK', bankName: 'Metropolitan Bank & Trust Company - Payroll', accountNumber: '00987-12345-6', glAccountNumber: '1010-000', chequeMarginTopMm: -0.5, chequeMarginLeftMm: 1.0, createdBy: 'system' }),
    ];
    this.bankAccounts.set(tid, banks);

    // 6. Fiscal Periods
    const periods = [
      new FiscalPeriod({ id: `${tid}-fp-2026-08`, fiscalYear: 2026, fiscalMonth: 8, periodName: 'August 2026', dateFrom: new Date('2026-08-01T00:00:00Z'), dateTo: new Date('2026-08-31T23:59:59Z'), status: 'CLOSED', closedBy: 'usr-admin-01', closedAt: new Date('2026-09-01T08:00:00Z'), createdBy: 'system' }),
      new FiscalPeriod({ id: `${tid}-fp-2026-09`, fiscalYear: 2026, fiscalMonth: 9, periodName: 'September 2026', dateFrom: new Date('2026-09-01T00:00:00Z'), dateTo: new Date('2026-09-30T23:59:59Z'), status: 'OPEN', createdBy: 'system' }),
      new FiscalPeriod({ id: `${tid}-fp-2026-10`, fiscalYear: 2026, fiscalMonth: 10, periodName: 'October 2026', dateFrom: new Date('2026-10-01T00:00:00Z'), dateTo: new Date('2026-10-31T23:59:59Z'), status: 'OPEN', createdBy: 'system' }),
    ];
    this.fiscalPeriods.set(tid, periods);

    // 7. Seed Sample Journal Vouchers
    const jv1 = new JournalVoucher(`${tid}-jv01`, tid, `JV-2026-${tid}-001`, new Date('2026-09-10T10:00:00Z'), 'usr-acct-01', 'Monthly plant utilities and power consumption accrual');
    jv1.addDebitLine('l1', 'acc-6010', '6010-000', 'Plant Utilities', Money.from(145000), 'Meralco electric bill accrual', '03-PRD');
    jv1.addCreditLine('l2', 'acc-2010', '2010-000', 'Accounts Payable', Money.from(145000), 'Meralco September billing', '03-PRD');
    jv1.submit();
    jv1.review('usr-checker-01');
    jv1.approve('usr-admin-01');
    jv1.postToLedger('usr-admin-01', periods[1]);

    const jv2 = new JournalVoucher(`${tid}-jv02`, tid, `JV-2026-${tid}-002`, new Date('2026-09-15T14:30:00Z'), 'usr-acct-01', 'Raw materials acquisition and supplies delivery');
    jv2.addDebitLine('l1', 'acc-1050', '1050-000', 'Merchandise Inventory', Money.from(380000), 'Petron solvents delivery', '03-PRD');
    jv2.addCreditLine('l2', 'acc-2010', '2010-000', 'Accounts Payable', Money.from(380000), 'Petron AP Invoice #8841', '03-PRD');
    jv2.submit();
    jv2.review('usr-checker-01');

    const jv3 = new JournalVoucher(`${tid}-jv03`, tid, `JV-2026-${tid}-003`, new Date('2026-09-18T09:15:00Z'), 'usr-acct-01', 'Laboratory chemical reagents purchase');
    jv3.addDebitLine('l1', 'acc-6000', '6000-000', 'Salaries & Wages Expense', Money.from(45000), 'Lab supplies', '04-QAC');
    jv3.addCreditLine('l2', 'acc-1010', '1010-000', 'Cash in Bank', Money.from(45000), 'Check payment', '04-QAC');

    this.journalVouchers.set(tid, [jv1, jv2, jv3]);

    // 8. General Ledger Postings
    const glh1: GlHeaderRecord = {
      id: `glh-${tid}-01`,
      batchNumber: `GL-2026-${jv1.documentNumber}`,
      documentType: 'JV',
      documentNumber: jv1.documentNumber,
      documentDate: jv1.documentDate,
      fiscalPeriodId: periods[1].id,
      totalDebit: 145000,
      totalCredit: 145000,
      postedBy: 'usr-admin-01',
      postedAt: new Date('2026-09-10T11:00:00Z'),
    };
    this.glHeaders.set(tid, [glh1]);

    const gll1: GlLineRecord = {
      id: `gll-${tid}-01`,
      glHeaderId: glh1.id,
      lineNumber: 1,
      accountNumber: '6010-000',
      costCenterCode: '03-PRD',
      debitAmount: 145000,
      creditAmount: 0,
      description: 'Meralco power consumption',
    };
    const gll2: GlLineRecord = {
      id: `gll-${tid}-02`,
      glHeaderId: glh1.id,
      lineNumber: 2,
      accountNumber: '2010-000',
      costCenterCode: '03-PRD',
      debitAmount: 0,
      creditAmount: 145000,
      description: 'Meralco September billing',
    };
    this.glLines.set(tid, [gll1, gll2]);

    // 9. Employees per Tenant
    const emps = [
      new Employee({
        id: `${tid}-emp-01`,
        tenantId: tid,
        employeeCode: `EMP-${tid}-001`,
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        position: 'Senior Chemical Engineer',
        department: 'Manufacturing',
        tin: '123-456-789-000',
        sssNumber: '03-1234567-8',
        philHealthNumber: '12-345678901-2',
        pagIbigNumber: '1234-5678-9012',
        monthlyBasicSalary: 45000,
        dailyRate: 1730.77,
        employmentStatus: 'REGULAR',
        hireDate: '2021-03-15',
      }),
      new Employee({
        id: `${tid}-emp-02`,
        tenantId: tid,
        employeeCode: `EMP-${tid}-002`,
        firstName: 'Maria',
        lastName: 'Santos',
        position: 'Plant Operations Manager',
        department: 'Operations',
        tin: '234-567-890-000',
        sssNumber: '03-9876543-2',
        philHealthNumber: '12-987654321-0',
        pagIbigNumber: '2345-6789-0123',
        monthlyBasicSalary: 75000,
        dailyRate: 2884.62,
        employmentStatus: 'REGULAR',
        hireDate: '2019-06-01',
      }),
      new Employee({
        id: `${tid}-emp-03`,
        tenantId: tid,
        employeeCode: `EMP-${tid}-003`,
        firstName: 'Carlos',
        lastName: 'Reyes',
        position: 'Materials & Warehouse Lead',
        department: 'Logistics',
        tin: '345-678-901-000',
        sssNumber: '03-4567890-1',
        philHealthNumber: '12-456789012-3',
        pagIbigNumber: '3456-7890-1234',
        monthlyBasicSalary: 32000,
        dailyRate: 1230.77,
        employmentStatus: 'REGULAR',
        hireDate: '2022-11-10',
      }),
      new Employee({
        id: `${tid}-emp-04`,
        tenantId: tid,
        employeeCode: `EMP-${tid}-004`,
        firstName: 'Elena',
        lastName: 'Gomez',
        position: 'Treasury & Cashier Specialist',
        department: 'Finance',
        tin: '456-789-012-000',
        sssNumber: '03-6789012-3',
        philHealthNumber: '12-678901234-5',
        pagIbigNumber: '4567-8901-2345',
        monthlyBasicSalary: 28000,
        dailyRate: 1076.92,
        employmentStatus: 'REGULAR',
        hireDate: '2023-02-20',
      }),
    ];
    this.employees.set(tid, emps);

    // 10. Seed Payroll Run
    this.payrollRuns.set(tid, []);
  }

  public loadSampleData(): void {
    this.seedUsers();
    this.seedAccessMatrix();
    this.seedAllTenants();
    this.recordAudit('system', 'System', 'ALL', 'LOAD_SAMPLE_DATA', 'admin', 'Restored complete enterprise demo sample data across all corporate tenants.');
  }

  public clearAllData(preserveSystemConfig = true): void {
    const tenants = ['8100', '8200', '8300'];
    for (const tid of tenants) {
      this.journalVouchers.set(tid, []);
      this.glHeaders.set(tid, []);
      this.glLines.set(tid, []);
      this.payrollRuns.set(tid, []);
      if (!preserveSystemConfig) {
        this.vendors.set(tid, []);
        this.customers.set(tid, []);
        this.employees.set(tid, []);
      }
    }
    this.recordAudit('system', 'System', 'ALL', 'CLEAR_DATA', 'admin', 'Cleared transactional vouchers and active entries. System reset to blank operational state.');
  }

  public recordAudit(
    tenantId: string,
    entityType: string,
    entityId: string,
    action: string,
    actor: string,
    details: string
  ): void {
    this.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      entityType,
      entityId,
      action,
      actor,
      timestamp: new Date().toISOString(),
      details,
    });
  }
}

// Global Singleton for runtime persistence across Next.js API requests and worker cycles
const globalDataStore = globalThis as unknown as { __AOS100_STORE__?: TenantDataStore };
export const tenantStore = globalDataStore.__AOS100_STORE__ || new TenantDataStore();
if (!globalDataStore.__AOS100_STORE__) {
  globalDataStore.__AOS100_STORE__ = tenantStore;
}
