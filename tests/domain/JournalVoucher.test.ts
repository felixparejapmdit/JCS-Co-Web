import { describe, it, expect } from 'vitest';
import { JournalVoucher } from '../../src/domain/entities/JournalVoucher';
import { Money } from '../../src/domain/value-objects/Money';
import { DocumentStatus } from '../../src/domain/enums/DocumentStatus';
import { DomainException } from '../../src/domain/common/DomainException';

describe('JournalVoucher Aggregate Root (Equilibrium Invariant & Maker-Checker)', () => {
  it('should calculate total debit and total credit correctly', () => {
    const jv = new JournalVoucher(
      'jv-01',
      '8100',
      'JV-2026-001',
      new Date(),
      'usr-acct-01',
      'Production chemicals expense'
    );

    jv.addDebitLine('l1', 'acc-501', '5010-001', 'Chemical Expenses', Money.from(50000));
    jv.addCreditLine('l2', 'acc-201', '2010-001', 'Accounts Payable', Money.from(50000));

    expect(jv.getTotalDebit().amount).toBe(50000);
    expect(jv.getTotalCredit().amount).toBe(50000);
    expect(jv.isBalanced()).toBe(true);
  });

  it('should throw DomainException when attempting to post in Draft status without approval', () => {
    const jv = new JournalVoucher(
      'jv-02',
      '8100',
      'JV-2026-002',
      new Date(),
      'usr-acct-01',
      'Unapproved Entry'
    );

    jv.addDebitLine('l1', 'acc-501', '5010-001', 'Raw Materials', Money.from(50000));
    jv.addCreditLine('l2', 'acc-201', '2010-001', 'Accounts Payable', Money.from(50000));

    expect(() => jv.postToLedger('usr-admin-01')).toThrow(DomainException);
    expect(() => jv.postToLedger('usr-admin-01')).toThrow(/Document must be APPROVED/);
    expect(jv.status).toBe(DocumentStatus.Draft);
  });

  it('should throw DomainException when attempting to post an out-of-balance approved voucher', () => {
    const jv = new JournalVoucher(
      'jv-03',
      '8100',
      'JV-2026-003',
      new Date(),
      'usr-acct-01',
      'Unbalanced Entry'
    );

    jv.addDebitLine('l1', 'acc-501', '5010-001', 'Raw Materials', Money.from(50000));
    jv.addCreditLine('l2', 'acc-201', '2010-001', 'Accounts Payable', Money.from(40000));

    jv.submit();
    jv.approve('usr-admin-01');

    expect(jv.isBalanced()).toBe(false);
    expect(jv.getDifference().amount).toBe(10000);

    expect(() => jv.postToLedger('usr-admin-01')).toThrow(DomainException);
    expect(() => jv.postToLedger('usr-admin-01')).toThrow(/out of balance/);
  });

  it('should successfully post a strictly balanced, approved Journal Voucher', () => {
    const jv = new JournalVoucher(
      'jv-04',
      '8100',
      'JV-2026-004',
      new Date(),
      'usr-acct-01',
      'Balanced Entry'
    );

    jv.addDebitLine('l1', 'acc-501', '5010-001', 'Chemicals', Money.from(112000));
    jv.addCreditLine('l2', 'acc-101', '1010-001', 'Cash in Bank', Money.from(112000));

    jv.submit();
    jv.review('usr-checker-01');
    jv.approve('usr-admin-01');

    jv.postToLedger('usr-admin-01');

    expect(jv.status).toBe(DocumentStatus.Posted);
    expect(jv.postedBy).toBe('usr-admin-01');
    expect(jv.getDomainEvents()).toHaveLength(1);
    expect(jv.getDomainEvents()[0].eventName).toBe('JournalVoucherPosted');
  });

  it('should reject lines with negative amounts', () => {
    const jv = new JournalVoucher('jv-05', '8100', 'JV-005', new Date(), 'usr-01');

    expect(() =>
      jv.addDebitLine('l1', 'acc-01', '1000', 'Title', Money.from(-500))
    ).toThrow(DomainException);
  });
});
