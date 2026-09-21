'use client';

import React, { useState } from 'react';
import { Database, Download, Trash2, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function DataManagementPage() {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDataAction = async (action: 'LOAD_SAMPLE' | 'START_EMPTY') => {
    const confirmMsg =
      action === 'LOAD_SAMPLE'
        ? 'Load pre-configured sample accounting data for 8100 JCS, 8200 APF, and 8300 Chemag?'
        : 'WARNING: Clear all transactional vouchers and active entries to start from an empty state? (Chart of accounts and setup will be preserved).';

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/settings/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message });
      } else {
        setFeedback({ type: 'error', message: json.error || 'Action failed.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Data Management & System Reset
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Initialize demonstration data or start with a clean ledger for live accounting operations.
          </p>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Load Sample Data */}
          <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Load Sample Demo Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Populates the multi-tenant store with complete demo datasets across:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 mt-3 space-y-1 list-disc list-inside">
                <li>JCS Chemical Industries (8100) — Solvent manufacturing</li>
                <li>APF Corporation (8200) — Milling & agricultural feeds</li>
                <li>Chemag Trading (8300) — Bulk chemical distribution</li>
                <li>Pre-balanced Journal Vouchers & General Ledger postings</li>
                <li>Vendors, Customers, Bank accounts & Employee rosters</li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDataAction('LOAD_SAMPLE')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Load Sample Data</span>
              </button>
            </div>
          </div>

          {/* Card 2: Start Empty */}
          <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Start Empty / Blank Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Clears all sample transactional data to prepare the system for clean, genuine corporate entry:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 mt-3 space-y-1 list-disc list-inside">
                <li>Wipes Journal Vouchers, GL Postings & Payables</li>
                <li>Wipes Cashiering receipts & temporary batches</li>
                <li>Wipes Payroll runs and test payslips</li>
                <li>Preserves standard Chart of Accounts & User logins</li>
                <li>Leaves the system clean for Day 1 production use</li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDataAction('START_EMPTY')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-rose-500/20 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Start Empty (Clear Data)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
