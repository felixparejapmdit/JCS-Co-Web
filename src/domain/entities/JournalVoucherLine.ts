import { BaseEntity } from '../common/BaseEntity';
import { Money } from '../value-objects/Money';
import { DomainException } from '../common/DomainException';

/**
 * Encapsulated line item of a Journal Voucher enforcing non-negative debit/credit values.
 */
export class JournalVoucherLine extends BaseEntity<string> {
  public readonly lineNumber: number;
  public readonly accountId: string;
  public readonly accountCode: string;
  public readonly accountName: string;
  public readonly costCenterId?: string;
  public readonly debit: Money;
  public readonly credit: Money;
  public readonly memo: string;

  constructor(
    id: string,
    lineNumber: number,
    accountId: string,
    accountCode: string,
    accountName: string,
    debit: Money,
    credit: Money,
    memo: string,
    createdBy: string,
    costCenterId?: string
  ) {
    super(id, createdBy);
    if (!accountId || !accountId.trim()) {
      throw new DomainException('Account ID is required on journal voucher line.');
    }
    if (lineNumber <= 0) {
      throw new DomainException('Line number must be greater than zero.');
    }
    if (debit.isNegative() || credit.isNegative()) {
      throw new DomainException('Debit and credit amounts cannot be negative.');
    }
    if (debit.isZero() && credit.isZero()) {
      throw new DomainException('Line item must have either a non-zero debit or credit amount.');
    }
    if (!debit.isZero() && !credit.isZero()) {
      throw new DomainException('A single journal line cannot contain both a debit and credit amount.');
    }

    this.lineNumber = lineNumber;
    this.accountId = accountId;
    this.accountCode = accountCode;
    this.accountName = accountName;
    this.costCenterId = costCenterId;
    this.debit = debit;
    this.credit = credit;
    this.memo = memo;
  }
}
