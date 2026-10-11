'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Pencil, Printer, TriangleAlert } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { today } from '@/shared/dates';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, Field, Input, KeyValue, Modal, NumberInput, Select, Spinner, useToast } from '@/components/ui/kit';
import { DOCS } from './configs';
import { fmtCell, isNumericKind } from './format';
import { PrintDoc, ChequePrint } from './PrintDoc';

interface ActionDef {
  id: string;
  label: string;
  tone?: 'primary' | 'danger' | 'default';
  confirm?: string;
  hint?: string;
  input?: { key: string; label: string; type: 'text' | 'date' | 'number' | 'select'; required?: boolean; options?: { value: string; label: string }[]; default?: unknown }[];
}

const LINK_PATH: Record<string, string> = { stock: '/dashboard/mm/stock' };

/** The natural next document in each flow, opened pre-filled from this one. */
function nextSteps(type: string, v: any): { label: string; href: string; form: string }[] {
  const h = v.header ?? {};
  const no = encodeURIComponent(v.no);
  const open = (s: string | undefined) => !s || s === 'Unserved' || s === 'Partial' || s === 'Undelivered';
  switch (type) {
    case 'riv':
      return v.status === 'Approved' && open(h.servstat) ? [{ label: 'Create purchase order', href: `/dashboard/doc/po/new?from=riv&no=${no}`, form: '035' }] : [];
    case 'po':
      return v.status === 'Approved' && open(h.servstat) ? [{ label: 'Receive goods', href: `/dashboard/doc/mmrr/new?from=po&no=${no}`, form: '050' }] : [];
    case 'mmrr':
      return v.status === 'Posted' && !h.vpno ? [{ label: 'Bill this receipt', href: `/dashboard/doc/vp/new?from=mmrr&no=${no}`, form: '023' }] : [];
    case 'so':
      return v.status === 'Approved' && open(h.delstat) ? [{ label: 'Deliver this order', href: `/dashboard/doc/do/new?from=so&no=${no}`, form: '007' }] : [];
    case 'do':
      return v.status === 'Posted' && h.mov === '201' && !h.invno ? [{ label: 'Invoice this delivery', href: `/dashboard/doc/si/new?from=do&no=${no}`, form: '019' }] : [];
    case 'si': {
      const bal = v.totals?.find((t: any) => t.label === 'Balance outstanding')?.value ?? 0;
      return v.status === 'Posted' && bal > 0 ? [{ label: 'Record a payment', href: `/dashboard/doc/or/new?custno=${encodeURIComponent(h.custno)}`, form: '010' }] : [];
    }
    case 'vp':
      return v.status === 'Posted' && Number(h.vpbals) > 0 ? [{ label: 'Pay with a cheque', href: `/dashboard/doc/cv/new?venno=${encodeURIComponent(h.venno)}`, form: '024' }] : [];
    case 'prod':
      return v.status === 'Posted' ? [{ label: 'See the stock', href: '/dashboard/mm/stock', form: '034' }] : [];
    default:
      return [];
  }
}

export function DocView({ type, no }: { type: string; no: string }) {
  const cfg = DOCS[type];
  const toast = useToast();
  const { can } = useSession();
  const { data: v, loading, error, reload } = useRpc<any>('doc.get', { type, no });
  const [pending, setPending] = useState<ActionDef | null>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [printing, setPrinting] = useState<'doc' | 'cheque' | null>(null);

  if (!cfg) return <Alert tone="danger">Unknown document type.</Alert>;

  const run = async (a: ActionDef, payload: Record<string, any> = {}) => {
    setBusy(a.id);
    setActionError(null);
    try {
      const res = await rpc<{ message: string }>('doc.act', { type, no, action: a.id, payload });
      toast.success(res.message);
      setPending(null);
      await reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
      if (!pending) toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const start = (a: ActionDef) => {
    if (a.confirm || a.input?.length) {
      const init: Record<string, any> = {};
      for (const f of a.input ?? []) init[f.key] = f.default ?? (f.type === 'date' ? today() : '');
      setInputs(init);
      setActionError(null);
      setPending(a);
    } else run(a);
  };

  const doPrint = async (kind: 'doc' | 'cheque') => {
    setPrinting(kind);
    if (kind === 'cheque') {
      try {
        await rpc('cv.printed', { docno: no });
      } catch {}
    }
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(null), 500);
    }, 150);
  };

  return (
    <RequireRight form={cfg.form}>
      <div className="mb-4">
        <Link href={`/dashboard/doc/${type}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-700 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> {cfg.plural}
        </Link>
      </div>
      {loading && !v ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        v && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{v.title}</h1>
                  <Badge tone={v.tone}>{v.status}</Badge>
                </div>
                {v.subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{v.subtitle}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {v.editable && !cfg.noEdit && (
                  <Button icon={Pencil} href={`/dashboard/doc/${type}/${encodeURIComponent(no)}/edit`}>
                    Edit
                  </Button>
                )}
                <Button icon={Printer} onClick={() => doPrint('doc')}>
                  Print
                </Button>
                {v.print?.kind === 'cheque' && ['Approved', 'Released'].includes(v.status) && (
                  <Button icon={Printer} onClick={() => doPrint('cheque')}>
                    Print cheque
                  </Button>
                )}
                {nextSteps(type, v)
                  .filter((s) => can(s.form, s.form === '034' ? 1 : 3))
                  .map((s) => (
                    <Button key={s.href} variant="subtle" icon={ArrowRight} href={s.href}>
                      {s.label}
                    </Button>
                  ))}
                {v.actions.map((a: ActionDef) => (
                  <Button key={a.id} variant={a.tone === 'primary' ? 'primary' : a.tone === 'danger' ? 'danger' : 'secondary'} loading={busy === a.id} onClick={() => start(a)} title={a.hint}>
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>

            {v.actions.length > 0 && v.actions.find((a: ActionDef) => a.tone === 'primary')?.hint && (
              <p className="-mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">Next step:</span> {v.actions.find((a: ActionDef) => a.tone === 'primary')!.hint}
              </p>
            )}
            {!v.actions.length && v.status === 'Open' && !can(cfg.form, 5) && <Alert tone="info">This document is waiting for someone with approval rights. It appears in their task list automatically.</Alert>}

            {v.checks?.length > 0 && (
              <Card title="Automatic checks">
                <ul className="grid gap-2 md:grid-cols-2">
                  {v.checks.map((c: any, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" /> : <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />}
                      <span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{c.label}</span>
                        {c.detail && <span className="block text-slate-500 dark:text-slate-400">{c.detail}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="min-w-0 space-y-6 xl:col-span-2">
                <Card title="Details">
                  <KeyValue items={cfg.viewHeader.map((f) => ({ label: f.label, value: fmtCell(v.header[f.key], f.kind) }))} />
                  {v.header.remarks && cfg.viewHeader.every((f) => f.key !== 'remarks') && (
                    <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-white/[0.03] dark:text-slate-300">{v.header.remarks}</div>
                  )}
                </Card>
                <Card title="Lines" padded={false}>
                  {v.lines.length === 0 ? (
                    <p className="p-5 text-sm text-slate-500">No lines.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-[#1e2a44] dark:bg-white/[0.02]">
                            {cfg.viewLines.map((c) => (
                              <th key={c.key} className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${isNumericKind(c.kind) ? 'text-right' : 'text-left'}`}>
                                {c.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#1a2540]">
                          {v.lines.map((l: any, i: number) => (
                            <tr key={i}>
                              {cfg.viewLines.map((c) => (
                                <td key={c.key} className={`px-4 py-2.5 text-slate-700 dark:text-slate-300 ${isNumericKind(c.kind) ? 'whitespace-nowrap text-right' : c.kind === 'mono' || c.kind === 'date' ? 'whitespace-nowrap' : ''}`}>
                                  {fmtCell(l[c.key], c.kind)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
              <div className="space-y-6">
                <Card title="Totals">
                  <dl className="space-y-2">
                    {v.totals.map((t: any) => (
                      <div key={t.label} className={`flex items-center justify-between gap-4 text-sm ${t.strong ? 'border-t border-slate-100 pt-2 font-semibold text-slate-900 dark:border-[#1e2a44] dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                        <dt>{t.label}</dt>
                        <dd className="tabular-nums">{fmtCell(t.value, t.kind === 'qty' ? 'qty' : 'money')}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
                {(v.info?.length > 0 || v.links?.length > 0) && (
                  <Card title="Status & related documents">
                    {v.info?.length > 0 && (
                      <dl className="space-y-2.5 text-sm">
                        {v.info.map((i: any) => (
                          <div key={i.label}>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{i.label}</dt>
                            <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{i.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {v.links?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {v.links.map((l: any) => (
                          <Link key={`${l.type}-${l.no}`} href={LINK_PATH[l.type] ?? `/dashboard/doc/${l.type}/${encodeURIComponent(l.no)}`} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-teal-700 hover:border-teal-400 hover:bg-teal-50 dark:border-[#2a3a5c] dark:text-teal-300 dark:hover:bg-teal-500/10">
                            {l.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </Card>
                )}
                <Card title="History">
                  {v.log.length === 0 ? (
                    <p className="text-sm text-slate-500">No recorded activity.</p>
                  ) : (
                    <ol className="space-y-3">
                      {v.log.map((l: any, i: number) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          <div>
                            <div className="text-slate-800 dark:text-slate-200">{l.trans}</div>
                            <div className="text-xs text-slate-500">
                              {l.user} · {l.when}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              </div>
            </div>

            <Modal
              open={Boolean(pending)}
              onClose={() => setPending(null)}
              title={pending?.label ?? ''}
              description={pending?.hint}
              footer={
                <>
                  <Button onClick={() => setPending(null)}>Cancel</Button>
                  <Button variant={pending?.tone === 'danger' ? 'danger' : 'primary'} loading={Boolean(busy)} onClick={() => pending && run(pending, inputs)}>
                    {pending?.label}
                  </Button>
                </>
              }
            >
              <div className="space-y-4">
                {pending?.confirm && <p className="text-sm text-slate-700 dark:text-slate-300">{pending.confirm}</p>}
                {pending?.input?.map((f) => (
                  <Field key={f.key} label={f.label} required={f.required}>
                    {f.type === 'number' ? (
                      <NumberInput value={inputs[f.key]} onValue={(n) => setInputs({ ...inputs, [f.key]: n })} />
                    ) : f.type === 'select' ? (
                      <Select value={inputs[f.key] ?? ''} options={f.options ?? []} onChange={(e) => setInputs({ ...inputs, [f.key]: e.target.value })} />
                    ) : (
                      <Input type={f.type === 'date' ? 'date' : 'text'} value={inputs[f.key] ?? ''} onChange={(e) => setInputs({ ...inputs, [f.key]: e.target.value })} />
                    )}
                  </Field>
                ))}
                {actionError && <Alert tone="danger">{actionError}</Alert>}
              </div>
            </Modal>

            {printing === 'doc' && <PrintDoc view={v} cfg={cfg} />}
            {printing === 'cheque' && v.print && <ChequePrint print={v.print} />}
          </div>
        )
      )}
    </RequireRight>
  );
}
