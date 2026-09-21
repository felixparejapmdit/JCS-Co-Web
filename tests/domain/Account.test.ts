import { describe, it, expect } from 'vitest';
import { Account } from '../../src/domain/entities/Account';
import { DomainException } from '../../src/domain/common/DomainException';

describe('Account Entity & COA Hierarchical Invariants', () => {
  it('should initialize account and derive normal balance automatically', () => {
    const cash = new Account({
      id: 'acc-01',
      accountNumber: '1010-000',
      accountName: 'Cash in Bank - BDO Operating',
      accountType: 'Asset',
      createdBy: 'admin',
    });

    expect(cash.accountNumber).toBe('1010-000');
    expect(cash.normalBalance).toBe('DR');
    expect(cash.isActive).toBe(true);
    expect(cash.isHeader).toBe(false);
  });

  it('should derive CR for Liabilities and Equity', () => {
    const ap = new Account({
      id: 'acc-02',
      accountNumber: '2000-000',
      accountName: 'Accounts Payable - Trade',
      accountType: 'Liability',
      createdBy: 'admin',
    });

    const equity = new Account({
      id: 'acc-03',
      accountNumber: '3010-000',
      accountName: 'Retained Earnings',
      accountType: 'Equity',
      createdBy: 'admin',
    });

    expect(ap.normalBalance).toBe('CR');
    expect(equity.normalBalance).toBe('CR');
  });

  it('should throw DomainException if account number prefix mismatches account type', () => {
    // Attempting to register an Expense with prefix '1' instead of '6'
    expect(
      () =>
        new Account({
          id: 'acc-invalid',
          accountNumber: '1050-000',
          accountName: 'Office Supplies Expense',
          accountType: 'Expense',
          createdBy: 'admin',
        })
    ).toThrow(DomainException);
  });

  it('should prevent posting to header or inactive accounts', () => {
    const headerAcc = new Account({
      id: 'acc-hdr',
      accountNumber: '1000-000',
      accountName: 'Current Assets',
      accountType: 'Asset',
      isHeader: true,
      createdBy: 'admin',
    });

    expect(() => headerAcc.assertCanPost()).toThrow(DomainException);
    expect(() => headerAcc.assertCanPost()).toThrow(/Cannot post to header account/);

    const inactiveAcc = new Account({
      id: 'acc-inact',
      accountNumber: '1020-099',
      accountName: 'Legacy Receivables',
      accountType: 'Asset',
      isActive: false,
      createdBy: 'admin',
    });

    expect(() => inactiveAcc.assertCanPost()).toThrow(DomainException);
    expect(() => inactiveAcc.assertCanPost()).toThrow(/inactive account/);
  });
});
