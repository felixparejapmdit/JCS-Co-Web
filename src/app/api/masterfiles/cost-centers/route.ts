import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';
import { CostCenter } from '@/domain/entities/CostCenter';
import { DomainException } from '@/domain/common/DomainException';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';
  const ccs = tenantStore.costCenters.get(tenantId) || [];

  const serialized = ccs.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    division: c.division,
    plantLocation: c.plantLocation,
    isActive: c.isActive,
  }));

  return NextResponse.json({ success: true, tenantId, data: serialized });
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || '8100';
    const body = await req.json();

    const cc = new CostCenter({
      id: `${tenantId}-cc-${Date.now()}`,
      code: body.code,
      name: body.name,
      division: body.division || 'General',
      plantLocation: body.plantLocation || 'Valenzuela Plant',
      createdBy: body.actor || 'admin',
    });

    const list = tenantStore.costCenters.get(tenantId) || [];
    if (list.some((c) => c.code.toUpperCase() === cc.code.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: `Cost center with code '${cc.code}' already exists.` },
        { status: 409 }
      );
    }

    list.push(cc);
    tenantStore.costCenters.set(tenantId, list);
    tenantStore.recordAudit(
      tenantId,
      'CostCenter',
      cc.id,
      'CREATE',
      body.actor || 'admin',
      `Registered cost center ${cc.code} (${cc.name})`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: cc.id,
          code: cc.code,
          name: cc.name,
          division: cc.division,
          plantLocation: cc.plantLocation,
          isActive: cc.isActive,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof DomainException ? err.message : (err as Error).message;
    return NextResponse.json({ success: false, error: msg }, { status: 422 });
  }
}
