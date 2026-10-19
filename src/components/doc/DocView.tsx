'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Pencil, Printer, TriangleAlert } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { today } from '@/shared/dates';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, Field, Input, KeyValue, Modal, NumberInput, Select, Spinner, cx, useToast } from '@/components/ui/kit';
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
    case 'vp': {
      const steps: { label: string; href: string; form: string }[] = [];
      if (v.status === 'Posted' && Number(h.vpbals) > 0) steps.push({ label: 'Pay with a cheque', href: `/dashboard/doc/cv/new?venno=${encodeURIComponent(h.venno)}`, form: '024' });
      if (v.status === 'Posted' && h.isAdvance && h.liqstat !== 'Liquidated') steps.push({ label: 'Liquidate this advance', href: `/dashboard/doc/liq/new?from=ca&no=${no}`, form: '038' });
      return steps;
    }
    case 'fr':
      return v.status === 'Unpaid' && (!h.vpno || h.vpno === '0') ? [{ label: 'Create the voucher payable', href: `/dashboard/doc/vp/new?from=fr&no=${no}`, form: '023' }] : [];
    case 'liq':
      return v.status === 'Posted' && Number(h.vpbals) > 0 ? [{ label: 'Pay the reimbursement', href: `/dashboard/doc/cv/new?venno=${encodeURIComponent(h.venno)}`, form: '024' }] : [];
    case 'pcv':
    case 'rfv':
      return v.status === 'Posted' && !h.replno ? [{ label: 'Replenish the fund', href: `/dashboard/doc/fr/new?tc=${type === 'pcv' ? '40' : '44'}`, form: '028' }] : [];
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
        <Link href={`/dashboard/doc/${type}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4 text-brand-600 dark:text-brand-300" /> {cfg.plural}
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
                  <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">{v.title}</h1>
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
              <p className="-mt-2 inline-flex items-start gap-2 rounded-2xl bg-brand-500/[0.07] px-3.5 py-2 text-sm text-slate-600 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-400/[0.07] dark:text-slate-300 dark:ring-brand-400/15">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500 shadow-[0_0_8px_rgb(var(--brand-500)/0.9)]" />
                <span>
                  <span className="font-semibold text-slate-800 dark:text-white">Next step:</span> {v.actions.find((a: ActionDef) => a.tone === 'primary')!.hint}
                </span>
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
                    <div className="mt-4 rounded-2xl bg-black/[0.03] px-4 py-3 text-sm text-slate-700 dark:bg-white/[0.04] dark:text-slate-300">{v.header.remarks}</div>
                  )}
                </Card>
                <Card title="Lines" padded={false}>
                  {v.lines.length === 0 ? (
                    <p className="p-5 text-sm text-slate-500">No lines.</p>
                  ) : (
                    <div className="grid gap-3 p-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr))]">
                      {v.lines.map((l: any, i: number) => {
                        const text = cfg.viewLines.filter((c) => !isNumericKind(c.kind));
                        const nums = cfg.viewLines.filter((c) => isNumericKind(c.kind));
                        const main = nums[nums.length - 1];
                        const [first, ...restText] = text;
                        return (
                          <div key={i} className="tile flex min-w-0 flex-col gap-2.5 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                {first && <div className={cx('truncate text-[13.5px] font-semibold text-slate-900 dark:text-white', first.kind === 'mono' && 'font-mono')}>{fmtCell(l[first.key], first.kind)}</div>}
                                {restText[0] && <div className="truncate text-[13px] text-slate-600 dark:text-slate-300">{fmtCell(l[restText[0].key], restText[0].kind)}</div>}
                              </div>
                              <span className="flex-shrink-0 rounded-md bg-black/[0.04] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:bg-white/[0.06]">{i + 1}</span>
                            </div>
                            {(restText.length > 1 || nums.length > 1) && (
                              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                {[...restText.slice(1), ...nums.slice(0, -1)].map((c) => (
                                  <div key={c.key} className="min-w-0">
                                    <dt className="truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">{c.label}</dt>
                                    <dd className={cx('truncate text-[13px] text-slate-700 dark:text-slate-300', isNumericKind(c.kind) && 'tabular-nums')}>{fmtCell(l[c.key], c.kind)}</dd>
                                  </div>
                                ))}
                              </dl>
                            )}
                            {main && (
                              <div className="mt-auto flex items-end justify-between gap-2 border-t border-black/[0.05] pt-2.5 dark:border-white/[0.06]">
                                <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">{main.label}</span>
                                <span className="text-base font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">{fmtCell(l[main.key], main.kind)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
              <div className="space-y-6">
                <Card title="Totals">
                  <dl className="space-y-2">
                    {v.totals.map((t: any) => (
                      <div key={t.label} className={`flex items-center justify-between gap-4 text-sm ${t.strong ? 'border-t border-black/[0.06] pt-2 text-base font-semibold text-slate-900 dark:border-white/[0.08] dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
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
                            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">{i.label}</dt>
                            <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{i.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {v.links?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {v.links.map((l: any) => (
                          <Link key={`${l.type}-${l.no}`} href={LINK_PATH[l.type] ?? `/dashboard/doc/${l.type}/${encodeURIComponent(l.no)}`} className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-500/20 transition hover:bg-brand-500/15 hover:ring-brand-500/40 dark:text-brand-200 dark:ring-brand-400/25">
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
                          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600 dark:text-sky-400" />
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
