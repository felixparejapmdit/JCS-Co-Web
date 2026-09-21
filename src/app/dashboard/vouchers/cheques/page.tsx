'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Printer, RefreshCw, Eye, CheckCircle2, Sliders, Plus } from 'lucide-react';

interface CvRow {
  id: string;
  checkVoucherNumber: string;
  checkNumber: string;
  checkDate: string;
  bankCode: string;
  bankName: string;
  payeeName: string;
  amount: number;
  amountInWords: string;
  vpReferences: string[];
  status: string;
  coordinates: any;
}

export default function ChequesPage() {
  const [cheques, setCheques] = useState<CvRow[]>([]);
  const [selectedCheque, setSelectedCheque] = useState<CvRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCheques = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vouchers/cv');
      const json = await res.json();
      if (json.success) {
        setCheques(json.data);
        if (json.data.length > 0 && !selectedCheque) {
          setSelectedCheque(json.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheques();

    // Hotkey listener: F7 to trigger Print
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F7') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const columns: ColumnDef<CvRow>[] = [
    {
      header: 'CV Number',
      accessorKey: 'checkVoucherNumber',
      cell: (row) => <span className="font-mono font-bold text-blue-600">{row.checkVoucherNumber}</span>,
    },
    {
      header: 'Check #',
      accessorKey: 'checkNumber',
      cell: (row) => <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold">{row.checkNumber}</span>,
    },
    {
      header: 'Payee / Recipient',
      accessorKey: 'payeeName',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.payeeName}</div>
          <div className="text-[11px] text-slate-500">{row.bankName}</div>
        </div>
      ),
    },
    {
      header: 'Amount (PhP)',
      accessorKey: 'amount',
      align: 'right',
      cell: (row) => <span className="font-mono font-extrabold text-slate-900">{row.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      cell: (row) => (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-blue-50 text-blue-700">
          {row.status}
        </span>
      ),
    },
    {
      header: 'Print Cheque',
      accessorKey: 'id',
      align: 'center',
      cell: (row) => (
        <button
          onClick={() => {
            setSelectedCheque(row);
            setTimeout(() => window.print(), 100);
          }}
          className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" /> Print (F7)
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Check Voucher & Precision Cheque Printing (Form 024)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Millimeter-accurate physical cheque vector alignment for BDO, BPI, and Metrobank with legal Peso verbalizer. Press <strong>F7</strong> to print.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCheques}
              className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Check Vouchers Grid */}
        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
          <DataGrid
            data={cheques}
            columns={columns}
            searchPlaceholder="Search check voucher by payee or check number..."
            searchFields={['checkVoucherNumber', 'checkNumber', 'payeeName']}
            pageSize={5}
          />
        </div>

        {/* Precision Physical Cheque Preview */}
        {selectedCheque && (
          <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Physical Cheque Vector Alignment Preview — Check #{selectedCheque.checkNumber}
              </h2>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Cheque (F7 Hotkey)
              </button>
            </div>

            {/* Simulated Philippine Cheque */}
            <div className="relative w-full max-w-3xl mx-auto h-52 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-5 text-slate-900 shadow-md font-mono select-none">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-extrabold text-sm">{selectedCheque.bankName}</div>
                  <div className="text-[11px] text-slate-600">Cheque #{selectedCheque.checkNumber}</div>
                </div>
                <div className="border-b border-slate-800 text-right pr-2">
                  <span className="text-[10px] text-slate-500 block">DATE (X: {selectedCheque.coordinates.dateX}mm)</span>
                  <span className="text-xs font-bold text-blue-900">{selectedCheque.checkDate}</span>
                </div>
              </div>

              <div className="mt-4 border-b border-slate-800 pb-1 flex justify-between items-baseline">
                <div className="w-3/4">
                  <span className="text-[10px] text-slate-500 block">PAY TO THE ORDER OF</span>
                  <span className="text-xs font-bold text-slate-900">{selectedCheque.payeeName}</span>
                </div>
                <div className="text-right w-1/4">
                  <span className="text-[10px] text-slate-500 block">PESOS (X: {selectedCheque.coordinates.amountFiguresX}mm)</span>
                  <span className="text-xs font-black text-emerald-800">**{selectedCheque.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}**</span>
                </div>
              </div>

              <div className="mt-3 border-b border-slate-800 pb-1">
                <span className="text-[10px] text-slate-500 block">AMOUNT IN WORDS (AmtWords Engine)</span>
                <span className="text-[11px] font-bold text-slate-900 leading-snug">
                  {selectedCheque.amountInWords}
                </span>
              </div>

              <div className="mt-4 flex justify-between items-end text-[10px] text-slate-600">
                <span>||' 043001 ||' {selectedCheque.checkNumber} ||'</span>
                <div className="border-t border-slate-800 pt-1 px-8 text-center">
                  <span className="font-bold text-slate-800">AUTHORIZED SIGNATURE</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
