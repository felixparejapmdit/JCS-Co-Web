import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';
import { Account, AccountType } from '@/domain/entities/Account';
import { DomainException } from '@/domain/common/DomainException';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';
  const accounts = tenantStore.accounts.get(tenantId) || [];

  const serialized = accounts.map((acc) => ({
    id: acc.id,
    accountNumber: acc.accountNumber,
    accountName: acc.accountName,
    accountType: acc.accountType,
    normalBalance: acc.normalBalance,
    parentAccountId: acc.parentAccountId,
    isHeader: acc.isHeader,
    isActive: acc.isActive,
  }));

  return NextResponse.json({ success: true, tenantId, data: serialized });
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || '8100';
    const body = await req.json();

    const newAccount = new Account({
      id: `${tenantId}-${body.accountNumber.replace(/[^0-9]/g, '')}`,
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      accountType: body.accountType as AccountType,
      parentAccountId: body.parentAccountId,
      isHeader: Boolean(body.isHeader),
      createdBy: body.actor || 'admin',
    });

    const list = tenantStore.accounts.get(tenantId) || [];
    if (list.some((a) => a.accountNumber === newAccount.accountNumber)) {
      return NextResponse.json(
        { success: false, error: `Account '${newAccount.accountNumber}' already exists.` },
        { status: 409 }
      );
    }

    list.push(newAccount);
    tenantStore.accounts.set(tenantId, list);
    tenantStore.recordAudit(
      tenantId,
      'Account',
      newAccount.id,
      'CREATE',
      body.actor || 'admin',
      `Created ${newAccount.accountType} account ${newAccount.accountNumber} - ${newAccount.accountName}`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newAccount.id,
          accountNumber: newAccount.accountNumber,
          accountName: newAccount.accountName,
          accountType: newAccount.accountType,
          normalBalance: newAccount.normalBalance,
          isHeader: newAccount.isHeader,
          isActive: newAccount.isActive,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof DomainException ? err.message : (err as Error).message;
    return NextResponse.json({ success: false, error: msg }, { status: 422 });
  }
}
