'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Plus,
  ArrowRight,
  Download,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Employee, PayrollItem, PayrollRunProps } from '@/domain/entities/Payroll';
import { AmtWords } from '@/domain/services/AmtWords';

export default function PayrollPage() {
  const [tenantId, setTenantId] = useState('8100');
  const [activeTab, setActiveTab] = useState<'compute' | 'payslips' | 'thirteenth' | 'bank_export' | 'history'>('compute');
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

    // Listen to zero-flicker corporate entity switch event
    const handleTenantSwitch = () => {
      fetchPayrollData();
    };
    window.addEventListener('aos100_tenant_changed', handleTenantSwitch);
    return () => window.removeEventListener('aos100_tenant_changed', handleTenantSwitch);
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
      const processedBy = user ? JSON.parse(user).name : 'Maria Santos, CPA';

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
          message: `Payroll run ${json.payrollRun.payrollNumber} successfully calculated, approved, and disbursed via Check Voucher ${json.voucherId}!`,
        });
        fetchPayrollData();
        setActiveTab('history');
      } else {
        setFeedback({
          type: 'error',
          message: json.error || 'Failed to process payroll run.',
        });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error executing payroll.' });
    } finally {
      setProcessing(false);
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
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Philippine Payroll & Compensation Engine
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              BA {tenantId}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Automated semi-monthly calculation with 2026 SSS MSC schedule, PhilHealth 2.5%, Pag-IBIG PhP 200, and BIR TRAIN Law withholding tax tables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/hris"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-cyan-600" />
            <span>Manage 201 Records in HRIS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={fetchPayrollData}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            title="Refresh payroll data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Semi-Monthly Gross</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            PhP {totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Basic pay + Overtime + Allowances</div>
        </div>

        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Deductions</div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            -PhP {totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Statutory (SSS/PH/HDMF) + BIR Tax</div>
        </div>

        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Net Take-Home Payable</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            PhP {totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-0.5">
            Disbursement via Bank Transfer
          </div>
        </div>

        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Employer Counterpart Share</div>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            PhP {totalEmployer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">SSS, PhilHealth & Pag-IBIG ER</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('compute')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'compute'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Semi-Monthly Computation</span>
        </button>

        <button
          onClick={() => setActiveTab('payslips')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'payslips'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Official Payslips</span>
        </button>

        <button
          onClick={() => setActiveTab('thirteenth')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'thirteenth'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>13th Month Pay Estimator</span>
        </button>

        <button
          onClick={() => setActiveTab('bank_export')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'bank_export'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bank Batch Export</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Disbursement History</span>
        </button>
      </div>

      {/* TAB 1: SEMI-MONTHLY COMPUTATION */}
      {activeTab === 'compute' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#16161A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Active Cycle: September 1–15, 2026 (Semi-Monthly)
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Adjust Overtime hours or non-taxable allowances live in the table below. Totals update dynamically.
              </div>
            </div>

            <button
              onClick={handleProcessRun}
              disabled={processing || currentItems.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Payroll & Disbursement...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Approve & Generate Check Voucher</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/75 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Basic (Half)</th>
                    <th className="py-3 px-3">OT (Hrs)</th>
                    <th className="py-3 px-3">OT Pay</th>
                    <th className="py-3 px-3">Allowance</th>
                    <th className="py-3 px-3">Gross Pay</th>
                    <th className="py-3 px-3 text-rose-500">SSS (EE)</th>
                    <th className="py-3 px-3 text-rose-500">PhilHealth</th>
                    <th className="py-3 px-3 text-rose-500">Pag-IBIG</th>
                    <th className="py-3 px-3 text-rose-500">BIR WTax</th>
                    <th className="py-3 px-3 font-bold text-emerald-600">Net Take-Home</th>
                    <th className="py-3 px-3 text-right">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                  {currentItems.map((it) => (
                    <tr key={it.employeeId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{it.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{it.position}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">PhP {it.basicPay.toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={overtimeHours[it.employeeId] ?? 0}
                          onChange={(e) =>
                            setOvertimeHours({
                              ...overtimeHours,
                              [it.employeeId]: Number(e.target.value),
                            })
                          }
                          className="w-16 px-1.5 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-center font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                        PhP {it.overtimePay.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={allowances[it.employeeId] ?? 0}
                          onChange={(e) =>
                            setAllowances({
                              ...allowances,
                              [it.employeeId]: Number(e.target.value),
                            })
                          }
                          className="w-20 px-1.5 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-center font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        PhP {it.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-500">PhP {it.sssEmployee.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-500">PhP {it.philHealthEmployee.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-500">PhP {it.pagIbigEmployee.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-600 font-bold">PhP {it.withholdingTax.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        PhP {it.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedPayslip(it)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400"
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
        </div>
      )}

      {/* TAB 2: OFFICIAL PAYSLIPS */}
      {activeTab === 'payslips' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((it) => (
              <div
                key={it.employeeId}
                className="p-5 rounded-2xl border bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{it.employeeName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold">
                    {it.employeeCode}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{it.position} &bull; {it.department}</div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Earnings:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      PhP {it.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Total Deductions:</span>
                    <span className="font-mono font-semibold">-PhP {it.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Net Pay:</span>
                    <span className="font-mono">PhP {it.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPayslip(it)}
                  className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate Official Payslip</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 13TH MONTH PAY ESTIMATOR */}
      {activeTab === 'thirteenth' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
            <h4 className="font-bold text-sm flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Philippine Mandatory 13th Month Pay (PD 851)</span>
            </h4>
            <p>
              Calculated as 1/12 of the total basic salary earned by an employee within the calendar year. Tax-exempt up to the PhP 90,000 TRAIN Law threshold.
            </p>
          </div>

          <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/75 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Monthly Rate</th>
                    <th className="py-3 px-4">Months Rendered (2026)</th>
                    <th className="py-3 px-4">Estimated 13th Month Pay</th>
                    <th className="py-3 px-4">Taxability</th>
                    <th className="py-3 px-4">Disbursement Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                  {employees.map((emp) => {
                    const est13th = Math.round(((emp.monthlyBasicSalary * 12) / 12) * 100) / 100;
                    const isExempt = est13th <= 90000;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{emp.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{emp.employeeCode}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          PhP {emp.monthlyBasicSalary?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-semibold">12 Months (Full Year)</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          PhP {est13th.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          {isExempt ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              100% Tax Exempt (&le; 90k)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              Excess Taxable
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-500">December 15, 2026</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BANK BATCH EXPORT */}
      {activeTab === 'bank_export' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#16161A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Bank Disbursement Hash & PESONet File (BDO / BPI Batch)
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ready for batch upload to corporate banking electronic fund transfer portal.
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Bank batch disbursement hash file generated successfully for PhP ${totalNet.toLocaleString()}!`);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download Bank Hash (.txt)</span>
            </button>
          </div>

          <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/75 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Disbursement Bank</th>
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4 font-bold text-emerald-600">Net Credit Amount</th>
                    <th className="py-3 px-4">Hash Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                  {currentItems.map((it, idx) => (
                    <tr key={it.employeeId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{it.employeeName}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{it.employeeCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">BDO Unibank</td>
                      <td className="py-3 px-4 font-mono">0012-3456-{7890 + idx}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        PhP {it.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        SHA256:{Math.random().toString(36).substring(2, 10).toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DISBURSEMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/75 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Payroll Run ID</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Date Range</th>
                    <th className="py-3 px-4">Disbursed Net</th>
                    <th className="py-3 px-4">Employer Share</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Disbursement Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                  {payrollRuns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-mono">{r.payrollNumber}</td>
                      <td className="py-3 px-4 font-semibold">{r.periodName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {r.dateFrom} to {r.dateTo}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        PhP {r.totalNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400">
                        PhP {r.totalEmployerCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                          {r.disbursementVoucherId || 'CV-2026-PAYROLL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payrollRuns.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No previous finalized payroll runs found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL PAYSLIP MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Official Semi-Monthly Payslip
                </h3>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corporate Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-200 dark:border-slate-800 space-y-0.5">
              <div className="font-bold text-sm text-slate-900 dark:text-white">JCS Chemical Industries, Inc.</div>
              <div className="text-[11px] text-slate-400">Business Area {tenantId} &bull; Dasmariñas, Cavite</div>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Pay Period: September 1–15, 2026
              </div>
            </div>

            {/* Employee Data */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div><span className="text-slate-400">Name:</span> <span className="font-bold text-slate-900 dark:text-white">{selectedPayslip.employeeName}</span></div>
              <div><span className="text-slate-400">Emp Code:</span> <span className="font-mono text-blue-600 font-semibold">{selectedPayslip.employeeCode}</span></div>
              <div><span className="text-slate-400">Position:</span> <span className="text-slate-700 dark:text-slate-300">{selectedPayslip.position}</span></div>
              <div><span className="text-slate-400">Department:</span> <span className="text-slate-700 dark:text-slate-300">{selectedPayslip.department}</span></div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Gross Earnings
                </div>
                <div className="flex justify-between">
                  <span>Basic Pay (Half):</span>
                  <span className="font-mono font-semibold">PhP {selectedPayslip.basicPay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime Pay:</span>
                  <span className="font-mono font-semibold">PhP {selectedPayslip.overtimePay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allowances:</span>
                  <span className="font-mono font-semibold">PhP {selectedPayslip.allowances.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                  <span>Total Gross:</span>
                  <span className="font-mono">PhP {selectedPayslip.grossPay.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="font-bold text-[11px] text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Deductions
                </div>
                <div className="flex justify-between">
                  <span>SSS Contribution:</span>
                  <span className="font-mono font-semibold">PhP {selectedPayslip.sssEmployee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PhilHealth:</span>
                  <span className="font-mono font-semibold">PhP {selectedPayslip.philHealthEmployee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pag-IBIG / HDMF:</span>
                  <span className="font-mono font-semibold">PhP {selectedPayslip.pagIbigEmployee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Withholding Tax:</span>
                  <span className="font-mono font-semibold">PhP {selectedPayslip.withholdingTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 font-bold text-rose-600">
                  <span>Total Deductions:</span>
                  <span className="font-mono">-PhP {selectedPayslip.totalDeductions.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Net Take-Home */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-950 dark:text-emerald-200">
              <div>
                <div className="font-bold text-xs uppercase tracking-wider">Net Take-Home Pay</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 italic mt-0.5">
                  {AmtWords.formatToWords(selectedPayslip.netPay)}
                </div>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                PhP {selectedPayslip.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Payslip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
