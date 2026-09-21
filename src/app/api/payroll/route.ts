import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';
import { Employee, PayrollCalculator, PayrollItem, PayrollRunProps } from '@/domain/entities/Payroll';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';
  const employees = tenantStore.employees.get(tenantId) || [];
  const payrollRuns = tenantStore.payrollRuns.get(tenantId) || [];

  return NextResponse.json({
    success: true,
    tenantId,
    employees,
    payrollRuns,
  });
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || '8100';
    const body = await req.json();
    const { action = 'CALCULATE', periodName = 'September 2026 (1st Half)', dateFrom = '2026-09-01', dateTo = '2026-09-15', overtimeHours = {}, allowances = {} } = body;

    const employees = tenantStore.employees.get(tenantId) || [];

    if (action === 'CALCULATE' || action === 'PROCESS_RUN') {
      const items: PayrollItem[] = employees.map((emp) => {
        const ot = overtimeHours[emp.id] || 0;
        const allow = allowances[emp.id] || 0;
        return PayrollCalculator.calculateEmployeePayroll(emp, ot, allow);
      });

      const totalGrossPay = Math.round(items.reduce((sum, it) => sum + it.grossPay, 0) * 100) / 100;
      const totalDeductions = Math.round(items.reduce((sum, it) => sum + it.totalDeductions, 0) * 100) / 100;
      const totalNetPay = Math.round(items.reduce((sum, it) => sum + it.netPay, 0) * 100) / 100;
      const totalEmployerCost = Math.round(
        items.reduce((sum, it) => sum + (it.sssEmployer + it.philHealthEmployer + it.pagIbigEmployer), 0) * 100
      ) / 100;

      const payrollRun: PayrollRunProps = {
        id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenantId,
        payrollNumber: `PR-2026-${tenantId}-${Math.floor(100 + Math.random() * 900)}`,
        periodName,
        dateFrom,
        dateTo,
        status: action === 'PROCESS_RUN' ? 'APPROVED' : 'DRAFT',
        items,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
        totalEmployerCost,
        processedBy: body.processedBy || 'Maria Santos, CPA',
        processedAt: new Date().toISOString(),
      };

      if (action === 'PROCESS_RUN') {
        const runs = tenantStore.payrollRuns.get(tenantId) || [];
        runs.unshift(payrollRun);
        tenantStore.payrollRuns.set(tenantId, runs);

        tenantStore.recordAudit(
          tenantId,
          'Payroll',
          payrollRun.id,
          'PROCESS_PAYROLL',
          body.processedBy || 'Maria Santos, CPA',
          `Processed payroll ${payrollRun.payrollNumber} (${payrollRun.periodName}) for ${items.length} employees. Total Net: PhP ${totalNetPay.toLocaleString()}`
        );
      }

      return NextResponse.json({
        success: true,
        payrollRun,
      });
    }

    if (action === 'DISBURSE_CV') {
      // Create Check Voucher disbursement
      const runId = body.payrollRunId;
      const runs = tenantStore.payrollRuns.get(tenantId) || [];
      const run = runs.find((r) => r.id === runId);

      if (!run) {
        return NextResponse.json({ success: false, error: 'Payroll run not found' }, { status: 404 });
      }

      run.status = 'DISBURSED';
      run.disbursementVoucherId = `CV-PAYROLL-${tenantId}-${Date.now().toString().slice(-4)}`;

      tenantStore.recordAudit(
        tenantId,
        'Payroll',
        run.id,
        'DISBURSE_PAYROLL',
        body.processedBy || 'Maria Santos, CPA',
        `Disbursed payroll ${run.payrollNumber} via Cheque Voucher ${run.disbursementVoucherId}`
      );

      return NextResponse.json({
        success: true,
        message: `Payroll disbursed successfully via Check Voucher ${run.disbursementVoucherId}`,
        payrollRun: run,
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported payroll action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
