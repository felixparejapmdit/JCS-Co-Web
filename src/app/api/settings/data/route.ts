import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'LOAD_SAMPLE') {
      tenantStore.loadSampleData();
      return NextResponse.json({
        success: true,
        message: 'Sample data successfully loaded across all three corporate tenants (8100 JCS, 8200 APF, 8300 Chemag).',
      });
    }

    if (action === 'START_EMPTY') {
      const preserveMasterfiles = body.preserveMasterfiles ?? true;
      tenantStore.clearAllData(preserveMasterfiles);
      return NextResponse.json({
        success: true,
        message: 'Data successfully cleared. The system is initialized to a fresh, clean operational state.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Supported: LOAD_SAMPLE, START_EMPTY' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
