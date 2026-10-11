import { VAT_RATE, r2 } from './money';

export interface OpenInvoice {
  invno: string;
  transdate: string;
  duedate: string;
  netamt: number;
  balance: number;
  vatable: boolean;
}

export interface Application {
  invno: string;
  oramt: number; // cash / cheque applied
  ewt: number; // tax withheld by the customer (BIR 2307)
}

/** Settlement that leaves an invoice fully paid when the customer withholds `ratePct` EWT. */
export function ewtForSettlement(settle: number, ratePct: number, vatable: boolean): number {
  if (!ratePct) return 0;
  const base = vatable ? settle / (1 + VAT_RATE) : settle;
  return r2((base * ratePct) / 100);
}

/**
 * Applies a received amount to open invoices, oldest due first. For each invoice the customer
 * pays (balance - EWT) in cash and the rest is covered by the withholding tax certificate.
 */
export function autoApply(invoices: OpenInvoice[], received: number, ratePct: number): { lines: Application[]; unapplied: number } {
  let cash = r2(received);
  const lines: Application[] = [];
  const ordered = [...invoices].filter((i) => i.balance > 0).sort((a, b) => a.duedate.localeCompare(b.duedate) || a.invno.localeCompare(b.invno));
  for (const inv of ordered) {
    if (cash <= 0) break;
    const fullEwt = ewtForSettlement(inv.balance, ratePct, inv.vatable);
    const fullCash = r2(inv.balance - fullEwt);
    if (cash >= fullCash) {
      lines.push({ invno: inv.invno, oramt: fullCash, ewt: fullEwt });
      cash = r2(cash - fullCash);
    } else {
      // Partial payment: gross the cash up so EWT stays proportional.
      const factor = 1 - (inv.vatable ? ratePct / 100 / (1 + VAT_RATE) : ratePct / 100);
      const settle = r2(cash / factor);
      const ewt = r2(settle - cash);
      lines.push({ invno: inv.invno, oramt: cash, ewt });
      cash = 0;
    }
  }
  return { lines, unapplied: r2(cash) };
}
