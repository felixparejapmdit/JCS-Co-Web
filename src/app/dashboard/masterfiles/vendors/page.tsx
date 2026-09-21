'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { PlusCircle, Briefcase, ShieldCheck, AlertCircle, RefreshCw, FileCheck } from 'lucide-react';

interface VendorRow {
  id: string;
  vendorCode: string;
  vendorName: string;
  tradeName?: string;
  tin: string;
  registeredAddress: string;
  defaultAtc: string;
  paymentTermsDays: number;
  isVatRegistered: boolean;
  isActive: boolean;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [vendorCode, setVendorCode] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [tin, setTin] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [defaultAtc, setDefaultAtc] = useState('WC160');
  const [paymentTermsDays, setPaymentTermsDays] = useState(30);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/masterfiles/vendors', {
        headers: { 'x-tenant-id': tid },
      });
      const json = await res.json();
      if (json.success) {
        setVendors(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/masterfiles/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tid,
        },
        body: JSON.stringify({
          vendorCode,
          vendorName,
          tradeName,
          tin,
          registeredAddress,
          defaultAtc,
          paymentTermsDays,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to create vendor.');
      } else {
        setSuccess(`Vendor ${json.data.vendorCode} (${json.data.vendorName}) successfully registered.`);
        setShowModal(false);
        setVendorCode('');
        setVendorName('');
        setTin('');
        setRegisteredAddress('');
        fetchVendors();
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving vendor.');
    }
  };

  const columns: ColumnDef<VendorRow>[] = [
    {
      header: 'Vendor Code',
      accessorKey: 'vendorCode',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
          {row.vendorCode}
        </span>
      ),
    },
    {
      header: 'Legal Corporate Name',
      accessorKey: 'vendorName',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{row.vendorName}</div>
          {row.tradeName && <div className="text-xs text-slate-500 dark:text-slate-400">T/A: {row.tradeName}</div>}
        </div>
      ),
    },
    {
      header: 'Philippine TIN',
      accessorKey: 'tin',
      cell: (row) => (
        <span className="font-mono text-xs px-2 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded text-slate-700 dark:text-slate-300">
          {row.tin}
        </span>
      ),
    },
    {
      header: 'Default ATC',
      accessorKey: 'defaultAtc',
      align: 'center',
      cell: (row) => (
        <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded">
          {row.defaultAtc}
        </span>
      ),
    },
    {
      header: 'Terms',
      accessorKey: 'paymentTermsDays',
      align: 'center',
      cell: (row) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          Net {row.paymentTermsDays}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      align: 'center',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Vendor Masterfile</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supplier directory with 9/12-digit Philippine TIN formatting and automated BIR Form 2307 ATC tax categorization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchVendors}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
              title="Refresh Vendors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-blue-500/20 transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Register Vendor
            </button>
          </div>
        </div>

        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <DataGrid
          data={vendors}
          columns={columns}
          searchPlaceholder="Search vendor by code, name, or TIN..."
          searchFields={['vendorCode', 'vendorName', 'tin', 'defaultAtc']}
          pageSize={10}
        />

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16161A] border border-slate-200 dark:border-slate-700/80 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Register Corporate Supplier
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. V-SHELL"
                    value={vendorCode}
                    onChange={(e) => setVendorCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Philippine TIN (9/12 Digits)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000-123-456-000"
                    value={tin}
                    onChange={(e) => setTin(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Legal Corporate Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shell Pilipinas Corporation"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trade Name / Brand (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shell Chemicals"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  BIR Registered Address
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Official registered address for BIR Form 2307 certificate..."
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default ATC Tax Code
                  </label>
                  <select
                    value={defaultAtc}
                    onChange={(e) => setDefaultAtc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="WC160">WC160 (1% - Regular Supplier of Goods)</option>
                    <option value="WC158">WC158 (2% - Regular Supplier of Services)</option>
                    <option value="WI010">WI010 (5% / 10% - Professional Fees)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value={15}>Net 15 Days</option>
                    <option value={30}>Net 30 Days</option>
                    <option value={60}>Net 60 Days</option>
                    <option value={90}>Net 90 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
                >
                  Register Vendor
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
