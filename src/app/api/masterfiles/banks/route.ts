import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';
import { BankAccount } from '@/domain/entities/BankAccount';
import { DomainException } from '@/domain/common/DomainException';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';
  const banks = tenantStore.bankAccounts.get(tenantId) || [];

  const serialized = banks.map((b) => ({
    id: b.id,
    bankCode: b.bankCode,
    bankName: b.bankName,
    accountNumber: b.accountNumber,
    glAccountNumber: b.glAccountNumber,
    currency: b.currency,
    chequeMarginTopMm: b.chequeMarginTopMm,
    chequeMarginLeftMm: b.chequeMarginLeftMm,
    isActive: b.isActive,
    calibratedCoordinates: b.getCalibratedChequeCoordinates(),
  }));

  return NextResponse.json({ success: true, tenantId, data: serialized });
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || '8100';
    const body = await req.json();

    const bank = new BankAccount({
      id: `${tenantId}-bk-${Date.now()}`,
      bankCode: body.bankCode,
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      glAccountNumber: body.glAccountNumber || '1010-000',
      chequeMarginTopMm: Number(body.chequeMarginTopMm || 0),
      chequeMarginLeftMm: Number(body.chequeMarginLeftMm || 0),
      createdBy: body.actor || 'admin',
    });

    const list = tenantStore.bankAccounts.get(tenantId) || [];
    if (list.some((b) => b.accountNumber === bank.accountNumber)) {
      return NextResponse.json(
        { success: false, error: `Bank account '${bank.accountNumber}' already exists.` },
        { status: 409 }
      );
    }

    list.push(bank);
    tenantStore.bankAccounts.set(tenantId, list);
    tenantStore.recordAudit(
      tenantId,
      'BankAccount',
      bank.id,
      'CREATE',
      body.actor || 'admin',
      `Registered bank account ${bank.bankCode} (${bank.accountNumber}) with cheque calibration [${bank.chequeMarginTopMm}mm, ${bank.chequeMarginLeftMm}mm]`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: bank.id,
          bankCode: bank.bankCode,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          glAccountNumber: bank.glAccountNumber,
          calibratedCoordinates: bank.getCalibratedChequeCoordinates(),
          isActive: bank.isActive,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof DomainException ? err.message : (err as Error).message;
    return NextResponse.json({ success: false, error: msg }, { status: 422 });
  }
}
