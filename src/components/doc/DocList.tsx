'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleDollarSign, FileSearch, Hourglass, Plus, Wallet, Wand2 } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { fmtDate } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Button, Card, EmptyState, Input, Modal, PageHeader, SearchInput, Spinner, Stat, Tabs } from '@/components/ui/kit';
import { DOCS } from './configs';
import { fmtCell, isNumericKind } from './format';

export function SourcePicker({ type, source, label, help, open, onClose }: { type: string; source: string; label: string; help: string; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    if (!open) return;
    setRows(null);
    setError(null);
    rpc<any[]>('doc.sources', { type, source })
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [open, type, source]);
  const shown = (rows ?? []).filter((r) => !q || `${r.no} ${r.party} ${r.note}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title={label} description={help} size="lg">
      {error ? (
        <Alert tone="danger">{error}</Alert>
      ) : rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState icon={FileSearch} title="Nothing is waiting" text="There are no documents ready for this step right now." />
      ) : (
        <div className="space-y-3">
          <SearchInput value={q} onChange={setQ} placeholder="Filter…" />
          <div className="grid gap-2">
            {shown.map((r) => (
              <button
                key={r.no}
                onClick={() => router.push(`/dashboard/doc/${type}/new?from=${source}&no=${encodeURIComponent(r.no)}`)}
                className="tile-interactive flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{r.no}</div>
                  <div className="truncate text-sm text-slate-600 dark:text-slate-300">{r.party}</div>
                  {r.note && <div className="text-xs text-slate-500">{r.note}</div>}
                </div>
                <div className="text-right text-sm">
                  <div className="text-slate-500">{fmtDate(r.date)}</div>
                  {r.amount ? <div className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{source === 'reorder' || source === 'do' || source === 'formula' ? r.amount : fmtMoney(r.amount)}</div> : null}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

export function DocList({ type }: { type: string }) {
  const cfg = DOCS[type];
  const params = useSearchParams();
  const { can } = useSession();
  const [status, setStatus] = useState(params.get('status') ?? 'all');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [picker, setPicker] = useState<string | null>(null);
  // A long history comes in pages: the server sends the newest documents, and once the list is
  // capped the search, tab and dates are applied by the server (the search after a short pause).
  const [serverSide, setServerSide] = useState(false);
  const [sq, setSq] = useState('');
  useEffect(() => {
    if (!serverSide) return;
    const t = setTimeout(() => setSq(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q, serverSide]);
  const { data, loading, error } = useRpc<{ rows: any[]; counts: Record<string, number>; total?: number; capped?: boolean; limit?: number }>(
    cfg ? 'doc.list' : null,
    serverSide ? { type, status, q: sq, from, to } : { type }
  );
  useEffect(() => {
    if (data?.capped) setServerSide(true);
  }, [data?.capped]);
  const { data: summary } = useRpc<{ label: string; value: number; sub?: string; tone?: any; href?: string }[]>(cfg?.summary ? 'doc.summary' : null, { type });

  useEffect(() => setStatus(params.get('status') ?? 'all'), [params]);

  const rows = useMemo(() => {
    let r = data?.rows ?? [];
    if (status !== 'all') r = r.filter((x) => String(x.status).toLowerCase() === status.toLowerCase());
    if (q) {
      const t = q.toLowerCase();
      r = r.filter((x) => cfg.listCols.some((c) => String(x[c.key] ?? '').toLowerCase().includes(t)) || String(x.remarks ?? '').toLowerCase().includes(t));
    }
    if (from) r = r.filter((x) => String(x.transdate) >= from);
    if (to) r = r.filter((x) => String(x.transdate) <= to);
    return r;
  }, [data, status, q, from, to, cfg]);

  if (!cfg) return <Alert tone="danger">Unknown document type.</Alert>;
  const canCreate = can(cfg.form, 3);
  const tabs = [{ id: 'all', label: 'All', count: data ? data.counts.all ?? 0 : null }, ...cfg.tabs.map((t) => ({ id: t, label: t, count: data ? data.counts[t] ?? 0 : null }))];

  return (
    <RequireRight form={cfg.form}>
      <PageHeader
        title={cfg.plural}
        description={cfg.description}
        actions={
          canCreate && (
            <>
              {cfg.sources?.map((s) => (
                <Button key={s.id} icon={Wand2} onClick={() => setPicker(s.id)}>
                  {s.label}
                </Button>
              ))}
              <Button variant="primary" icon={Plus} href={`/dashboard/doc/${type}/new`}>
                {cfg.newLabel}
              </Button>
            </>
          )
        }
      />
      {cfg.summary && !summary && (
        // Keeps the place of the summary blocks while they load, so the list below does not jump.
        <div className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass h-[118px] rounded-2xl" />
          ))}
        </div>
      )}
      {summary && summary.length > 0 && (
        <div className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
          {summary.map((b, i) => (
            <Stat key={b.label} label={b.label} value={`₱${fmtMoney(b.value)}`} sub={b.sub} tone={b.tone} href={b.href && canCreate ? b.href : undefined} icon={[Wallet, Hourglass, CircleDollarSign][i % 3]} />
          ))}
        </div>
      )}
      <Card padded={false}>
        <div className="px-4 pt-4">
          <Tabs tabs={tabs} value={status} onChange={setStatus} />
        </div>
        <div className="flex flex-col gap-3 px-4 pb-1 pt-3 md:flex-row md:items-center">
          <SearchInput value={q} onChange={setQ} placeholder={`Search ${cfg.plural.toLowerCase()}…`} className="md:max-w-sm md:flex-1" />
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm text-slate-500 sm:flex">
            <span>From</span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="sm:w-40" />
            <span>to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="sm:w-40" />
          </div>
        </div>
        {data?.capped && (
          <p className="px-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
            Showing the newest {data.limit?.toLocaleString()} of {data.total?.toLocaleString()} documents. Search or set dates to find older ones.
          </p>
        )}
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : (
          <DataTable
            rows={rows}
            rowHref={(r) => `/dashboard/doc/${type}/${encodeURIComponent(r.no)}`}
            columns={cfg.listCols.map((c) => ({ key: c.key, header: c.label, align: isNumericKind(c.kind) ? 'right' : 'left', hideOnMobile: c.hideOnMobile, render: (r: any) => fmtCell(r[c.key], c.kind), card: c.kind === 'status' ? 'badge' : undefined }))}
            empty={
              <EmptyState
                icon={FileSearch}
                title={data?.rows.length ? 'No documents match your filters' : `No ${cfg.plural.toLowerCase()} yet`}
                text={data?.rows.length ? 'Try another status tab or clear the search.' : canCreate ? `Create the first one with “${cfg.newLabel}”.` : undefined}
                action={!data?.rows.length && canCreate ? <Button variant="primary" icon={Plus} href={`/dashboard/doc/${type}/new`}>{cfg.newLabel}</Button> : undefined}
              />
            }
          />
        )}
      </Card>
      {cfg.sources?.map((s) => (
        <SourcePicker key={s.id} type={type} source={s.id} label={s.label} help={s.help} open={picker === s.id} onClose={() => setPicker(null)} />
      ))}
      {data && (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Tip: click any row to open it. Documents number themselves; you never need to type a document number.{' '}
          <Link href="/dashboard" className="text-brand-700 hover:underline dark:text-brand-400">
            Back to Home
          </Link>
        </p>
      )}
    </RequireRight>
  );
}
