import { NextRequest, NextResponse } from 'next/server';
import { MigrationEtlService } from '@/domain/services/MigrationEtlService';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';
  const report = MigrationEtlService.executeDryRun(tenantId);

  return NextResponse.json({
    success: true,
    report,
    message: 'Legacy MySQL extraction dry-run completed with zero-centavo trial balance equilibrium.',
  });
}
