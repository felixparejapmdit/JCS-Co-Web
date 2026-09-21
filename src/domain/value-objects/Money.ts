import { ValueObject } from '../common/ValueObject';
import { DomainException } from '../common/DomainException';

/**
 * Immutable financial Value Object ensuring zero-float calculation precision and currency safety.
 */
export class Money extends ValueObject {
  public static readonly DEFAULT_CURRENCY = 'PHP';

  public readonly amount: number;
  public readonly currency: string;

  constructor(amount: number, currency: string = Money.DEFAULT_CURRENCY) {
    super();
    if (!currency || !currency.trim()) {
      throw new DomainException('Currency cannot be empty.');
    }
    if (!Number.isFinite(amount)) {
      throw new DomainException(`Invalid numeric amount: ${amount}`);
    }

    this.currency = currency.trim().toUpperCase();
    // Enforce strict 2-decimal precision (centavos) to prevent JavaScript IEEE-754 binary floating drift
    this.amount = Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  public static zero(currency: string = Money.DEFAULT_CURRENCY): Money {
    return new Money(0, currency);
  }

  public static from(amount: number, currency: string = Money.DEFAULT_CURRENCY): Money {
    return new Money(amount, currency);
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  public multiply(factor: number): Money {
    if (!Number.isFinite(factor)) {
      throw new DomainException(`Invalid multiplier factor: ${factor}`);
    }
    return new Money(this.amount * factor, this.currency);
  }

  public isZero(): boolean {
    return Math.abs(this.amount) < 0.001;
  }

  public isPositive(): boolean {
    return this.amount > 0;
  }

  public isNegative(): boolean {
    return this.amount < 0;
  }

  public greaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  public lessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  public greaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount >= other.amount;
  }

  public lessThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount <= other.amount;
  }

  public format(): string {
    return `${this.currency} ${this.amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainException(
        `Cannot perform arithmetic across disparate currencies: '${this.currency}' and '${other.currency}'.`
      );
    }
  }

  protected getEqualityComponents(): unknown[] {
    return [this.amount, this.currency];
  }
}
