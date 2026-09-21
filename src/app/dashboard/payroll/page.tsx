'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  FileCheck,
  Calculator,
  Printer,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Employee, PayrollItem, PayrollRunProps } from '@/domain/entities/Payroll';
import { AmtWords } from '@/domain/services/AmtWords';

export default function PayrollPage() {
  const [tenantId, setTenantId] = useState('8100');
  const [activeTab, setActiveTab] = useState<'roster' | 'compute' | 'history'>('compute');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRunProps[]>([]);
  const [loading, setLoading] = useState(true);

  // Computation state
  const [overtimeHours, setOvertimeHours] = useState<Record<string, number>>({});
  const [allowances, setAllowances] = useState<Record<string, number>>({});
  const [currentItems, setCurrentItems] = useState<PayrollItem[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollItem | null>(null);

  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      setTenantId(tid);
      const res = await fetch('/api/payroll', {
        headers: { 'x-tenant-id': tid },
      });
      const json = await res.json();
      if (json.success) {
        setEmployees(json.employees || []);
        setPayrollRuns(json.payrollRuns || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  // Compute live payroll whenever employees, OT, or allowances change
  useEffect(() => {
    if (employees.length === 0) return;

    const computeLive = async () => {
      try {
        const tid = localStorage.getItem('aos100_tenant') || '8100';
        const res = await fetch('/api/payroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tid,
          },
          body: JSON.stringify({
            action: 'CALCULATE',
            overtimeHours,
            allowances,
          }),
        });
        const json = await res.json();
        if (json.success && json.payrollRun) {
          setCurrentItems(json.payrollRun.items);
        }
      } catch (e) {
        console.error(e);
      }
    };

    computeLive();
  }, [employees, overtimeHours, allowances]);

  const handleProcessRun = async () => {
    setProcessing(true);
    setFeedback(null);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const user = localStorage.getItem('aos100_user');
      const processedBy = user ? JSON.parse(user).fullName : 'Maria Santos, CPA';

      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tid,
        },
        body: JSON.stringify({
          action: 'PROCESS_RUN',
          periodName: 'September 2026 (1st Half)',
          dateFrom: '2026-09-01',
          dateTo: '2026-09-15',
          overtimeHours,
          allowances,
          processedBy,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: 'success',
          message: `Payroll run ${json.payrollRun.payrollNumber} has been approved and saved! Net Payout: PhP ${json.payrollRun.totalNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        });
        fetchPayrollData();
        setActiveTab('history');
      } else {
        setFeedback({ type: 'error', message: json.error || 'Failed to process payroll.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleDisburseCv = async (payrollRunId: string) => {
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tid,
        },
        body: JSON.stringify({
          action: 'DISBURSE_CV',
          payrollRunId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message });
        fetchPayrollData();
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    }
  };

  const totalGross = currentItems.reduce((acc, it) => acc + it.grossPay, 0);
  const totalDeductions = currentItems.reduce((acc, it) => acc + it.totalDeductions, 0);
  const totalNet = currentItems.reduce((acc, it) => acc + it.netPay, 0);
  const totalEmployer = currentItems.reduce(
    (acc, it) => acc + (it.sssEmployer + it.philHealthEmployer + it.pagIbigEmployer),
    0
  );

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-500" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Human Resources & Philippine Payroll Engine
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Automated compensation calculation compliant with 2026 SSS, PhilHealth, Pag-IBIG, and BIR TRAIN Law withholding tax tables.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPayrollData}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold"
              title="Refresh payroll data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
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
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Semi-Monthly Gross</div>
            <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              PhP {totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{currentItems.length} active employees</div>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Deductions (EE + Tax)</div>
            <div className="text-xl font-extrabold font-mono text-rose-500 mt-1">
              PhP {totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">SSS, PhilHealth, Pag-IBIG, WTax</div>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Net Take-Home Pay</div>
            <div className="text-xl font-extrabold font-mono text-emerald-500 mt-1">
              PhP {totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">For Bank / Cheque Payout</div>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Employer Burden (ER)</div>
            <div className="text-xl font-extrabold font-mono text-blue-500 mt-1">
              PhP {totalEmployer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Company statutory contributions</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveTab('compute')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'compute'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Run Semi-Monthly Payroll
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Employee Master Roster ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Payroll Runs & Disbursements ({payrollRuns.length})
          </button>
        </div>

        {/* Tab 1: Run Payroll Computation Grid */}
        {activeTab === 'compute' && (
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  Period: September 01 to September 15, 2026
                </div>
                <div className="text-xs text-slate-400">
                  Semi-monthly payroll calculation for Business Area {tenantId}
                </div>
              </div>

              <button
                type="button"
                disabled={processing}
                onClick={handleProcessRun}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{processing ? 'Processing...' : 'Process & Approve Payroll'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[880px]">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Employee</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Monthly Rate</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Basic (1/2)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">OT (Hrs)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Allowance</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Gross Pay</th>
                    <th className="py-2.5 px-3 font-semibold text-right">SSS (EE)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">PhilHealth</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Pag-IBIG</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Tax Withheld</th>
                    <th className="py-2.5 px-3 font-semibold text-right font-bold text-emerald-600">Net Take-Home</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {currentItems.map((it) => (
                    <tr key={it.employeeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <div>{it.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{it.position}</div>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {it.monthlyRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                        {it.basicPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="80"
                          value={overtimeHours[it.employeeId] || 0}
                          onChange={(e) =>
                            setOvertimeHours({
                              ...overtimeHours,
                              [it.employeeId]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-14 p-1 rounded border text-center text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={allowances[it.employeeId] || 0}
                          onChange={(e) =>
                            setAllowances({
                              ...allowances,
                              [it.employeeId]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 p-1 rounded border text-center text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                        {it.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-500">
                        {it.sssEmployee.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-500">
                        {it.philHealthEmployee.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-500">
                        {it.pagIbigEmployee.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-600 font-bold">
                        {it.withholdingTax.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-xs">
                        {it.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslip(it)}
                          className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                          title="View Official Payslip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Employee Roster */}
        {activeTab === 'roster' && (
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Registered Personnel Directory — Tenant {tenantId}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Emp Code</th>
                    <th className="py-2.5 px-3 font-semibold">Full Name</th>
                    <th className="py-2.5 px-3 font-semibold">Department & Position</th>
                    <th className="py-2.5 px-3 font-semibold">TIN</th>
                    <th className="py-2.5 px-3 font-semibold">SSS Number</th>
                    <th className="py-2.5 px-3 font-semibold">PhilHealth</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Monthly Rate</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employees.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">{e.employeeCode}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {e.lastName}, {e.firstName}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{e.position}</div>
                        <div className="text-[10px] text-slate-400">{e.department}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{e.tin}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{e.sssNumber}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{e.philHealthNumber}</td>
                      <td className="py-3 px-3 font-mono font-bold text-right text-slate-900 dark:text-white">
                        PhP {e.monthlyBasicSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {e.employmentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: History & Disbursement */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Approved Payroll Runs & Cheque Disbursements
            </h3>

            {payrollRuns.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No archived payroll runs found for tenant {tenantId}. Process a semi-monthly payroll run above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Run Number</th>
                      <th className="py-2.5 px-3 font-semibold">Period Covered</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Gross Total</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Net Payout</th>
                      <th className="py-2.5 px-3 font-semibold">Approved By</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Disbursement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payrollRuns.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">{r.payrollNumber}</td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">{r.periodName}</td>
                        <td className="py-3 px-3 font-mono text-right text-slate-500">
                          PhP {r.totalGrossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                          PhP {r.totalNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{r.processedBy}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.status === 'DISBURSED'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {r.status === 'DISBURSED' ? (
                            <span className="font-mono text-[10px] text-purple-600 font-bold">
                              {r.disbursementVoucherId}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDisburseCv(r.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold"
                            >
                              Generate CV
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Official Philippine Payslip */}
        {selectedPayslip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-5 bg-blue-600 text-white font-black text-[10px] rounded flex items-center justify-center">JCS</div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Confidential Employee Payslip</span>
                </div>
                <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                {/* Employee Header */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Employee:</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{selectedPayslip.employeeName}</div>
                    <div className="text-[10px] text-slate-500">{selectedPayslip.position} &bull; {selectedPayslip.department}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase">Payroll Period:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Sep 01 – Sep 15, 2026</div>
                    <div className="text-[10px] font-mono text-slate-500">ID: {selectedPayslip.employeeCode}</div>
                  </div>
                </div>

                {/* Earnings & Deductions Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="space-y-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 pb-1 border-b border-emerald-200 dark:border-emerald-900/60">
                      EARNINGS
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-600 dark:text-slate-400">Basic Pay (1/2):</span>
                      <span className="font-semibold">{selectedPayslip.basicPay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-600 dark:text-slate-400">Overtime Pay:</span>
                      <span className="font-semibold">{selectedPayslip.overtimePay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-600 dark:text-slate-400">Allowances:</span>
                      <span className="font-semibold">{selectedPayslip.allowances.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono pt-1 border-t border-emerald-200 font-bold text-emerald-800 dark:text-emerald-200">
                      <span>GROSS PAY:</span>
                      <span>PhP {selectedPayslip.grossPay.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-2 p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40">
                    <div className="font-bold text-rose-700 dark:text-rose-400 pb-1 border-b border-rose-200 dark:border-rose-900/60">
                      DEDUCTIONS
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-600 dark:text-slate-400">SSS Contribution:</span>
                      <span>{selectedPayslip.sssEmployee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-600 dark:text-slate-400">PhilHealth (2.5%):</span>
                      <span>{selectedPayslip.philHealthEmployee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-600 dark:text-slate-400">Pag-IBIG (HDMF):</span>
                      <span>{selectedPayslip.pagIbigEmployee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-600 dark:text-slate-400">Withholding Tax:</span>
                      <span>{selectedPayslip.withholdingTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono pt-1 border-t border-rose-200 font-bold text-rose-800 dark:text-rose-200">
                      <span>DEDUCTIONS:</span>
                      <span>PhP {selectedPayslip.totalDeductions.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay Callout */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-900 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">NET TAKE-HOME PAY:</span>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {AmtWords.formatToWords(selectedPayslip.netPay)}
                    </div>
                  </div>
                  <div className="font-mono font-black text-xl text-blue-700 dark:text-blue-300">
                    PhP {selectedPayslip.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Payslip sent to printer / PDF spool.');
                    setSelectedPayslip(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Payslip</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
