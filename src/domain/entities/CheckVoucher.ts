import { FinancialDocument } from './FinancialDocument';
import { Money } from '../value-objects/Money';
import { DocumentStatus } from '../enums/DocumentStatus';
import { DomainException } from '../common/DomainException';

/**
 * Check Voucher (CV / Form 024) aggregate managing physical cheque disbursement and bank allocation.
 */
export class CheckVoucher extends FinancialDocument {
  public readonly bankAccountId: string;
  public readonly bankName: string;
  public readonly vendorId: string;
  public readonly payeeName: string;
  public readonly checkNumber: string;
  public readonly checkDate: Date;
  public readonly checkAmount: Money;
  public readonly amountInWords: string;
  private _isPrinted: boolean = false;

  constructor(
    id: string,
    tenantId: string,
    documentNumber: string,
    documentDate: Date,
    bankAccountId: string,
    bankName: string,
    vendorId: string,
    payeeName: string,
    checkNumber: string,
    checkDate: Date,
    checkAmount: Money,
    amountInWords: string,
    createdBy: string,
    remarks: string = '',
    status: DocumentStatus = DocumentStatus.Draft
  ) {
    super(id, tenantId, documentNumber, documentDate, createdBy, remarks, status);
    if (!bankAccountId || !bankAccountId.trim()) {
      throw new DomainException('Bank Account ID is required on Check Voucher.');
    }
    if (!payeeName || !payeeName.trim()) {
      throw new DomainException('Payee Name is required.');
    }
    if (!checkNumber || !checkNumber.trim()) {
      throw new DomainException('Check Number is required.');
    }
    if (checkAmount.isNegative() || checkAmount.isZero()) {
      throw new DomainException('Check Amount must be strictly greater than zero.');
    }

    this.bankAccountId = bankAccountId.trim();
    this.bankName = bankName.trim();
    this.vendorId = vendorId.trim();
    this.payeeName = payeeName.trim();
    this.checkNumber = checkNumber.trim();
    this.checkDate = checkDate;
    this.checkAmount = checkAmount;
    this.amountInWords = amountInWords.trim();
  }

  public get isPrinted(): boolean {
    return this._isPrinted;
  }

  public markAsPrinted(printedBy: string): void {
    if (!printedBy || !printedBy.trim()) {
      throw new DomainException('PrintedBy identifier is required.');
    }
    if (this._status !== DocumentStatus.Approved && this._status !== DocumentStatus.Posted) {
      throw new DomainException(
        `Cannot print cheque for voucher in '${this._status}' status. Document must be Approved first.`
      );
    }

    this._isPrinted = true;
    this.updatedAt = new Date();
  }
}
