import { AggregateRoot } from '../common/AggregateRoot';
import { DomainException } from '../common/DomainException';
import { TaxIdentificationNumber } from '../value-objects/TaxIdentificationNumber';
import { Money } from '../value-objects/Money';

export interface CustomerProps {
  id: string;
  customerCode: string;
  customerName: string;
  tradeName?: string;
  tin: string | TaxIdentificationNumber;
  billingAddress: string;
  creditLimit?: number | Money;
  paymentTermsDays?: number;
  isActive?: boolean;
  createdBy: string;
}

export class Customer extends AggregateRoot<string> {
  private _customerCode: string;
  private _customerName: string;
  private _tradeName?: string;
  private _tin: TaxIdentificationNumber;
  private _billingAddress: string;
  private _creditLimit: Money;
  private _paymentTermsDays: number;
  private _isActive: boolean;

  constructor(props: CustomerProps) {
    super(props.id, props.createdBy);

    if (!props.customerCode || props.customerCode.trim().length === 0) {
      throw new DomainException('Customer code is required.');
    }
    if (!props.customerName || props.customerName.trim().length === 0) {
      throw new DomainException('Customer legal name is required.');
    }
    if (!props.billingAddress || props.billingAddress.trim().length === 0) {
      throw new DomainException('Customer billing address is required.');
    }

    this._customerCode = props.customerCode.trim().toUpperCase();
    this._customerName = props.customerName.trim();
    this._tradeName = props.tradeName?.trim();
    this._tin = typeof props.tin === 'string' ? new TaxIdentificationNumber(props.tin) : props.tin;
    this._billingAddress = props.billingAddress.trim();
    this._creditLimit =
      props.creditLimit instanceof Money
        ? props.creditLimit
        : new Money(props.creditLimit ?? 0);
    this._paymentTermsDays = props.paymentTermsDays ?? 30;
    this._isActive = props.isActive ?? true;
  }

  public get customerCode(): string {
    return this._customerCode;
  }

  public get customerName(): string {
    return this._customerName;
  }

  public get tradeName(): string | undefined {
    return this._tradeName;
  }

  public get tin(): TaxIdentificationNumber {
    return this._tin;
  }

  public get billingAddress(): string {
    return this._billingAddress;
  }

  public get creditLimit(): Money {
    return this._creditLimit;
  }

  public get paymentTermsDays(): number {
    return this._paymentTermsDays;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public update(props: {
    customerName: string;
    tradeName?: string;
    tin: string;
    billingAddress: string;
    creditLimit: number;
    paymentTermsDays: number;
    isActive: boolean;
    updatedBy: string;
  }): void {
    this._customerName = props.customerName.trim();
    this._tradeName = props.tradeName?.trim();
    this._tin = new TaxIdentificationNumber(props.tin);
    this._billingAddress = props.billingAddress.trim();
    this._creditLimit = new Money(props.creditLimit);
    this._paymentTermsDays = props.paymentTermsDays;
    this._isActive = props.isActive;
    this.updatedBy = props.updatedBy;
    this.updatedAt = new Date();
  }
}
