import { AggregateRoot } from '../common/AggregateRoot';
import { DomainException } from '../common/DomainException';

export type FiscalPeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

export interface FiscalPeriodProps {
  id: string;
  fiscalYear: number;
  fiscalMonth: number; // 1-12
  periodName: string;  // e.g. "September 2026"
  dateFrom: Date;
  dateTo: Date;
  status?: FiscalPeriodStatus;
  closedBy?: string;
  closedAt?: Date;
  createdBy: string;
}

export class FiscalPeriod extends AggregateRoot<string> {
  private _fiscalYear: number;
  private _fiscalMonth: number;
  private _periodName: string;
  private _dateFrom: Date;
  private _dateTo: Date;
  private _status: FiscalPeriodStatus;
  private _closedBy?: string;
  private _closedAt?: Date;

  constructor(props: FiscalPeriodProps) {
    super(props.id, props.createdBy);

    if (props.fiscalMonth < 1 || props.fiscalMonth > 12) {
      throw new DomainException(`Invalid fiscal month: ${props.fiscalMonth}. Must be between 1 and 12.`);
    }
    if (props.fiscalYear < 2000 || props.fiscalYear > 2100) {
      throw new DomainException(`Invalid fiscal year: ${props.fiscalYear}.`);
    }
    if (props.dateFrom > props.dateTo) {
      throw new DomainException('Period start date must not be later than end date.');
    }

    this._fiscalYear = props.fiscalYear;
    this._fiscalMonth = props.fiscalMonth;
    this._periodName = props.periodName.trim();
    this._dateFrom = props.dateFrom;
    this._dateTo = props.dateTo;
    this._status = props.status || 'OPEN';
    this._closedBy = props.closedBy;
    this._closedAt = props.closedAt;
  }

  public get fiscalYear(): number {
    return this._fiscalYear;
  }

  public get fiscalMonth(): number {
    return this._fiscalMonth;
  }

  public get periodName(): string {
    return this._periodName;
  }

  public get dateFrom(): Date {
    return this._dateFrom;
  }

  public get dateTo(): Date {
    return this._dateTo;
  }

  public get status(): FiscalPeriodStatus {
    return this._status;
  }

  public get closedBy(): string | undefined {
    return this._closedBy;
  }

  public get closedAt(): Date | undefined {
    return this._closedAt;
  }

  public isOpen(): boolean {
    return this._status === 'OPEN';
  }

  public isClosed(): boolean {
    return this._status === 'CLOSED';
  }

  public isLocked(): boolean {
    return this._status === 'LOCKED';
  }

  public assertAllowsPosting(transactionDate?: Date): void {
    if (this._status === 'CLOSED') {
      throw new DomainException(
        `Fiscal Period '${this._periodName}' is CLOSED. Voucher posting and editing are strictly forbidden.`
      );
    }
    if (this._status === 'LOCKED') {
      throw new DomainException(
        `Fiscal Period '${this._periodName}' is permanently LOCKED by statutory compliance. No postings allowed.`
      );
    }

    if (transactionDate) {
      const toDateString = (d: Date) => {
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const txStr = toDateString(transactionDate);
      const fromStr = toDateString(this._dateFrom);
      const toStr = toDateString(this._dateTo);

      if (txStr < fromStr || txStr > toStr) {
        throw new DomainException(
          `Transaction date ${txStr} falls outside period range (${fromStr} to ${toStr}).`
        );
      }
    }
  }

  public close(closedBy: string): void {
    if (this._status === 'CLOSED') {
      throw new DomainException(`Period '${this._periodName}' is already closed.`);
    }
    if (this._status === 'LOCKED') {
      throw new DomainException(`Cannot modify locked period '${this._periodName}'.`);
    }

    this._status = 'CLOSED';
    this._closedBy = closedBy;
    this._closedAt = new Date();
    this.updatedBy = closedBy;
    this.updatedAt = this._closedAt;
  }

  public reopen(reopenedBy: string, reason: string): void {
    if (this._status === 'LOCKED') {
      throw new DomainException(`Statutory locked period '${this._periodName}' cannot be reopened under BIR audit rules.`);
    }
    if (this._status === 'OPEN') {
      throw new DomainException(`Period '${this._periodName}' is already open.`);
    }
    if (!reason || reason.trim().length < 5) {
      throw new DomainException('A detailed justification reason is mandatory to reopen a closed fiscal period.');
    }

    this._status = 'OPEN';
    this._closedBy = undefined;
    this._closedAt = undefined;
    this.updatedBy = reopenedBy;
    this.updatedAt = new Date();
  }

  public lock(lockedBy: string): void {
    this._status = 'LOCKED';
    this.updatedBy = lockedBy;
    this.updatedAt = new Date();
  }
}
