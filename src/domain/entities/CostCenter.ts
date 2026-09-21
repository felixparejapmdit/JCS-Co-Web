import { BaseEntity } from '../common/BaseEntity';
import { DomainException } from '../common/DomainException';

export interface CostCenterProps {
  id: string;
  code: string;           // e.g. "01", "02", "10-VAL"
  name: string;           // e.g. "Valenzuela Chemical Synthesis Plant"
  division: string;       // e.g. "Operations", "Sales & Marketing", "General & Admin"
  plantLocation: string;  // e.g. "Valenzuela Complex", "Mandaluyong Head Office"
  isActive?: boolean;
  createdBy: string;
}

export class CostCenter extends BaseEntity<string> {
  private _code: string;
  private _name: string;
  private _division: string;
  private _plantLocation: string;
  private _isActive: boolean;

  constructor(props: CostCenterProps) {
    super(props.id, props.createdBy);
    if (!props.code || props.code.trim().length === 0) {
      throw new DomainException('Cost Center code is required.');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new DomainException('Cost Center name is required.');
    }

    this._code = props.code.trim().toUpperCase();
    this._name = props.name.trim();
    this._division = props.division.trim();
    this._plantLocation = props.plantLocation.trim();
    this._isActive = props.isActive ?? true;
  }

  public get code(): string {
    return this._code;
  }

  public get name(): string {
    return this._name;
  }

  public get division(): string {
    return this._division;
  }

  public get plantLocation(): string {
    return this._plantLocation;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public assertActive(): void {
    if (!this._isActive) {
      throw new DomainException(`Cost Center '${this._code} - ${this._name}' is inactive.`);
    }
  }

  public update(name: string, division: string, plantLocation: string, isActive: boolean, updatedBy: string): void {
    this._name = name.trim();
    this._division = division.trim();
    this._plantLocation = plantLocation.trim();
    this._isActive = isActive;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }
}
