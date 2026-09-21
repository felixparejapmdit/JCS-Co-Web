'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck2, Lock, Unlock, ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

interface FiscalPeriodRow {
  id: string;
  fiscalYear: number;
  fiscalMonth: number;
  periodName: string;
  dateFrom: string;
  dateTo: string;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
  closedBy?: string;
  closedAt?: string;
}

export default function FiscalPeriodsPage() {
  const [periods, setPeriods] = useState<FiscalPeriodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ period: FiscalPeriodRow; type: 'CLOSE' | 'REOPEN' } | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/fiscal-periods', {
        headers: { 'x-tenant-id': tid },
      });
      const json = await res.json();
      if (json.success) {
        setPeriods(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handlePeriodAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;

    setError(null);
    setSuccess(null);

    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const actor = localStorage.getItem('aos100_user') || 'Maria Santos, CPA';
      const res = await fetch('/api/fiscal-periods/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tid,
        },
        body: JSON.stringify({
          periodId: actionModal.period.id,
          action: actionModal.type,
          actor,
          reason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to update fiscal period status.');
      } else {
        setSuccess(json.message);
        setActionModal(null);
        setReason('');
        fetchPeriods();
      }
    } catch (err: any) {
      setError(err.message || 'Error executing period transition.');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Fiscal Period Controller</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Statutory accounting period governance (`gltransmonstatus`). Enforces atomic locking against unauthorized post-closing modifications.
            </p>
          </div>

          <button
            onClick={fetchPeriods}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            title="Refresh Periods"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Feedback Alerts */}
        {success && (
          <div className="p-3.5 bg-emerald-950/70 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Fiscal Period Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {periods.map((p) => {
            const isOpen = p.status === 'OPEN';
            const isLocked = p.status === 'LOCKED';

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-[#16161A] border rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isOpen
                    ? 'border-emerald-300 dark:border-emerald-700/60 ring-1 ring-emerald-500/20'
                    : isLocked
                    ? 'border-rose-300 dark:border-rose-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                      FY {p.fiscalYear} • Month {p.fiscalMonth}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold font-mono rounded-full border ${
                        isOpen
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                          : isLocked
                          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : isLocked ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      {p.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{p.periodName}</h3>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                      {p.dateFrom} to {p.dateTo}
                    </p>
                  </div>

                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {p.status === 'CLOSED' ? (
                      <div>
                        Closed by: <span className="text-slate-800 dark:text-slate-200 font-semibold">{p.closedBy || 'System'}</span>
                        <div className="text-[11px] text-slate-400">{p.closedAt?.slice(0, 16).replace('T', ' ')}</div>
                      </div>
                    ) : (
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Voucher Posting & GL Updates Active
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  {isOpen ? (
                    <button
                      onClick={() => setActionModal({ period: p, type: 'CLOSE' })}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-600/20 dark:hover:bg-amber-600/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" /> Execute Month-End Close
                    </button>
                  ) : !isLocked ? (
                    <button
                      onClick={() => setActionModal({ period: p, type: 'REOPEN' })}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Unlock className="w-3.5 h-3.5" /> Authorize Period Reopen
                    </button>
                  ) : (
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-mono flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Statutory Audit Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      {/* Close/Reopen Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A1E] border border-slate-200 dark:border-slate-700/80 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {actionModal.type === 'CLOSE' ? (
                  <>
                    <Lock className="w-5 h-5 text-amber-500" /> Close Fiscal Period — {actionModal.period.periodName}
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5 text-blue-500" /> Reopen Fiscal Period — {actionModal.period.periodName}
                  </>
                )}
              </h2>
              <button
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePeriodAction} className="space-y-4">
              {actionModal.type === 'CLOSE' ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 rounded-lg text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong>Month-End Closing Pre-Flight Check:</strong>
                  <ul className="list-disc ml-4 mt-1 space-y-0.5 text-slate-700 dark:text-slate-300">
                    <li>The system will verify that all Journal Vouchers are Posted or Voided.</li>
                    <li>Any draft or pending approval voucher will block closure under domain invariants.</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 rounded-lg text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    <strong>Mandatory Audit Justification:</strong> Reopening an accounting period requires a formal reason for BIR and statutory auditor compliance.
                  </div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Justification Reason
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Authorized by CFO for prior period tax withholding calibration..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm ${
                    actionModal.type === 'CLOSE'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                  }`}
                >
                  {actionModal.type === 'CLOSE' ? 'Confirm & Close Period' : 'Authorize Reopening'}
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
