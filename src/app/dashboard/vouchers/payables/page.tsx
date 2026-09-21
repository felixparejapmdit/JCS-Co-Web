'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { FileSpreadsheet, PlusCircle, RefreshCw, Calculator, ShieldCheck } from 'lucide-react';

interface VpRow {
  id: string;
  documentNumber: string;
  documentDate: string;
  vendorCode: string;
  vendorName: string;
  grossAmount: number;
  vat12Percent: number;
  ewtRatePct: number;
  ewtAmount: number;
  netPayable: number;
  terms: string;
  status: string;
}

export default function PayablesPage() {
  const [payables, setPayables] = useState<VpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [vendorCode, setVendorCode] = useState('V-PETRON');
  const [vendorName, setVendorName] = useState('Petron Corporation - Solvents');
  const [grossAmount, setGrossAmount] = useState(500000);
  const [ewtRate, setEwtRate] = useState(1);

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vouchers/vp');
      const json = await res.json();
      if (json.success) setPayables(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  const handleCreateVp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vouchers/vp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorCode,
          vendorName,
          grossAmount,
          ewtRate,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchPayables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns: ColumnDef<VpRow>[] = [
    {
      header: 'VP Number',
      accessorKey: 'documentNumber',
      cell: (row) => <span className="font-mono font-bold text-blue-600">{row.documentNumber}</span>,
    },
    {
      header: 'Date',
      accessorKey: 'documentDate',
      cell: (row) => <span className="font-mono text-xs text-slate-500">{row.documentDate}</span>,
    },
    {
      header: 'Supplier / Payee',
      accessorKey: 'vendorName',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.vendorName}</div>
          <div className="text-[11px] font-mono text-slate-400">{row.vendorCode} • {row.terms}</div>
        </div>
      ),
    },
    {
      header: 'Gross (PhP)',
      accessorKey: 'grossAmount',
      align: 'right',
      cell: (row) => <span className="font-mono font-bold">{row.grossAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: '12% VAT',
      accessorKey: 'vat12Percent',
      align: 'right',
      cell: (row) => <span className="font-mono text-xs text-slate-600">{row.vat12Percent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: 'EWT (2307)',
      accessorKey: 'ewtAmount',
      align: 'right',
      cell: (row) => <span className="font-mono text-xs text-rose-600 font-bold">-{row.ewtAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} ({row.ewtRatePct}%)</span>,
    },
    {
      header: 'Net Payable (PhP)',
      accessorKey: 'netPayable',
      align: 'right',
      cell: (row) => <span className="font-mono font-extrabold text-emerald-700">{row.netPayable.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      cell: (row) => (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${row.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {row.status}
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
              Vouchers Payable (Form 023)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Trade payables management with automated 12% Input VAT and Expanded Withholding Tax (EWT) deductions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPayables}
              className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Create Voucher Payable
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
          <DataGrid
            data={payables}
            columns={columns}
            searchPlaceholder="Search by VP number or vendor name..."
            searchFields={['documentNumber', 'vendorName', 'vendorCode']}
            pageSize={10}
          />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A1E] border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">New Voucher Payable (Form 023)</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateVp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Supplier</label>
                <select
                  value={vendorCode}
                  onChange={(e) => {
                    setVendorCode(e.target.value);
                    if (e.target.value === 'V-PETRON') setVendorName('Petron Corporation - Solvents');
                    else if (e.target.value === 'V-MERALCO') setVendorName('Manila Electric Company');
                    else setVendorName('Dow Chemical Philippines Inc');
                  }}
                  className="w-full bg-slate-50 dark:bg-[#121214] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="V-PETRON">Petron Corporation - Solvents (WC160 1%)</option>
                  <option value="V-MERALCO">Manila Electric Company (WC158 2%)</option>
                  <option value="V-DOWCHEM">Dow Chemical Philippines Inc (WC160 1%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice Gross Amount (PhP)</label>
                <input
                  type="number"
                  step="1000"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#121214] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">EWT Withholding Rate</label>
                <select
                  value={ewtRate}
                  onChange={(e) => setEwtRate(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#121214] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value={1}>1% - Goods (WC160)</option>
                  <option value={2}>2% - Services / Utilities (WC158)</option>
                  <option value={5}>5% - Professional Fees (WI010)</option>
                </select>
              </div>

              {/* Real time calculation preview */}
              <div className="bg-slate-50 dark:bg-[#141416] p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-800 dark:text-slate-200">
                  <span>Gross Total:</span>
                  <span className="font-bold">PhP {grossAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Net of 12% VAT:</span>
                  <span>PhP {(grossAmount / 1.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                  <span>Less: EWT {ewtRate}%:</span>
                  <span>-PhP {((grossAmount / 1.12) * (ewtRate / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 font-extrabold">
                  <span>Estimated Net Check Payable:</span>
                  <span>PhP {(grossAmount - (grossAmount / 1.12) * (ewtRate / 100)).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Save Voucher Payable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
