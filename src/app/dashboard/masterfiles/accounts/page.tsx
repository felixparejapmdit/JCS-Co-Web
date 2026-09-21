'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { PlusCircle, BookOpen, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface AccountRow {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  normalBalance: string;
  isHeader: boolean;
  isActive: boolean;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('Asset');
  const [isHeader, setIsHeader] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/masterfiles/accounts', {
        headers: { 'x-tenant-id': tid },
      });
      const json = await res.json();
      if (json.success) {
        setAccounts(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/masterfiles/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tid,
        },
        body: JSON.stringify({
          accountNumber,
          accountName,
          accountType,
          isHeader,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to create account.');
      } else {
        setSuccess(`Account ${json.data.accountNumber} successfully added to Chart of Accounts.`);
        setShowModal(false);
        setAccountNumber('');
        setAccountName('');
        fetchAccounts();
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving account.');
    }
  };

  const columns: ColumnDef<AccountRow>[] = [
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
      header: 'Account Description',
      accessorKey: 'accountName',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className={`${row.isHeader ? 'font-bold text-white' : 'text-slate-200'}`}>
            {row.accountName}
          </span>
          {row.isHeader && (
            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-amber-900/40 text-amber-300 rounded border border-amber-800/60">
              Header
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Classification',
      accessorKey: 'accountType',
      cell: (row) => {
        const typeColors: Record<string, string> = {
          Asset: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
          Liability: 'bg-rose-950/60 text-rose-300 border-rose-800',
          Equity: 'bg-indigo-950/60 text-indigo-300 border-indigo-800',
          Revenue: 'bg-teal-950/60 text-teal-300 border-teal-800',
          CostOfGoodsSold: 'bg-amber-950/60 text-amber-300 border-amber-800',
          Expense: 'bg-purple-950/60 text-purple-300 border-purple-800',
        };
        return (
          <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${typeColors[row.accountType] || 'bg-slate-800 text-slate-300'}`}>
            {row.accountType}
          </span>
        );
      },
    },
    {
      header: 'Normal Balance',
      accessorKey: 'normalBalance',
      align: 'center',
      cell: (row) => (
        <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${row.normalBalance === 'DR' ? 'bg-blue-900/60 text-blue-300' : 'bg-amber-900/60 text-amber-300'}`}>
          {row.normalBalance}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      align: 'center',
      cell: (row) => (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${row.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Chart of Accounts (COA)</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Hierarchical general ledger account architecture with automated prefix validation and normal balance governance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAccounts}
              className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
              title="Refresh Accounts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Add Account
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* DataGrid Component */}
        <DataGrid
          data={accounts}
          columns={columns}
          searchPlaceholder="Search by account number, title, or type..."
          searchFields={['accountNumber', 'accountName', 'accountType']}
          pageSize={12}
        />

      {/* Account Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A1E] border border-slate-200 dark:border-slate-700/80 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-500" /> New General Ledger Account
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Classification
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="Asset">Asset (Prefix 1xxx - Normal DR)</option>
                  <option value="Liability">Liability (Prefix 2xxx - Normal CR)</option>
                  <option value="Equity">Equity (Prefix 3xxx - Normal CR)</option>
                  <option value="Revenue">Revenue (Prefix 4xxx - Normal CR)</option>
                  <option value="CostOfGoodsSold">Cost of Goods Sold (Prefix 5xxx - Normal DR)</option>
                  <option value="Expense">Operating Expense (Prefix 6xxx - Normal DR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Code / Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1010-001 or 6010-002"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  OOP Rule: Account prefix digit must match the classification type.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Title / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw Material Storage - Resin"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isHeader"
                  checked={isHeader}
                  onChange={(e) => setIsHeader(e.target.checked)}
                  className="rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                />
                <label htmlFor="isHeader" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  Is Header Group Account (Header accounts cannot receive direct voucher postings)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Create GL Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
