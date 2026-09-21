'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  FileText,
  DollarSign,
  Wallet,
  Plus,
  Printer,
  ChevronDown,
  Pencil,
  Trash2,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  X,
  Check,
  RefreshCw,
  Building2,
  AlertCircle
} from 'lucide-react';

interface VoucherItem {
  id: string;
  date: string;
  voucherNumber: string;
  payee: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REVIEWED' | 'POSTED';
  explanation?: string;
}

interface TenantMetrics {
  name: string;
  revenue: number;
  revenueMom: string;
  revenueUp: boolean;
  expenses: number;
  expensesMom: string;
  expensesUp: boolean;
  netIncome: number;
  cashOnHand: number;
  chartData: Array<{ month: string; rev: number; exp: number }>;
  materials: Array<{ name: string; level: number; color: string }>;
}

const TENANT_DATA: Record<string, TenantMetrics> = {
  '8100': {
    name: 'JCS Chemical Industries, Inc.',
    revenue: 14850230.15,
    revenueMom: '+12% MoM',
    revenueUp: true,
    expenses: 6112450.00,
    expensesMom: '-5% MoM',
    expensesUp: false,
    netIncome: 8737780.15,
    cashOnHand: 22500000.00,
    chartData: [
      { month: 'Apr', rev: 6.8, exp: 4.8 },
      { month: 'May', rev: 7.4, exp: 5.2 },
      { month: 'Jun', rev: 7.1, exp: 5.0 },
      { month: 'Jul', rev: 8.9, exp: 5.8 },
      { month: 'Aug', rev: 8.1, exp: 5.5 },
      { month: 'Sep', rev: 11.2, exp: 6.1 },
    ],
    materials: [
      { name: 'Polymer Resin', level: 65, color: 'bg-blue-600' },
      { name: 'Industrial Solvent', level: 88, color: 'bg-blue-500' },
      { name: 'Pigment Additives', level: 45, color: 'bg-emerald-500' },
      { name: 'Packaging Drums', level: 92, color: 'bg-blue-600' },
      { name: 'Reagents', level: 58, color: 'bg-emerald-600' },
    ],
  },
  '8200': {
    name: 'APF Corporation',
    revenue: 9420180.50,
    revenueMom: '+8.4% MoM',
    revenueUp: true,
    expenses: 4890300.00,
    expensesMom: '-2.1% MoM',
    expensesUp: false,
    netIncome: 4529880.50,
    cashOnHand: 14180000.00,
    chartData: [
      { month: 'Apr', rev: 5.2, exp: 3.9 },
      { month: 'May', rev: 5.8, exp: 4.1 },
      { month: 'Jun', rev: 6.0, exp: 4.3 },
      { month: 'Jul', rev: 6.9, exp: 4.5 },
      { month: 'Aug', rev: 7.5, exp: 4.6 },
      { month: 'Sep', rev: 9.4, exp: 4.9 },
    ],
    materials: [
      { name: 'Yellow Corn Feed', level: 75, color: 'bg-amber-500' },
      { name: 'Soybean Meal', level: 82, color: 'bg-emerald-600' },
      { name: 'Limestone Premix', level: 40, color: 'bg-blue-500' },
      { name: 'Feed Pellet Sacks', level: 95, color: 'bg-blue-600' },
      { name: 'Methionine Grade', level: 62, color: 'bg-emerald-500' },
    ],
  },
  '8300': {
    name: 'Chemag Trading Corporation',
    revenue: 18340650.80,
    revenueMom: '+15.8% MoM',
    revenueUp: true,
    expenses: 8120400.00,
    expensesMom: '+3.2% MoM',
    expensesUp: true,
    netIncome: 10220250.80,
    cashOnHand: 31450000.00,
    chartData: [
      { month: 'Apr', rev: 11.0, exp: 6.5 },
      { month: 'May', rev: 12.4, exp: 6.8 },
      { month: 'Jun', rev: 13.1, exp: 7.2 },
      { month: 'Jul', rev: 14.8, exp: 7.5 },
      { month: 'Aug', rev: 16.0, exp: 7.8 },
      { month: 'Sep', rev: 18.3, exp: 8.1 },
    ],
    materials: [
      { name: 'Caustic Soda Flakes', level: 70, color: 'bg-blue-600' },
      { name: 'Hydrochloric Acid', level: 85, color: 'bg-blue-500' },
      { name: 'Titanium Dioxide', level: 50, color: 'bg-emerald-500' },
      { name: 'Solvent Naphtha', level: 90, color: 'bg-blue-600' },
      { name: 'Polyethylene Pellets', level: 65, color: 'bg-emerald-600' },
    ],
  },
};

const DEFAULT_VOUCHERS: Record<string, VoucherItem[]> = {
  '8100': [
    { id: 'v1', date: '21/09/26', voucherNumber: 'V0004521', payee: 'APF Corp.', amount: 450000, status: 'PENDING', explanation: 'Raw chemical materials shipment balance' },
    { id: 'v2', date: '20/09/26', voucherNumber: 'V0004520', payee: 'Chemag Trading Corp.', amount: 1250500, status: 'APPROVED', explanation: 'Bulk chemical solvents inventory replenishment' },
    { id: 'v3', date: '18/09/26', voucherNumber: 'V0004519', payee: 'Meralco Industrial', amount: 350000, status: 'PENDING', explanation: 'Valenzuela manufacturing facility September power' },
    { id: 'v4', date: '15/09/26', voucherNumber: 'V0004518', payee: 'Manila Water Industrial', amount: 85200, status: 'APPROVED', explanation: 'Plant water utility treatment consumption' },
    { id: 'v5', date: '12/09/26', voucherNumber: 'V0004515', payee: 'PLDT Enterprise', amount: 45000, status: 'APPROVED', explanation: 'Head office and plant leased line telecom' },
  ],
  '8200': [
    { id: 'v6', date: '21/09/26', voucherNumber: 'V0008201', payee: 'San Miguel Feeds', amount: 850000, status: 'PENDING', explanation: 'Feed grade premix raw stock' },
    { id: 'v7', date: '19/09/26', voucherNumber: 'V0008202', payee: 'JCS Chemical Industries', amount: 450000, status: 'APPROVED', explanation: 'Feed preservation additives' },
    { id: 'v8', date: '17/09/26', voucherNumber: 'V0008203', payee: 'Shell Industrial Fuel', amount: 280000, status: 'PENDING', explanation: 'Boiler generator diesel supply' },
    { id: 'v9', date: '14/09/26', voucherNumber: 'V0008204', payee: 'Aboitiz Power', amount: 125000, status: 'APPROVED', explanation: 'Milling plant electricity billing' },
  ],
  '8300': [
    { id: 'v10', date: '21/09/26', voucherNumber: 'V0008301', payee: 'Dow Chemical Asia', amount: 2450000, status: 'APPROVED', explanation: 'Imported solvent container shipment' },
    { id: 'v11', date: '20/09/26', voucherNumber: 'V0008302', payee: 'BASF Philippines', amount: 1800000, status: 'PENDING', explanation: 'Bulk specialty polymer granules' },
    { id: 'v12', date: '18/09/26', voucherNumber: 'V0008303', payee: 'Bureau of Customs', amount: 540000, status: 'APPROVED', explanation: 'Port of Manila import duties' },
    { id: 'v13', date: '15/09/26', voucherNumber: 'V0008304', payee: '2GO Freight Logistics', amount: 195000, status: 'PENDING', explanation: 'Inter-island chemical trucking' },
  ],
};

export default function DashboardPage() {
  const [tenantId, setTenantId] = useState('8100');
  const [vouchers, setVouchers] = useState<VoucherItem[]>(DEFAULT_VOUCHERS['8100']);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for quick voucher creation
  const [newPayee, setNewPayee] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newExplanation, setNewExplanation] = useState('');

  useEffect(() => {
    const fetchLiveVouchers = async (tid: string) => {
      try {
        const res = await fetch('/api/vouchers/jv', {
          headers: { 'x-tenant-id': tid },
        });
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          const mapped: VoucherItem[] = json.data.slice(0, 5).map((jv: any) => ({
            id: jv.id,
            date: jv.documentDate?.slice(2).replace(/-/g, '/') || '21/09/26',
            voucherNumber: jv.documentNumber,
            payee: jv.explanation?.slice(0, 30) || 'Accrual Entry',
            amount: jv.totalDebit || 0,
            status: jv.status === 'POSTED' || jv.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
            explanation: jv.explanation,
          }));
          setVouchers(mapped);
        } else {
          setVouchers(DEFAULT_VOUCHERS[tid] || DEFAULT_VOUCHERS['8100']);
        }
      } catch (e) {
        console.error('Error fetching live vouchers:', e);
      }
    };

    const updateForTenant = (tid: string) => {
      setTenantId(tid);
      setVouchers(DEFAULT_VOUCHERS[tid] || DEFAULT_VOUCHERS['8100']);
      fetchLiveVouchers(tid);
    };

    const initialTid = localStorage.getItem('aos100_tenant') || '8100';
    updateForTenant(initialTid);

    const handleTenantEvent = (e: any) => {
      const newTid = e?.detail?.tenantId || localStorage.getItem('aos100_tenant') || '8100';
      updateForTenant(newTid);
    };

    window.addEventListener('aos100_tenant_changed', handleTenantEvent);
    return () => window.removeEventListener('aos100_tenant_changed', handleTenantEvent);
  }, []);

  const currentMetrics = TENANT_DATA[tenantId] || TENANT_DATA['8100'];

  const handleToggleStatus = (id: string) => {
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, status: v.status === 'PENDING' ? 'APPROVED' : 'PENDING' } : v
      )
    );
  };

  const handleDeleteVoucher = (id: string) => {
    if (confirm('Are you sure you want to delete this voucher from the queue?')) {
      setVouchers((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayee || !newAmount) return;

    const newV: VoucherItem = {
      id: `v-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      voucherNumber: `V${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`,
      payee: newPayee,
      amount: parseFloat(newAmount),
      status: 'PENDING',
      explanation: newExplanation || 'Direct voucher disbursement',
    };

    setVouchers([newV, ...vouchers]);
    setShowCreateModal(false);
    setNewPayee('');
    setNewAmount('');
    setNewExplanation('');
  };

  return (
    <>
      <div className="space-y-6">
        {/* Title Bar with Action Buttons matching screenshot */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Financial Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                BA {tenantId} — {currentMetrics.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Monday, September 21, 2026 • Real-time Multi-Tenant Accounting Ledger
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* New Cheque Button */}
            <Link
              href="/dashboard/vouchers/cheques"
              className="flex items-center gap-2 px-4 py-2 font-semibold text-xs rounded-lg border shadow-sm transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>New Cheque</span>
            </Link>

            {/* Create Voucher Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Voucher</span>
            </button>
          </div>
        </div>

        {/* 4 Metric KPI Cards matching user screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Revenue */}
          <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Revenue</span>
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                PhP {currentMetrics.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-500 font-mono">
              <span>▲ {currentMetrics.revenueMom}</span>
            </div>
          </div>

          {/* Card 2: Operating Expenses */}
          <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Operating Expenses</span>
              <div className="w-7 h-7 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                PhP {currentMetrics.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`mt-2 flex items-center gap-1 text-xs font-semibold font-mono ${
              currentMetrics.expensesUp ? 'text-rose-500' : 'text-emerald-500'
            }`}>
              <span>{currentMetrics.expensesUp ? '▲' : '▼'} {currentMetrics.expensesMom}</span>
            </div>
          </div>

          {/* Card 3: Net Income */}
          <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Net Income</span>
              <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                PhP {currentMetrics.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 text-xs font-medium text-slate-400">
              Year to Date
            </div>
          </div>

          {/* Card 4: Cash On Hand */}
          <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cash On Hand</span>
              <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                PhP {currentMetrics.cashOnHand.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 text-xs font-medium text-slate-400">
              Available Balance
            </div>
          </div>
        </div>

        {/* Middle Row: Financial Performance Chart + Vouchers Awaiting Approval */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Financial Performance (Last 6 Months) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Financial Performance (Last 6 Months)
              </h2>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-blue-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Revenue
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Expenses
                </span>
              </div>
            </div>

            {/* Spline Chart SVG Representation */}
            <div className="mt-4 relative h-56 w-full flex items-end">
              {/* Y-Axis Labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] font-mono text-slate-400 pr-2">
                <span>20M</span>
                <span>15M</span>
                <span>10M</span>
                <span>5M</span>
                <span>0M</span>
              </div>

              {/* Chart Grid & Splines */}
              <div className="ml-10 w-full h-full relative">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 180">
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  <line x1="0" y1="10" x2="500" y2="10" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
                  <line x1="0" y1="95" x2="500" y2="95" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
                  <line x1="0" y1="140" x2="500" y2="140" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="3 3" />
                  <line x1="0" y1="180" x2="500" y2="180" stroke="#94a3b8" strokeOpacity="0.2" />

                  {/* Area fills */}
                  <path
                    d="M 10 120 Q 100 105, 190 110 T 370 70 T 490 35 L 490 180 L 10 180 Z"
                    fill="url(#revGrad)"
                  />

                  {/* Revenue Curve (Blue) */}
                  <path
                    d="M 10 120 Q 100 105, 190 110 T 370 70 T 490 35"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />
                  {/* Revenue Data Points */}
                  <circle cx="10" cy="120" r="4" fill="#2563eb" />
                  <circle cx="105" cy="108" r="4" fill="#2563eb" />
                  <circle cx="200" cy="112" r="4" fill="#2563eb" />
                  <circle cx="295" cy="85" r="4" fill="#2563eb" />
                  <circle cx="390" cy="98" r="4" fill="#2563eb" />
                  <circle cx="490" cy="35" r="5" fill="#2563eb" stroke="#fff" strokeWidth="2" />

                  {/* Expenses Curve (Green) */}
                  <path
                    d="M 10 145 Q 100 138, 190 140 T 370 130 T 490 115"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                  {/* Expense Data Points */}
                  <circle cx="10" cy="145" r="3.5" fill="#10b981" />
                  <circle cx="105" cy="138" r="3.5" fill="#10b981" />
                  <circle cx="200" cy="140" r="3.5" fill="#10b981" />
                  <circle cx="295" cy="132" r="3.5" fill="#10b981" />
                  <circle cx="390" cy="135" r="3.5" fill="#10b981" />
                  <circle cx="490" cy="115" r="4" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                </svg>

                {/* X-Axis Months */}
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-2">
                  {currentMetrics.chartData.map((d) => (
                    <span key={d.month}>{d.month}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Vouchers Awaiting Approval (Table on the right) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Vouchers Awaiting Approval
                </h2>
                <Link
                  href="/dashboard/gl/vouchers"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </Link>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 font-semibold">Date</th>
                      <th className="py-2.5 font-semibold">Voucher #</th>
                      <th className="py-2.5 font-semibold">Payee</th>
                      <th className="py-2.5 font-semibold text-right">Amount (PHP)</th>
                      <th className="py-2.5 font-semibold text-center">Status</th>
                      <th className="py-2.5 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {v.date}
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {v.voucherNumber}
                        </td>
                        <td className="py-3 font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate" title={v.payee}>
                          {v.payee}
                        </td>
                        <td className="py-3 font-mono font-bold text-right text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {v.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleToggleStatus(v.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              v.status === 'APPROVED'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                            }`}
                            title="Click to toggle status"
                          >
                            {v.status}
                          </button>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-slate-400">
                            <button
                              onClick={() => setSelectedVoucher(v)}
                              className="hover:text-blue-500 transition-colors p-1"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVoucher(v.id)}
                              className="hover:text-rose-500 transition-colors p-1"
                              title="Delete Voucher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Materials Management Overview + BIR 2307 Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Materials Management Overview (Bottom Left) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Materials Management Overview
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold cursor-pointer">
                <span>Inventory Status</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Bar Chart Representation matching screenshot */}
            <div className="mt-6 flex items-end justify-around h-44 border-b border-slate-200/60 dark:border-slate-800 pb-2">
              {currentMetrics.materials.map((m) => (
                <div key={m.name} className="flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.level}%
                  </div>
                  <div
                    style={{ height: `${m.level * 1.5}px` }}
                    className={`w-12 rounded-t-sm ${m.color} shadow-sm transition-all group-hover:scale-105`}
                  ></div>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 text-center max-w-[70px] truncate" title={m.name}>
                    {m.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* BIR Form 2307 Summary (Bottom Right) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      BIR Form 2307 Summary
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Expanded Withholding Tax Certificates
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/reports/bir2307"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Generate BIR 2307
                </Link>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Pending Certificates</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">8 Forms Ready</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Total Tax Withheld (EWT)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">PhP 350,000.00</span>
                </div>

                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tax Compliance Status</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    TRAIN / EOPT Active
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Quarter 3, 2026 Filing</span>
              <Link href="/dashboard/reports/bir2307" className="text-blue-500 hover:underline flex items-center gap-1 font-semibold">
                <span>View SAWT Register</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: View Voucher Details */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 bg-white dark:bg-[#16161A] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Voucher Details — {selectedVoucher.voucherNumber}</h3>
              <button onClick={() => setSelectedVoucher(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Document Date:</span>
                <span className="font-mono font-bold">{selectedVoucher.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Payee / Account:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedVoucher.payee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Amount in Peso:</span>
                <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                  PhP {selectedVoucher.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Current Status:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  selectedVoucher.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                }`}>
                  {selectedVoucher.status}
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Explanation / Memo:</span>
                <p className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {selectedVoucher.explanation}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleToggleStatus(selectedVoucher.id);
                  setSelectedVoucher(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Toggle Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Create Voucher */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 bg-white dark:bg-[#16161A] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Quick Voucher</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Payee / Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Petron Corporation"
                  value={newPayee}
                  onChange={(e) => setNewPayee(e.target.value)}
                  className="w-full p-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Gross Amount (PHP)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 150000.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full p-2 rounded-lg border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Explanation / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Memo / Accounting purpose..."
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full p-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                >
                  Create & Enqueue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
