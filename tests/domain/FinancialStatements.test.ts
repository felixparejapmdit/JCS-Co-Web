import { describe, it, expect } from 'vitest';
import { FinancialStatementService } from '../../src/domain/services/FinancialStatementService';

describe('FinancialStatementService (Balance Sheet & Income Statement Equilibrium)', () => {
  it('should generate a strictly balanced Balance Sheet (Assets == Liabilities + Equity)', () => {
    const bs = FinancialStatementService.generateBalanceSheet();
    expect(bs.isBalanced).toBe(true);
    expect(bs.difference).toBeCloseTo(0, 2);
    expect(bs.assets.totalAssets).toBe(bs.liabilities.totalLiabilities + bs.equity.totalEquity);
  });

  it('should generate Income Statement matching user screenshot KPIs', () => {
    const pnl = FinancialStatementService.generateIncomeStatement(14850230.15, 6112450.0);
    expect(pnl.revenue.totalRevenue).toBe(14850230.15);
    expect(pnl.operatingExpenses.totalExpenses).toBe(6112450.0);
    expect(pnl.netIncome).toBe(8737780.15); // Matches PhP 8,737,780.15 in user screenshot!
  });

  it('should provide AP Aging categorized into aging buckets', () => {
    const aging = FinancialStatementService.generateApAging();
    expect(aging.length).toBeGreaterThan(0);
    const petron = aging.find((a) => a.entityCode === 'V-PETRON');
    expect(petron).toBeDefined();
    expect(petron?.current).toBe(450000);
    expect(petron?.days31To60).toBe(1250500);
  });
});
