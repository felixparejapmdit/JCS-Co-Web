import { describe, it, expect } from 'vitest';
import { TaxIdentificationNumber } from '../../src/domain/value-objects/TaxIdentificationNumber';
import { DomainException } from '../../src/domain/common/DomainException';

describe('TaxIdentificationNumber (TIN) Value Object', () => {
  it('should parse and format standard 9-digit Philippine TIN', () => {
    const tin = new TaxIdentificationNumber('123-456-789');
    expect(tin.value).toBe('123456789');
    expect(tin.formattedValue).toBe('123-456-789-000');
  });

  it('should parse and format 12-digit Philippine TIN with branch code', () => {
    const tin = new TaxIdentificationNumber('123-456-789-001');
    expect(tin.value).toBe('123456789001');
    expect(tin.formattedValue).toBe('123-456-789-001');
  });

  it('should throw DomainException for invalid TIN strings', () => {
    expect(() => new TaxIdentificationNumber('INVALID-TIN')).toThrow(DomainException);
    expect(() => new TaxIdentificationNumber('12345')).toThrow(DomainException);
  });
});
