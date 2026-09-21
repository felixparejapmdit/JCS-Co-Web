import { FinancialDocument } from './FinancialDocument';
import { Money } from '../value-objects/Money';
import { DocumentStatus } from '../enums/DocumentStatus';
import { DomainException } from '../common/DomainException';

/**
 * Voucher Payable (VP / Form 023) aggregate managing vendor bills, 12% VAT, EWT, and disbursements.
 */
export class VoucherPayable extends FinancialDocument {
  public readonly vendorId: string;
  public readonly vendorName: string;
  public readonly invoiceNumber: string;
  public readonly invoiceDate: Date;
  public readonly dueDate: Date;
  public readonly grossAmount: Money;
  public readonly vatAmount: Money;
  public readonly ewtAmount: Money;
  public readonly netPayable: Money;
  private _balanceAmount: Money;

  constructor(
    id: string,
    tenantId: string,
    documentNumber: string,
    documentDate: Date,
    vendorId: string,
    vendorName: string,
    invoiceNumber: string,
    invoiceDate: Date,
    dueDate: Date,
    grossAmount: Money,
    vatAmount: Money,
    ewtAmount: Money,
    createdBy: string,
    remarks: string = '',
    status: DocumentStatus = DocumentStatus.Draft
  ) {
    super(id, tenantId, documentNumber, documentDate, createdBy, remarks, status);
    if (!vendorId || !vendorId.trim()) {
      throw new DomainException('Vendor ID is required on Voucher Payable.');
    }
    if (!invoiceNumber || !invoiceNumber.trim()) {
      throw new DomainException('Vendor Invoice Number is required.');
    }
    if (grossAmount.isNegative() || grossAmount.isZero()) {
      throw new DomainException('Gross amount must be strictly greater than zero.');
    }

    this.vendorId = vendorId.trim();
    this.vendorName = vendorName.trim();
    this.invoiceNumber = invoiceNumber.trim();
    this.invoiceDate = invoiceDate;
    this.dueDate = dueDate;
    this.grossAmount = grossAmount;
    this.vatAmount = vatAmount;
    this.ewtAmount = ewtAmount;

    // Net Payable = Gross - EWT (Input VAT is included in gross or allocated separately)
    this.netPayable = grossAmount.subtract(ewtAmount);
    this._balanceAmount = this.netPayable;
  }

  public get balanceAmount(): Money {
    return this._balanceAmount;
  }

  public applyPayment(paymentAmount: Money): void {
    if (paymentAmount.isNegative() || paymentAmount.isZero()) {
      throw new DomainException('Payment amount must be positive.');
    }
    if (paymentAmount.greaterThan(this._balanceAmount)) {
      throw new DomainException(
        `Payment amount of ${paymentAmount.format()} exceeds outstanding VP balance of ${this._balanceAmount.format()}.`
      );
    }

    this._balanceAmount = this._balanceAmount.subtract(paymentAmount);
    this.updatedAt = new Date();
  }
}
