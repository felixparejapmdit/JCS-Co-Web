import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';

export async function GET() {
  return NextResponse.json({
    success: true,
    accessMatrix: tenantStore.accessMatrix,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessMatrix } = body;

    if (accessMatrix) {
      tenantStore.accessMatrix = accessMatrix;
      tenantStore.recordAudit(
        'system',
        'Security',
        'ACCESS_MATRIX',
        'UPDATE_PERMISSIONS',
        'admin',
        'Updated Role-Based Access Control matrix permissions'
      );
    }

    return NextResponse.json({
      success: true,
      accessMatrix: tenantStore.accessMatrix,
      message: 'Access control permissions updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
