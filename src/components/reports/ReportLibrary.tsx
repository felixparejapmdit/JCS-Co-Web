'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, Download, FileBarChart2, Printer, RefreshCw } from 'lucide-react';
import { fetchRead, peek, useRpc } from '@/lib/api';
import { useSession } from '@/components/shell/AppShell';
import { NAV } from '@/components/shell/nav';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Alert, Button, Card, EmptyState, Field, ICON_CHIP, ICON_TEXT, Input, MODULE_TONE, PageHeader, SearchInput, Select, Spinner, Stat, StatusBadge, cx } from '@/components/ui/kit';
import { fmtDate, nowStamp } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { PERMISSIONS } from '@/shared/permissions';

type Kind = 'text' | 'mono' | 'date' | 'money' | 'qty' | 'int' | 'status';
interface RCol {
  key: string;
  label: string;
  kind?: Kind;
  total?: boolean;
  card?: Column<any>['card'];
}
interface RParam {
  key: string;
  label: string;
  type: 'date' | 'select' | 'text';
  def: string;
  options?: { value: string; label: string }[];
}
export interface ReportMeta {
  id: string;
  module: string;
  title: string;
  description: string;
  legacy: string;
  form: string;
  params: RParam[];
  columns: RCol[];
  link?: { type: string; key: string };
}

const MODULE_LABEL: Record<string, string> = Object.fromEntries(PERMISSIONS.map((s) => [s.id, s.label]));
const moduleIcon = (id: string) => NAV.find((n) => n.id === id)?.icon ?? BarChart3;

/** Short name of a module's report library, as shown in the menu. */
export const LIBRARY_TITLE: Record<string, string> = { gl: 'GL Registers', ap: 'A/P Reports', ar: "Cashier's Reports", sd: 'Sales Registers' };

// ---------------------------------------------------------------------------
// Hub: the reports of one module (or all), as cards
// ---------------------------------------------------------------------------
export function ReportHub({ module }: { module?: string }) {
  const { data, loading, error } = useRpc<ReportMeta[]>('report.catalog');
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const rows = (data ?? []).filter((r) => (!module || r.module === module) && (!query || `${r.title} ${r.description} ${r.legacy}`.toLowerCase().includes(query)));
    const order = PERMISSIONS.map((s) => s.id);
    const m = new Map<string, ReportMeta[]>();
    for (const r of rows) m.set(r.module, [...(m.get(r.module) ?? []), r]);
    return [...m.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }, [data, module, q]);

  return (
    <>
      <PageHeader
        eyebrow={module ? MODULE_LABEL[module] : 'Reports'}
        title={module ? LIBRARY_TITLE[module] ?? 'Reports' : 'Report Library'}
        description="Registers and summaries from the legacy report pages. Open one, set the period, then view it as cards or a list, print it with your company header or export it to Excel (CSV)."
        actions={<SearchInput value={q} onChange={setQ} placeholder="Find a report…" className="w-full sm:w-72" />}
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : !groups.length ? (
        <EmptyState icon={FileBarChart2} title={q ? `No report matches “${q}”` : 'No reports in your access'} text="Ask your system administrator if you need one of these reports." />
      ) : (
        <div className="grid gap-8">
          {groups.map(([mod, reports]) => {
            const Icon = moduleIcon(mod);
            return (
              <section key={mod}>
                {!module && (
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    <Icon className={cx('h-3.5 w-3.5', ICON_TEXT[MODULE_TONE[mod] ?? 'brand'])} /> {MODULE_LABEL[mod] ?? mod}
                  </h3>
                )}
                <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
                  {reports.map((r) => (
                    <Link key={r.id} href={`/dashboard/reports/${r.id}`} className="tile-interactive group flex flex-col p-4">
                      <span className={cx('grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset', ICON_CHIP[MODULE_TONE[r.module] ?? 'brand'])}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="mt-3 font-semibold text-slate-900 dark:text-white">{r.title}</span>
                      <span className="mt-1 flex-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{r.description}</span>
                      <span className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span className="truncate">{r.legacy}</span>
                        <ArrowRight className={cx('h-4 w-4 shrink-0 transition group-hover:translate-x-0.5', ICON_TEXT[MODULE_TONE[r.module] ?? 'brand'])} />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Viewer: parameters, totals, cards / list, print and CSV
// ---------------------------------------------------------------------------
function plain(v: any, kind?: Kind): string {
  if (v === null || v === undefined || v === '') return '';
  if (kind === 'date') return fmtDate(String(v));
  if (kind === 'money') return fmtMoney(Number(v));
  if (kind === 'qty') return Number(v).toLocaleString('en-PH', { maximumFractionDigits: 4 });
  if (kind === 'int') return Number(v).toLocaleString('en-PH');
  return String(v);
}

function cell(v: any, kind?: Kind): React.ReactNode {
  if (v === null || v === undefined || v === '') return <span className="text-slate-400">—</span>;
  if (kind === 'status') return <StatusBadge status={String(v)} />;
  if (kind === 'mono') return <span className="font-mono text-[13px]">{String(v)}</span>;
  if (kind === 'money' || kind === 'qty' || kind === 'int') return <span className="tabular-nums">{plain(v, kind)}</span>;
  return plain(v, kind);
}

const numeric = (k?: Kind) => k === 'money' || k === 'qty' || k === 'int';

function csvOf(meta: ReportMeta, rows: any[], totals: Record<string, number>): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const raw = (v: any, k?: Kind) => (v === null || v === undefined ? '' : numeric(k) ? String(v) : String(v));
  const lines = [meta.columns.map((c) => esc(c.label)).join(',')];
  for (const r of rows) lines.push(meta.columns.map((c) => esc(raw(r[c.key], c.kind))).join(','));
  if (meta.columns.some((c) => c.total)) lines.push(meta.columns.map((c, i) => (c.total ? String(totals[c.key] ?? '') : i === 0 ? 'TOTAL' : '')).join(','));
  return '﻿' + lines.join('\r\n');
}

export function ReportViewer({ id }: { id: string }) {
  const { info } = useSession();
  const catalog = useRpc<ReportMeta[]>('report.catalog');
  const meta = catalog.data?.find((r) => r.id === id);
  const defaults = (m?: ReportMeta) => (m ? Object.fromEntries(m.params.map((p) => [p.key, p.def])) : null);
  // A report opened again shows its last result at once, then refreshes it.
  const [params, setParams] = useState<Record<string, string> | null>(() => defaults(meta));
  const [result, setResult] = useState<{ rows: any[]; totals: Record<string, number>; count: number } | null>(() => (params ? peek("report.run", { id, params }) ?? null : null));
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState('');
  const seq = useRef(0);

  useEffect(() => {
    if (meta && !params) setParams(defaults(meta));
  }, [meta, params]);

  const run = async (p: Record<string, string>) => {
    const n = ++seq.current;
    setRunning(true);
    setError(null);
    try {
      const r = await fetchRead<any>('report.run', { id, params: p });
      if (n === seq.current) {
        setResult(r);
        setRanAt(nowStamp());
      }
    } catch (e) {
      if (n === seq.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (n === seq.current) setRunning(false);
    }
  };

  // Run as soon as the parameters change; typing in a search box waits a moment.
  const first = useRef(true);
  useEffect(() => {
    if (!params) return;
    const t = setTimeout(() => run(params), first.current ? 0 : 350);
    first.current = false;
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const columns: Column<any>[] = useMemo(
    () =>
      (meta?.columns ?? []).map((c) => ({
        key: c.key,
        header: c.label,
        align: numeric(c.kind) ? ('right' as const) : undefined,
        card: c.card,
        render: (r: any) => cell(r[c.key], c.kind),
        sortValue: numeric(c.kind) ? (r: any) => Number(r[c.key] ?? 0) : undefined,
      })),
    [meta]
  );

  if (catalog.loading && !catalog.data) return <Spinner />;
  if (catalog.error) return <Alert tone="danger">{catalog.error}</Alert>;
  if (!meta)
    return (
      <div className="glass mx-auto mt-16 max-w-lg rounded-3xl p-8 text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">This report is not part of your access</p>
        <p className="mt-2 text-sm text-slate-500">Ask your system administrator to add it to your group in Group Access.</p>
        <Link href="/dashboard/reports" className="mt-5 inline-flex text-sm font-semibold text-brand-600 dark:text-brand-300">
          Back to the report library
        </Link>
      </div>
    );

  const totals = meta.columns.filter((c) => c.total);
  const paramText = meta.params
    .map((p) => {
      const v = params?.[p.key] ?? '';
      if (!v || v === 'all') return '';
      const shown = p.type === 'date' ? fmtDate(v) : p.options?.find((o) => o.value === v)?.label ?? v;
      return `${p.label}: ${shown}`;
    })
    .filter(Boolean)
    .join(' · ');

  const exportCsv = () => {
    if (!result) return;
    const blob = new Blob([csvOf(meta, result.rows, result.totals)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${meta.id.replace('/', '-')}-${(params?.from || '').replace(/-/g, '')}${params?.to ? `-${params.to.replace(/-/g, '')}` : ''}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={`/dashboard/reports/${meta.module}`} className="hover:underline">
            {LIBRARY_TITLE[meta.module] ?? MODULE_LABEL[meta.module]}
          </Link>
        }
        title={meta.title}
        description={meta.description}
        actions={
          <>
            <Button icon={Download} disabled={!result?.rows.length} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button icon={Printer} disabled={!result} onClick={() => window.print()}>
              Print
            </Button>
          </>
        }
      />
      <div className="grid gap-6">
        <Card padded>
          <div className="flex flex-wrap items-end gap-3">
            {meta.params.map((p) => (
              <Field key={p.key} label={p.label} className={p.type === 'text' ? 'min-w-[220px] flex-1' : 'w-full sm:w-auto sm:min-w-[170px]'}>
                {p.type === 'select' ? (
                  <Select value={params?.[p.key] ?? ''} options={p.options ?? []} onChange={(e) => setParams((x) => ({ ...(x ?? {}), [p.key]: e.target.value }))} />
                ) : (
                  <Input type={p.type === 'date' ? 'date' : 'search'} value={params?.[p.key] ?? ''} placeholder={p.type === 'text' ? 'Type to filter…' : undefined} onChange={(e) => setParams((x) => ({ ...(x ?? {}), [p.key]: e.target.value }))} />
                )}
              </Field>
            ))}
            <Button icon={RefreshCw} loading={running} onClick={() => params && run(params)}>
              Refresh
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">Legacy source: {meta.legacy}</p>
        </Card>

        {error && <Alert tone="danger">{error}</Alert>}

        {result && (
          <>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
              <Stat label="Lines" value={result.count.toLocaleString()} sub={paramText || 'All records'} icon={FileBarChart2} />
              {totals.slice(0, 3).map((c, i) => (
                <Stat key={c.key} label={c.label} value={plain(result.totals[c.key] ?? 0, c.kind)} tone={(['emerald', 'blue', 'amber'] as const)[i]} />
              ))}
            </div>
            <div className={cx('glass overflow-hidden rounded-2xl transition-opacity', running && 'opacity-60')}>
              <DataTable rows={result.rows} columns={columns} pageSize={25} rowKey={(r, i) => `${r[meta.columns[0].key]}-${i}`} rowHref={meta.link ? (r) => r._href ?? `/dashboard/doc/${meta.link!.type === 'fund' ? r.type : meta.link!.type}/${encodeURIComponent(r[meta.link!.key])}` : undefined} empty={<EmptyState icon={FileBarChart2} title="Nothing in this period" text="Change the dates or filters above." />} />
            </div>
          </>
        )}
        {!result && running && <Spinner label="Running the report…" />}
      </div>

      {/* Paper copy: company header, parameters, every line and the totals. */}
      {result && (
        <div id="print-area" className="hidden print:block">
          <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', fontSize: '9pt', padding: '6mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '3mm' }}>
              <div>
                <div style={{ fontSize: '13pt', fontWeight: 700 }}>{info.legal.bussname}</div>
                <div>{info.legal.address}</div>
                {info.legal.tin && <div>VAT Reg. TIN {info.legal.tin}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12pt', fontWeight: 700, textTransform: 'uppercase' }}>{meta.title}</div>
                <div>{paramText || 'All records'}</div>
                <div>
                  Printed {fmtDate(ranAt.slice(0, 10))} {ranAt.slice(11, 16)} by {info.user.username}
                </div>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '3mm' }}>
              <thead>
                <tr>
                  {meta.columns.map((c) => (
                    <th key={c.key} style={{ borderBottom: '1px solid #000', padding: '1.5mm 1mm', textAlign: numeric(c.kind) ? 'right' : 'left', fontSize: '8pt' }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={i}>
                    {meta.columns.map((c) => (
                      <td key={c.key} style={{ borderBottom: '1px solid #ddd', padding: '1mm', textAlign: numeric(c.kind) ? 'right' : 'left' }}>
                        {plain(r[c.key], c.kind)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {totals.length > 0 && (
                <tfoot>
                  <tr>
                    {meta.columns.map((c, i) => (
                      <td key={c.key} style={{ borderTop: '2px solid #000', padding: '1.5mm 1mm', fontWeight: 700, textAlign: numeric(c.kind) ? 'right' : 'left' }}>
                        {c.total ? plain(result.totals[c.key], c.kind) : i === 0 ? `TOTAL (${result.count})` : ''}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </>
  );
}
