import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';
  const periods = tenantStore.fiscalPeriods.get(tenantId) || [];

  const serialized = periods.map((p) => ({
    id: p.id,
    fiscalYear: p.fiscalYear,
    fiscalMonth: p.fiscalMonth,
    periodName: p.periodName,
    dateFrom: p.dateFrom.toISOString().slice(0, 10),
    dateTo: p.dateTo.toISOString().slice(0, 10),
    status: p.status,
    closedBy: p.closedBy,
    closedAt: p.closedAt?.toISOString(),
  }));

  const currentOpenPeriod = serialized.find((p) => p.status === 'OPEN');

  return NextResponse.json({
    success: true,
    tenantId,
    currentOpenPeriod,
    data: serialized,
  });
}
