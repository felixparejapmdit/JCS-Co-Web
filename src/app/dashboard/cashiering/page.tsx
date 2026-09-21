'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Receipt, RefreshCw, PlusCircle, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface CollectionRow {
  id: string;
  orNumber: string;
  collectionDate: string;
  customerName: string;
  tender: 'CASH' | 'CHEQUE' | 'ONLINE_EFT';
  checkNumber?: string;
  bankName?: string;
  netCollectionAmount: number;
  isPostDated: boolean;
  status: string;
}

export default function CashieringPage() {
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [cdcr, setCdcr] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cashiering/collections');
      const json = await res.json();
      if (json.success) {
        setCollections(json.data);
        setCdcr(json.cdcrSummary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const columns: ColumnDef<CollectionRow>[] = [
    {
      header: 'OR Number',
      accessorKey: 'orNumber',
      cell: (row) => <span className="font-mono font-bold text-blue-600">{row.orNumber}</span>,
    },
    {
      header: 'Date',
      accessorKey: 'collectionDate',
      cell: (row) => <span className="font-mono text-xs text-slate-500">{row.collectionDate}</span>,
    },
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.customerName}</div>
          {row.checkNumber && (
            <div className="text-[11px] text-slate-400 font-mono">
              Check: {row.checkNumber} ({row.bankName})
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Tender Type',
      accessorKey: 'tender',
      align: 'center',
      cell: (row) => {
        const styles: Record<string, string> = {
          CASH: 'bg-emerald-100 text-emerald-800',
          CHEQUE: 'bg-blue-100 text-blue-800',
          ONLINE_EFT: 'bg-purple-100 text-purple-800',
        };
        return (
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${styles[row.tender]}`}>
            {row.tender}
          </span>
        );
      },
    },
    {
      header: 'PDC Tag',
      accessorKey: 'isPostDated',
      align: 'center',
      cell: (row) =>
        row.isPostDated ? (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> Post-Dated
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      header: 'Net Collected (PhP)',
      accessorKey: 'netCollectionAmount',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-900">
          {row.netCollectionAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cashiering & Official Receipts (Form 010)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Daily collections, tender reconciliations (Cash, Cheque, EFT), and Post-Dated Check (PDC) tracking.
            </p>
          </div>

          <button
            onClick={fetchCollections}
            className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* CDCR Daily Aggregate Cards */}
        {cdcr && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Cash Collected</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                PhP {cdcr.totalCash.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Cheques Received</span>
              <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                PhP {cdcr.totalCheque.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Online / EFT Transfers</span>
              <span className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-1 block">
                PhP {cdcr.totalOnline.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">CDCR Grand Total</span>
              <span className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
                PhP {cdcr.grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Collections Table */}
        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
          <DataGrid
            data={collections}
            columns={columns}
            searchPlaceholder="Search collections by customer, OR #, or check..."
            searchFields={['orNumber', 'customerName', 'checkNumber']}
            pageSize={10}
          />
        </div>
      </div>
    </>
  );
}
