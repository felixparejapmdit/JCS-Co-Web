import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || '8100';
  const headers = tenantStore.glHeaders.get(tenantId) || [];
  const lines = tenantStore.glLines.get(tenantId) || [];
  const accounts = tenantStore.accounts.get(tenantId) || [];

  // Calculate Trial Balance totals
  const totalDebit = lines.reduce((s, l) => s + l.debitAmount, 0);
  const totalCredit = lines.reduce((s, l) => s + l.creditAmount, 0);

  // Group balances by account
  const accountBalances: Record<string, { accountName: string; accountType: string; normalBalance: string; totalDebit: number; totalCredit: number; netBalance: number }> = {};

  for (const acc of accounts) {
    accountBalances[acc.accountNumber] = {
      accountName: acc.accountName,
      accountType: acc.accountType,
      normalBalance: acc.normalBalance,
      totalDebit: 0,
      totalCredit: 0,
      netBalance: 0,
    };
  }

  for (const line of lines) {
    if (!accountBalances[line.accountNumber]) {
      accountBalances[line.accountNumber] = {
        accountName: 'General Account',
        accountType: 'Asset',
        normalBalance: 'DR',
        totalDebit: 0,
        totalCredit: 0,
        netBalance: 0,
      };
    }
    accountBalances[line.accountNumber].totalDebit += line.debitAmount;
    accountBalances[line.accountNumber].totalCredit += line.creditAmount;
  }

  // Calculate net balances based on normal balance
  for (const num of Object.keys(accountBalances)) {
    const item = accountBalances[num];
    if (item.normalBalance === 'DR') {
      item.netBalance = item.totalDebit - item.totalCredit;
    } else {
      item.netBalance = item.totalCredit - item.totalDebit;
    }
  }

  return NextResponse.json({
    success: true,
    tenantId,
    trialBalance: {
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      difference: totalDebit - totalCredit,
    },
    headers,
    lines,
    accountBalances,
  });
}
