import { BaseEntity } from '../common/BaseEntity';
import { DomainException } from '../common/DomainException';
import { ChequeLayoutFactory, ChequeCoordinate } from '../strategies/ChequeLayoutStrategy';

export interface BankAccountProps {
  id: string;
  bankCode: string;           // "BDO", "BPI", "MBTC", "SECB"
  bankName: string;           // "Banco De Oro - Valenzuela Branch"
  accountNumber: string;      // "00123-45678-9"
  glAccountNumber: string;    // "1010-000"
  currency?: string;          // "PHP"
  chequeMarginTopMm?: number;  // Calibrated printer offset
  chequeMarginLeftMm?: number;
  isActive?: boolean;
  createdBy: string;
}

export class BankAccount extends BaseEntity<string> {
  private _bankCode: string;
  private _bankName: string;
  private _accountNumber: string;
  private _glAccountNumber: string;
  private _currency: string;
  private _chequeMarginTopMm: number;
  private _chequeMarginLeftMm: number;
  private _isActive: boolean;

  constructor(props: BankAccountProps) {
    super(props.id, props.createdBy);

    if (!props.bankCode || props.bankCode.trim().length === 0) {
      throw new DomainException('Bank code is required.');
    }
    if (!props.accountNumber || props.accountNumber.trim().length === 0) {
      throw new DomainException('Bank account number is required.');
    }
    if (!props.glAccountNumber || props.glAccountNumber.trim().length === 0) {
      throw new DomainException('Associated GL Account Number is required.');
    }

    this._bankCode = props.bankCode.trim().toUpperCase();
    this._bankName = props.bankName.trim();
    this._accountNumber = props.accountNumber.trim();
    this._glAccountNumber = props.glAccountNumber.trim();
    this._currency = props.currency?.trim().toUpperCase() || 'PHP';
    this._chequeMarginTopMm = props.chequeMarginTopMm ?? 0;
    this._chequeMarginLeftMm = props.chequeMarginLeftMm ?? 0;
    this._isActive = props.isActive ?? true;
  }

  public get bankCode(): string {
    return this._bankCode;
  }

  public get bankName(): string {
    return this._bankName;
  }

  public get accountNumber(): string {
    return this._accountNumber;
  }

  public get glAccountNumber(): string {
    return this._glAccountNumber;
  }

  public get currency(): string {
    return this._currency;
  }

  public get chequeMarginTopMm(): number {
    return this._chequeMarginTopMm;
  }

  public get chequeMarginLeftMm(): number {
    return this._chequeMarginLeftMm;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public getCalibratedChequeCoordinates(): ChequeCoordinate {
    const base = ChequeLayoutFactory.getLayout(this._bankCode);
    return {
      bankCode: base.bankCode,
      dateX: base.dateX + this._chequeMarginLeftMm,
      dateY: base.dateY + this._chequeMarginTopMm,
      payeeX: base.payeeX + this._chequeMarginLeftMm,
      payeeY: base.payeeY + this._chequeMarginTopMm,
      amountFiguresX: base.amountFiguresX + this._chequeMarginLeftMm,
      amountFiguresY: base.amountFiguresY + this._chequeMarginTopMm,
      amountWordsX: base.amountWordsX + this._chequeMarginLeftMm,
      amountWordsY: base.amountWordsY + this._chequeMarginTopMm,
    };
  }

  public updateOffsets(topMm: number, leftMm: number, updatedBy: string): void {
    this._chequeMarginTopMm = topMm;
    this._chequeMarginLeftMm = leftMm;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }
}
