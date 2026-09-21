import { FinancialDocument } from './FinancialDocument';
import { Money } from '../value-objects/Money';
import { DomainException } from '../common/DomainException';
import { DocumentStatus } from '../enums/DocumentStatus';

export type PaymentTender = 'CASH' | 'CHEQUE' | 'ONLINE_EFT';

export interface InvoiceAllocation {
  invoiceNumber: string;
  invoiceAmount: number;
  withholdingTaxAmount: number; // 2307 Creditable WT
  discountAmount: number;
  netCollectionAmount: number;
}

export interface CollectionProps {
  id: string;
  tenantId: string;
  officialReceiptNumber: string;
  collectionDate: Date;
  customerId: string;
  customerName: string;
  tender: PaymentTender;
  checkNumber?: string;
  bankName?: string;
  checkDate?: Date;
  isPostDated?: boolean;
  allocations: InvoiceAllocation[];
  remarks?: string;
  createdBy: string;
}

export class Collection extends FinancialDocument {
  public readonly customerId: string;
  public readonly customerName: string;
  public readonly tender: PaymentTender;
  public readonly checkNumber?: string;
  public readonly bankName?: string;
  public readonly checkDate?: Date;
  public readonly isPostDated: boolean;
  private readonly _allocations: InvoiceAllocation[] = [];

  constructor(props: CollectionProps) {
    super(
      props.id,
      props.tenantId,
      props.officialReceiptNumber,
      props.collectionDate,
      props.createdBy,
      props.remarks || '',
      DocumentStatus.Draft
    );

    if (!props.customerId || !props.customerName) {
      throw new DomainException('Customer information is required for Official Receipt collection.');
    }
    if (props.tender === 'CHEQUE' && !props.checkNumber) {
      throw new DomainException('Check number is required for check collections.');
    }

    this.customerId = props.customerId;
    this.customerName = props.customerName;
    this.tender = props.tender;
    this.checkNumber = props.checkNumber;
    this.bankName = props.bankName;
    this.checkDate = props.checkDate;
    this.isPostDated = props.isPostDated ?? false;
    this._allocations = [...props.allocations];
  }

  public get allocations(): ReadonlyArray<InvoiceAllocation> {
    return [...this._allocations];
  }

  public getTotalNetCollection(): Money {
    const total = this._allocations.reduce((sum, a) => sum + a.netCollectionAmount, 0);
    return new Money(total);
  }

  public getTotalWithholdingTax(): Money {
    const total = this._allocations.reduce((sum, a) => sum + a.withholdingTaxAmount, 0);
    return new Money(total);
  }

  public getTotalDiscounts(): Money {
    const total = this._allocations.reduce((sum, a) => sum + a.discountAmount, 0);
    return new Money(total);
  }

  public getTotalInvoiceSettled(): Money {
    const total = this._allocations.reduce((sum, a) => sum + a.invoiceAmount, 0);
    return new Money(total);
  }
}
