import { JournalVoucher } from '../entities/JournalVoucher';
import { FiscalPeriod } from '../entities/FiscalPeriod';
import { DomainException } from '../common/DomainException';
import { Money } from '../value-objects/Money';

export interface GlHeaderRecord {
  id: string;
  batchNumber: string;
  documentType: string;
  documentNumber: string;
  documentDate: Date;
  fiscalPeriodId: string;
  totalDebit: number;
  totalCredit: number;
  postedBy: string;
  postedAt: Date;
}

export interface GlLineRecord {
  id: string;
  glHeaderId: string;
  lineNumber: number;
  accountNumber: string;
  costCenterCode?: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

export interface PostingResult {
  header: GlHeaderRecord;
  lines: GlLineRecord[];
}

export class GeneralLedgerPostingService {
  /**
   * Posts an approved Journal Voucher into balanced immutable General Ledger records.
   */
  public static postJournalVoucher(
    voucher: JournalVoucher,
    period: FiscalPeriod,
    postedBy: string
  ): PostingResult {
    // 1. Invariant Checks
    period.assertAllowsPosting(voucher.documentDate);
    voucher.postToLedger(postedBy, period);

    const totalDebit = voucher.getTotalDebit();
    const totalCredit = voucher.getTotalCredit();

    if (!totalDebit.equals(totalCredit)) {
      throw new DomainException(
        `Critical GL Invariant Violation: Total Debit (${totalDebit.format()}) != Total Credit (${totalCredit.format()}).`
      );
    }

    // 2. Generate GL Header
    const batchNumber = `GL-${new Date().getFullYear()}-${voucher.documentNumber}`;
    const headerId = `glh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const header: GlHeaderRecord = {
      id: headerId,
      batchNumber,
      documentType: 'JV',
      documentNumber: voucher.documentNumber,
      documentDate: voucher.documentDate,
      fiscalPeriodId: period.id,
      totalDebit: totalDebit.amount,
      totalCredit: totalCredit.amount,
      postedBy,
      postedAt: new Date(),
    };

    // 3. Generate GL Lines
    const lines: GlLineRecord[] = voucher.lines.map((line, idx) => ({
      id: `gll-${headerId}-${idx + 1}`,
      glHeaderId: headerId,
      lineNumber: line.lineNumber,
      accountNumber: line.accountCode,
      costCenterCode: line.costCenterId,
      debitAmount: line.debit.amount,
      creditAmount: line.credit.amount,
      description: line.memo || voucher.remarks,
    }));

    return { header, lines };
  }
}
