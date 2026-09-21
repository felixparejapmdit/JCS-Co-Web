import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';
import { Vendor } from '@/domain/entities/Vendor';
import { DomainException } from '@/domain/common/DomainException';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';
  const vendors = tenantStore.vendors.get(tenantId) || [];

  const serialized = vendors.map((v) => ({
    id: v.id,
    vendorCode: v.vendorCode,
    vendorName: v.vendorName,
    tradeName: v.tradeName,
    tin: v.tin.formattedValue,
    registeredAddress: v.registeredAddress,
    defaultAtc: v.defaultAtc,
    paymentTermsDays: v.paymentTermsDays,
    isVatRegistered: v.isVatRegistered,
    isActive: v.isActive,
  }));

  return NextResponse.json({ success: true, tenantId, data: serialized });
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || '8100';
    const body = await req.json();

    const vendor = new Vendor({
      id: `${tenantId}-v-${Date.now()}`,
      vendorCode: body.vendorCode,
      vendorName: body.vendorName,
      tradeName: body.tradeName,
      tin: body.tin,
      registeredAddress: body.registeredAddress,
      defaultAtc: body.defaultAtc || 'WC160',
      paymentTermsDays: Number(body.paymentTermsDays || 30),
      isVatRegistered: body.isVatRegistered !== false,
      createdBy: body.actor || 'admin',
    });

    const list = tenantStore.vendors.get(tenantId) || [];
    if (list.some((v) => v.vendorCode === vendor.vendorCode)) {
      return NextResponse.json(
        { success: false, error: `Vendor code '${vendor.vendorCode}' is already registered.` },
        { status: 409 }
      );
    }

    list.push(vendor);
    tenantStore.vendors.set(tenantId, list);
    tenantStore.recordAudit(
      tenantId,
      'Vendor',
      vendor.id,
      'CREATE',
      body.actor || 'admin',
      `Registered vendor ${vendor.vendorCode} (${vendor.vendorName}) TIN: ${vendor.tin.formattedValue}`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: vendor.id,
          vendorCode: vendor.vendorCode,
          vendorName: vendor.vendorName,
          tin: vendor.tin.formattedValue,
          defaultAtc: vendor.defaultAtc,
          paymentTermsDays: vendor.paymentTermsDays,
          isActive: vendor.isActive,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof DomainException ? err.message : (err as Error).message;
    return NextResponse.json({ success: false, error: msg }, { status: 422 });
  }
}
