'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Scale, RefreshCw, CheckCircle2, TrendingUp, BookOpen, Layers, ShieldCheck } from 'lucide-react';

interface GlLineDisplay {
  id: string;
  batchNumber: string;
  documentNumber: string;
  documentDate: string;
  accountNumber: string;
  accountName: string;
  costCenterCode?: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

interface AccountSummary {
  accountNumber: string;
  accountName: string;
  accountType: string;
  normalBalance: string;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

export default function GeneralLedgerPage() {
  const [lines, setLines] = useState<GlLineDisplay[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountSummary[]>([]);
  const [trialBalance, setTrialBalance] = useState<{ totalDebit: number; totalCredit: number; isBalanced: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'ENTRIES' | 'SUMMARY'>('SUMMARY');
  const [yearEndResult, setYearEndResult] = useState<any | null>(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/gl/ledger', {
        headers: { 'x-tenant-id': tid },
      });
      const json = await res.json();
      if (json.success) {
        setTrialBalance(json.trialBalance);

        // Flatten lines with header metadata
        const headersMap = new Map(json.headers.map((h: any) => [h.id, h]));
        const enrichedLines: GlLineDisplay[] = json.lines.map((l: any) => {
          const h: any = headersMap.get(l.glHeaderId) || {};
          return {
            id: l.id,
            batchNumber: h.batchNumber || 'GL-BATCH',
            documentNumber: h.documentNumber || 'JV-REF',
            documentDate: h.documentDate ? String(h.documentDate).slice(0, 10) : '2026-09-10',
            accountNumber: l.accountNumber,
            accountName: json.accountBalances[l.accountNumber]?.accountName || 'Account',
            costCenterCode: l.costCenterCode,
            debitAmount: l.debitAmount,
            creditAmount: l.creditAmount,
            description: l.description,
          };
        });
        setLines(enrichedLines);

        const summaryList: AccountSummary[] = Object.entries(json.accountBalances).map(([num, val]: [string, any]) => ({
          accountNumber: num,
          accountName: val.accountName,
          accountType: val.accountType,
          normalBalance: val.normalBalance,
          totalDebit: val.totalDebit,
          totalCredit: val.totalCredit,
          netBalance: val.netBalance,
        }));
        setAccountBalances(summaryList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const simulateYearEndClosing = () => {
    // Collect revenue and expenses
    const revAndExp = accountBalances
      .filter((a) => a.accountType === 'Revenue' || a.accountType === 'CostOfGoodsSold' || a.accountType === 'Expense')
      .map((a) => ({
        accountNumber: a.accountNumber,
        accountName: a.accountName,
        accountType: a.accountType as any,
        balance: Math.abs(a.netBalance),
      }));

    let totalRev = 0;
    let totalExp = 0;
    for (const item of revAndExp) {
      if (item.accountType === 'Revenue') totalRev += item.balance;
      else totalExp += item.balance;
    }
    const net = totalRev - totalExp;

    setYearEndResult({
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      netIncome: net,
      retainedEarningsTransfer: net,
    });
  };

  const summaryColumns: ColumnDef<AccountSummary>[] = [
    {
      header: 'Account Number',
      accessorKey: 'accountNumber',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-400">
          {row.accountNumber}
        </span>
      ),
    },
    {
      header: 'Account Name',
      accessorKey: 'accountName',
      cell: (row) => (
        <span className="font-semibold text-white">{row.accountName}</span>
      ),
    },
    {
      header: 'Classification',
      accessorKey: 'accountType',
      cell: (row) => (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300">
          {row.accountType}
        </span>
      ),
    },
    {
      header: 'Normal',
      accessorKey: 'normalBalance',
      align: 'center',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-slate-400">
          {row.normalBalance}
        </span>
      ),
    },
    {
      header: 'Total Debit (PHP)',
      accessorKey: 'totalDebit',
      align: 'right',
      cell: (row) => (
        <span className="font-mono text-xs text-emerald-400">
          {row.totalDebit > 0 ? row.totalDebit.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}
        </span>
      ),
    },
    {
      header: 'Total Credit (PHP)',
      accessorKey: 'totalCredit',
      align: 'right',
      cell: (row) => (
        <span className="font-mono text-xs text-amber-400">
          {row.totalCredit > 0 ? row.totalCredit.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}
        </span>
      ),
    },
    {
      header: 'Net Running Balance (PHP)',
      accessorKey: 'netBalance',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-white">
          {row.netBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const entryColumns: ColumnDef<GlLineDisplay>[] = [
    {
      header: 'Date',
      accessorKey: 'documentDate',
      cell: (row) => <span className="font-mono text-xs text-slate-300">{row.documentDate}</span>,
    },
    {
      header: 'Batch Reference',
      accessorKey: 'batchNumber',
      cell: (row) => <span className="font-mono text-xs font-bold text-blue-400">{row.batchNumber}</span>,
    },
    {
      header: 'Voucher #',
      accessorKey: 'documentNumber',
      cell: (row) => <span className="font-mono text-xs text-slate-200">{row.documentNumber}</span>,
    },
    {
      header: 'Account',
      accessorKey: 'accountNumber',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-mono font-bold text-slate-200">{row.accountNumber}</span>
          <span className="text-slate-400 ml-1.5">{row.accountName}</span>
        </div>
      ),
    },
    {
      header: 'Description / Line Memo',
      accessorKey: 'description',
      cell: (row) => <span className="text-xs text-slate-300">{row.description}</span>,
    },
    {
      header: 'Debit (PHP)',
      accessorKey: 'debitAmount',
      align: 'right',
      cell: (row) => (
        <span className="font-mono text-xs text-emerald-400 font-bold">
          {row.debitAmount > 0 ? row.debitAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}
        </span>
      ),
    },
    {
      header: 'Credit (PHP)',
      accessorKey: 'creditAmount',
      align: 'right',
      cell: (row) => (
        <span className="font-mono text-xs text-amber-400 font-bold">
          {row.creditAmount > 0 ? row.creditAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">General Ledger & Trial Balance</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Atomic immutable ledger entries with real-time debit/credit running balances and year-end retained earnings routine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLedger}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
              title="Refresh Ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={simulateYearEndClosing}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-indigo-500/20 transition-colors"
            >
              <TrendingUp className="w-4 h-4" /> Simulate Year-End Closing
            </button>
          </div>
        </div>

        {/* Trial Balance Health Bar */}
        {trialBalance && (
          <div className="bg-white dark:bg-[#16161A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 transition-colors">
            <div className="border-r border-slate-200 dark:border-slate-800/80 pr-4">
              <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 block">Total Ledger Debits</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                PHP {trialBalance.totalDebit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-r border-slate-200 dark:border-slate-800/80 pr-4">
              <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 block">Total Ledger Credits</span>
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                PHP {trialBalance.totalCredit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 block">Trial Balance Equilibrium</span>
              <div className="flex items-center gap-2 mt-1">
                {trialBalance.isBalanced ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-xs rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    PERFECT EQUILIBRIUM (Δ 0.00)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-bold font-mono text-xs rounded-full">
                    OUT OF BALANCE
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Year End Simulation Drawer */}
        {yearEndResult && (
          <div className="bg-indigo-950/40 border border-indigo-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
              <div className="flex items-center gap-2 font-bold text-indigo-200 text-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Year-End Retained Earnings Closing Preview (FY 2026)
              </div>
              <button
                onClick={() => setYearEndResult(null)}
                className="text-indigo-400 hover:text-white text-xs font-mono"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Total Operating Revenue (4xxx):</span>
                <span className="text-emerald-400 font-bold text-sm">PHP {yearEndResult.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total COGS & Expenses (5xxx/6xxx):</span>
                <span className="text-amber-400 font-bold text-sm">PHP {yearEndResult.totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Net Transfer to Retained Earnings (3010-000):</span>
                <span className="text-indigo-300 font-bold text-sm">PHP {yearEndResult.retainedEarningsTransfer.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveView('SUMMARY')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeView === 'SUMMARY'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Account Running Balances (Trial Balance)
          </button>
          <button
            onClick={() => setActiveView('ENTRIES')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeView === 'ENTRIES'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Detailed GL Posting Lines ({lines.length} Records)
          </button>
        </div>

        {/* Table Display */}
        {activeView === 'SUMMARY' ? (
          <DataGrid
            data={accountBalances}
            columns={summaryColumns}
            searchPlaceholder="Filter accounts by number, title, or type..."
            searchFields={['accountNumber', 'accountName', 'accountType']}
            pageSize={15}
          />
        ) : (
          <DataGrid
            data={lines}
            columns={entryColumns}
            searchPlaceholder="Search posting lines by batch, voucher, or account..."
            searchFields={['batchNumber', 'documentNumber', 'accountNumber', 'description']}
            pageSize={10}
          />
        )}
      </div>
    </>
  );
}
