import { BaseEntity } from '../common/BaseEntity';
import { Money } from '../value-objects/Money';

export interface EmployeeProps {
  id: string;
  tenantId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  tin: string;
  sssNumber: string;
  philHealthNumber: string;
  pagIbigNumber: string;
  monthlyBasicSalary: number;
  dailyRate: number;
  employmentStatus: 'REGULAR' | 'PROBATIONARY' | 'CONTRACTUAL';
  hireDate: string;
}

export class Employee extends BaseEntity {
  public tenantId: string;
  public employeeCode: string;
  public firstName: string;
  public lastName: string;
  public position: string;
  public department: string;
  public tin: string;
  public sssNumber: string;
  public philHealthNumber: string;
  public pagIbigNumber: string;
  public monthlyBasicSalary: number;
  public dailyRate: number;
  public employmentStatus: 'REGULAR' | 'PROBATIONARY' | 'CONTRACTUAL';
  public hireDate: string;

  constructor(props: EmployeeProps) {
    super(props.id, 'system');
    this.tenantId = props.tenantId;
    this.employeeCode = props.employeeCode;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.position = props.position;
    this.department = props.department;
    this.tin = props.tin;
    this.sssNumber = props.sssNumber;
    this.philHealthNumber = props.philHealthNumber;
    this.pagIbigNumber = props.pagIbigNumber;
    this.monthlyBasicSalary = props.monthlyBasicSalary;
    this.dailyRate = props.dailyRate;
    this.employmentStatus = props.employmentStatus;
    this.hireDate = props.hireDate;
  }

  get fullName(): string {
    return `${this.lastName}, ${this.firstName}`;
  }
}

export interface PayrollItem {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  position: string;
  department: string;
  monthlyRate: number;
  basicPay: number;
  overtimePay: number;
  allowances: number;
  grossPay: number;
  sssEmployee: number;
  sssEmployer: number;
  philHealthEmployee: number;
  philHealthEmployer: number;
  pagIbigEmployee: number;
  pagIbigEmployer: number;
  totalStatutoryDeductions: number;
  taxableIncome: number;
  withholdingTax: number;
  totalDeductions: number;
  netPay: number;
}

export interface PayrollRunProps {
  id: string;
  tenantId: string;
  payrollNumber: string;
  periodName: string;
  dateFrom: string;
  dateTo: string;
  status: 'DRAFT' | 'APPROVED' | 'DISBURSED';
  items: PayrollItem[];
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  totalEmployerCost: number;
  processedBy: string;
  processedAt: string;
  disbursementVoucherId?: string;
}

export class PayrollCalculator {
  /**
   * 2026 Philippine SSS Contribution Schedule
   * Total 14%: 4.5% Employee, 9.5% Employer
   * Capped at Monthly Salary Credit (MSC) of PhP 30,000.00
   */
  public static computeSss(monthlySalary: number): { employee: number; employer: number } {
    const msc = Math.min(Math.max(monthlySalary, 4000), 30000);
    const employeeMonthly = Math.round(msc * 0.045 * 100) / 100;
    const employerMonthly = Math.round(msc * 0.095 * 100) / 100;

    return {
      employee: Math.round((employeeMonthly / 2) * 100) / 100,
      employer: Math.round((employerMonthly / 2) * 100) / 100,
    };
  }

  /**
   * 2026 Philippine PhilHealth Contribution (5% total, 2.5% EE / 2.5% ER)
   * Floor: PhP 10,000 | Ceiling: PhP 100,000
   */
  public static computePhilHealth(monthlySalary: number): { employee: number; employer: number } {
    const base = Math.min(Math.max(monthlySalary, 10000), 100000);
    const monthlyPremium = Math.round(base * 0.05 * 100) / 100;
    const share = Math.round((monthlyPremium / 2) * 100) / 100;

    return {
      employee: Math.round((share / 2) * 100) / 100,
      employer: Math.round((share / 2) * 100) / 100,
    };
  }

  /**
   * 2026 Pag-IBIG (HDMF) Contribution
   * Mandatory PhP 200.00 / month for employees earning > PhP 1,500
   */
  public static computePagIbig(monthlySalary: number): { employee: number; employer: number } {
    const monthlyEe = monthlySalary >= 1500 ? 200.0 : 100.0;
    const monthlyEr = 200.0;

    return {
      employee: Math.round((monthlyEe / 2) * 100) / 100,
      employer: Math.round((monthlyEr / 2) * 100) / 100,
    };
  }

  /**
   * Philippine BIR TRAIN Law Semi-Monthly Withholding Tax on Compensation
   */
  public static computeWithholdingTaxSemiMonthly(taxableIncome: number): number {
    if (taxableIncome <= 10417) {
      return 0.0;
    }
    if (taxableIncome <= 16666) {
      return Math.round((taxableIncome - 10417) * 0.15 * 100) / 100;
    }
    if (taxableIncome <= 33332) {
      return Math.round((937.50 + (taxableIncome - 16667) * 0.20) * 100) / 100;
    }
    if (taxableIncome <= 83332) {
      return Math.round((4270.70 + (taxableIncome - 33333) * 0.25) * 100) / 100;
    }
    if (taxableIncome <= 333332) {
      return Math.round((16770.70 + (taxableIncome - 83333) * 0.30) * 100) / 100;
    }
    return Math.round((91770.70 + (taxableIncome - 333333) * 0.35) * 100) / 100;
  }

  public static calculateEmployeePayroll(
    employee: Employee,
    overtimeHours: number = 0,
    allowances: number = 0
  ): PayrollItem {
    const basicPay = Math.round((employee.monthlyBasicSalary / 2) * 100) / 100;
    const hourlyRate = (employee.monthlyBasicSalary / 26) / 8;
    const overtimePay = Math.round(overtimeHours * hourlyRate * 1.25 * 100) / 100;
    const grossPay = Math.round((basicPay + overtimePay + allowances) * 100) / 100;

    const sss = this.computeSss(employee.monthlyBasicSalary);
    const philHealth = this.computePhilHealth(employee.monthlyBasicSalary);
    const pagIbig = this.computePagIbig(employee.monthlyBasicSalary);

    const totalStatutoryDeductions = Math.round(
      (sss.employee + philHealth.employee + pagIbig.employee) * 100
    ) / 100;

    const taxableIncome = Math.max(0, Math.round((grossPay - totalStatutoryDeductions) * 100) / 100);
    const withholdingTax = this.computeWithholdingTaxSemiMonthly(taxableIncome);

    const totalDeductions = Math.round((totalStatutoryDeductions + withholdingTax) * 100) / 100;
    const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

    return {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.fullName,
      position: employee.position,
      department: employee.department,
      monthlyRate: employee.monthlyBasicSalary,
      basicPay,
      overtimePay,
      allowances,
      grossPay,
      sssEmployee: sss.employee,
      sssEmployer: sss.employer,
      philHealthEmployee: philHealth.employee,
      philHealthEmployer: philHealth.employer,
      pagIbigEmployee: pagIbig.employee,
      pagIbigEmployer: pagIbig.employer,
      totalStatutoryDeductions,
      taxableIncome,
      withholdingTax,
      totalDeductions,
      netPay,
    };
  }
}
