import { ValueObject } from '../common/ValueObject';
import { DomainException } from '../common/DomainException';

/**
 * Philippine Tax Identification Number (TIN) Value Object validating standard 9 or 12 digit formats.
 */
export class TaxIdentificationNumber extends ValueObject {
  private static readonly TIN_REGEX = /^\d{3}-?\d{3}-?\d{3}(-?\d{3,5})?$/;

  public readonly value: string;
  public readonly formattedValue: string;

  constructor(rawTin: string) {
    super();
    if (!rawTin || !rawTin.trim()) {
      throw new DomainException('Tax Identification Number cannot be empty.');
    }

    const trimmed = rawTin.trim();
    if (!TaxIdentificationNumber.TIN_REGEX.test(trimmed)) {
      throw new DomainException(
        `Invalid Philippine TIN format: '${rawTin}'. Must contain 9 to 12 numeric digits.`
      );
    }

    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length !== 9 && digitsOnly.length !== 12) {
      throw new DomainException(
        `TIN must contain 9 or 12 digits, received ${digitsOnly.length}.`
      );
    }

    this.value = digitsOnly;
    this.formattedValue =
      digitsOnly.length === 9
        ? `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 9)}-000`
        : `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 9)}-${digitsOnly.slice(9, 12)}`;
  }

  public toString(): string {
    return this.formattedValue;
  }

  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}
