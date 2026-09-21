/**
 * Abstract BaseEntity class providing identity and audit tracking.
 */
export abstract class BaseEntity<TId = string> {
  protected readonly _id: TId;
  public createdAt: Date;
  public createdBy: string;
  public updatedAt?: Date;
  public updatedBy?: string;
  public isDeleted: boolean;

  constructor(id: TId, createdBy: string, createdAt?: Date) {
    this._id = id;
    this.createdBy = createdBy;
    this.createdAt = createdAt ?? new Date();
    this.isDeleted = false;
  }

  public get id(): TId {
    return this._id;
  }

  public equals(other?: BaseEntity<TId> | null): boolean {
    if (!other) return false;
    if (this === other) return true;
    if (Object.getPrototypeOf(this) !== Object.getPrototypeOf(other)) return false;
    return this._id === other._id;
  }
}
