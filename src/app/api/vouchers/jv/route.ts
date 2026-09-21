import { NextRequest, NextResponse } from 'next/server';
import { JournalVoucher } from '@/domain/entities/JournalVoucher';
import { Money } from '@/domain/value-objects/Money';
import { DomainException } from '@/domain/common/DomainException';
import { tenantStore } from '@/services/TenantDataStore';

interface JVLinePayload {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
  costCenterId?: string;
}

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';
  const vouchers = tenantStore.journalVouchers.get(tenantId) || [];

  const serialized = vouchers.map((v) => ({
    id: v.id,
    documentNumber: v.documentNumber,
    documentDate: v.documentDate.toISOString().slice(0, 10),
    explanation: v.remarks,
    status: v.status,
    totalDebit: v.getTotalDebit().amount,
    totalCredit: v.getTotalCredit().amount,
    isBalanced: v.isBalanced(),
    createdBy: v.createdBy,
    reviewedBy: v.reviewedBy,
    reviewedAt: v.reviewedAt?.toISOString(),
    approvedBy: v.approvedBy,
    approvedAt: v.approvedAt?.toISOString(),
    postedBy: v.postedBy,
    postedAt: v.postedAt?.toISOString(),
    rejectionReason: v.rejectionReason,
    lines: v.lines.map((l) => ({
      id: l.id,
      lineNumber: l.lineNumber,
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit: l.debit.amount,
      credit: l.credit.amount,
      memo: l.memo,
      costCenterId: l.costCenterId,
    })),
  }));

  return NextResponse.json({ success: true, tenantId, data: serialized });
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || '8100';
    const body = await req.json();
    const { documentNumber, documentDate, remarks, lines, actor, autoSubmit } = body;

    if (!documentNumber || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: 'Document number and at least one line are required.' },
        { status: 400 }
      );
    }

    const jv = new JournalVoucher(
      `${tenantId}-jv-${Date.now()}`,
      tenantId,
      documentNumber,
      new Date(documentDate || Date.now()),
      actor || 'usr-acct-01',
      remarks || ''
    );

    lines.forEach((line: JVLinePayload, idx: number) => {
      const lineId = `line-${idx + 1}`;
      if (line.debit > 0) {
        jv.addDebitLine(
          lineId,
          line.accountId || `acc-${line.accountCode}`,
          line.accountCode,
          line.accountName,
          Money.from(line.debit),
          line.memo || '',
          line.costCenterId
        );
      } else if (line.credit > 0) {
        jv.addCreditLine(
          lineId,
          line.accountId || `acc-${line.accountCode}`,
          line.accountCode,
          line.accountName,
          Money.from(line.credit),
          line.memo || '',
          line.costCenterId
        );
      }
    });

    if (autoSubmit) {
      jv.submit();
    }

    const list = tenantStore.journalVouchers.get(tenantId) || [];
    list.unshift(jv);
    tenantStore.journalVouchers.set(tenantId, list);

    tenantStore.recordAudit(
      tenantId,
      'JournalVoucher',
      jv.id,
      autoSubmit ? 'CREATE_AND_SUBMIT' : 'CREATE_DRAFT',
      actor || 'usr-acct-01',
      `Created JV ${jv.documentNumber} (${jv.remarks}) - Total: PHP ${jv.getTotalDebit().amount}`
    );

    return NextResponse.json({
      success: true,
      documentNumber: jv.documentNumber,
      status: jv.status,
      totalDebit: jv.getTotalDebit().amount,
      totalCredit: jv.getTotalCredit().amount,
      difference: jv.getDifference().amount,
      isBalanced: jv.isBalanced(),
      linesCount: jv.lines.length,
      message: `Journal Voucher ${jv.documentNumber} successfully saved with status ${jv.status}.`,
    }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof DomainException) {
      return NextResponse.json(
        { error: err.message, type: 'DomainInvariantViolation', isBalanced: false },
        { status: 422 }
      );
    }
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
