import { AggregateRoot } from '../common/AggregateRoot';
import { DomainException } from '../common/DomainException';
import { TaxIdentificationNumber } from '../value-objects/TaxIdentificationNumber';

export interface VendorProps {
  id: string;
  vendorCode: string;
  vendorName: string;
  tradeName?: string;
  tin: string | TaxIdentificationNumber;
  registeredAddress: string;
  defaultAtc: string; // e.g. "WC158", "WC160", "WI010"
  paymentTermsDays?: number;
  isVatRegistered?: boolean;
  isActive?: boolean;
  createdBy: string;
}

export class Vendor extends AggregateRoot<string> {
  private _vendorCode: string;
  private _vendorName: string;
  private _tradeName?: string;
  private _tin: TaxIdentificationNumber;
  private _registeredAddress: string;
  private _defaultAtc: string;
  private _paymentTermsDays: number;
  private _isVatRegistered: boolean;
  private _isActive: boolean;

  constructor(props: VendorProps) {
    super(props.id, props.createdBy);

    if (!props.vendorCode || props.vendorCode.trim().length === 0) {
      throw new DomainException('Vendor code is required.');
    }
    if (!props.vendorName || props.vendorName.trim().length === 0) {
      throw new DomainException('Vendor legal name is required.');
    }
    if (!props.registeredAddress || props.registeredAddress.trim().length === 0) {
      throw new DomainException('Vendor registered address is required for BIR Form 2307 compliance.');
    }

    this._vendorCode = props.vendorCode.trim().toUpperCase();
    this._vendorName = props.vendorName.trim();
    this._tradeName = props.tradeName?.trim();
    this._tin = typeof props.tin === 'string' ? new TaxIdentificationNumber(props.tin) : props.tin;
    this._registeredAddress = props.registeredAddress.trim();
    this._defaultAtc = props.defaultAtc?.trim().toUpperCase() || 'WC160';
    this._paymentTermsDays = props.paymentTermsDays ?? 30;
    this._isVatRegistered = props.isVatRegistered ?? true;
    this._isActive = props.isActive ?? true;
  }

  public get vendorCode(): string {
    return this._vendorCode;
  }

  public get vendorName(): string {
    return this._vendorName;
  }

  public get tradeName(): string | undefined {
    return this._tradeName;
  }

  public get tin(): TaxIdentificationNumber {
    return this._tin;
  }

  public get registeredAddress(): string {
    return this._registeredAddress;
  }

  public get defaultAtc(): string {
    return this._defaultAtc;
  }

  public get paymentTermsDays(): number {
    return this._paymentTermsDays;
  }

  public get isVatRegistered(): boolean {
    return this._isVatRegistered;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public update(props: {
    vendorName: string;
    tradeName?: string;
    tin: string;
    registeredAddress: string;
    defaultAtc: string;
    paymentTermsDays: number;
    isVatRegistered: boolean;
    isActive: boolean;
    updatedBy: string;
  }): void {
    this._vendorName = props.vendorName.trim();
    this._tradeName = props.tradeName?.trim();
    this._tin = new TaxIdentificationNumber(props.tin);
    this._registeredAddress = props.registeredAddress.trim();
    this._defaultAtc = props.defaultAtc.trim().toUpperCase();
    this._paymentTermsDays = props.paymentTermsDays;
    this._isVatRegistered = props.isVatRegistered;
    this._isActive = props.isActive;
    this.updatedBy = props.updatedBy;
    this.updatedAt = new Date();
  }
}
