/**
 * Converts Philippine Peso numeric currency values into verbalized legal words
 * for precision physical cheque printing (Form 024 / Check Voucher).
 * Example: 1250500.00 -> "ONE MILLION TWO HUNDRED FIFTY THOUSAND FIVE HUNDRED PESOS ONLY"
 */
export class AmtWords {
  private static readonly ONES = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];

  private static readonly TENS = [
    '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
  ];

  public static formatToWords(amount: number): string {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(`Invalid currency amount for verbalizer: ${amount}`);
    }

    const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
    const pesos = Math.floor(rounded);
    const centavos = Math.round((rounded - pesos) * 100);

    if (pesos === 0 && centavos === 0) {
      return 'ZERO PESOS ONLY';
    }

    const pesoWords = this.convertIntegerPart(pesos);
    const centavoWords = centavos > 0 ? ` & ${centavos}/100` : '';

    return `*** ${pesoWords} PESOS${centavoWords} ONLY ***`.toUpperCase();
  }

  private static convertIntegerPart(n: number): string {
    if (n === 0) return 'ZERO';

    const chunks: string[] = [];
    const scales = ['', 'THOUSAND', 'MILLION', 'BILLION'];
    let scaleIndex = 0;

    while (n > 0 && scaleIndex < scales.length) {
      const chunk = n % 1000;
      if (chunk > 0) {
        const words = this.convertThreeDigits(chunk);
        const scale = scales[scaleIndex];
        chunks.unshift(scale ? `${words} ${scale}` : words);
      }
      n = Math.floor(n / 1000);
      scaleIndex++;
    }

    return chunks.join(' ');
  }

  private static convertThreeDigits(n: number): string {
    const parts: string[] = [];
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;

    if (hundreds > 0) {
      parts.push(`${this.ONES[hundreds]} HUNDRED`);
    }

    if (remainder > 0) {
      if (remainder < 20) {
        parts.push(this.ONES[remainder]);
      } else {
        const tens = Math.floor(remainder / 10);
        const ones = remainder % 10;
        parts.push(ones > 0 ? `${this.TENS[tens]}-${this.ONES[ones]}` : this.TENS[tens]);
      }
    }

    return parts.join(' ');
  }
}
