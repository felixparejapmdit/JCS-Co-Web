'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Landmark, RefreshCw, Eye, CheckCircle2, Sliders } from 'lucide-react';

interface BankRow {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  glAccountNumber: string;
  currency: string;
  chequeMarginTopMm: number;
  chequeMarginLeftMm: number;
  isActive: boolean;
  calibratedCoordinates: {
    bankCode: string;
    dateX: number;
    dateY: number;
    payeeX: number;
    payeeY: number;
    amountFiguresX: number;
    amountFiguresY: number;
    amountWordsX: number;
    amountWordsY: number;
  };
}

export default function BanksPage() {
  const [banks, setBanks] = useState<BankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<BankRow | null>(null);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/masterfiles/banks', {
        headers: { 'x-tenant-id': tid },
      });
      const json = await res.json();
      if (json.success) {
        setBanks(json.data);
        if (json.data.length > 0 && !selectedBank) {
          setSelectedBank(json.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const columns: ColumnDef<BankRow>[] = [
    {
      header: 'Bank Code',
      accessorKey: 'bankCode',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
          {row.bankCode}
        </span>
      ),
    },
    {
      header: 'Bank & Branch',
      accessorKey: 'bankName',
      cell: (row) => (
        <div className="font-semibold text-slate-900 dark:text-white">{row.bankName}</div>
      ),
    },
    {
      header: 'Account Number',
      accessorKey: 'accountNumber',
      cell: (row) => (
        <span className="font-mono text-xs px-2 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded text-slate-700 dark:text-slate-200">
          {row.accountNumber}
        </span>
      ),
    },
    {
      header: 'GL Link',
      accessorKey: 'glAccountNumber',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
          {row.glAccountNumber}
        </span>
      ),
    },
    {
      header: 'Calibrated Offset',
      accessorKey: 'chequeMarginTopMm',
      align: 'center',
      cell: (row) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          T: {row.chequeMarginTopMm}mm | L: {row.chequeMarginLeftMm}mm
        </span>
      ),
    },
    {
      header: 'Preview Layout',
      accessorKey: 'id',
      align: 'center',
      cell: (row) => (
        <button
          onClick={() => setSelectedBank(row)}
          className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${
            selectedBank?.id === row.id
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Bank Master & Cheque Coordinate Calibration</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Checking account configurations with millimeter-accurate printer offset calibrations for BDO, BPI, and Metrobank vouchers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBanks}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
              title="Refresh Banks"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bank Table */}
        <DataGrid
          data={banks}
          columns={columns}
          searchPlaceholder="Search by bank code, name, or account number..."
          searchFields={['bankCode', 'bankName', 'accountNumber']}
          pageSize={5}
        />

        {/* Cheque Visualizer Sandbox */}
        {selectedBank && (
          <div className="bg-white dark:bg-[#16161A] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Millimeter Cheque Print Alignment Preview — {selectedBank.bankName} ({selectedBank.bankCode})
                </h2>
              </div>
              <span className="text-xs font-mono bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded">
                Standard Philippine Commercial Cheque (203.2mm × 76.2mm)
              </span>
            </div>

            {/* Visual Cheque Simulation Card */}
            <div className="relative w-full max-w-3xl mx-auto h-52 bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-300/80 rounded-lg p-4 text-slate-900 shadow-2xl overflow-hidden select-none font-mono">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none text-5xl font-black uppercase text-amber-900 tracking-widest rotate-[-10deg]">
                {selectedBank.bankCode} CHEQUE
              </div>

              {/* Bank Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm text-slate-900">{selectedBank.bankName}</div>
                  <div className="text-[11px] text-slate-600">Account: {selectedBank.accountNumber}</div>
                </div>
                {/* Date Position */}
                <div className="border-b border-slate-700 text-right pr-2">
                  <span className="text-[10px] text-slate-500 block">DATE (X: {selectedBank.calibratedCoordinates.dateX}mm, Y: {selectedBank.calibratedCoordinates.dateY}mm)</span>
                  <span className="text-xs font-bold text-blue-900">2026-09-21</span>
                </div>
              </div>

              {/* Payee Line */}
              <div className="mt-4 border-b border-slate-700 pb-1 flex justify-between items-baseline">
                <div className="w-4/5">
                  <span className="text-[10px] text-slate-500 block">PAY TO THE ORDER OF (X: {selectedBank.calibratedCoordinates.payeeX}mm, Y: {selectedBank.calibratedCoordinates.payeeY}mm)</span>
                  <span className="text-xs font-bold text-slate-900">Petron Corporation - Industrial Solvent</span>
                </div>
                {/* Amount Figures */}
                <div className="text-right w-1/5">
                  <span className="text-[10px] text-slate-500 block">PHP (X: {selectedBank.calibratedCoordinates.amountFiguresX}mm)</span>
                  <span className="text-xs font-black text-emerald-800">**380,000.00**</span>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="mt-3 border-b border-slate-700 pb-1">
                <span className="text-[10px] text-slate-500 block">PESOS IN WORDS (X: {selectedBank.calibratedCoordinates.amountWordsX}mm, Y: {selectedBank.calibratedCoordinates.amountWordsY}mm)</span>
                <span className="text-xs font-bold text-slate-900">
                  *** THREE HUNDRED EIGHTY THOUSAND PESOS ONLY ***
                </span>
              </div>

              {/* Cheque Footer / Signatures */}
              <div className="mt-4 flex justify-between items-end text-[10px] text-slate-600">
                <span>MICR LINE: ||' 001234 ||' 043001 ||' {selectedBank.accountNumber} ||'</span>
                <div className="border-t border-slate-700 pt-1 px-6 text-center">
                  <span className="font-bold text-slate-800">AUTHORIZED SIGNATURE</span>
                </div>
              </div>
            </div>

            {/* Coordinate Readout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>Date Coordinate: <span className="text-blue-600 dark:text-blue-300 font-bold">({selectedBank.calibratedCoordinates.dateX}mm, {selectedBank.calibratedCoordinates.dateY}mm)</span></div>
              <div>Payee Coordinate: <span className="text-blue-600 dark:text-blue-300 font-bold">({selectedBank.calibratedCoordinates.payeeX}mm, {selectedBank.calibratedCoordinates.payeeY}mm)</span></div>
              <div>Amount Figures: <span className="text-blue-600 dark:text-blue-300 font-bold">({selectedBank.calibratedCoordinates.amountFiguresX}mm, {selectedBank.calibratedCoordinates.amountFiguresY}mm)</span></div>
              <div>Amount Words: <span className="text-blue-600 dark:text-blue-300 font-bold">({selectedBank.calibratedCoordinates.amountWordsX}mm, {selectedBank.calibratedCoordinates.amountWordsY}mm)</span></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
