import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';
import { GeneralLedgerPostingService } from '@/domain/services/GeneralLedgerPostingService';
import { DomainException } from '@/domain/common/DomainException';

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || '8100';
    const body = await req.json();
    const { voucherId, actor } = body;

    const vouchers = tenantStore.journalVouchers.get(tenantId) || [];
    const jv = vouchers.find((v) => v.id === voucherId || v.documentNumber === voucherId);

    if (!jv) {
      return NextResponse.json({ success: false, error: `Journal voucher '${voucherId}' not found.` }, { status: 404 });
    }

    const periods = tenantStore.fiscalPeriods.get(tenantId) || [];
    const period = periods.find((p) => p.isOpen()) || periods[0];

    if (!period) {
      return NextResponse.json({ success: false, error: 'No active fiscal period found for tenant.' }, { status: 422 });
    }

    // Execute atomic GL posting domain service
    const postingResult = GeneralLedgerPostingService.postJournalVoucher(jv, period, actor || 'usr-admin-01');

    // Persist into GL stores
    const currentHeaders = tenantStore.glHeaders.get(tenantId) || [];
    currentHeaders.unshift(postingResult.header);
    tenantStore.glHeaders.set(tenantId, currentHeaders);

    const currentLines = tenantStore.glLines.get(tenantId) || [];
    currentLines.push(...postingResult.lines);
    tenantStore.glLines.set(tenantId, currentLines);

    tenantStore.recordAudit(
      tenantId,
      'GeneralLedger',
      postingResult.header.id,
      'POST_GL',
      actor || 'usr-admin-01',
      `Posted ${jv.documentNumber} to GL Batch ${postingResult.header.batchNumber} (Debit: PHP ${postingResult.header.totalDebit}, Credit: PHP ${postingResult.header.totalCredit})`
    );

    return NextResponse.json({
      success: true,
      message: `Journal voucher ${jv.documentNumber} successfully posted to General Ledger.`,
      header: postingResult.header,
      linesCount: postingResult.lines.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof DomainException ? err.message : (err as Error).message;
    return NextResponse.json({ success: false, error: msg }, { status: 422 });
  }
}
