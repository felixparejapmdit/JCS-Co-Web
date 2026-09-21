import { BaseEntity } from '../common/BaseEntity';
import { DomainException } from '../common/DomainException';

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'CostOfGoodsSold' | 'Expense';
export type NormalBalance = 'DR' | 'CR';

export interface AccountProps {
  id: string;
  accountNumber: string; // e.g. "1010-000"
  accountName: string;   // e.g. "Cash in Bank - BDO Operating"
  accountType: AccountType;
  normalBalance?: NormalBalance;
  parentAccountId?: string;
  isHeader?: boolean;
  isActive?: boolean;
  createdBy: string;
}

export class Account extends BaseEntity<string> {
  private _accountNumber: string;
  private _accountName: string;
  private _accountType: AccountType;
  private _normalBalance: NormalBalance;
  private _parentAccountId?: string;
  private _isHeader: boolean;
  private _isActive: boolean;

  constructor(props: AccountProps) {
    super(props.id, props.createdBy);
    this.validateAccountNumber(props.accountNumber, props.accountType);

    this._accountNumber = props.accountNumber.trim();
    this._accountName = props.accountName.trim();
    this._accountType = props.accountType;
    this._normalBalance = props.normalBalance || Account.deriveNormalBalance(props.accountType);
    this._parentAccountId = props.parentAccountId;
    this._isHeader = props.isHeader ?? false;
    this._isActive = props.isActive ?? true;
  }

  public get accountNumber(): string {
    return this._accountNumber;
  }

  public get accountName(): string {
    return this._accountName;
  }

  public get accountType(): AccountType {
    return this._accountType;
  }

  public get normalBalance(): NormalBalance {
    return this._normalBalance;
  }

  public get parentAccountId(): string | undefined {
    return this._parentAccountId;
  }

  public get isHeader(): boolean {
    return this._isHeader;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public static deriveNormalBalance(type: AccountType): NormalBalance {
    switch (type) {
      case 'Asset':
      case 'CostOfGoodsSold':
      case 'Expense':
        return 'DR';
      case 'Liability':
      case 'Equity':
      case 'Revenue':
        return 'CR';
    }
  }

  private validateAccountNumber(accountNumber: string, type: AccountType): void {
    if (!accountNumber || accountNumber.trim().length < 4) {
      throw new DomainException(`Account number '${accountNumber}' must be at least 4 characters long.`);
    }

    const firstChar = accountNumber.trim().charAt(0);
    const expectedPrefixes: Record<AccountType, string> = {
      Asset: '1',
      Liability: '2',
      Equity: '3',
      Revenue: '4',
      CostOfGoodsSold: '5',
      Expense: '6'
    };

    const expected = expectedPrefixes[type];
    if (firstChar !== expected) {
      throw new DomainException(
        `Account prefix violation: Account '${accountNumber}' of type '${type}' must begin with '${expected}'`
      );
    }
  }

  public assertCanPost(): void {
    if (!this._isActive) {
      throw new DomainException(`Cannot post to inactive account '${this._accountNumber} - ${this._accountName}'.`);
    }
    if (this._isHeader) {
      throw new DomainException(`Cannot post to header account '${this._accountNumber} - ${this._accountName}'.`);
    }
  }

  public updateDetails(name: string, isActive: boolean, updatedBy: string): void {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Account name cannot be empty.');
    }
    this._accountName = name.trim();
    this._isActive = isActive;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }
}
