import { Money } from '../value-objects/Money';
import { DomainException } from '../common/DomainException';

export interface TaxCalculationResult {
  readonly atcCode: string;
  readonly baseAmount: Money;
  readonly taxRate: number;
  readonly taxAmount: Money;
  readonly netAmount: Money;
}

/**
 * Strategy pattern interface for Philippine tax computation algorithms.
 */
export interface ITaxCalculationStrategy {
  isApplicable(taxCode: string): boolean;
  calculate(baseAmount: Money, taxCode: string): TaxCalculationResult;
}

/**
 * Philippine Expanded Withholding Tax (EWT / BIR Form 2307) Strategy.
 * Applicable to corporate vendors under TRAIN and CREATE laws.
 */
export class ExpandedWithholdingTaxStrategy implements ITaxCalculationStrategy {
  private static readonly ATC_RATES: Record<string, { rate: number; desc: string }> = {
    WC158: { rate: 0.02, desc: 'Creditable Withholding Tax on Services (2%)' },
    WC160: { rate: 0.01, desc: 'Creditable Withholding Tax on Goods (1%)' },
    WI010: { rate: 0.05, desc: 'Professional Fees / Talent Fees (5%)' },
    WI158: { rate: 0.02, desc: 'Individual Withholding Tax on Services (2%)' },
  };

  public isApplicable(taxCode: string): boolean {
    const code = taxCode.trim().toUpperCase();
    return code in ExpandedWithholdingTaxStrategy.ATC_RATES;
  }

  public calculate(baseAmount: Money, taxCode: string): TaxCalculationResult {
    const code = taxCode.trim().toUpperCase();
    const config = ExpandedWithholdingTaxStrategy.ATC_RATES[code];

    if (!config) {
      throw new DomainException(`Unsupported EWT Alphanumeric Tax Code (ATC): '${taxCode}'.`);
    }

    const taxAmount = baseAmount.multiply(config.rate);
    const netAmount = baseAmount.subtract(taxAmount);

    return {
      atcCode: code,
      baseAmount,
      taxRate: config.rate,
      taxAmount,
      netAmount,
    };
  }
}

/**
 * Value-Added Tax (VAT 12%) Strategy.
 */
export class ValueAddedTaxStrategy implements ITaxCalculationStrategy {
  public static readonly VAT_RATE = 0.12;

  public isApplicable(taxCode: string): boolean {
    const code = taxCode.trim().toUpperCase();
    return code === 'VAT12' || code === 'INPUT_VAT' || code === 'OUTPUT_VAT';
  }

  public calculate(baseAmount: Money, taxCode: string): TaxCalculationResult {
    const taxAmount = baseAmount.multiply(ValueAddedTaxStrategy.VAT_RATE);
    const netAmount = baseAmount.add(taxAmount); // Total inclusive of VAT

    return {
      atcCode: taxCode.toUpperCase(),
      baseAmount,
      taxRate: ValueAddedTaxStrategy.VAT_RATE,
      taxAmount,
      netAmount,
    };
  }
}

/**
 * Zero-Rated / Tax-Exempt Strategy (0%).
 */
export class ZeroRatedVatStrategy implements ITaxCalculationStrategy {
  public isApplicable(taxCode: string): boolean {
    const code = taxCode.trim().toUpperCase();
    return code === 'EXEMPT' || code === 'ZERO_RATED';
  }

  public calculate(baseAmount: Money, taxCode: string): TaxCalculationResult {
    return {
      atcCode: taxCode.toUpperCase(),
      baseAmount,
      taxRate: 0,
      taxAmount: Money.zero(baseAmount.currency),
      netAmount: baseAmount,
    };
  }
}

/**
 * Factory creating appropriate tax calculation strategy based on ATC.
 */
export class TaxStrategyFactory {
  private static readonly strategies: ITaxCalculationStrategy[] = [
    new ExpandedWithholdingTaxStrategy(),
    new ValueAddedTaxStrategy(),
    new ZeroRatedVatStrategy(),
  ];

  public static getStrategy(taxCode: string): ITaxCalculationStrategy {
    const strategy = this.strategies.find((s) => s.isApplicable(taxCode));
    if (!strategy) {
      throw new DomainException(`No applicable tax strategy registered for code '${taxCode}'.`);
    }
    return strategy;
  }
}
