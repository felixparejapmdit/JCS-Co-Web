import { BaseHttpService } from './BaseHttpService';
import { JournalVoucher } from '../domain/entities/JournalVoucher';
import { Money } from '../domain/value-objects/Money';

export interface JVLineDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo: string;
  costCenterId?: string;
}

export interface CreateJvDto {
  tenantId: string;
  documentNumber: string;
  documentDate: string;
  remarks: string;
  lines: JVLineDto[];
}

export class VoucherService extends BaseHttpService {
  /**
   * Validates a Journal Voucher in-memory using OOP domain logic before submission.
   */
  public createInMemoryJV(dto: CreateJvDto, createdBy: string): JournalVoucher {
    const jv = new JournalVoucher(
      `jv-${Date.now()}`,
      dto.tenantId,
      dto.documentNumber,
      new Date(dto.documentDate),
      createdBy,
      dto.remarks
    );

    dto.lines.forEach((l, index) => {
      if (l.debit > 0) {
        jv.addDebitLine(
          `line-${index}`,
          l.accountId,
          l.accountCode,
          l.accountName,
          Money.from(l.debit),
          l.memo,
          l.costCenterId
        );
      } else if (l.credit > 0) {
        jv.addCreditLine(
          `line-${index}`,
          l.accountId,
          l.accountCode,
          l.accountName,
          Money.from(l.credit),
          l.memo,
          l.costCenterId
        );
      }
    });

    return jv;
  }

  public async submitJournalVoucher(dto: CreateJvDto): Promise<{ success: boolean; documentNumber: string }> {
    return this.post<{ success: boolean; documentNumber: string }>('/api/vouchers/jv', dto, dto.tenantId);
  }
}
