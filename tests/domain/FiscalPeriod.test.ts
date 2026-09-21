import { describe, it, expect } from 'vitest';
import { FiscalPeriod } from '../../src/domain/entities/FiscalPeriod';
import { DomainException } from '../../src/domain/common/DomainException';

describe('FiscalPeriod Entity & Governance', () => {
  it('should initialize an OPEN fiscal period and allow valid transaction dates', () => {
    const period = new FiscalPeriod({
      id: 'fp-2026-09',
      fiscalYear: 2026,
      fiscalMonth: 9,
      periodName: 'September 2026',
      dateFrom: new Date('2026-09-01T00:00:00Z'),
      dateTo: new Date('2026-09-30T23:59:59Z'),
      createdBy: 'admin',
    });

    expect(period.status).toBe('OPEN');
    expect(period.isOpen()).toBe(true);

    // Valid date within September 2026
    expect(() =>
      period.assertAllowsPosting(new Date('2026-09-15T10:00:00Z'))
    ).not.toThrow();
  });

  it('should throw DomainException if transaction date is outside period bounds', () => {
    const period = new FiscalPeriod({
      id: 'fp-2026-09',
      fiscalYear: 2026,
      fiscalMonth: 9,
      periodName: 'September 2026',
      dateFrom: new Date('2026-09-01T00:00:00Z'),
      dateTo: new Date('2026-09-30T23:59:59Z'),
      createdBy: 'admin',
    });

    // Date from August 2026
    expect(() =>
      period.assertAllowsPosting(new Date('2026-08-31T23:59:59Z'))
    ).toThrow(DomainException);
    expect(() =>
      period.assertAllowsPosting(new Date('2026-08-31T23:59:59Z'))
    ).toThrow(/falls outside period range/);
  });

  it('should reject postings when closed, but allow reopening with valid audit reason', () => {
    const period = new FiscalPeriod({
      id: 'fp-2026-08',
      fiscalYear: 2026,
      fiscalMonth: 8,
      periodName: 'August 2026',
      dateFrom: new Date('2026-08-01T00:00:00Z'),
      dateTo: new Date('2026-08-31T23:59:59Z'),
      createdBy: 'admin',
    });

    period.close('usr-admin-01');
    expect(period.status).toBe('CLOSED');
    expect(period.closedBy).toBe('usr-admin-01');

    // Attempting to post to a closed period
    expect(() =>
      period.assertAllowsPosting(new Date('2026-08-15T12:00:00Z'))
    ).toThrow(DomainException);
    expect(() =>
      period.assertAllowsPosting(new Date('2026-08-15T12:00:00Z'))
    ).toThrow(/is CLOSED/);

    // Reopening without reason should fail
    expect(() => period.reopen('usr-admin-01', '')).toThrow(DomainException);

    // Reopening with proper reason succeeds
    period.reopen('usr-admin-01', 'Late BIR withholding tax adjustment authorized by CFO');
    expect(period.status).toBe('OPEN');
  });

  it('should permanently forbid reopening a statutory LOCKED period', () => {
    const period = new FiscalPeriod({
      id: 'fp-2025-12',
      fiscalYear: 2025,
      fiscalMonth: 12,
      periodName: 'December 2025',
      dateFrom: new Date('2025-12-01T00:00:00Z'),
      dateTo: new Date('2025-12-31T23:59:59Z'),
      createdBy: 'admin',
    });

    period.lock('usr-admin-01');
    expect(period.isLocked()).toBe(true);

    expect(() =>
      period.reopen('usr-admin-01', 'Trying to adjust audited year')
    ).toThrow(DomainException);
    expect(() =>
      period.reopen('usr-admin-01', 'Trying to adjust audited year')
    ).toThrow(/statutory locked period/i);
  });
});
