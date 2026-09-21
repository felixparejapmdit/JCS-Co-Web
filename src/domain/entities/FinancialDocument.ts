import { AggregateRoot } from '../common/AggregateRoot';
import { DocumentStatus } from '../enums/DocumentStatus';
import { DomainException } from '../common/DomainException';

/**
 * Abstract Aggregate Root providing unified document identity, multi-tenant scoping,
 * and state-machine lifecycle enforcement for all financial vouchers and invoices.
 * Enforces Maker-Checker segregation of duties.
 */
export abstract class FinancialDocument extends AggregateRoot<string> {
  public readonly tenantId: string;
  public readonly documentNumber: string;
  public readonly documentDate: Date;
  protected _status: DocumentStatus;
  public remarks: string;

  public reviewedBy?: string;
  public reviewedAt?: Date;
  public approvedBy?: string;
  public approvedAt?: Date;
  public postedBy?: string;
  public postedAt?: Date;
  public voidedBy?: string;
  public voidedAt?: Date;
  public voidReason?: string;
  public rejectionReason?: string;

  constructor(
    id: string,
    tenantId: string,
    documentNumber: string,
    documentDate: Date,
    createdBy: string,
    remarks: string = '',
    status: DocumentStatus = DocumentStatus.Draft,
    createdAt?: Date
  ) {
    super(id, createdBy, createdAt);
    if (!tenantId || !tenantId.trim()) {
      throw new DomainException('Tenant ID is required for financial documents.');
    }
    if (!documentNumber || !documentNumber.trim()) {
      throw new DomainException('Document Number is required.');
    }

    this.tenantId = tenantId.trim();
    this.documentNumber = documentNumber.trim();
    this.documentDate = documentDate;
    this._status = status;
    this.remarks = remarks;
  }

  public get status(): DocumentStatus {
    return this._status;
  }

  public submit(): void {
    if (this._status !== DocumentStatus.Draft && this._status !== DocumentStatus.Rejected) {
      throw new DomainException(`Cannot submit document in '${this._status}' status.`);
    }
    this._status = DocumentStatus.Submitted;
    this.rejectionReason = undefined;
    this.updatedAt = new Date();
  }

  public review(reviewedBy: string): void {
    if (!reviewedBy || !reviewedBy.trim()) {
      throw new DomainException('Reviewer identifier is required.');
    }
    if (this._status !== DocumentStatus.Submitted) {
      throw new DomainException(`Cannot review document in '${this._status}' status. Document must be SUBMITTED first.`);
    }
    // Maker-Checker: Reviewer should ideally not be the creator
    if (reviewedBy === this.createdBy) {
      throw new DomainException('Segregation of duties violation: Maker cannot review their own document.');
    }

    this._status = DocumentStatus.Reviewed;
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    this.updatedAt = new Date();
  }

  public approve(approvedBy: string): void {
    if (!approvedBy || !approvedBy.trim()) {
      throw new DomainException('Approver identifier is required.');
    }
    if (this._status !== DocumentStatus.Reviewed && this._status !== DocumentStatus.Submitted) {
      throw new DomainException(`Cannot approve document currently in '${this._status}' status. Must be SUBMITTED or REVIEWED.`);
    }
    // Maker-Checker segregation of duties: Approver CANNOT be the creator
    if (approvedBy === this.createdBy) {
      throw new DomainException('Segregation of duties violation: Maker cannot approve their own financial document.');
    }

    this._status = DocumentStatus.Approved;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.updatedAt = new Date();
  }

  public reject(rejectedBy: string, reason: string): void {
    if (!reason || !reason.trim()) {
      throw new DomainException('A rejection explanation is mandatory for audit trail compliance.');
    }
    if (this._status !== DocumentStatus.Submitted && this._status !== DocumentStatus.Reviewed) {
      throw new DomainException(`Cannot reject document in '${this._status}' status.`);
    }

    this._status = DocumentStatus.Rejected;
    this.rejectionReason = reason.trim();
    this.updatedBy = rejectedBy;
    this.updatedAt = new Date();
  }

  public void(reason: string, voidedBy: string): void {
    if (!reason || !reason.trim()) {
      throw new DomainException('A void reason must be recorded.');
    }
    if (!voidedBy || !voidedBy.trim()) {
      throw new DomainException('VoidedBy identifier is required.');
    }
    if (this._status === DocumentStatus.Void) {
      throw new DomainException('Document is already voided.');
    }
    if (this._status === DocumentStatus.Posted) {
      throw new DomainException('Cannot void a posted voucher. Reverse it via an offsetting Journal Voucher instead.');
    }

    this._status = DocumentStatus.Void;
    this.voidReason = reason.trim();
    this.voidedBy = voidedBy;
    this.voidedAt = new Date();
    this.updatedAt = new Date();
  }
}
