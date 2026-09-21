'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Boxes, RefreshCw, CheckCircle, PackageCheck, Layers } from 'lucide-react';

export default function MaterialsPage() {
  const [mmrrList, setMmrrList] = useState<any[]>([]);
  const [stockCards, setStockCards] = useState<any[]>([]);
  const [valuation, setValuation] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/materials/receipts');
      const json = await res.json();
      if (json.success) {
        setMmrrList(json.mmrrList);
        setStockCards(json.stockCards);
        setValuation(json.inventoryValuation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const mmrrColumns: ColumnDef<any>[] = [
    {
      header: 'MMRR Number',
      accessorKey: 'mmrrNumber',
      cell: (row) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.mmrrNumber}</span>,
    },
    {
      header: 'PO Ref',
      accessorKey: 'poNumber',
      cell: (row) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{row.poNumber}</span>,
    },
    {
      header: 'Vendor & Chemical Item',
      accessorKey: 'vendorName',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">{row.vendorName}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{row.itemDescription}</div>
        </div>
      ),
    },
    {
      header: 'Qty Received',
      accessorKey: 'receivedQuantity',
      align: 'center',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
          {row.receivedQuantity} {row.unit}
        </span>
      ),
    },
    {
      header: 'Total Value (PhP)',
      accessorKey: 'totalCost',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {row.totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: '3-Way Match',
      accessorKey: 'is3WayMatched',
      align: 'center',
      cell: (row) => (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> VERIFIED
        </span>
      ),
    },
  ];

  const stockColumns: ColumnDef<any>[] = [
    {
      header: 'Item Code',
      accessorKey: 'itemCode',
      cell: (row) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.itemCode}</span>,
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.description}</span>,
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (row) => <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">{row.category}</span>,
    },
    {
      header: 'On Hand Qty',
      accessorKey: 'onHand',
      align: 'right',
      cell: (row) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{row.onHand} {row.unit}</span>,
    },
    {
      header: 'Moving Avg Unit Cost',
      accessorKey: 'movingAvgCost',
      align: 'right',
      cell: (row) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">PhP {row.movingAvgCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: 'Total Valuation (PhP)',
      accessorKey: 'totalValue',
      align: 'right',
      cell: (row) => <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{row.totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Materials Management & Inventory Stock Cards
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Chemical raw materials receiving (MMRR), PO 3-way matching, and Moving Average costing engine.
            </p>
          </div>

          <button
            onClick={fetchMaterials}
            className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Total Valuation Bar */}
        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Chemical Inventory Valuation</span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
              PhP {valuation.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono rounded-full border border-emerald-200 dark:border-emerald-800">
            Valenzuela Plant Complex Active
          </span>
        </div>

        {/* Stock Cards */}
        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 transition-colors">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Chemical Stock Cards (Moving Average Costing)</h2>
          <DataGrid
            data={stockCards}
            columns={stockColumns}
            searchPlaceholder="Filter items by code or description..."
            searchFields={['itemCode', 'description', 'category']}
            pageSize={5}
          />
        </div>

        {/* Material Receiving Reports */}
        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 transition-colors">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Material Receiving Reports (MMRR 3-Way Match)</h2>
          <DataGrid
            data={mmrrList}
            columns={mmrrColumns}
            searchPlaceholder="Search MMRR by number, vendor, or PO..."
            searchFields={['mmrrNumber', 'poNumber', 'vendorName']}
            pageSize={5}
          />
        </div>
      </div>
    </>
  );
}
