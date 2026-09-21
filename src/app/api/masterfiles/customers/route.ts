import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';
import { Customer } from '@/domain/entities/Customer';
import { DomainException } from '@/domain/common/DomainException';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';
  const customers = tenantStore.customers.get(tenantId) || [];

  const serialized = customers.map((c) => ({
    id: c.id,
    customerCode: c.customerCode,
    customerName: c.customerName,
    tradeName: c.tradeName,
    tin: c.tin.formattedValue,
    billingAddress: c.billingAddress,
    creditLimit: c.creditLimit.amount,
    creditLimitFormatted: c.creditLimit.format(),
    paymentTermsDays: c.paymentTermsDays,
    isActive: c.isActive,
  }));

  return NextResponse.json({ success: true, tenantId, data: serialized });
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || '8100';
    const body = await req.json();

    const customer = new Customer({
      id: `${tenantId}-c-${Date.now()}`,
      customerCode: body.customerCode,
      customerName: body.customerName,
      tradeName: body.tradeName,
      tin: body.tin,
      billingAddress: body.billingAddress,
      creditLimit: Number(body.creditLimit || 0),
      paymentTermsDays: Number(body.paymentTermsDays || 30),
      createdBy: body.actor || 'admin',
    });

    const list = tenantStore.customers.get(tenantId) || [];
    if (list.some((c) => c.customerCode === customer.customerCode)) {
      return NextResponse.json(
        { success: false, error: `Customer code '${customer.customerCode}' already exists.` },
        { status: 409 }
      );
    }

    list.push(customer);
    tenantStore.customers.set(tenantId, list);
    tenantStore.recordAudit(
      tenantId,
      'Customer',
      customer.id,
      'CREATE',
      body.actor || 'admin',
      `Registered customer ${customer.customerCode} (${customer.customerName}) Limit: ${customer.creditLimit.format()}`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: customer.id,
          customerCode: customer.customerCode,
          customerName: customer.customerName,
          tin: customer.tin.formattedValue,
          creditLimit: customer.creditLimit.amount,
          creditLimitFormatted: customer.creditLimit.format(),
          paymentTermsDays: customer.paymentTermsDays,
          isActive: customer.isActive,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof DomainException ? err.message : (err as Error).message;
    return NextResponse.json({ success: false, error: msg }, { status: 422 });
  }
}
