import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';
import { PeriodClosingService } from '@/domain/services/PeriodClosingService';
import { DomainException } from '@/domain/common/DomainException';
import { DocumentStatus } from '@/domain/enums/DocumentStatus';

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || '8100';
    const body = await req.json();
    const { periodId, action, actor, reason } = body;

    const periods = tenantStore.fiscalPeriods.get(tenantId) || [];
    const period = periods.find((p) => p.id === periodId);

    if (!period) {
      return NextResponse.json({ success: false, error: `Period '${periodId}' not found.` }, { status: 404 });
    }

    if (action === 'CLOSE') {
      // Find unposted vouchers in this period
      const vouchers = tenantStore.journalVouchers.get(tenantId) || [];
      const unposted = vouchers
        .filter(
          (v) =>
            v.status !== DocumentStatus.Posted &&
            v.status !== DocumentStatus.Void &&
            v.status !== DocumentStatus.Cancelled
        )
        .map((v) => ({ voucherNumber: v.documentNumber, status: v.status }));

      PeriodClosingService.assertEligibleForMonthEndClose(period, unposted);

      period.close(actor || 'usr-admin-01');

      tenantStore.recordAudit(
        tenantId,
        'FiscalPeriod',
        period.id,
        'CLOSE_PERIOD',
        actor || 'usr-admin-01',
        `Closed fiscal accounting period ${period.periodName}`
      );

      return NextResponse.json({
        success: true,
        message: `Fiscal period '${period.periodName}' successfully closed.`,
        period: { id: period.id, status: period.status, closedBy: period.closedBy, closedAt: period.closedAt },
      });
    } else if (action === 'REOPEN') {
      period.reopen(actor || 'usr-admin-01', reason || 'Adjustment authorized by Finance Head');

      tenantStore.recordAudit(
        tenantId,
        'FiscalPeriod',
        period.id,
        'REOPEN_PERIOD',
        actor || 'usr-admin-01',
        `Reopened fiscal period ${period.periodName}: ${reason}`
      );

      return NextResponse.json({
        success: true,
        message: `Fiscal period '${period.periodName}' reopened.`,
        period: { id: period.id, status: period.status },
      });
    } else {
      return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof DomainException ? err.message : (err as Error).message;
    return NextResponse.json({ success: false, error: msg }, { status: 422 });
  }
}
