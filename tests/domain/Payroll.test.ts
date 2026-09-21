import { describe, it, expect } from 'vitest';
import { Employee, PayrollCalculator } from '../../src/domain/entities/Payroll';

describe('Philippine Payroll & Statutory Calculations', () => {
  const testEmp = new Employee({
    id: 'emp-01',
    tenantId: '8100',
    employeeCode: 'EMP-8100-001',
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
    hireDate: '2022-01-15',
  });

  it('correctly calculates semi-monthly SSS with MSC cap of PhP 30,000', () => {
    // Salary is 45,000, MSC is capped at 30,000
    // Monthly SSS EE = 30,000 * 0.045 = 1,350
    // Semi-monthly = 675.00
    const sss = PayrollCalculator.computeSss(45000);
    expect(sss.employee).toBe(675.0);
    expect(sss.employer).toBe(1425.0); // 30,000 * 0.095 = 2,850 / 2 = 1,425.00
  });

  it('correctly calculates semi-monthly PhilHealth 2.5% employee share', () => {
    // 45,000 base * 0.05 = 2,250 monthly
    // EE share = 1,125 monthly -> 562.50 semi-monthly
    const ph = PayrollCalculator.computePhilHealth(45000);
    expect(ph.employee).toBe(562.5);
    expect(ph.employer).toBe(562.5);
  });

  it('correctly calculates semi-monthly Pag-IBIG PhP 100 employee deduction', () => {
    const hdmf = PayrollCalculator.computePagIbig(45000);
    expect(hdmf.employee).toBe(100.0);
    expect(hdmf.employer).toBe(100.0);
  });

  it('computes complete semi-monthly payroll item satisfying Gross - Deductions = Net Pay', () => {
    const item = PayrollCalculator.calculateEmployeePayroll(testEmp, 4, 1500);
    expect(item.basicPay).toBe(22500);
    expect(item.allowances).toBe(1500);
    expect(item.grossPay).toBeGreaterThan(item.basicPay);
    expect(item.totalDeductions).toBe(
      Math.round((item.totalStatutoryDeductions + item.withholdingTax) * 100) / 100
    );
    expect(item.netPay).toBe(
      Math.round((item.grossPay - item.totalDeductions) * 100) / 100
    );
  });
});
