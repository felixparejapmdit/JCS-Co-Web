'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { Button, Combobox, Input, SearchInput } from '@/components/ui/kit';

export interface LogFilter {
  from: string;
  to: string;
  user: string;
  q: string;
}

/** The filter bar of every log page: period, user, search, and whatever the page adds. */
export function LogFilters({ value, onChange, placeholder, extra, onExport, exportDisabled }: { value: LogFilter; onChange: (f: LogFilter) => void; placeholder: string; extra?: React.ReactNode; onExport?: () => void; exportDisabled?: boolean }) {
  const set = (k: keyof LogFilter, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-white/[0.07]">
      <SearchInput value={value.q} onChange={(v) => set('q', v)} placeholder={placeholder} className="w-full sm:w-64" />
      <Combobox lookup="users" value={value.user} onChange={(v) => set('user', v)} placeholder="Any user" className="w-full sm:w-48" />
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Input type="date" aria-label="From" value={value.from} max={value.to} onChange={(e) => set('from', e.target.value)} className="sm:w-40" />
        <span className="text-xs text-slate-400">to</span>
        <Input type="date" aria-label="To" value={value.to} min={value.from} onChange={(e) => set('to', e.target.value)} className="sm:w-40" />
      </div>
      {extra}
      {onExport && (
        <Button icon={Download} className="sm:ml-auto" disabled={exportDisabled} onClick={onExport}>
          Export CSV
        </Button>
      )}
    </div>
  );
}

/** Saves rows as a CSV file Excel opens directly (UTF-8 with a byte-order mark). */
export function downloadCsv(name: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = String.fromCharCode(0xfeff) + [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
