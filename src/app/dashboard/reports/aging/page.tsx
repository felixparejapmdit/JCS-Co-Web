'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Clock, RefreshCw, Layers } from 'lucide-react';

export default function AgingPage() {
  const [apAging, setApAging] = useState<any[]>([]);
  const [arAging, setArAging] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAging = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/aging');
      const json = await res.json();
      if (json.success) {
        setApAging(json.apAging);
        setArAging(json.arAging);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAging();
  }, []);

  const agingColumns: ColumnDef<any>[] = [
    {
      header: 'Entity / Counterparty',
      accessorKey: 'entityName',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">{row.entityName}</div>
          <div className="text-[11px] font-mono text-slate-400">{row.entityCode}</div>
        </div>
      ),
    },
    {
      header: 'Current (0-30d)',
      accessorKey: 'current',
      align: 'right',
      cell: (row) => <span className="font-mono text-slate-700 dark:text-slate-300">{row.current > 0 ? row.current.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}</span>,
    },
    {
      header: '31-60 Days',
      accessorKey: 'days31To60',
      align: 'right',
      cell: (row) => <span className="font-mono text-slate-700 dark:text-slate-300">{row.days31To60 > 0 ? row.days31To60.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}</span>,
    },
    {
      header: '61-90 Days',
      accessorKey: 'days61To90',
      align: 'right',
      cell: (row) => <span className="font-mono text-slate-700 dark:text-slate-300">{row.days61To90 > 0 ? row.days61To90.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}</span>,
    },
    {
      header: 'Over 120 Days',
      accessorKey: 'over120Days',
      align: 'right',
      cell: (row) => <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{row.over120Days > 0 ? row.over120Days.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}</span>,
    },
    {
      header: 'Total Outstanding (PhP)',
      accessorKey: 'totalOutstanding',
      align: 'right',
      cell: (row) => <span className="font-mono font-extrabold text-slate-900 dark:text-white">{row.totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Accounts Payable & Receivable Aging Matrices
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Cash flow maturity schedules categorized into 30, 60, 90, and 120+ overdue aging brackets.
            </p>
          </div>

          <button
            onClick={fetchAging}
            className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* AP Aging */}
        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 transition-colors">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Accounts Payable (Supplier Aging Schedule)</h2>
          <DataGrid
            data={apAging}
            columns={agingColumns}
            searchPlaceholder="Filter suppliers..."
            searchFields={['entityName', 'entityCode']}
            pageSize={5}
          />
        </div>

        {/* AR Aging */}
        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 transition-colors">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Accounts Receivable (Customer Credit Aging Schedule)</h2>
          <DataGrid
            data={arAging}
            columns={agingColumns}
            searchPlaceholder="Filter customers..."
            searchFields={['entityName', 'entityCode']}
            pageSize={5}
          />
        </div>
      </div>
    </>
  );
}
