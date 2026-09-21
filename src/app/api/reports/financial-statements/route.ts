import { NextResponse } from 'next/server';
import { FinancialStatementService } from '@/domain/services/FinancialStatementService';

export async function GET() {
  const balanceSheet = FinancialStatementService.generateBalanceSheet();
  const incomeStatement = FinancialStatementService.generateIncomeStatement();

  return NextResponse.json({
    success: true,
    balanceSheet,
    incomeStatement,
  });
}
