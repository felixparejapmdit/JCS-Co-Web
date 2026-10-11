'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { EmptyState, cx } from './kit';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
  sortValue?: (row: T) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  onRowClick,
  rowHref,
  empty,
  pageSize = 15,
  footer,
  dense,
  rowKey,
  initialSort,
}: {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  rowHref?: (row: T) => string;
  empty?: React.ReactNode;
  pageSize?: number;
  footer?: React.ReactNode;
  dense?: boolean;
  rowKey?: (row: T, i: number) => string;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
}) {
  const router = useRouter();
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [rows.length]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const val = (r: T) => (col?.sortValue ? col.sortValue(r) : r[sort.key]);
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true });
      return sort.dir === 'asc' ? c : -c;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const view = sorted.slice((page - 1) * pageSize, page * pageSize);
  const clickable = Boolean(onRowClick || rowHref);

  const go = (r: T) => {
    if (onRowClick) onRowClick(r);
    else if (rowHref) router.push(rowHref(r));
  };

  if (!rows.length) return <>{empty ?? <EmptyState icon={Inbox} title="Nothing here yet" />}</>;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left dark:border-[#1e2a44] dark:bg-white/[0.02]">
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={cx(
                      'whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.hideOnMobile && 'hidden md:table-cell',
                      c.className
                    )}
                  >
                    {c.sortable === false ? (
                      c.header
                    ) : (
                      <button className={cx('inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200', active && 'text-slate-800 dark:text-slate-200')} onClick={() => setSort(active && sort!.dir === 'asc' ? { key: c.key, dir: 'desc' } : { key: c.key, dir: 'asc' })}>
                        {c.header}
                        {active && (sort!.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2540]">
            {view.map((r, i) => (
              <tr
                key={rowKey ? rowKey(r, i) : String(r.no ?? r.id ?? i)}
                onClick={clickable ? () => go(r) : undefined}
                className={cx(clickable && 'cursor-pointer hover:bg-teal-50/50 dark:hover:bg-teal-500/5', 'transition-colors')}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cx(
                      dense ? 'px-4 py-2' : 'px-4 py-3',
                      'align-middle text-slate-700 dark:text-slate-300',
                      c.align === 'right' && 'text-right tabular-nums',
                      c.align === 'center' && 'text-center',
                      c.hideOnMobile && 'hidden md:table-cell',
                      c.className
                    )}
                  >
                    {c.render ? c.render(r) : r[c.key] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && <tfoot className="border-t-2 border-slate-200 bg-slate-50/80 font-semibold dark:border-[#1e2a44] dark:bg-white/[0.02]">{footer}</tfoot>}
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500 dark:border-[#1e2a44] dark:text-slate-400">
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-white/5" disabled={page === 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2">
              Page {page} of {pages}
            </span>
            <button className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-white/5" disabled={page === pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
