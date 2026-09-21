import { ValueObject } from '../common/ValueObject';
import { DomainException } from '../common/DomainException';
import { Money } from './Money';

/**
 * Value object representing a Philippine BIR tax code and fractional rate.
 */
export class TaxRate extends ValueObject {
  public readonly atcCode: string;
  public readonly rate: number; // e.g. 0.02 for 2%
  public readonly description: string;

  constructor(atcCode: string, rate: number, description: string = '') {
    super();
    if (!atcCode || !atcCode.trim()) {
      throw new DomainException('ATC Code cannot be empty.');
    }
    if (rate < 0 || rate > 1) {
      throw new DomainException(`Tax rate must be between 0.0 and 1.0 (got ${rate}).`);
    }

    this.atcCode = atcCode.trim().toUpperCase();
    this.rate = rate;
    this.description = description;
  }

  public calculateTax(baseAmount: Money): Money {
    if (baseAmount.isNegative()) {
      throw new DomainException('Tax base amount cannot be negative.');
    }
    return baseAmount.multiply(this.rate);
  }

  protected getEqualityComponents(): unknown[] {
    return [this.atcCode, this.rate];
  }
}
