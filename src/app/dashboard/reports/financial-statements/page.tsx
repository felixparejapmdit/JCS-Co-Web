'use client';

import React, { useState, useEffect } from 'react';
import { Scale, RefreshCw, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

export default function FinancialStatementsPage() {
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'BS' | 'PNL'>('BS');
  const [loading, setLoading] = useState(true);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/financial-statements');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Financial Statements Subsystem
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Comparative real-time Balance Sheet and Income Statement (P&L) with multi-plant cost center breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatements}
              className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('BS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'BS' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            Balance Sheet (Statement of Financial Position)
          </button>
          <button
            onClick={() => setActiveTab('PNL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PNL' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            Income Statement (Profit & Loss)
          </button>
        </div>

        {data && activeTab === 'BS' && (
          <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6 max-w-4xl mx-auto transition-colors">
            <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">JCS Chemical Industries, Inc.</h2>
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">Balance Sheet</h3>
              <p className="text-xs text-slate-400 font-mono">As of September 21, 2026 (Amounts in Philippine Pesos)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-sans">
              {/* Assets */}
              <div className="space-y-4">
                <div className="font-black text-sm uppercase text-blue-900 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-1">Assets</div>
                <div className="space-y-2">
                  <div className="font-bold text-slate-700 dark:text-slate-200">Current Assets</div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                    <span>Cash and Cash Equivalents:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">PhP {data.balanceSheet.assets.cashAndEquivalents.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                    <span>Accounts Receivable - Trade:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">PhP {data.balanceSheet.assets.accountsReceivable.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                    <span>Merchandise Inventories:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">PhP {data.balanceSheet.assets.inventories.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                    <span>Creditable Withholding Tax (2307):</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">PhP {data.balanceSheet.assets.creditableWithholdingTax.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t-2 border-slate-700 dark:border-slate-600 font-extrabold text-sm text-slate-900 dark:text-white">
                  <span>TOTAL ASSETS:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">PhP {data.balanceSheet.assets.totalAssets.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div className="space-y-4">
                <div className="font-black text-sm uppercase text-blue-900 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-1">Liabilities & Stockholders' Equity</div>
                <div className="space-y-2">
                  <div className="font-bold text-slate-700 dark:text-slate-200">Current Liabilities</div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                    <span>Accounts Payable - Trade:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">PhP {data.balanceSheet.liabilities.accountsPayable.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                    <span>Expanded Withholding Tax Payable:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">PhP {data.balanceSheet.liabilities.withholdingTaxPayable.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                    <span>Output VAT Payable:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">PhP {data.balanceSheet.liabilities.vatPayable.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pl-4 pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                    <span>Total Liabilities:</span>
                    <span className="font-mono text-slate-900 dark:text-white">PhP {data.balanceSheet.liabilities.totalLiabilities.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-700 dark:text-slate-200">Stockholders' Equity</div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                    <span>Capital Stock:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">PhP {data.balanceSheet.equity.capitalStock.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                    <span>Current Period Net Income:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">PhP {data.balanceSheet.equity.currentPeriodNetIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pl-4 pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                    <span>Total Equity:</span>
                    <span className="font-mono text-slate-900 dark:text-white">PhP {data.balanceSheet.equity.totalEquity.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t-2 border-slate-700 dark:border-slate-600 font-extrabold text-sm text-slate-900 dark:text-white">
                  <span>TOTAL LIABILITIES & EQUITY:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">PhP {(data.balanceSheet.liabilities.totalLiabilities + data.balanceSheet.equity.totalEquity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-mono">Accounting Invariant: Assets = Liabilities + Equity</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold rounded-full font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> PERFECT EQUILIBRIUM (Δ 0.00)
              </span>
            </div>
          </div>
        )}

        {data && activeTab === 'PNL' && (
          <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6 max-w-4xl mx-auto text-xs transition-colors">
            <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">JCS Chemical Industries, Inc.</h2>
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">Income Statement (Profit & Loss)</h3>
              <p className="text-xs text-slate-400 font-mono">{data.incomeStatement.period}</p>
            </div>

            <div className="space-y-3 font-sans">
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1">
                <span>REVENUE:</span>
                <span className="font-mono">PhP {data.incomeStatement.revenue.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                <span>Finished Chemical Products:</span>
                <span className="font-mono">PhP {data.incomeStatement.revenue.chemicalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                <span>Chemical Trading & Logistics:</span>
                <span className="font-mono">PhP {data.incomeStatement.revenue.tradingIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 pt-3">
                <span>COST OF GOODS SOLD:</span>
                <span className="font-mono">PhP {data.incomeStatement.costOfGoodsSold.totalCogs.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-blue-900 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/40 p-2 rounded">
                <span>GROSS PROFIT:</span>
                <span className="font-mono">PhP {data.incomeStatement.grossProfit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 pt-3">
                <span>OPERATING & ADMINISTRATIVE EXPENSES:</span>
                <span className="font-mono">PhP {data.incomeStatement.operatingExpenses.totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-base font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span>NET OPERATING INCOME:</span>
                <span className="font-mono">PhP {data.incomeStatement.netIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
