import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';
import { DomainException } from '@/domain/common/DomainException';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = req.headers.get('x-tenant-id') || '8100';
    const body = await req.json();
    const { action, actor, reason } = body;

    const vouchers = tenantStore.journalVouchers.get(tenantId) || [];
    const jv = vouchers.find((v) => v.id === id || v.documentNumber === id);

    if (!jv) {
      return NextResponse.json({ success: false, error: `Journal voucher '${id}' not found.` }, { status: 404 });
    }

    const previousStatus = jv.status;

    switch (action) {
      case 'SUBMIT':
        jv.submit();
        break;
      case 'REVIEW':
        jv.review(actor || 'usr-checker-01');
        break;
      case 'APPROVE':
        jv.approve(actor || 'usr-admin-01');
        break;
      case 'REJECT':
        jv.reject(actor || 'usr-admin-01', reason || 'Rejected by reviewer');
        break;
      default:
        return NextResponse.json({ success: false, error: `Unsupported workflow action: ${action}` }, { status: 400 });
    }

    tenantStore.recordAudit(
      tenantId,
      'JournalVoucher',
      jv.id,
      action,
      actor || 'unknown',
      `Workflow transition: ${previousStatus} -> ${jv.status} on voucher ${jv.documentNumber}`
    );

    return NextResponse.json({
      success: true,
      voucher: {
        id: jv.id,
        documentNumber: jv.documentNumber,
        status: jv.status,
        reviewedBy: jv.reviewedBy,
        reviewedAt: jv.reviewedAt?.toISOString(),
        approvedBy: jv.approvedBy,
        approvedAt: jv.approvedAt?.toISOString(),
        rejectionReason: jv.rejectionReason,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof DomainException ? err.message : (err as Error).message;
    return NextResponse.json({ success: false, error: msg }, { status: 422 });
  }
}
