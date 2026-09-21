'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import {
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Send,
  CheckCheck,
  Award,
  BookMarked,
  XCircle,
  Eye,
  Trash2
} from 'lucide-react';

interface JVLine {
  id: string;
  lineNumber: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo: string;
  costCenterId?: string;
}

interface JVRow {
  id: string;
  documentNumber: string;
  documentDate: string;
  explanation: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'POSTED' | 'REJECTED' | 'VOID';
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  postedBy?: string;
  postedAt?: string;
  rejectionReason?: string;
  lines: JVLine[];
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<JVRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedVoucher, setSelectedVoucher] = useState<JVRow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: string; num: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New Voucher Form
  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [lines, setLines] = useState<Array<{ accountCode: string; accountName: string; debit: number; credit: number; memo: string; costCenterId: string }>>([
    { accountCode: '6010-000', accountName: 'Plant Utilities', debit: 50000, credit: 0, memo: 'Valenzuela Plant Electricity', costCenterId: '03-PRD' },
    { accountCode: '1010-000', accountName: 'Cash in Bank', debit: 0, credit: 50000, memo: 'Operating checking payment', costCenterId: '01-ADM' },
  ]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/vouchers/jv', {
        headers: { 'x-tenant-id': tid },
      });
      const json = await res.json();
      if (json.success) {
        setVouchers(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleWorkflowAction = async (id: string, action: 'SUBMIT' | 'REVIEW' | 'APPROVE' | 'REJECT', reason?: string) => {
    setError(null);
    setSuccess(null);

    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const actor = localStorage.getItem('aos100_user') || 'Maria Santos, CPA';
      const res = await fetch(`/api/vouchers/jv/${id}/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tid,
        },
        body: JSON.stringify({ action, actor, reason }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || `Workflow action '${action}' failed.`);
      } else {
        setSuccess(`Voucher ${json.voucher.documentNumber} updated to status '${json.voucher.status}'.`);
        setRejectModal(null);
        setRejectReason('');
        fetchVouchers();
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during workflow transition.');
    }
  };

  const handlePostToGl = async (voucherId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const actor = localStorage.getItem('aos100_user') || 'Maria Santos, CPA';
      const res = await fetch('/api/gl/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tid,
        },
        body: JSON.stringify({ voucherId, actor }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to post voucher to General Ledger.');
      } else {
        setSuccess(json.message);
        fetchVouchers();
      }
    } catch (err: any) {
      setError(err.message || 'GL Posting execution error.');
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const actor = localStorage.getItem('aos100_user') || 'Juan Dela Cruz';
      const res = await fetch('/api/vouchers/jv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tid,
        },
        body: JSON.stringify({
          documentNumber: docNumber,
          documentDate: docDate,
          remarks,
          lines,
          actor,
          autoSubmit,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to save Journal Voucher.');
      } else {
        setSuccess(json.message);
        setShowCreateModal(false);
        setDocNumber('');
        setRemarks('');
        fetchVouchers();
      }
    } catch (err: any) {
      setError(err.message || 'Error creating voucher.');
    }
  };

  // Filtered Vouchers by Tab
  const filteredVouchers = vouchers.filter((v) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'DRAFT') return v.status === 'DRAFT' || v.status === 'REJECTED';
    if (activeTab === 'REVIEW') return v.status === 'SUBMITTED';
    if (activeTab === 'APPROVE') return v.status === 'REVIEWED';
    if (activeTab === 'READY_POST') return v.status === 'APPROVED';
    if (activeTab === 'POSTED') return v.status === 'POSTED';
    return true;
  });

  const columns: ColumnDef<JVRow>[] = [
    {
      header: 'Voucher Number',
      accessorKey: 'documentNumber',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-400">
          {row.documentNumber}
        </span>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'documentDate',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.documentDate}
        </span>
      ),
    },
    {
      header: 'Explanation / Memo',
      accessorKey: 'explanation',
      cell: (row) => (
        <div>
          <div className="font-semibold text-white text-xs">{row.explanation}</div>
          {row.rejectionReason && (
            <div className="text-[11px] text-rose-400 mt-0.5">
              ⚠️ Rejection Note: {row.rejectionReason}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Amount (PHP)',
      accessorKey: 'totalDebit',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-100">
          {row.totalDebit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Workflow Stage',
      accessorKey: 'status',
      align: 'center',
      cell: (row) => {
        const badgeStyles: Record<string, string> = {
          DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
          SUBMITTED: 'bg-blue-950/80 text-blue-300 border-blue-800',
          REVIEWED: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
          APPROVED: 'bg-amber-950/80 text-amber-300 border-amber-800',
          POSTED: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          REJECTED: 'bg-rose-950/80 text-rose-300 border-rose-800',
        };
        return (
          <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${badgeStyles[row.status] || 'bg-slate-800 text-slate-300'}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedVoucher(row)}
            className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            title="Inspect Line Entries"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Maker-Checker Workflow Action Buttons */}
          {(row.status === 'DRAFT' || row.status === 'REJECTED') && (
            <button
              onClick={() => handleWorkflowAction(row.id, 'SUBMIT')}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1"
              title="Submit for Review"
            >
              <Send className="w-3 h-3" /> Submit
            </button>
          )}

          {row.status === 'SUBMITTED' && (
            <>
              <button
                onClick={() => handleWorkflowAction(row.id, 'REVIEW')}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                title="Mark Reviewed by Checker"
              >
                <CheckCheck className="w-3 h-3" /> Review
              </button>
              <button
                onClick={() => setRejectModal({ id: row.id, num: row.documentNumber })}
                className="p-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded"
                title="Reject with Note"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {row.status === 'REVIEWED' && (
            <>
              <button
                onClick={() => handleWorkflowAction(row.id, 'APPROVE')}
                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                title="Approve (Finance Head)"
              >
                <Award className="w-3 h-3" /> Approve
              </button>
              <button
                onClick={() => setRejectModal({ id: row.id, num: row.documentNumber })}
                className="p-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded"
                title="Reject with Note"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {row.status === 'APPROVED' && (
            <button
              onClick={() => handlePostToGl(row.id)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-500/20"
              title="Post to General Ledger"
            >
              <BookMarked className="w-3.5 h-3.5" /> Post to GL
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Journal Voucher Console (Form 052)</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Double-entry balanced accounting vouchers with strict Maker-Checker segregation of duties before atomic GL posting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchVouchers}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
              title="Refresh Vouchers"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                setDocNumber(`JV-2026-${Math.floor(100 + Math.random() * 900)}`);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-blue-500/20 transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> New Journal Voucher
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {success && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Maker-Checker Workflow Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Vouchers' },
            { id: 'DRAFT', label: 'Drafts & Rejected' },
            { id: 'REVIEW', label: 'Pending Review (Checker)' },
            { id: 'APPROVE', label: 'Pending Approval (Finance Head)' },
            { id: 'READY_POST', label: 'Ready to Post' },
            { id: 'POSTED', label: 'Posted Archive' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DataGrid Component */}
        <DataGrid
          data={filteredVouchers}
          columns={columns}
          searchPlaceholder="Search by voucher number, explanation, or status..."
          searchFields={['documentNumber', 'explanation', 'status']}
          pageSize={10}
        />

        {/* Voucher Line Item Inspector Drawer */}
        {selectedVoucher && (
          <div className="bg-white dark:bg-[#16161A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Line Items for {selectedVoucher.documentNumber} ({selectedVoucher.explanation})
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 text-left">#</th>
                    <th className="py-2 text-left">Account Code</th>
                    <th className="py-2 text-left">Description</th>
                    <th className="py-2 text-left">Cost Center</th>
                    <th className="py-2 text-right">Debit (PHP)</th>
                    <th className="py-2 text-right">Credit (PHP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {selectedVoucher.lines.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2 text-slate-400">{l.lineNumber}</td>
                      <td className="py-2 text-blue-600 dark:text-blue-400 font-bold">{l.accountCode}</td>
                      <td className="py-2 text-slate-700 dark:text-slate-200 font-sans">{l.accountName} - {l.memo}</td>
                      <td className="py-2 text-slate-400">{l.costCenterId || '—'}</td>
                      <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        {l.debit > 0 ? l.debit.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="py-2 text-right text-amber-600 dark:text-amber-400 font-bold">
                        {l.credit > 0 ? l.credit.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                    <td colSpan={4} className="py-2 text-right">Equilibrium Total:</td>
                    <td className="py-2 text-right text-emerald-600 dark:text-emerald-400">
                      {selectedVoucher.totalDebit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 text-right text-amber-600 dark:text-amber-400">
                      {selectedVoucher.totalCredit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A1E] border border-slate-200 dark:border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" /> Reject Voucher {rejectModal.num}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Provide a mandatory explanation for audit trail compliance. The voucher will return to the Maker for correction.
            </p>
            <textarea
              required
              rows={3}
              placeholder="e.g. Please attach vendor delivery receipt or correct withholding tax rate..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100"
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWorkflowAction(rejectModal.id, 'REJECT', rejectReason)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Voucher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A1E] border border-slate-200 dark:border-slate-700/80 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-500" /> Create Balanced Journal Voucher
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Voucher Number
                  </label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Document Date
                  </label>
                  <input
                    type="date"
                    required
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Accounting Explanation / Memo
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accrual of warehouse lease rental"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Line items mini grid */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Double-Entry Line Items (DR = CR Strict Equilibrium)
                </span>
                {lines.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 text-xs font-mono items-center">
                    <input
                      type="text"
                      value={l.accountCode}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].accountCode = e.target.value;
                        setLines(newLines);
                      }}
                      className="col-span-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      placeholder="Line Memo"
                      value={l.memo}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].memo = e.target.value;
                        setLines(newLines);
                      }}
                      className="col-span-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="number"
                      placeholder="Debit"
                      value={l.debit || ''}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].debit = Number(e.target.value || 0);
                        if (newLines[idx].debit > 0) newLines[idx].credit = 0;
                        setLines(newLines);
                      }}
                      className="col-span-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-right text-emerald-600 dark:text-emerald-400 font-bold"
                    />
                    <input
                      type="number"
                      placeholder="Credit"
                      value={l.credit || ''}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].credit = Number(e.target.value || 0);
                        if (newLines[idx].credit > 0) newLines[idx].debit = 0;
                        setLines(newLines);
                      }}
                      className="col-span-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-right text-amber-600 dark:text-amber-400 font-bold"
                    />
                  </div>
                ))}
              </div>

              {/* Equilibrium Readout */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-xs font-mono">
                <div className="text-slate-700 dark:text-slate-300">
                  Total Debit: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{lines.reduce((s, l) => s + l.debit, 0).toFixed(2)}</span>
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  Total Credit: <span className="text-amber-600 dark:text-amber-400 font-bold">{lines.reduce((s, l) => s + l.credit, 0).toFixed(2)}</span>
                </div>
                <div>
                  {lines.reduce((s, l) => s + l.debit, 0) === lines.reduce((s, l) => s + l.credit, 0) ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ BALANCED</span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">✗ UNBALANCED</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  Save & Submit Voucher
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
