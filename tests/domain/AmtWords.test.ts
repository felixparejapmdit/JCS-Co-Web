import { describe, it, expect } from 'vitest';
import { AmtWords } from '../../src/domain/services/AmtWords';

describe('AmtWords Philippine Peso Currency Verbalizer (Cheque Printing)', () => {
  it('should verbalize thousands and hundred thousand peso figures correctly', () => {
    const words = AmtWords.formatToWords(450000.0);
    expect(words).toBe('*** FOUR HUNDRED FIFTY THOUSAND PESOS ONLY ***');
  });

  it('should verbalize multi-million figures matching the user screenshot', () => {
    // PhP 1,250,500.00
    const words = AmtWords.formatToWords(1250500.0);
    expect(words).toBe('*** ONE MILLION TWO HUNDRED FIFTY THOUSAND FIVE HUNDRED PESOS ONLY ***');
  });

  it('should verbalize centavos fractional parts correctly', () => {
    const words = AmtWords.formatToWords(85200.75);
    expect(words).toBe('*** EIGHTY-FIVE THOUSAND TWO HUNDRED PESOS & 75/100 ONLY ***');
  });

  it('should handle zero pesos gracefully', () => {
    const words = AmtWords.formatToWords(0);
    expect(words).toBe('ZERO PESOS ONLY');
  });
});
