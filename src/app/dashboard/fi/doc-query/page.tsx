'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, History, Lock, PencilLine, Search } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, Combobox, EmptyState, Field, Input, Modal, PageHeader, SearchInput, Spinner, StatusBadge, cx, useToast } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';

const LOOKUP: Record<string, string> = { customer: 'customers', vendor: 'vendors', salesman: 'salesmen' };

export default function DocQueryPage() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const results = useRpc<any[]>(term.length >= 2 ? 'dq.search' : null, { q: term }, [term]);
  const [pick, setPick] = useState<{ type: string; no: string } | null>(null);
  const info = useRpc<any>(pick ? 'dq.info' : null, pick ?? {}, [pick?.type, pick?.no]);
  const [edit, setEdit] = useState<{ field: string; label: string; kind: string; value: string; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!edit || !pick) return;
    setBusy(true);
    try {
      toast.success(await rpc<string>('dq.correct', { ...pick, field: edit.field, value: edit.value, reason: edit.reason }));
      setEdit(null);
      await info.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const d = info.data;
  return (
    <RequireRight form="052">
      <PageHeader eyebrow="General Ledger" title="Document Query" description="Find any document, check its ledger entries and correction history, and correct a date, reference, salesman, customer or vendor where it is still safe to do so." />
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card title="Find a document" icon={Search} className="lg:self-start">
          <SearchInput value={q} onChange={setQ} placeholder="Number, customer or vendor…" />
          <div className="mt-3 grid max-h-[60vh] gap-1.5 overflow-y-auto">
            {term.length < 2 ? (
              <p className="text-sm text-slate-500">Type at least two characters.</p>
            ) : results.loading && !results.data ? (
              <Spinner />
            ) : !results.data?.length ? (
              <p className="text-sm text-slate-500">No document found.</p>
            ) : (
              results.data.map((r) => (
                <button key={`${r.type}-${r.no}`} onClick={() => setPick({ type: r.type, no: r.no })} className={cx('w-full min-w-0 rounded-xl px-3 py-2 text-left transition', pick?.no === r.no && pick?.type === r.type ? 'bg-white shadow-sm ring-1 ring-black/[0.06] dark:bg-white/[0.09] dark:ring-white/[0.08]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{r.no}</span>
                    <span className="shrink-0">
                      <StatusBadge status={r.status} />
                    </span>
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {r.title} · {r.party || '—'} · {fmtDate(r.date)}
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <div className="grid min-w-0 gap-6">
          {!pick ? (
            <EmptyState icon={Search} title="Choose a document" text="Search on the left, then pick a document to see what can be corrected." />
          ) : info.loading && !d ? (
            <Spinner />
          ) : info.error ? (
            <Alert tone="danger">{info.error}</Alert>
          ) : (
            d && (
              <>
                <Card
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      {d.title} {d.no} <StatusBadge status={d.status} />
                    </span>
                  }
                  subtitle={`${d.header.party || '—'} · ${fmtDate(d.header.transdate)} · ${fmtMoney(d.header.amount)} · form ${d.form}${d.tc ? ` · TC ${d.tc}` : ''}`}
                  actions={
                    <Button icon={ExternalLink} href={`/dashboard/doc/${d.type}/${encodeURIComponent(d.no)}`}>
                      Open
                    </Button>
                  }
                >
                  <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
                    {d.fields.map((f: any) => (
                      <div key={f.field} className="tile flex flex-col p-3">
                        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">{f.label}</div>
                        <div className="mt-1 min-h-[1.25rem] truncate text-sm font-semibold text-slate-900 dark:text-white">{f.kind === 'date' ? fmtDate(f.value) : f.value || '—'}</div>
                        {f.allowed ? (
                          <Button size="sm" icon={PencilLine} className="mt-2 self-start" onClick={() => setEdit({ field: f.field, label: f.label, kind: f.kind, value: f.value, reason: '' })}>
                            Correct
                          </Button>
                        ) : (
                          <p className="mt-2 flex items-start gap-1 text-[11px] text-slate-500">
                            <Lock className="mt-0.5 h-3 w-3 shrink-0" /> {f.why}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Ledger entries" subtitle="From gltranstbl. Open entries move with a date correction; posted ones need a journal voucher.">
                  {!d.gl.length ? (
                    <p className="text-sm text-slate-500">This document has no ledger entries.</p>
                  ) : (
                    <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]">
                      {d.gl.map((g: any, i: number) => (
                        <div key={i} className="tile p-3 text-[13px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-semibold text-slate-900 dark:text-white">{g.acctno}</span>
                            <Badge tone={String(g.glstatus).toUpperCase() === 'POSTED' ? 'success' : 'warning'}>{String(g.glstatus).toUpperCase() === 'POSTED' ? `Posted${g.jvno ? ` ${g.jvno}` : ''}` : 'Open'}</Badge>
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-slate-500">
                            <span>
                              {fmtDate(g.transdate)}
                              {g.ccno ? ` · ${g.ccno}` : ''}
                            </span>
                            <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-100">{g.dramt ? `Dr ${fmtMoney(g.dramt)}` : `Cr ${fmtMoney(g.cramt)}`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card title="Correction history" icon={History}>
                  {!d.history.length ? (
                    <p className="text-sm text-slate-500">No correction yet.</p>
                  ) : (
                    <ul className="grid gap-2 text-sm">
                      {d.history.map((h: any, i: number) => (
                        <li key={i} className="tile p-3">
                          <div className="text-slate-800 dark:text-slate-100">{h.what}</div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {h.when} · {h.user}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            )
          )}
        </div>
      </div>

      <Modal
        open={Boolean(edit)}
        onClose={() => setEdit(null)}
        title={`Correct ${edit?.label.toLowerCase()}`}
        description="The correction and its reason are kept in the document's history and the audit trail."
        footer={
          <>
            <Button onClick={() => setEdit(null)}>Cancel</Button>
            <Button variant="primary" loading={busy} disabled={!edit?.reason.trim()} onClick={save}>
              Save correction
            </Button>
          </>
        }
      >
        {edit && (
          <div className="grid gap-4">
            <Field label={`New ${edit.label.toLowerCase()}`}>
              {edit.kind === 'date' ? (
                <Input type="date" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} />
              ) : LOOKUP[edit.kind] ? (
                <Combobox lookup={LOOKUP[edit.kind]} value={edit.value} onChange={(v) => setEdit({ ...edit, value: v })} />
              ) : (
                <Input value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} />
              )}
            </Field>
            <Field label="Reason" required>
              <Input value={edit.reason} onChange={(e) => setEdit({ ...edit, reason: e.target.value })} placeholder="e.g. encoded with the wrong date" />
            </Field>
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
