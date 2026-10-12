'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, CheckCircle2, FileSpreadsheet, Inbox, Plus, Users, XCircle } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, NumberInput, PageHeader, SearchInput, Select, Spinner, StatusBadge, Tabs, Textarea, cx, useToast } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';

type Bulk = { custno: string; custtype?: string; areano?: string; smnno?: string };

/** Reads pasted Excel cells (tab) or CSV: custno [, custtype, areano, smnno]; a header row is skipped. */
function parsePaste(text: string): Bulk[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(/\t|,|;/).map((x) => x.trim().replace(/^"|"$/g, '')))
    .filter((c) => c[0] && !/^cust/i.test(c[0]))
    .map(([custno, custtype, areano, smnno]) => ({ custno, custtype, areano, smnno }));
}

export default function CustomerToolsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useRpc<any>('cust.tools');
  const [tab, setTab] = useState('requests');
  const run = async (op: string, args: Record<string, unknown>) => {
    try {
      toast.success(await rpc<string>(op, args));
      await reload();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      return false;
    }
  };
  const waiting = (data?.requests ?? []).filter((r: any) => r.stat === 'Requested').length;

  return (
    <RequireRight form="020">
      <PageHeader eyebrow="Sales & Distribution" title="Customer Tools" description="Work on many customers at once: new-account requests, updates from an Excel list and moving customers between salesmen. Every change keeps the old record in the customer history." />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        <div className="grid gap-5">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'requests', label: 'Customer requests', count: waiting },
              { id: 'bulk', label: 'Update from Excel' },
              { id: 'transfer', label: 'Transfer to salesman' },
            ]}
          />
          {tab === 'requests' && <Requests data={data} run={run} />}
          {tab === 'bulk' && <BulkUpdate data={data} run={run} />}
          {tab === 'transfer' && <Transfer data={data} run={run} />}
        </div>
      )}
    </RequireRight>
  );
}

type Run = (op: string, args: Record<string, unknown>) => Promise<boolean>;

function Requests({ data, run }: { data: any; run: Run }) {
  const [form, setForm] = useState<{ reqname: string; type1: string; type2: string; remarks: string } | null>(null);
  const [decide, setDecide] = useState<{ r: any; approve: boolean; note: string; row: any } | null>(null);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">Salesmen and branches ask for a customer number here; Customers creates the account from the request.</p>
        {data.can.request && (
          <Button icon={Plus} onClick={() => setForm({ reqname: '', type1: data.types[0] ?? 'Dealer', type2: 'Charge', remarks: '' })}>
            Request a customer number
          </Button>
        )}
      </div>
      {!data.requests.length ? (
        <EmptyState icon={Inbox} title="No customer requests" />
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {data.requests.map((r: any) => (
            <div key={r.docno} className="tile flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white">{r.reqname}</div>
                  <div className="text-xs text-slate-500">
                    {r.docno} · {fmtDate(r.transdate)} · by {r.user}
                  </div>
                </div>
                <StatusBadge status={r.stat === 'Done' ? 'Approved' : r.stat} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.type1 && <Badge tone="neutral">{r.type1}</Badge>}
                {r.type2 && <Badge tone="neutral">{r.type2}</Badge>}
              </div>
              {r.remarks && <p className="mt-2 text-[12px] text-slate-600 dark:text-slate-300">{r.remarks}</p>}
              {r.custno && (
                <Link href="/dashboard/master/customers" className="mt-2 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">
                  Customer {r.custno}
                </Link>
              )}
              {r.stat === 'Requested' && (data.can.add || data.can.edit) && (
                <div className="mt-3 flex gap-2">
                  {data.can.add && (
                    <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => setDecide({ r, approve: true, note: '', row: { bussname: r.reqname, custtype: r.type1, paytype: r.type2 === 'Cash' ? 'Cash' : 'Charge', term: r.type2 === 'Cash' ? 0 : 30, crlimit: 0, smnno: data.salesmen[0]?.value ?? '', areano: data.areas[0]?.value ?? '' } })}>
                      Create customer
                    </Button>
                  )}
                  {data.can.edit && (
                    <Button size="sm" variant="ghost" icon={XCircle} onClick={() => setDecide({ r, approve: false, note: '', row: {} })}>
                      Reject
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal open={Boolean(form)} onClose={() => setForm(null)} title="Request a customer number" footer={<><Button onClick={() => setForm(null)}>Cancel</Button><Button variant="primary" disabled={!form?.reqname.trim()} onClick={async () => (await run('cust.request', form!)) && setForm(null)}>Send request</Button></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" required className="sm:col-span-2">
              <Input value={form.reqname} onChange={(e) => setForm({ ...form, reqname: e.target.value })} />
            </Field>
            <Field label="Customer type">
              <Select value={form.type1} onChange={(e) => setForm({ ...form, type1: e.target.value })} options={data.types.map((t: string) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Payment">
              <Select value={form.type2} onChange={(e) => setForm({ ...form, type2: e.target.value })} options={[{ value: 'Charge', label: 'Charge (on account)' }, { value: 'Cash', label: 'Cash' }]} />
            </Field>
            <Field label="Details" className="sm:col-span-2">
              <Textarea rows={3} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Address, contact person, expected orders…" />
            </Field>
          </div>
        )}
      </Modal>
      <Modal
        open={Boolean(decide)}
        onClose={() => setDecide(null)}
        title={decide?.approve ? `Create ${decide?.r.reqname}` : `Reject ${decide?.r.docno}`}
        footer={<><Button onClick={() => setDecide(null)}>Cancel</Button><Button variant={decide?.approve ? 'primary' : 'danger'} disabled={!decide || (!decide.approve && !decide.note.trim())} onClick={async () => (await run('cust.decideRequest', { docno: decide!.r.docno, approve: decide!.approve, note: decide!.note, row: decide!.row })) && setDecide(null)}>{decide?.approve ? 'Create customer' : 'Reject'}</Button></>}
      >
        {decide &&
          (decide.approve ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name" className="sm:col-span-2">
                <Input value={decide.row.bussname} onChange={(e) => setDecide({ ...decide, row: { ...decide.row, bussname: e.target.value } })} />
              </Field>
              <Field label="Salesman">
                <Select value={decide.row.smnno} onChange={(e) => setDecide({ ...decide, row: { ...decide.row, smnno: e.target.value } })} options={data.salesmen} />
              </Field>
              <Field label="Area">
                <Select value={decide.row.areano} onChange={(e) => setDecide({ ...decide, row: { ...decide.row, areano: e.target.value } })} options={data.areas} />
              </Field>
              <Field label="Terms (days)">
                <NumberInput decimals={0} value={decide.row.term} onValue={(v) => setDecide({ ...decide, row: { ...decide.row, term: v } })} />
              </Field>
              <Field label="Credit limit">
                <NumberInput value={decide.row.crlimit} onValue={(v) => setDecide({ ...decide, row: { ...decide.row, crlimit: v } })} />
              </Field>
              <p className="text-xs text-slate-500 sm:col-span-2">Address, TIN and the other details can be completed in Customers afterwards.</p>
            </div>
          ) : (
            <Field label="Reason" required>
              <Input value={decide.note} onChange={(e) => setDecide({ ...decide, note: e.target.value })} />
            </Field>
          ))}
      </Modal>
    </>
  );
}

function BulkUpdate({ data, run }: { data: any; run: Run }) {
  const [text, setText] = useState('');
  const [defaults, setDefaults] = useState({ custtype: '', areano: '', smnno: '' });
  const [preview, setPreview] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => parsePaste(text), [text]);
  const check = async () => {
    setBusy(true);
    try {
      setPreview(await rpc<any[]>('cust.previewBulk', { rows, defaults }));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  if (!data.can.edit) return <Alert tone="info">Updating customers needs the Edit right on Customer Master (form 020).</Alert>;
  const good = preview?.filter((p) => p.ok).length ?? 0;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="1. Paste the list" subtitle="Copy the columns from Excel: customer no. and, if they differ per customer, type, area and salesman code." icon={FileSpreadsheet}>
        <Textarea rows={10} className="font-mono text-[13px]" value={text} onChange={(e) => (setText(e.target.value), setPreview(null))} placeholder={'C00001\tDealer\tNCR\tS001\nC00002\nC00003'} />
        <p className="mt-2 text-xs text-slate-500">{rows.length} customer line(s) read.</p>
      </Card>
      <Card title="2. Values for blank cells" subtitle="Used for every line that leaves the column empty. Leave as “No change” to keep the current value.">
        <div className="grid gap-4">
          <Field label="Customer type">
            <Select value={defaults.custtype} onChange={(e) => (setDefaults({ ...defaults, custtype: e.target.value }), setPreview(null))} options={[{ value: '', label: 'No change' }, ...data.types.map((t: string) => ({ value: t, label: t }))]} />
          </Field>
          <Field label="Sales area">
            <Select value={defaults.areano} onChange={(e) => (setDefaults({ ...defaults, areano: e.target.value }), setPreview(null))} options={[{ value: '', label: 'No change' }, ...data.areas]} />
          </Field>
          <Field label="Salesman">
            <Select value={defaults.smnno} onChange={(e) => (setDefaults({ ...defaults, smnno: e.target.value }), setPreview(null))} options={[{ value: '', label: 'No change' }, ...data.salesmen]} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button loading={busy} disabled={!rows.length} onClick={check}>
              Check the list
            </Button>
            <Button variant="primary" disabled={!good} onClick={async () => (await run('cust.applyBulk', { rows, defaults })) && (setPreview(null), setText(''))}>
              Update {good || ''} customer(s)
            </Button>
          </div>
        </div>
      </Card>
      {preview && (
        <Card title="3. What will change" className="lg:col-span-2">
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
            {preview.map((p) => (
              <div key={p.line} className={cx('tile p-3 text-[13px]', !p.ok && 'border-rose-500/40')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{p.custno}</span>
                  <span className="text-[11px] text-slate-400">line {p.line}</span>
                </div>
                <div className="truncate text-xs text-slate-500">{p.bussname || '—'}</div>
                {p.changes.map((c: any) => (
                  <div key={c.field} className="mt-1 text-xs text-slate-700 dark:text-slate-200">
                    {c.field}: <span className="text-slate-400 line-through">{c.from || 'blank'}</span> → <b>{c.to}</b>
                  </div>
                ))}
                {p.problem && <div className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{p.problem}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Transfer({ data, run }: { data: any; run: Run }) {
  const [from, setFrom] = useState(data.salesmen[0]?.value ?? '');
  const [to, setTo] = useState(data.salesmen[1]?.value ?? '');
  const [area, setArea] = useState(false);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const list = data.customers.filter((c: any) => c.smnno === from && (!q || `${c.custno} ${c.bussname}`.toLowerCase().includes(q.toLowerCase())));
  if (!data.can.edit) return <Alert tone="info">Transferring customers needs the Edit right on Customer Master (form 020).</Alert>;
  const toggle = (c: string) => setPicked((s) => {
    const n = new Set(s);
    n.has(c) ? n.delete(c) : n.add(c);
    return n;
  });
  return (
    <Card title="Move customers to another salesman" subtitle="Tick the customers to move. The old salesman is kept in the customer history." icon={ArrowRightLeft}>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <Field label="From salesman">
          <Select value={from} onChange={(e) => (setFrom(e.target.value), setPicked(new Set()))} options={data.salesmen} />
        </Field>
        <ArrowRightLeft className="mx-auto mb-2.5 hidden h-5 w-5 text-slate-400 sm:block" />
        <Field label="To salesman">
          <Select value={to} onChange={(e) => setTo(e.target.value)} options={data.salesmen.filter((s: any) => s.value !== from)} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Find a customer…" className="w-full sm:w-72" />
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={area} onChange={(e) => setArea(e.target.checked)} className="h-4 w-4 rounded" /> Also move them to the new salesman's area
        </label>
        <Button size="sm" variant="ghost" onClick={() => setPicked(new Set(list.map((c: any) => c.custno)))} disabled={!list.length}>
          Tick all {list.length}
        </Button>
        <Button variant="primary" className="ml-auto" disabled={!picked.size || !to || to === from} onClick={async () => confirm(`Move ${picked.size} customer(s)?`) && (await run('cust.transfer', { from, to, custnos: [...picked], area })) && setPicked(new Set())}>
          Transfer {picked.size || ''} customer(s)
        </Button>
      </div>
      {!list.length ? (
        <EmptyState icon={Users} title="No customers" text="This salesman has no customers matching the search." />
      ) : (
        <div className="mt-4 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
          {list.map((c: any) => (
            <label key={c.custno} className={cx('tile-interactive flex cursor-pointer items-center gap-3 p-3', picked.has(c.custno) && 'border-brand-500/50 bg-brand-500/[0.06]')}>
              <input type="checkbox" checked={picked.has(c.custno)} onChange={() => toggle(c.custno)} className="h-4 w-4 rounded" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{c.bussname}</span>
                <span className="text-xs text-slate-500">
                  {c.custno} · {c.areano || 'no area'} · {c.custtype || '—'}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </Card>
  );
}
