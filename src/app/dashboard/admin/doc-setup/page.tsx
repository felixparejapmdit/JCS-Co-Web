'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, FileDigit, Hash, PauseCircle, PlayCircle } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight } from '@/components/shell/AppShell';
import { NAV } from '@/components/shell/nav';
import { Alert, Badge, Button, Card, ICON_TEXT, MODULE_TONE, PageHeader, SearchInput, Spinner, Stat, cx, useToast } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';
import { PERMISSIONS } from '@/shared/permissions';

/** Which menu section a document type belongs to, from its permission form. */
function sectionOf(form: string): string {
  return PERMISSIONS.find((s) => s.forms.some((f) => f.form === form))?.label ?? 'Other';
}

export default function DocSetupPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useRpc<any>('system.docSetup');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const grouped = useMemo(() => {
    const m = new Map<string, any[]>();
    const query = q.trim().toLowerCase();
    for (const d of data?.docs ?? []) {
      if (query && !`${d.title} ${d.type} ${d.form} ${d.tc} ${d.table} ${d.latest}`.toLowerCase().includes(query)) continue;
      const s = sectionOf(d.form);
      m.set(s, [...(m.get(s) ?? []), d]);
    }
    const order = PERMISSIONS.map((s) => s.label);
    return [...m.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }, [data, q]);

  const setHold = async (hold: boolean) => {
    setBusy(true);
    try {
      toast.success(await rpc<string>('system.setDownload', { hold }));
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const held = data?.download === 'held';
  const total = (data?.docs ?? []).reduce((n: number, d: any) => n + d.count, 0);
  const sectionIcon = (label: string) => NAV.find((n) => n.id === PERMISSIONS.find((p) => p.label === label)?.id)?.icon ?? FileDigit;

  return (
    <RequireRight form="001">
      <PageHeader eyebrow="Administration" title="Document Setup" description="Every document type with its legacy table, transaction code and numbering, plus the switch that holds the AOS mobile app data download." />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="grid gap-6">
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
              <Stat label="Document types" icon={FileDigit} value={data.docs.length} sub="Each one numbers its own series" />
              <Stat label="Documents on file" icon={Hash} tone="emerald" value={total.toLocaleString()} sub="Across all types, this company" />
              <Stat label="App data download" icon={Download} tone={held ? 'amber' : 'emerald'} value={held ? 'On hold' : 'Released'} sub={`batbl.dloadstat = ${data.downloadRaw || '(empty)'}`} />
            </div>

            <Card
              title="AOS mobile app download"
              subtitle="Hold the download while you correct masters or prices, so salesmen do not load half-finished data. This is the legacy “Hold DL / Release DL” switch."
              icon={held ? PauseCircle : PlayCircle}
              actions={
                data.canEdit &&
                (held ? (
                  <Button variant="success" icon={PlayCircle} loading={busy} onClick={() => setHold(false)}>
                    Release download
                  </Button>
                ) : (
                  <Button icon={PauseCircle} loading={busy} onClick={() => setHold(true)}>
                    Hold download
                  </Button>
                ))
              }
            >
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Badge tone={held ? 'warning' : 'success'}>{held ? 'On hold (Close)' : 'Released (Open)'}</Badge>
                <span>{held ? 'The app cannot download new data until you release it.' : 'The app can download the latest masters and prices.'}</span>
              </div>
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <SearchInput value={q} onChange={setQ} placeholder="Find a document type, code or table…" className="w-full sm:w-80" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Numbers continue from the highest number in each legacy table, so both systems keep one series.</p>
            </div>

            {grouped.map(([section, docs]) => {
              const Icon = sectionIcon(section);
              return (
                <section key={section}>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    <Icon className={cx('h-3.5 w-3.5', ICON_TEXT[MODULE_TONE[PERMISSIONS.find((p) => p.label === section)?.id ?? ''] ?? 'brand'])} /> {section}
                  </h3>
                  <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,290px),1fr))]">
                    {docs.map((d: any) => {
                      const body = (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">{d.title}</span>
                            <span className="font-mono text-[11px] text-slate-400">form {d.form}</span>
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
                            <div>
                              <dt className="text-[11px] text-slate-500">Latest number</dt>
                              <dd className="font-mono text-slate-800 dark:text-slate-100">{d.latest || '—'}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-slate-500">Documents</dt>
                              <dd className="tabular-nums text-slate-800 dark:text-slate-100">{d.count.toLocaleString()}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-slate-500">Series</dt>
                              <dd className="text-slate-600 dark:text-slate-300">
                                {d.digits ? (
                                  <>
                                    <span className="font-mono">{d.prefix || '(none)'}</span> + {d.digits} digits
                                  </>
                                ) : (
                                  '—'
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-slate-500">Last dated</dt>
                              <dd className="text-slate-600 dark:text-slate-300">{d.lastDate ? fmtDate(d.lastDate) : '—'}</dd>
                            </div>
                          </dl>
                          <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px] text-slate-500">
                            <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5 dark:bg-white/[0.06]">{d.table}.{d.column}</span>
                            {d.tc && <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5 dark:bg-white/[0.06]">TC {d.tc}</span>}
                          </div>
                        </>
                      );
                      return d.canView ? (
                        <Link key={d.type} href={`/dashboard/doc/${d.type}`} className="tile-interactive block p-4">
                          {body}
                        </Link>
                      ) : (
                        <div key={d.type} className="tile p-4">
                          {body}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            {!grouped.length && <p className="text-sm text-slate-500">No document type matches “{q}”.</p>}
          </div>
        )
      )}
    </RequireRight>
  );
}
