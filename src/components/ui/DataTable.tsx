'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, LayoutGrid, Rows3 } from 'lucide-react';
import { EmptyState, Segmented, cx } from './kit';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
  sortValue?: (row: T) => string | number;
  /** Role of the column on a card. Inferred when not given. */
  card?: 'title' | 'subtitle' | 'amount' | 'meta' | 'badge' | 'hide';
}

type View = 'cards' | 'list';
const VIEW_KEY = 'cloudaos_view';
const AMOUNT_KEYS = ['amount', 'total', 'value', 'balance', 'netamt', 'net', 'debit', 'docamt'];

function useViewPref(): [View, (v: View) => void] {
  // Read before the first paint (tables only render in the browser), so the view never switches visibly.
  const [view, setView] = useState<View>(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      return v === 'list' ? 'list' : 'cards';
    } catch {
      return 'cards';
    }
  });
  return [
    view,
    (v: View) => {
      setView(v);
      try {
        localStorage.setItem(VIEW_KEY, v);
      } catch {}
    },
  ];
}

function headerText(h: React.ReactNode): string {
  return typeof h === 'string' ? h : '';
}

/** Works out which column plays which part on a card. */
function cardRoles<T>(columns: Column<T>[]) {
  const explicit = (role: Column<T>['card']) => columns.find((c) => c.card === role);
  const isStatus = (c: Column<T>) => c.key === 'status' || /status/i.test(headerText(c.header));
  const free = columns.filter((c) => !c.card || c.card === 'meta');
  const title = explicit('title') ?? free.find((c) => !isStatus(c));
  const badge = explicit('badge') ?? free.find((c) => isStatus(c) && c !== title);
  const amount =
    explicit('amount') ??
    AMOUNT_KEYS.map((k) => free.find((c) => c.key === k && c.align === 'right')).find(Boolean) ??
    [...free].reverse().find((c) => c.align === 'right' && c !== title);
  const subtitle = explicit('subtitle') ?? free.find((c) => c !== title && c !== badge && c !== amount && c.align !== 'right' && !/date/i.test(c.key) && !/date/i.test(headerText(c.header)));
  const meta = columns.filter((c) => c.card !== 'hide' && c !== title && c !== badge && c !== amount && c !== subtitle);
  return { title, badge, amount, subtitle, meta };
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
  view: forcedView,
  toolbar = true,
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
  /** Force one presentation (e.g. a wide matrix that only reads well as a list). */
  view?: View;
  toolbar?: boolean;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null);
  const [page, setPage] = useState(1);
  const [pref, setPref] = useViewPref();
  const view: View = forcedView ?? pref;

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

  const size = view === 'cards' ? (pageSize > 15 ? pageSize : 12) : pageSize;
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * size, current * size);
  const clickable = Boolean(onRowClick || rowHref);
  const roles = useMemo(() => cardRoles(columns), [columns]);
  const sortable = columns.filter((c) => c.sortable !== false && headerText(c.header));

  const go = (r: T) => {
    if (onRowClick) onRowClick(r);
    else if (rowHref) router.push(rowHref(r));
  };
  const cell = (c: Column<T>, r: T) => (c.render ? c.render(r) : r[c.key] ?? '');

  if (!rows.length) return <>{empty ?? <EmptyState icon={Inbox} title="Nothing here yet" />}</>;

  return (
    <div>
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-1 pt-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sorted.length} {sorted.length === 1 ? 'item' : 'items'}
          </p>
          <div className="flex items-center gap-2">
            {sortable.length > 0 && (
              <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <ArrowUpDown className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <select
                  aria-label="Sort by"
                  className="h-8 rounded-lg border border-black/[0.07] bg-white/60 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200"
                  value={sort ? `${sort.key}:${sort.dir}` : ''}
                  onChange={(e) => {
                    const [key, dir] = e.target.value.split(':');
                    setSort(key ? { key, dir: dir as 'asc' | 'desc' } : null);
                  }}
                >
                  <option value="">Default order</option>
                  {sortable.flatMap((c) => [
                    <option key={`${c.key}:asc`} value={`${c.key}:asc`}>
                      {headerText(c.header)} ↑
                    </option>,
                    <option key={`${c.key}:desc`} value={`${c.key}:desc`}>
                      {headerText(c.header)} ↓
                    </option>,
                  ])}
                </select>
              </label>
            )}
            {!forcedView && (
              <Segmented<View>
                value={view}
                onChange={setPref}
                options={[
                  { value: 'cards', label: 'Cards', icon: LayoutGrid },
                  { value: 'list', label: 'List', icon: Rows3 },
                ]}
              />
            )}
          </div>
        </div>
      )}

      {view === 'cards' ? (
        <div className="grid gap-3 p-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,268px),1fr))]">
          {shown.map((r, i) => {
            const key = rowKey ? rowKey(r, i) : String(r.no ?? r.id ?? `${current}-${i}`);
            return (
              <div
                key={key}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => go(r) : undefined}
                onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go(r)) : undefined}
                className={cx('flex min-w-0 flex-col gap-3 p-4', clickable ? 'tile-interactive' : 'tile')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {roles.title && <div className="truncate text-[14px] font-semibold tracking-tight text-slate-900 dark:text-white">{cell(roles.title, r)}</div>}
                    {roles.subtitle && <div className="mt-0.5 truncate text-[13px] text-slate-600 dark:text-slate-300">{cell(roles.subtitle, r)}</div>}
                  </div>
                  {roles.badge && <div className="flex-shrink-0">{cell(roles.badge, r)}</div>}
                </div>
                {roles.meta.length > 0 && (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {roles.meta.map((c) => {
                      const v = cell(c, r);
                      return (
                        <div key={c.key} className="min-w-0">
                          <dt className="truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">{c.header}</dt>
                          <dd className={cx('truncate text-[13px] text-slate-700 dark:text-slate-300', c.align === 'right' && 'tabular-nums')}>{v === '' || v === null || v === undefined ? '—' : v}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {roles.amount && (
                  <div className="mt-auto flex items-end justify-between gap-2 border-t border-black/[0.05] pt-3 dark:border-white/[0.06]">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">{roles.amount.header}</span>
                    <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums dark:text-white">{cell(roles.amount, r)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto px-2 pb-1">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {columns.map((c) => {
                  const active = sort?.key === c.key;
                  return (
                    <th
                      key={c.key}
                      className={cx(
                        'whitespace-nowrap border-b border-black/[0.06] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:border-white/[0.07] dark:text-slate-400',
                        c.align === 'right' && 'text-right',
                        c.align === 'center' && 'text-center',
                        c.hideOnMobile && 'hidden md:table-cell',
                        c.className
                      )}
                    >
                      {c.sortable === false ? (
                        c.header
                      ) : (
                        <button className={cx('inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200', active && 'text-brand-600 dark:text-brand-300')} onClick={() => setSort(active && sort!.dir === 'asc' ? { key: c.key, dir: 'desc' } : { key: c.key, dir: 'asc' })}>
                          {c.header}
                          {active && (sort!.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={rowKey ? rowKey(r, i) : String(r.no ?? r.id ?? i)} onClick={clickable ? () => go(r) : undefined} className={cx('group transition-colors', clickable && 'cursor-pointer')}>
                  {columns.map((c, ci) => (
                    <td
                      key={c.key}
                      className={cx(
                        dense ? 'px-3 py-2' : 'px-3 py-2.5',
                        'align-middle text-slate-700 dark:text-slate-300',
                        clickable && 'group-hover:bg-brand-500/[0.06] dark:group-hover:bg-brand-400/[0.07]',
                        ci === 0 && 'rounded-l-xl',
                        ci === columns.length - 1 && 'rounded-r-xl',
                        c.align === 'right' && 'text-right tabular-nums',
                        c.align === 'center' && 'text-center',
                        c.hideOnMobile && 'hidden md:table-cell',
                        c.className
                      )}
                    >
                      {cell(c, r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {footer && <tfoot className="font-semibold [&_td]:border-t [&_td]:border-black/[0.08] dark:[&_td]:border-white/[0.1]">{footer}</tfoot>}
          </table>
        </div>
      )}

      {view === 'cards' && footer && (
        <div className="mx-4 mb-3 overflow-x-auto rounded-2xl bg-brand-500/[0.06] px-2 py-1 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-400/[0.06] dark:ring-brand-400/15">
          <table className="w-full text-sm font-semibold">
            <tfoot>{footer}</tfoot>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          <span className="tabular-nums">
            {(current - 1) * size + 1}–{Math.min(current * size, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button className="rounded-lg p-1.5 hover:bg-black/[0.05] disabled:opacity-40 dark:hover:bg-white/[0.07]" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 tabular-nums">
              Page {current} of {pages}
            </span>
            <button className="rounded-lg p-1.5 hover:bg-black/[0.05] disabled:opacity-40 dark:hover:bg-white/[0.07]" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
