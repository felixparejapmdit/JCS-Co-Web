'use client';

import React from 'react';
import { fmtMoney } from '@/shared/money';
import { DataTable } from '@/components/ui/DataTable';

export const BUCKETS = [
  { key: 'current', label: 'Not yet due' },
  { key: 'd30', label: '1–30 days' },
  { key: 'd60', label: '31–60 days' },
  { key: 'd90', label: '61–90 days' },
  { key: 'd120', label: '91–120 days' },
  { key: 'over120', label: 'Over 120 days' },
];

export function AgingBar({ totals }: { totals: Record<string, number> }) {
  const total = totals.total || 1;
  const colors = ['bg-emerald-500', 'bg-amber-400', 'bg-orange-500', 'bg-rose-500', 'bg-rose-700', 'bg-rose-900'];
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
        {BUCKETS.map((b, i) => (totals[b.key] > 0 ? <div key={b.key} className={colors[i]} style={{ width: `${(totals[b.key] / total) * 100}%` }} title={`${b.label}: ${fmtMoney(totals[b.key])}`} /> : null))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 xl:grid-cols-6">
        {BUCKETS.map((b, i) => (
          <div key={b.key}>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2 w-2 rounded-full ${colors[i]}`} /> {b.label}
            </div>
            <div className="font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(totals[b.key])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgingTable({ rows, nameKey, nameLabel, onRowClick, totals }: { rows: any[]; nameKey: string; nameLabel: string; onRowClick?: (r: any) => void; totals: Record<string, number> }) {
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => String(r[nameKey])}
      onRowClick={onRowClick}
      pageSize={25}
      columns={[
        { key: nameKey, header: nameLabel, render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r[nameKey]}</span> },
        ...BUCKETS.map((b) => ({ key: b.key, header: b.label, align: 'right' as const, hideOnMobile: b.key !== 'current', render: (r: any) => (r[b.key] ? fmtMoney(r[b.key]) : '') })),
        { key: 'total', header: 'Total', align: 'right', render: (r) => <span className="font-semibold">{fmtMoney(r.total)}</span> },
      ]}
      footer={
        <tr>
          <td className="px-4 py-3">Total</td>
          {BUCKETS.map((b) => (
            <td key={b.key} className={`px-4 py-3 text-right tabular-nums ${b.key !== 'current' ? 'hidden md:table-cell' : ''}`}>
              {fmtMoney(totals[b.key])}
            </td>
          ))}
          <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(totals.total)}</td>
        </tr>
      }
    />
  );
}
