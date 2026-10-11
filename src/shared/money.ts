// Money helpers shared by the browser and the server so on-screen previews and saved
// documents always compute the same figures.

export const VAT_RATE = 0.12;

export function r2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function r4(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;
}

export function sum<T>(items: T[], pick: (t: T) => number): number {
  return r2(items.reduce((s, t) => s + (Number(pick(t)) || 0), 0));
}

const peso = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qtyFmt = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 3 });

export function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '0.00';
  return peso.format(Number(n));
}

export function fmtPeso(n: number | null | undefined): string {
  return `₱${fmtMoney(n)}`;
}

export function fmtQty(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '0';
  return qtyFmt.format(Number(n));
}

/** Splits a VAT-inclusive amount into its net and VAT parts. */
export function splitVat(grossInclusive: number, vatable = true): { net: number; vat: number } {
  if (!vatable) return { net: r2(grossInclusive), vat: 0 };
  const net = r2(grossInclusive / (1 + VAT_RATE));
  return { net, vat: r2(grossInclusive - net) };
}

/** Expanded withholding tax on the VAT-exclusive base (BIR rule: EWT never applies to VAT). */
export function ewtOn(base: number, ratePct: number): number {
  return r2((base * (Number(ratePct) || 0)) / 100);
}

// ---------------------------------------------------------------------------
// Amount in words: a faithful port of the legacy modules/AmtWords.vb (NumToEng),
// including its spacing, so printed cheques read exactly as they do today.
// ---------------------------------------------------------------------------
const ONES = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
const TWOS = ['Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];
const LLIONS = ['Trillion ', 'Billion ', 'Million ', 'Thousand ', ''];

function words(n: number): string {
  const s = String(Math.trunc(n)).padStart(3, '0');
  let out = '';
  const hun = Number(s[0]);
  if (hun !== 0) out = ONES[hun] + 'Hundred ';
  const tens = Number(s.slice(1, 3));
  if (tens > 0 && tens < 20) out += ONES[tens];
  else if (tens > 19) out += TWOS[Number(s[1]) - 2] + ONES[Number(s[2])];
  return out;
}

export function numToEng(amount: number): string {
  const fixed = r2(Math.abs(amount)).toFixed(2);
  const padded = fixed.padStart(18, '0');
  let out = '';
  let k2 = 0;
  for (let k = 0; k <= 12; k += 3) {
    const unit = Number(padded.slice(k, k + 3));
    if (unit > 0) out += words(unit) + LLIONS[k2];
    k2++;
  }
  const cents = padded.slice(padded.length - 2);
  if (cents !== '00') out += ' and ' + cents + '/100';
  else out += ' Only';
  return out;
}
