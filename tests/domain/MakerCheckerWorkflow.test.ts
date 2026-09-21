import { describe, it, expect } from 'vitest';
import { JournalVoucher } from '../../src/domain/entities/JournalVoucher';
import { Money } from '../../src/domain/value-objects/Money';
import { DocumentStatus } from '../../src/domain/enums/DocumentStatus';
import { DomainException } from '../../src/domain/common/DomainException';

describe('Maker-Checker Segregation of Duties & Workflow', () => {
  it('should enforce that the Maker cannot review their own document', () => {
    const jv = new JournalVoucher(
      'jv-mc-01',
      '8100',
      'JV-2026-010',
      new Date(),
      'usr-acct-01', // Maker: Juan Dela Cruz
      'Chemical Acquisition'
    );

    jv.addDebitLine('l1', 'acc-501', '5010-000', 'Raw Materials', Money.from(25000));
    jv.addCreditLine('l2', 'acc-201', '2000-000', 'Accounts Payable', Money.from(25000));

    jv.submit();
    expect(jv.status).toBe(DocumentStatus.Submitted);

    // Maker tries to review own document
    expect(() => jv.review('usr-acct-01')).toThrow(DomainException);
    expect(() => jv.review('usr-acct-01')).toThrow(/Segregation of duties violation/);
  });

  it('should enforce that the Maker cannot approve their own document', () => {
    const jv = new JournalVoucher(
      'jv-mc-02',
      '8100',
      'JV-2026-011',
      new Date(),
      'usr-acct-01', // Maker
      'Chemical Acquisition'
    );

    jv.addDebitLine('l1', 'acc-501', '5010-000', 'Raw Materials', Money.from(15000));
    jv.addCreditLine('l2', 'acc-201', '2000-000', 'Accounts Payable', Money.from(15000));

    jv.submit();
    jv.review('usr-checker-01'); // Reviewed by Checker

    // Maker tries to approve own document
    expect(() => jv.approve('usr-acct-01')).toThrow(DomainException);
    expect(() => jv.approve('usr-acct-01')).toThrow(/Maker cannot approve their own financial document/);

    // Authorized CPA / Finance Head approves
    jv.approve('usr-admin-01');
    expect(jv.status).toBe(DocumentStatus.Approved);
    expect(jv.approvedBy).toBe('usr-admin-01');
  });

  it('should handle rejection workflow with mandatory reason and resubmission', () => {
    const jv = new JournalVoucher(
      'jv-mc-03',
      '8100',
      'JV-2026-012',
      new Date(),
      'usr-acct-01',
      'Expense Entry'
    );

    jv.addDebitLine('l1', 'acc-601', '6000-000', 'Office Expenses', Money.from(5000));
    jv.addCreditLine('l2', 'acc-101', '1010-000', 'Cash in Bank', Money.from(5000));

    jv.submit();

    // Rejection without reason fails
    expect(() => jv.reject('usr-admin-01', '')).toThrow(DomainException);

    // Rejection with reason
    jv.reject('usr-admin-01', 'Missing official receipt attachment');
    expect(jv.status).toBe(DocumentStatus.Rejected);
    expect(jv.rejectionReason).toBe('Missing official receipt attachment');

    // Resubmission moves back to Submitted
    jv.submit();
    expect(jv.status).toBe(DocumentStatus.Submitted);
    expect(jv.rejectionReason).toBeUndefined();
  });
});
