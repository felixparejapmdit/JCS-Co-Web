import { describe, it, expect } from 'vitest';
import { Money } from '../../src/domain/value-objects/Money';
import { DomainException } from '../../src/domain/common/DomainException';

describe('Money Value Object', () => {
  it('should enforce exact 2-decimal financial rounding', () => {
    const m = new Money(123.456);
    expect(m.amount).toBe(123.46);
  });

  it('should add amounts of the same currency accurately', () => {
    const m1 = new Money(100.10);
    const m2 = new Money(200.20);
    const result = m1.add(m2);

    expect(result.amount).toBe(300.30);
    expect(result.currency).toBe('PHP');
  });

  it('should throw DomainException when adding disparate currencies', () => {
    const php = new Money(100, 'PHP');
    const usd = new Money(100, 'USD');

    expect(() => php.add(usd)).toThrow(DomainException);
    expect(() => php.add(usd)).toThrow(/disparate currencies/);
  });

  it('should format correctly in Philippine Peso', () => {
    const m = new Money(1250500.5);
    expect(m.format()).toBe('PHP 1,250,500.50');
  });

  it('should compare amounts correctly', () => {
    const low = new Money(50);
    const high = new Money(100);

    expect(high.greaterThan(low)).toBe(true);
    expect(low.lessThan(high)).toBe(true);
    expect(low.equals(new Money(50))).toBe(true);
  });
});
