'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { PlusCircle, Users, ShieldCheck, AlertCircle, RefreshCw, CreditCard } from 'lucide-react';

interface CustomerRow {
  id: string;
  customerCode: string;
  customerName: string;
  tradeName?: string;
  tin: string;
  billingAddress: string;
  creditLimit: number;
  creditLimitFormatted: string;
  paymentTermsDays: number;
  isActive: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [tin, setTin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(1000000);
  const [paymentTermsDays, setPaymentTermsDays] = useState(30);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/masterfiles/customers', {
        headers: { 'x-tenant-id': tid },
      });
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/masterfiles/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tid,
        },
        body: JSON.stringify({
          customerCode,
          customerName,
          tradeName,
          tin,
          billingAddress,
          creditLimit,
          paymentTermsDays,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to create customer.');
      } else {
        setSuccess(`Customer ${json.data.customerCode} (${json.data.customerName}) successfully registered.`);
        setShowModal(false);
        setCustomerCode('');
        setCustomerName('');
        setTin('');
        setBillingAddress('');
        fetchCustomers();
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving customer.');
    }
  };

  const columns: ColumnDef<CustomerRow>[] = [
    {
      header: 'Customer Code',
      accessorKey: 'customerCode',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
          {row.customerCode}
        </span>
      ),
    },
    {
      header: 'Customer Account Name',
      accessorKey: 'customerName',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{row.customerName}</div>
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
      header: 'Credit Limit',
      accessorKey: 'creditLimit',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {row.creditLimitFormatted}
        </span>
      ),
    },
    {
      header: 'Payment Terms',
      accessorKey: 'paymentTermsDays',
      align: 'center',
      cell: (row) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          Net {row.paymentTermsDays} Days
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
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Masterfile</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Commercial client directory with credit limits and billing terms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCustomers}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
              title="Refresh Customers"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-blue-500/20 transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Register Customer
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
          data={customers}
          columns={columns}
          searchPlaceholder="Search customer by code, company name, or TIN..."
          searchFields={['customerCode', 'customerName', 'tin']}
          pageSize={10}
        />

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16161A] border border-slate-200 dark:border-slate-700/80 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Register Corporate Customer
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C-CHEMCORP"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Philippine TIN
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000-789-101-000"
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
                  placeholder="e.g. Philippine Chemical Coatings Corp"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Billing & Delivery Address
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Official billing address..."
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approved Credit Limit (PHP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-mono"
                  />
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
                  Register Customer
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
