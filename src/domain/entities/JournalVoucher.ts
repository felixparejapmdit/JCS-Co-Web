import { FinancialDocument } from './FinancialDocument';
import { JournalVoucherLine } from './JournalVoucherLine';
import { Money } from '../value-objects/Money';
import { DocumentStatus } from '../enums/DocumentStatus';
import { DomainException } from '../common/DomainException';
import { FiscalPeriod } from './FiscalPeriod';

/**
 * Journal Voucher Aggregate Root strictly enforcing double-entry accounting equilibrium (Sum Dr == Sum Cr)
 * and Maker-Checker approval before posting.
 */
export class JournalVoucher extends FinancialDocument {
  private readonly _lines: JournalVoucherLine[] = [];
  public fiscalPeriodId?: string;

  constructor(
    id: string,
    tenantId: string,
    documentNumber: string,
    documentDate: Date,
    createdBy: string,
    remarks: string = '',
    status: DocumentStatus = DocumentStatus.Draft,
    fiscalPeriodId?: string
  ) {
    super(id, tenantId, documentNumber, documentDate, createdBy, remarks, status);
    this.fiscalPeriodId = fiscalPeriodId;
  }

  public get lines(): ReadonlyArray<JournalVoucherLine> {
    return [...this._lines];
  }

  public addDebitLine(
    id: string,
    accountId: string,
    accountCode: string,
    accountName: string,
    amount: Money,
    memo: string = '',
    costCenterId?: string
  ): void {
    this.ensureModifiable();
    const nextLineNumber = this._lines.length + 1;
    const line = new JournalVoucherLine(
      id,
      nextLineNumber,
      accountId,
      accountCode,
      accountName,
      amount,
      Money.zero(amount.currency),
      memo,
      this.createdBy,
      costCenterId
    );
    this._lines.push(line);
    this.updatedAt = new Date();
  }

  public addCreditLine(
    id: string,
    accountId: string,
    accountCode: string,
    accountName: string,
    amount: Money,
    memo: string = '',
    costCenterId?: string
  ): void {
    this.ensureModifiable();
    const nextLineNumber = this._lines.length + 1;
    const line = new JournalVoucherLine(
      id,
      nextLineNumber,
      accountId,
      accountCode,
      accountName,
      Money.zero(amount.currency),
      amount,
      memo,
      this.createdBy,
      costCenterId
    );
    this._lines.push(line);
    this.updatedAt = new Date();
  }

  public clearLines(): void {
    this.ensureModifiable();
    this._lines.length = 0;
    this.updatedAt = new Date();
  }

  public getTotalDebit(): Money {
    if (this._lines.length === 0) return Money.zero();
    const currency = this._lines[0].debit.currency;
    return this._lines.reduce((total, line) => total.add(line.debit), Money.zero(currency));
  }

  public getTotalCredit(): Money {
    if (this._lines.length === 0) return Money.zero();
    const currency = this._lines[0].credit.currency;
    return this._lines.reduce((total, line) => total.add(line.credit), Money.zero(currency));
  }

  public getDifference(): Money {
    return this.getTotalDebit().subtract(this.getTotalCredit());
  }

  public isBalanced(): boolean {
    if (this._lines.length < 2) return false;
    return this.getDifference().isZero();
  }

  public postToLedger(postedBy: string, fiscalPeriod?: FiscalPeriod): void {
    if (!postedBy || !postedBy.trim()) {
      throw new DomainException('Posting user identifier is required.');
    }
    if (this._status === DocumentStatus.Posted) {
      throw new DomainException('Journal Voucher is already posted.');
    }
    if (this._status !== DocumentStatus.Approved) {
      throw new DomainException(
        `Cannot post Journal Voucher in '${this._status}' status. Document must be APPROVED by Finance Head first.`
      );
    }
    if (this._lines.length < 2) {
      throw new DomainException('Journal Voucher must contain at least 2 balanced line items to post.');
    }
    if (!this.isBalanced()) {
      const diff = this.getDifference().format();
      throw new DomainException(
        `Journal Voucher is out of balance by ${diff}. Total Debits must strictly equal Total Credits.`
      );
    }

    if (fiscalPeriod) {
      fiscalPeriod.assertAllowsPosting(this.documentDate);
    }

    this._status = DocumentStatus.Posted;
    this.postedBy = postedBy;
    this.postedAt = new Date();
    this.updatedAt = new Date();

    this.addDomainEvent({
      eventName: 'JournalVoucherPosted',
      occurredOn: new Date(),
    });
  }

  private ensureModifiable(): void {
    if (this._status === DocumentStatus.Posted || this._status === DocumentStatus.Void) {
      throw new DomainException(`Cannot modify Journal Voucher in '${this._status}' status.`);
    }
  }
}
