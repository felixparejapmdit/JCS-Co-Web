import { FiscalPeriod } from '../entities/FiscalPeriod';
import { DomainException } from '../common/DomainException';
import { Money } from '../value-objects/Money';

export interface UnpostedVoucherSummary {
  voucherNumber: string;
  status: string;
}

export interface AccountClosingBalance {
  accountNumber: string;
  accountName: string;
  accountType: 'Revenue' | 'CostOfGoodsSold' | 'Expense';
  balance: number; // For Revenue, positive is Credit; for Expense/COGS, positive is Debit
}

export interface YearEndClosingJournal {
  explanation: string;
  closingLines: Array<{
    accountNumber: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
  }>;
  netIncome: number;
}

export class PeriodClosingService {
  /**
   * Asserts whether a fiscal period is eligible for month-end closure.
   */
  public static assertEligibleForMonthEndClose(
    period: FiscalPeriod,
    unpostedVouchers: UnpostedVoucherSummary[]
  ): void {
    if (!period.isOpen()) {
      throw new DomainException(`Cannot close period '${period.periodName}': Current status is '${period.status}'.`);
    }

    if (unpostedVouchers.length > 0) {
      const list = unpostedVouchers.map((v) => `${v.voucherNumber} (${v.status})`).join(', ');
      throw new DomainException(
        `Cannot close fiscal period '${period.periodName}'. There are ${unpostedVouchers.length} unposted/open vouchers: [${list}]. All vouchers must be Approved/Posted or Voided prior to period close.`
      );
    }
  }

  /**
   * Generates year-end retained earnings closing entries.
   * Closes Revenue accounts by Debiting them, and Closes Expense/COGS accounts by Crediting them.
   * The difference (Net Income or Net Loss) is posted to Retained Earnings (3010-000).
   */
  public static generateYearEndClosingEntry(
    fiscalYear: number,
    balances: AccountClosingBalance[],
    retainedEarningsAccount: string = '3010-000'
  ): YearEndClosingJournal {
    let totalRevenue = 0;
    let totalExpense = 0;
    const closingLines: YearEndClosingJournal['closingLines'] = [];

    for (const item of balances) {
      if (item.accountType === 'Revenue') {
        totalRevenue += item.balance;
        // To close Revenue (normal CR), we Debit it
        closingLines.push({
          accountNumber: item.accountNumber,
          accountName: item.accountName,
          debitAmount: item.balance,
          creditAmount: 0,
        });
      } else {
        totalExpense += item.balance;
        // To close Expense / COGS (normal DR), we Credit it
        closingLines.push({
          accountNumber: item.accountNumber,
          accountName: item.accountName,
          debitAmount: 0,
          creditAmount: item.balance,
        });
      }
    }

    const netIncome = Math.round((totalRevenue - totalExpense + Number.EPSILON) * 100) / 100;

    if (netIncome > 0) {
      // Net Profit: Credit Retained Earnings
      closingLines.push({
        accountNumber: retainedEarningsAccount,
        accountName: 'Retained Earnings - Year End Closing',
        debitAmount: 0,
        creditAmount: netIncome,
      });
    } else if (netIncome < 0) {
      // Net Loss: Debit Retained Earnings
      closingLines.push({
        accountNumber: retainedEarningsAccount,
        accountName: 'Retained Earnings - Year End Closing',
        debitAmount: Math.abs(netIncome),
        creditAmount: 0,
      });
    }

    return {
      explanation: `Year-End Retained Earnings Closing Entry for FY ${fiscalYear}. Net Income: PHP ${netIncome.toFixed(2)}`,
      closingLines,
      netIncome,
    };
  }
}
