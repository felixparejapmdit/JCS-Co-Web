'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileWarning, Layers, Plus, Scale, Trash2, Wrench } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { TC_DOC, TC_NAMES } from '@/shared/codes';
import { fmtDate } from '@/shared/dates';
import { fmtMoney, r2 } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, Combobox, EmptyState, Field, Input, Modal, NumberInput, PageHeader, Select, Spinner, Stat, Textarea, useToast } from '@/components/ui/kit';

interface DocRow {
  tc: string;
  docno: string;
  source: string;
  transdate: string;
  debit: number;
  credit: number;
  lines: number;
  accounts: number;
  balanced: boolean;
}

export default function JvEditPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [source, setSource] = useState('');
  const [open, setOpen] = useState<DocRow | null>(null);
  const toast = useToast();
  const { data, loading, error, reload } = useRpc<{ sources: string[]; docs: DocRow[] }>('jvedit.list', { from, to, source });
  const docs = data?.docs ?? [];
  const debit = docs.reduce((s, d) => s + d.debit, 0);

  return (
    <RequireRight form="052">
      <PageHeader
        eyebrow="General Ledger"
        title="Edit Auto JV Entries"
        description="Every posted subledger document writes its accounting entry here first. Before JV Posting bundles them into the monthly automatic JV, you can correct an entry, for example a wrong cost center or account. Corrections must balance and are kept in the audit trail."
      />
      <div className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
        <Stat label="Documents waiting for JV posting" value={docs.length} sub="Their entries can still be corrected" icon={Layers} tone="blue" />
        <Stat label="Total debits" value={`₱${fmtMoney(debit)}`} sub="Across the documents shown" icon={Scale} tone="violet" />
        <Stat label="Out of balance" value={docs.filter((d) => !d.balanced).length} sub="Should always be zero" icon={FileWarning} tone={docs.some((d) => !d.balanced) ? 'rose' : 'emerald'} />
      </div>
      <Card padded={false}>
        <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-center">
          <Select className="md:w-56" value={source} placeholder="All sources" options={(data?.sources ?? []).map((s) => ({ value: s, label: s }))} onChange={(e) => setSource(e.target.value)} />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>From</span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <span>to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
        </div>
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : !docs.length ? (
          <EmptyState icon={Layers} title="Nothing is waiting for JV posting" text="All subledger entries in this range are already posted to the ledger." />
        ) : (
          <div className="grid gap-3 p-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
            {docs.map((d) => (
              <button key={`${d.tc}-${d.docno}`} onClick={() => setOpen(d)} className="tile-interactive flex flex-col gap-3 p-4 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[13.5px] font-semibold text-slate-900 dark:text-white">{d.docno}</div>
                    <div className="truncate text-xs text-slate-500">
                      {TC_NAMES[d.tc]?.document ?? `TC ${d.tc}`} · {fmtDate(d.transdate)}
                    </div>
                  </div>
                  {d.balanced ? <Badge tone="success">Balanced</Badge> : <Badge tone="danger">Off by {fmtMoney(Math.abs(d.debit - d.credit))}</Badge>}
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-full bg-black/[0.04] px-2 py-0.5 font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">{d.source}</span>
                  <span className="rounded-full bg-black/[0.04] px-2 py-0.5 font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                    {d.lines} lines · {d.accounts} accounts
                  </span>
                </div>
                <div className="mt-auto flex items-end justify-between border-t border-black/[0.05] pt-3 dark:border-white/[0.06]">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Debit = credit</span>
                  <span className="text-lg font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">{fmtMoney(d.debit)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
      {open && (
        <EntryEditor
          doc={open}
          onClose={() => setOpen(null)}
          onSaved={async (msg) => {
            toast.success(msg);
            setOpen(null);
            await reload();
          }}
        />
      )}
    </RequireRight>
  );
}

function EntryEditor({ doc, onClose, onSaved }: { doc: DocRow; onClose: () => void; onSaved: (msg: string) => void }) {
  const { can } = useSession();
  const { data, error } = useRpc<{ lines: any[]; source: string; transdate: string }>('jvedit.load', { tc: doc.tc, docno: doc.docno });
  const [lines, setLines] = useState<any[] | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const editable = can('052', 2);

  useEffect(() => {
    if (data) setLines(data.lines.map((l) => ({ acctno: l.acctno, ccno: l.ccno, dramt: l.dramt || '', cramt: l.cramt || '' })));
  }, [data]);

  const dr = useMemo(() => r2((lines ?? []).reduce((s, l) => s + (Number(l.dramt) || 0), 0)), [lines]);
  const cr = useMemo(() => r2((lines ?? []).reduce((s, l) => s + (Number(l.cramt) || 0), 0)), [lines]);
  const diff = r2(dr - cr);
  const set = (i: number, patch: any) => setLines((ls) => (ls ?? []).map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const docType = TC_DOC[doc.tc];

  const save = async () => {
    setBusy(true);
    setSaveError(null);
    try {
      onSaved(await rpc<string>('jvedit.save', { tc: doc.tc, docno: doc.docno, reason, lines }));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      side
      size="xl"
      onClose={onClose}
      title={`GL entry of ${doc.docno}`}
      description={`${TC_NAMES[doc.tc]?.document ?? `TC ${doc.tc}`} · ${doc.source} · ${fmtDate(doc.transdate)}`}
      footer={
        <>
          {docType && (
            <Button icon={ExternalLink} href={`/dashboard/doc/${docType}/${encodeURIComponent(doc.docno)}`}>
              Open the document
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          {editable && (
            <Button variant="primary" icon={Wrench} loading={busy} disabled={Math.abs(diff) > 0.005 || !reason.trim()} onClick={save}>
              Save correction
            </Button>
          )}
        </>
      }
    >
      {error ? (
        <Alert tone="danger">{error}</Alert>
      ) : !lines ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          {!editable && <Alert tone="info">You can view this entry. Correcting it needs edit rights on Journal Vouchers (form 052).</Alert>}
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="tile grid grid-cols-2 items-end gap-2 p-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_8.5rem_8.5rem_2.25rem]">
                <Field label={i === 0 ? 'Account' : undefined} className="col-span-2 md:col-span-1">
                  <Combobox compact lookup="accounts" value={l.acctno} disabled={!editable} onChange={(v) => set(i, { acctno: v })} />
                </Field>
                <Field label={i === 0 ? 'Cost center' : undefined} className="col-span-2 md:col-span-1">
                  <Combobox compact lookup="costCenters" value={l.ccno} disabled={!editable} onChange={(v) => set(i, { ccno: v })} placeholder="None" />
                </Field>
                <Field label={i === 0 ? 'Debit' : undefined}>
                  <NumberInput className="h-8" disabled={!editable} value={l.dramt} onValue={(v) => set(i, { dramt: v, ...(Number(v) ? { cramt: '' } : {}) })} />
                </Field>
                <Field label={i === 0 ? 'Credit' : undefined}>
                  <NumberInput className="h-8" disabled={!editable} value={l.cramt} onValue={(v) => set(i, { cramt: v, ...(Number(v) ? { dramt: '' } : {}) })} />
                </Field>
                {editable && (
                  <button onClick={() => setLines((ls) => (ls ?? []).filter((_, j) => j !== i))} className="mb-0.5 hidden rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 md:block" aria-label={`Remove line ${i + 1}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <button
                onClick={() => setLines((ls) => [...(ls ?? []), { acctno: '', ccno: '', dramt: '', cramt: '' }])}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-black/[0.12] py-2.5 text-sm font-medium text-slate-500 transition hover:border-brand-500/50 hover:text-brand-700 dark:border-white/[0.12] dark:text-slate-400 dark:hover:text-brand-300"
              >
                <Plus className="h-4 w-4" /> Add line
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="tile p-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Debits</div>
              <div className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(dr)}</div>
            </div>
            <div className="tile p-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Credits</div>
              <div className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(cr)}</div>
            </div>
            <div className={`tile p-3 ${Math.abs(diff) > 0.005 ? 'border-rose-500/40' : 'border-emerald-500/40'}`}>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Difference</div>
              <div className={`text-base font-semibold tabular-nums ${Math.abs(diff) > 0.005 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmtMoney(diff)}</div>
            </div>
          </div>
          {editable && (
            <Field label="Why is the entry being corrected?" required hint="Kept in the audit trail with the entry before and after.">
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. Fuel was charged to Sales; it belongs to Logistics." />
            </Field>
          )}
          {saveError && <Alert tone="danger">{saveError}</Alert>}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already posted to the ledger? Correct it with a{' '}
            <Link href="/dashboard/doc/jv/new" className="text-brand-700 hover:underline dark:text-brand-300">
              journal voucher
            </Link>{' '}
            instead.
          </p>
        </div>
      )}
    </Modal>
  );
}
