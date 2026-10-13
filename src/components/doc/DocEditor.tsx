'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2, Wand2 } from 'lucide-react';
import { LookupItem, rpc } from '@/lib/api';
import { fmtDate } from '@/shared/dates';
import { fmtMoney, fmtQty, numToEng } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Button, Card, Combobox, Field, Input, NumberInput, Select, Spinner, Textarea, cx, useToast } from '@/components/ui/kit';
import { DOCS, Draft, FieldDef, LineCol } from './configs';
import { SourcePicker } from './DocList';
import { ApplyInvoices, CountSheet, FundVouchers, PayVouchers } from './SpecialLines';

function clean(d: Draft): Draft {
  const out: Draft = {};
  for (const [k, v] of Object.entries(d)) if (!k.startsWith('_')) out[k] = v;
  out.lines = (d.lines ?? []).map((l: Draft) => {
    const x: Draft = {};
    for (const [k, v] of Object.entries(l)) if (!k.startsWith('_')) x[k] = v;
    return x;
  });
  return out;
}

/** Stock available at the plant for each material on the lines, refreshed as lines change. */
function useAvailability(enabled: boolean, plntno: string | undefined, codes: string[]) {
  const [map, setMap] = useState<Record<string, any>>({});
  const key = codes.filter(Boolean).sort().join(',');
  useEffect(() => {
    if (!enabled || !plntno) return;
    let live = true;
    const missing = key.split(',').filter((c) => c && !map[`${plntno}|${c}`]);
    Promise.all(missing.map((c) => rpc<any>('inv.availability', { plntno, codeno: c }).then((r) => [c, r] as const).catch(() => [c, null] as const))).then((res) => {
      if (!live || !res.length) return;
      setMap((m) => {
        const n = { ...m };
        for (const [c, r] of res) if (r) n[`${plntno}|${c}`] = r;
        return n;
      });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, plntno, key]);
  return (codeno: string) => (plntno ? map[`${plntno}|${codeno}`] : undefined);
}

export function DocEditor({ type, no }: { type: string; no?: string }) {
  const cfg = DOCS[type];
  const params = useSearchParams();
  const from = params.get('from');
  const srcNo = params.get('no');
  const router = useRouter();
  const toast = useToast();
  const { can } = useSession();
  const [draft, setDraftState] = useState<Draft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<string | null>(null);
  const [openInvoices, setOpenInvoices] = useState<LookupItem[]>([]);
  const dirty = useRef(false);
  const top = useRef<HTMLDivElement>(null);

  const setDraft = useCallback((fn: (d: Draft) => Draft) => {
    dirty.current = true;
    setDraftState((d) => (d ? fn(d) : d));
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        let d: Draft;
        if (no) {
          const v = await rpc<any>('doc.get', { type, no });
          if (!v.editable) throw new Error(`${cfg.title} ${no} is ${v.status} and can no longer be edited.`);
          d = { ...v.header, no: v.no, lines: v.lines };
        } else if (from && srcNo) {
          d = { ...(await rpc<Draft>('doc.prefill', { type, source: from, no: srcNo })), _from: from, _fromNo: srcNo };
        } else {
          d = await rpc<Draft>('doc.defaults', { type });
          // Links such as "Pay this vendor" pass header values in the address, e.g. ?venno=V00001.
          for (const f of cfg?.header ?? []) {
            const v = params.get(f.key);
            if (v) d[f.key] = v;
          }
        }
        if (live) {
          dirty.current = false;
          setDraftState({ ...d, lines: d.lines ?? [] });
        }
      } catch (e) {
        if (live) setLoadError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      live = false;
    };
  }, [type, no, from, srcNo, cfg?.title]);

  // Customer invoices for credit / debit memo lines.
  useEffect(() => {
    if (!cfg?.lines?.cols.some((c) => c.lookup === 'openInvoices') || !draft?.custno) return;
    rpc<{ invoices: any[] }>('ar.openInvoices', { custno: draft.custno })
      .then((r) => setOpenInvoices(r.invoices.map((i) => ({ value: i.invno, label: i.invno, sub: `${fmtDate(i.transdate)} · balance ₱${fmtMoney(i.balance)}`, data: i }))))
      .catch(() => setOpenInvoices([]));
  }, [cfg, draft?.custno]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const lineCodes = useMemo(() => ((draft?.lines ?? []) as Draft[]).map((l) => String(l.codeno ?? '')), [draft?.lines]);
  const avail = useAvailability(Boolean(cfg?.lines?.availability), draft?.plntno, lineCodes);

  const save = useCallback(
    async (then?: { action: string; label: string }) => {
      if (!draft) return;
      setSaving(true);
      setError(null);
      let savedNo: string | null = null;
      try {
        const res = await rpc<{ no: string; message: string }>('doc.save', { type, input: clean(draft) });
        savedNo = res.no;
        dirty.current = false;
        if (then) {
          try {
            const r2 = await rpc<{ message: string }>('doc.act', { type, no: res.no, action: then.action, payload: {} });
            toast.success(r2.message);
          } catch (e) {
            toast.error(`Saved as ${res.no}, but it could not be completed: ${e instanceof Error ? e.message : e}`);
          }
        } else toast.success(res.message);
        router.push(`/dashboard/doc/${type}/${encodeURIComponent(res.no)}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        top.current?.scrollIntoView({ behavior: 'smooth' });
        if (savedNo) router.push(`/dashboard/doc/${type}/${encodeURIComponent(savedNo)}`);
      } finally {
        setSaving(false);
      }
    },
    [draft, type, router, toast]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!saving) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, saving]);

  if (!cfg) return <Alert tone="danger">Unknown document type.</Alert>;

  const setHeader = (key: string, value: any, item?: LookupItem) =>
    setDraft((d) => {
      const next = { ...d, [key]: value };
      return { ...next, ...(cfg.onHeader?.(key, value, next, item) ?? {}) };
    });
  const setLine = (idx: number, key: string, value: any, item?: LookupItem) =>
    setDraft((d) => {
      const lines = [...(d.lines ?? [])];
      let line = { ...lines[idx], [key]: value };
      line = { ...line, ...(cfg.onLine?.(key, value, line, d, item) ?? {}) };
      lines[idx] = line;
      return { ...d, lines };
    });
  const addLine = () => setDraft((d) => ({ ...d, lines: [...(d.lines ?? []), {}] }));
  const removeLine = (idx: number) => setDraft((d) => ({ ...d, lines: (d.lines ?? []).filter((_: unknown, i: number) => i !== idx) }));

  const renderField = (f: FieldDef) => {
    const value = draft?.[f.key] ?? '';
    const ro = f.readOnly?.(draft!) ?? false;
    switch (f.type) {
      case 'lookup':
        return <Combobox lookup={f.lookup} value={value} disabled={ro} onChange={(v, item) => setHeader(f.key, v, item)} placeholder={f.placeholder ?? 'Type to search…'} />;
      case 'date':
        return <Input type="date" value={value} disabled={ro} onChange={(e) => setHeader(f.key, e.target.value)} />;
      case 'number':
      case 'money':
        return <NumberInput value={value} disabled={ro} decimals={f.type === 'money' ? 2 : 3} onValue={(v) => setHeader(f.key, v)} />;
      case 'select':
        return <Select value={value} disabled={ro} options={f.options ?? []} onChange={(e) => setHeader(f.key, e.target.value)} />;
      case 'textarea':
        return <Textarea value={value} disabled={ro} rows={2} placeholder={f.placeholder} onChange={(e) => setHeader(f.key, e.target.value)} />;
      default:
        return <Input value={value} disabled={ro} placeholder={f.placeholder} onChange={(e) => setHeader(f.key, e.target.value)} />;
    }
  };

  const renderCell = (c: LineCol, l: Draft, idx: number) => {
    const value = l[c.key] ?? '';
    switch (c.type) {
      case 'lookup':
        return c.lookup === 'openInvoices' ? (
          <Combobox compact items={openInvoices} value={value} onChange={(v, item) => setLine(idx, c.key, v, item)} placeholder="Choose invoice" />
        ) : (
          <Combobox compact lookup={c.lookup} value={value} onChange={(v, item) => setLine(idx, c.key, v, item)} placeholder="Search…" />
        );
      case 'number':
      case 'money':
        return <NumberInput className="h-8 text-[13px]" value={value} decimals={c.type === 'money' ? 2 : 3} placeholder={c.placeholder} onValue={(v) => setLine(idx, c.key, v)} />;
      case 'select':
        return <Select className="h-8 text-[13px]" value={value || (c.options?.[0]?.value ?? '')} options={c.options ?? []} onChange={(e) => setLine(idx, c.key, e.target.value)} />;
      case 'date':
        return <Input type="date" className="h-8 text-[13px]" value={value} onChange={(e) => setLine(idx, c.key, e.target.value)} />;
      case 'computed': {
        const v = c.compute?.(l, draft!);
        return <div className="px-1 text-right text-[13px] tabular-nums text-slate-700 dark:text-slate-300">{c.computeKind === 'money' ? fmtMoney(Number(v)) : c.computeKind === 'qty' ? fmtQty(Number(v)) : String(v ?? '')}</div>;
      }
      default:
        return <Input className="h-8 text-[13px]" value={value} placeholder={c.placeholder} onChange={(e) => setLine(idx, c.key, e.target.value)} />;
    }
  };

  const totals = draft && cfg.totals ? cfg.totals(draft) : [];
  const fieldsShown = cfg.header.filter((f) => !f.when || (draft && f.when(draft)));
  const cols = cfg.lines?.cols.filter((c) => !c.when || (draft && c.when(draft))) ?? [];
  // Lookups such as the account or the material get a double-width field on the line card.
  const wide = (c: LineCol) => c.type === 'lookup' && parseFloat(String(c.width ?? '0')) >= 22;
  const canThen = Boolean(cfg.saveThen) && can(cfg.form, 5);
  const title = no ? `Edit ${cfg.title} ${no}` : cfg.newLabel;

  return (
    <RequireRight form={cfg.form} action={no ? 2 : 3}>
      <div ref={top} className="mb-4">
        <Link href={no ? `/dashboard/doc/${type}/${encodeURIComponent(no)}` : `/dashboard/doc/${type}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4 text-brand-600 dark:text-brand-300" /> {no ? `Back to ${no}` : cfg.plural}
        </Link>
      </div>
      {loadError ? (
        <Alert tone="danger" title="This document cannot be opened for editing">
          {loadError}
        </Alert>
      ) : !draft ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">{title}</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{draft._from ? `Filled in from ${draft._fromNo}. Check the details and save.` : cfg.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button href={no ? `/dashboard/doc/${type}/${encodeURIComponent(no)}` : `/dashboard/doc/${type}`}>Cancel</Button>
              {canThen && (
                <Button loading={saving} onClick={() => save()}>
                  Save as draft
                </Button>
              )}
              <Button variant="primary" icon={Save} loading={saving} onClick={() => save(canThen ? cfg.saveThen : undefined)}>
                {canThen ? cfg.saveThen!.label : cfg.saveLabel ?? 'Save'}
              </Button>
            </div>
          </div>

          {!no && !draft._from && cfg.sources && (
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-brand-500/40 bg-brand-500/[0.06] px-4 py-3 backdrop-blur-xl dark:border-brand-400/30 dark:bg-brand-400/[0.06] md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-brand-900 dark:text-brand-100">
                <span className="font-semibold">Save time:</span> {cfg.sources[0].help}
              </p>
              <div className="flex flex-wrap gap-2">
                {cfg.sources.map((s) => (
                  <Button key={s.id} variant="subtle" size="sm" icon={Wand2} onClick={() => setPicker(s.id)}>
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <Alert tone="danger" title="Please check the following" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Card title="Details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fieldsShown.map((f) => (
                <Field key={f.key} label={f.label} required={f.required} hint={f.hint} className={cx(f.span === 2 && 'sm:col-span-2', f.span === 3 && 'sm:col-span-2 lg:col-span-3')}>
                  {renderField(f)}
                </Field>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <Card
              className="min-w-0"
              title={cfg.custom === 'apply-invoices' ? 'Invoices paid' : cfg.custom === 'pay-vouchers' ? 'Vouchers paid by this cheque' : cfg.custom === 'count' ? 'Count sheet' : cfg.custom === 'fund-vouchers' ? 'Vouchers to replenish' : 'Lines'}
              padded={Boolean(cfg.custom)}
            >
              {cfg.custom === 'apply-invoices' ? (
                <ApplyInvoices draft={draft} setDraft={setDraft} />
              ) : cfg.custom === 'pay-vouchers' ? (
                <PayVouchers draft={draft} setDraft={setDraft} />
              ) : cfg.custom === 'count' ? (
                <CountSheet draft={draft} setDraft={setDraft} />
              ) : cfg.custom === 'fund-vouchers' ? (
                <FundVouchers draft={draft} setDraft={setDraft} />
              ) : (
                <div className="space-y-2 p-3">
                  {(draft.lines ?? []).map((l: Draft, idx: number) => {
                    const a = cfg.lines?.availability && l.codeno ? avail(String(l.codeno)) : undefined;
                    const short = a && Number(l.qty) > a.available + 0.0001;
                    return (
                      <div key={idx} className="tile group p-3 transition-colors focus-within:border-brand-400/50">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/[0.06]">Line {idx + 1}</span>
                          <button onClick={() => removeLine(idx)} className="rounded-lg p-1 text-rose-500/80 transition hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400/80" aria-label={`Remove line ${idx + 1}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))]">
                          {cols.map((c) => (
                            <div key={c.key} className={cx('min-w-0', wide(c) && 'md:col-span-2')}>
                              <span className={cx('mb-1 block truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400', (c.type === 'money' || c.type === 'number' || c.type === 'computed') && 'text-right')}>{c.label}</span>
                              {renderCell(c, l, idx)}
                              {c.key === 'qty' && a && (
                                <div className={cx('mt-1 text-right text-[11px]', short ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-500')}>
                                  {fmtQty(a.available)} available{a.labHold ? ` · ${fmtQty(a.labHold)} on lab hold` : ''}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={addLine}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-black/[0.12] py-3 text-sm font-medium text-slate-500 transition hover:border-brand-500/50 hover:bg-brand-500/[0.05] hover:text-brand-700 dark:border-white/[0.12] dark:text-slate-400 dark:hover:border-brand-400/50 dark:hover:text-brand-300"
                  >
                    <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {cfg.lines?.addLabel ?? 'Add line'}
                  </button>
                </div>
              )}
            </Card>

            {totals.length > 0 && (
              <div className="xl:sticky xl:top-24 xl:self-start">
                <Card title="Totals" className="relative overflow-hidden">
                  <dl className="space-y-2">
                    {totals.map((t) => (
                      <div key={t.label} className={cx('flex items-center justify-between gap-4 text-sm', t.strong ? 'border-t border-slate-100 pt-2 font-semibold text-slate-900 dark:border-white/[0.07] dark:text-white' : 'text-slate-600 dark:text-slate-400', t.warn && 'text-rose-600 dark:text-rose-400')}>
                        <dt>{t.label}</dt>
                        <dd className="tabular-nums">{t.kind === 'qty' ? fmtQty(t.value) : fmtMoney(t.value)}</dd>
                      </div>
                    ))}
                  </dl>
                  {type === 'cv' && totals[0]?.value > 0 && <p className="mt-3 rounded-lg bg-black/[0.03] px-3 py-2 text-xs text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">{numToEng(totals[0].value)}</p>}
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Totals update as you type. Press Ctrl+S to save.</p>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
      {cfg.sources?.map((s) => (
        <SourcePicker key={s.id} type={type} source={s.id} label={s.label} help={s.help} open={picker === s.id} onClose={() => setPicker(null)} />
      ))}
    </RequireRight>
  );
}
