import { describe, it, expect } from 'vitest';
import { JournalVoucher } from '../../src/domain/entities/JournalVoucher';
import { FiscalPeriod } from '../../src/domain/entities/FiscalPeriod';
import { Money } from '../../src/domain/value-objects/Money';
import { GeneralLedgerPostingService } from '../../src/domain/services/GeneralLedgerPostingService';
import { PeriodClosingService } from '../../src/domain/services/PeriodClosingService';
import { DomainException } from '../../src/domain/common/DomainException';

describe('General Ledger Posting & Period Closing Services', () => {
  const openPeriod = new FiscalPeriod({
    id: 'fp-2026-09',
    fiscalYear: 2026,
    fiscalMonth: 9,
    periodName: 'September 2026',
    dateFrom: new Date('2026-09-01T00:00:00Z'),
    dateTo: new Date('2026-09-30T23:59:59Z'),
    createdBy: 'admin',
  });

  it('should atomically post approved Journal Voucher into balanced General Ledger header and lines', () => {
    const jv = new JournalVoucher(
      'jv-post-01',
      '8100',
      'JV-2026-099',
      new Date('2026-09-15T00:00:00Z'),
      'usr-acct-01',
      'Chemical sales collection deposit'
    );

    jv.addDebitLine('l1', 'acc-101', '1010-000', 'Cash in Bank', Money.from(250000));
    jv.addCreditLine('l2', 'acc-102', '1020-000', 'Accounts Receivable', Money.from(250000));

    jv.submit();
    jv.approve('usr-admin-01');

    const result = GeneralLedgerPostingService.postJournalVoucher(jv, openPeriod, 'usr-admin-01');

    expect(result.header.documentNumber).toBe('JV-2026-099');
    expect(result.header.totalDebit).toBe(250000);
    expect(result.header.totalCredit).toBe(250000);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].accountNumber).toBe('1010-000');
    expect(result.lines[0].debitAmount).toBe(250000);
    expect(result.lines[1].accountNumber).toBe('1020-000');
    expect(result.lines[1].creditAmount).toBe(250000);
  });

  it('should reject GL posting if the fiscal period is closed', () => {
    const closedPeriod = new FiscalPeriod({
      id: 'fp-2026-08',
      fiscalYear: 2026,
      fiscalMonth: 8,
      periodName: 'August 2026',
      dateFrom: new Date('2026-08-01T00:00:00Z'),
      dateTo: new Date('2026-08-31T23:59:59Z'),
      createdBy: 'admin',
    });
    closedPeriod.close('usr-admin-01');

    const jv = new JournalVoucher(
      'jv-post-02',
      '8100',
      'JV-2026-100',
      new Date('2026-08-15T00:00:00Z'),
      'usr-acct-01',
      'Old entry'
    );
    jv.addDebitLine('l1', 'acc-101', '1010-000', 'Cash', Money.from(1000));
    jv.addCreditLine('l2', 'acc-201', '2000-000', 'AP', Money.from(1000));
    jv.submit();
    jv.approve('usr-admin-01');

    expect(() =>
      GeneralLedgerPostingService.postJournalVoucher(jv, closedPeriod, 'usr-admin-01')
    ).toThrow(DomainException);
    expect(() =>
      GeneralLedgerPostingService.postJournalVoucher(jv, closedPeriod, 'usr-admin-01')
    ).toThrow(/is CLOSED/);
  });

  it('should block Month-End close if open unposted vouchers exist', () => {
    expect(() =>
      PeriodClosingService.assertEligibleForMonthEndClose(openPeriod, [
        { voucherNumber: 'JV-2026-001', status: 'DRAFT' },
      ])
    ).toThrow(DomainException);
    expect(() =>
      PeriodClosingService.assertEligibleForMonthEndClose(openPeriod, [
        { voucherNumber: 'JV-2026-001', status: 'DRAFT' },
      ])
    ).toThrow(/unposted\/open vouchers/);
  });

  it('should calculate Year-End Retained Earnings closing entry correctly', () => {
    const balances = [
      {
        accountNumber: '4000-000',
        accountName: 'Sales Revenue - Chemicals',
        accountType: 'Revenue' as const,
        balance: 1000000, // Revenue 1,000,000 CR
      },
      {
        accountNumber: '5000-000',
        accountName: 'Cost of Goods Sold',
        accountType: 'CostOfGoodsSold' as const,
        balance: 600000, // COGS 600,000 DR
      },
      {
        accountNumber: '6000-000',
        accountName: 'Operating Expenses',
        accountType: 'Expense' as const,
        balance: 150000, // Expenses 150,000 DR
      },
    ];

    // Net Income = 1,000,000 - 600,000 - 150,000 = 250,000
    const closing = PeriodClosingService.generateYearEndClosingEntry(2026, balances, '3010-000');

    expect(closing.netIncome).toBe(250000);
    // 3 accounts to close + 1 retained earnings balancing line = 4 lines
    expect(closing.closingLines).toHaveLength(4);

    const reLine = closing.closingLines.find((l) => l.accountNumber === '3010-000');
    expect(reLine).toBeDefined();
    expect(reLine?.creditAmount).toBe(250000);
    expect(reLine?.debitAmount).toBe(0);

    // Verify debit/credit balance of closing entry
    const totalDr = closing.closingLines.reduce((s, l) => s + l.debitAmount, 0);
    const totalCr = closing.closingLines.reduce((s, l) => s + l.creditAmount, 0);
    expect(totalDr).toBe(totalCr);
  });
});
