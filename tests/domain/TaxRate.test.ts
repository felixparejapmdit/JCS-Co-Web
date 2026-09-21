import { describe, it, expect } from 'vitest';
import { TaxRate } from '../../src/domain/value-objects/TaxRate';
import { Money } from '../../src/domain/value-objects/Money';
import { TaxStrategyFactory } from '../../src/domain/strategies/TaxCalculationStrategy';

describe('Tax Strategy & TaxRate Domain Calculations (BIR Form 2307 / VAT)', () => {
  it('should calculate 2% EWT (WC158) on corporate services correctly', () => {
    const taxRate = new TaxRate('WC158', 0.02, 'Creditable Withholding Tax on Services');
    const gross = Money.from(100000);
    const tax = taxRate.calculateTax(gross);

    expect(tax.amount).toBe(2000.0);
  });

  it('should use TaxStrategyFactory to compute expanded withholding tax', () => {
    const strategy = TaxStrategyFactory.getStrategy('WC158');
    const base = Money.from(250000);
    const result = strategy.calculate(base, 'WC158');

    expect(result.taxRate).toBe(0.02);
    expect(result.taxAmount.amount).toBe(5000.0);
    expect(result.netAmount.amount).toBe(245000.0);
  });

  it('should use TaxStrategyFactory to compute 12% Value Added Tax', () => {
    const strategy = TaxStrategyFactory.getStrategy('VAT12');
    const base = Money.from(100000);
    const result = strategy.calculate(base, 'VAT12');

    expect(result.taxRate).toBe(0.12);
    expect(result.taxAmount.amount).toBe(12000.0);
    expect(result.netAmount.amount).toBe(112000.0); // Gross inclusive of VAT
  });
});
