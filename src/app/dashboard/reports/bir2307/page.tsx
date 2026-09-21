'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { FileCheck, RefreshCw, Printer, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function Bir2307Page() {
  const [certs, setCerts] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/bir2307');
      const json = await res.json();
      if (json.success) {
        setCerts(json.certificates);
        if (json.certificates.length > 0 && !selectedCert) {
          setSelectedCert(json.certificates[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const columns: ColumnDef<any>[] = [
    {
      header: 'Certificate ID',
      accessorKey: 'certificateId',
      cell: (row) => <span className="font-mono font-bold text-blue-600">{row.certificateId}</span>,
    },
    {
      header: 'Payee / Supplier',
      accessorKey: 'payeeName',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.payeeName}</div>
          <div className="text-[11px] font-mono text-slate-500">TIN: {row.payeeTin}</div>
        </div>
      ),
    },
    {
      header: 'ATC Code',
      accessorKey: 'atcCode',
      align: 'center',
      cell: (row) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">
          {row.atcCode} ({row.taxRatePercent}%)
        </span>
      ),
    },
    {
      header: 'Gross Payment (PhP)',
      accessorKey: 'grossPayment',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-800">
          {row.grossPayment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Tax Withheld (PhP)',
      accessorKey: 'taxWithheld',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-extrabold text-rose-600">
          {row.taxWithheld.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'certificateId',
      align: 'center',
      cell: (row) => (
        <button
          onClick={() => {
            setSelectedCert(row);
            setTimeout(() => window.print(), 100);
          }}
          className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" /> Print 2307
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
              BIR Form 2307 Withholding Tax Engine
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Certificate of Creditable Tax Withheld at Source (WC158 2%, WC160 1%, WI010 5%).
            </p>
          </div>

          <button
            onClick={fetchCertificates}
            className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
          <DataGrid
            data={certs}
            columns={columns}
            searchPlaceholder="Search certificate by supplier or TIN..."
            searchFields={['certificateId', 'payeeName', 'payeeTin']}
            pageSize={5}
          />
        </div>

        {/* Official BIR 2307 Certificate Layout Preview */}
        {selectedCert && (
          <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Official BIR Form 2307 Layout — {selectedCert.certificateId}
              </h2>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Official Form
              </button>
            </div>

            <div className="max-w-3xl mx-auto border-2 border-slate-800 p-6 text-slate-900 font-sans text-xs space-y-4 bg-amber-50/20">
              {/* BIR Header */}
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <div className="font-extrabold text-sm uppercase">Republic of the Philippines — Bureau of Internal Revenue</div>
                <div className="font-black text-base uppercase tracking-tight text-blue-900">Certificate of Creditable Tax Withheld at Source</div>
                <div className="font-mono text-[11px] text-slate-600">BIR Form No. 2307 (January 2018 Version)</div>
              </div>

              {/* Part I: Payee */}
              <div className="border border-slate-400 p-3 bg-white space-y-1">
                <div className="font-bold uppercase text-[11px] text-slate-600">Part I — Payee Information</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>TIN:</strong> <span className="font-mono">{selectedCert.payeeTin}</span></div>
                  <div><strong>Name:</strong> {selectedCert.payeeName}</div>
                </div>
              </div>

              {/* Part II: Payor */}
              <div className="border border-slate-400 p-3 bg-white space-y-1">
                <div className="font-bold uppercase text-[11px] text-slate-600">Part II — Payor Information</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>TIN:</strong> <span className="font-mono">{selectedCert.payorTin}</span></div>
                  <div><strong>Name:</strong> {selectedCert.payorName}</div>
                </div>
              </div>

              {/* Part III: Tax Details */}
              <div className="border border-slate-400 overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 font-bold border-b border-slate-400">
                    <tr>
                      <th className="p-2">Nature of Payment</th>
                      <th className="p-2">ATC</th>
                      <th className="p-2 text-right">Gross Amount</th>
                      <th className="p-2 text-right">Tax Rate</th>
                      <th className="p-2 text-right">Tax Withheld</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2">{selectedCert.taxDescription}</td>
                      <td className="p-2 font-mono font-bold text-amber-700">{selectedCert.atcCode}</td>
                      <td className="p-2 text-right font-mono">PhP {selectedCert.grossPayment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right font-mono">{selectedCert.taxRatePercent}%</td>
                      <td className="p-2 text-right font-mono font-bold text-rose-700">PhP {selectedCert.taxWithheld.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature */}
              <div className="pt-4 flex justify-between items-end text-[11px]">
                <div>Conforme: ________________________ (Payee Signature)</div>
                <div className="text-right">
                  <div>Maria Santos, CPA</div>
                  <div className="border-t border-slate-800 pt-1 font-bold">Authorized Representative / Tax Agent</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
