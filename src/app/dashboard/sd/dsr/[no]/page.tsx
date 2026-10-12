'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, CreditCard, Lock, PackageOpen, Receipt, Scale, Truck, Wallet, XCircle } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, Combobox, EmptyState, Field, Input, Modal, NumberInput, PageHeader, Select, Spinner, Stat, StatusBadge, Textarea, cx, useToast } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';
import { fmtMoney, fmtQty } from '@/shared/money';

type Dialog = { kind: 'load' | 'cash' | 'charge' | 'return' | 'count' | 'close' } | null;
const CASH = '84';
const CHARGE = '85';

export default function DsrPage() {
  const { no } = useParams<{ no: string }>();
  const dsrno = decodeURIComponent(no);
  const toast = useToast();
  const { data, loading, error, reload } = useRpc<any>('dsr.get', { dsrno }, [dsrno]);
  const [dialog, setDialog] = useState<Dialog>(null);

  const act = async (op: string, args: Record<string, unknown>) => {
    try {
      toast.success(await rpc<string>(op, { dsrno, ...args }));
      setDialog(null);
      await reload();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  if (loading && !data) return <Spinner />;
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!data) return null;
  const h = data.header;
  const t = data.totals;
  const onVan = data.recon.filter((r: any) => r.expected > 0);

  return (
    <RequireRight form="095">
      <PageHeader
        eyebrow={
          <Link href="/dashboard/sd/dsr" className="hover:underline">
            Daily Sales Reports
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {h.dsrno} <StatusBadge status={data.open ? 'Open' : 'Closed'} />
          </span>
        }
        description={`${h.salesman} · ${fmtDate(h.transdate)}${h.exceprep ? ` · Note: ${h.exceprep}` : ''}`}
        actions={
          data.canClose && (
            <Button variant="primary" icon={Lock} onClick={() => setDialog({ kind: 'close' })}>
              Close the day
            </Button>
          )
        }
      />
      <div className="grid gap-6">
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))]">
          <Stat label="Cash sales" icon={Wallet} tone="emerald" value={fmtMoney(t.cash)} sub={t.toRemit > 0.004 ? `${fmtMoney(t.toRemit)} still to remit` : t.cash ? 'Fully remitted' : 'No cash sales yet'} />
          <Stat label="Charge sales" icon={CreditCard} tone="blue" value={fmtMoney(t.charge)} sub="Collected later on official receipts" />
          <Stat label="Loaded today (at cost)" icon={Truck} tone="brand" value={fmtMoney(t.loadedValue)} sub={`${data.loads.length} load(s)`} />
          <Stat label="Count difference" icon={Scale} tone={t.shortage > 0 ? 'rose' : 'teal'} value={data.counted ? fmtMoney(t.overage - t.shortage) : 'Not counted'} sub={data.counted ? (t.shortage > 0 ? `Shortage ${fmtMoney(t.shortage)}` : 'Count matches') : 'Count the van before closing'} />
        </div>

        {data.canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button icon={ArrowDownToLine} onClick={() => setDialog({ kind: 'load' })}>
              Load the van
            </Button>
            <Button icon={Wallet} disabled={!onVan.length} onClick={() => setDialog({ kind: 'cash' })}>
              Cash sale
            </Button>
            <Button icon={CreditCard} disabled={!onVan.length} onClick={() => setDialog({ kind: 'charge' })}>
              Charge sale
            </Button>
            <Button icon={ArrowUpFromLine} disabled={!onVan.length} onClick={() => setDialog({ kind: 'return' })}>
              Return to plant
            </Button>
            <Button icon={ClipboardCheck} disabled={!data.recon.length} onClick={() => setDialog({ kind: 'count' })}>
              {data.counted ? 'Change PM count' : 'PM count'}
            </Button>
          </div>
        )}
        {t.toRemit > 0.004 && (
          <Alert tone="info">
            Record the cash remittance of {fmtMoney(t.toRemit)} as an official receipt for <b>{h.walkinName}</b> and apply it to the cash sales invoices.{' '}
            <Link href="/dashboard/doc/or/new" className="font-semibold underline">
              Record a payment
            </Link>
          </Alert>
        )}

        <Card title="Van stock" subtitle="AM stock + loaded − sold − returned = what should be on the van tonight" icon={PackageOpen}>
          {!data.recon.length ? (
            <EmptyState icon={Truck} title="The van is empty" text={data.canEdit ? 'Load it from a plant to start selling.' : undefined} />
          ) : (
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
              {data.recon.map((r: any) => (
                <div key={r.codeno} className={cx('tile p-4', r.variance !== null && r.variance !== 0 && 'border-rose-500/40')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900 dark:text-white">{r.mmdesc}</div>
                      <div className="font-mono text-[11px] text-slate-400">{r.codeno}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{fmtQty(r.expected)}</div>
                      <div className="text-[11px] text-slate-500">{r.um} expected</div>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px]">
                    {[
                      ['AM', r.am],
                      ['Loaded', r.loaded],
                      ['Sold', r.sold],
                      ['Returned', r.returned],
                    ].map(([k, v]) => (
                      <div key={k as string} className="rounded-lg bg-black/[0.03] py-1.5 dark:bg-white/[0.04]">
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{fmtQty(v as number)}</dd>
                      </div>
                    ))}
                  </dl>
                  {r.counted !== null && (
                    <div className="mt-3 flex items-center justify-between text-[12px]">
                      <span className="text-slate-500">Counted {fmtQty(r.counted)}</span>
                      {r.variance === 0 ? <Badge tone="success">Matches</Badge> : <Badge tone={r.variance < 0 ? 'danger' : 'warning'}>{`${r.variance > 0 ? '+' : ''}${fmtQty(r.variance)} · ${fmtMoney(r.varamt)}`}</Badge>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Invoices" subtitle="Cash sales invoices (ETCSI, TC 84) and charge invoices (ETCI, TC 85)" icon={Receipt}>
          {!data.invoices.length ? (
            <p className="text-sm text-slate-500">No sales yet.</p>
          ) : (
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
              {data.invoices.map((i: any) => (
                <div key={i.invno} className={cx('tile p-4', i.status === 'Void' && 'opacity-60')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{i.invno}</div>
                      <div className="truncate text-xs text-slate-500">{i.customer}</div>
                    </div>
                    <StatusBadge status={i.status} />
                  </div>
                  <ul className="mt-2 space-y-0.5 text-[12px] text-slate-600 dark:text-slate-300">
                    {i.lines.map((l: any, k: number) => (
                      <li key={k} className="flex justify-between gap-2">
                        <span className="truncate">
                          {fmtQty(l.qty)} × {l.mmdesc}
                        </span>
                        <span className="tabular-nums">{fmtMoney(l.itmamt)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Badge tone={i.tc === CASH ? 'success' : 'info'}>{i.tc === CASH ? 'Cash' : 'Charge'}</Badge>
                    <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(i.netamt)}</span>
                  </div>
                  {data.canEdit && i.status === 'Open' && (
                    <button className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline dark:text-rose-400" onClick={() => confirm(`Void invoice ${i.invno}?`) && act('dsr.voidInvoice', { invno: i.invno })}>
                      <XCircle className="h-3.5 w-3.5" /> Void
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
          <Card title="Loads" subtitle="Issued from a plant to the van (movement 603)" icon={ArrowDownToLine}>
            <MoveList rows={data.loads} no="dono" empty="Nothing loaded yet." docType="do" />
          </Card>
          <Card title="Returns" subtitle="Back from the van to a plant (WRR, movement 409)" icon={ArrowUpFromLine}>
            <MoveList rows={data.returns} no="wrrno" empty="Nothing returned." />
          </Card>
        </div>
      </div>

      {dialog?.kind === 'load' && <LoadDialog plants={data.plants} onClose={() => setDialog(null)} onSave={(a) => act('dsr.load', a)} />}
      {(dialog?.kind === 'cash' || dialog?.kind === 'charge') && <InvoiceDialog tc={dialog.kind === 'cash' ? CASH : CHARGE} stock={onVan} walkin={h.walkinName} onClose={() => setDialog(null)} onSave={(a) => act('dsr.invoice', a)} />}
      {dialog?.kind === 'return' && <ReturnDialog plants={data.plants} stock={onVan} onClose={() => setDialog(null)} onSave={(a) => act('dsr.return', a)} />}
      {dialog?.kind === 'count' && <CountDialog recon={data.recon} onClose={() => setDialog(null)} onSave={(a) => act('dsr.count', a)} />}
      {dialog?.kind === 'close' && <CloseDialog data={data} onClose={() => setDialog(null)} onSave={(a) => act('dsr.close', a)} />}
    </RequireRight>
  );
}

function MoveList({ rows, no, empty, docType }: { rows: any[]; no: string; empty: string; docType?: string }) {
  if (!rows.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <div className="grid gap-2">
      {rows.map((r) => (
        <div key={r[no]} className="tile p-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            {docType ? (
              <Link href={`/dashboard/doc/${docType}/${encodeURIComponent(r[no])}`} className="font-mono font-semibold text-brand-600 hover:underline dark:text-brand-300">
                {r[no]}
              </Link>
            ) : (
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{r[no]}</span>
            )}
            <span className="truncate text-xs text-slate-500">{r.plntname}</span>
          </div>
          <div className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">{r.lines.map((l: any) => `${fmtQty(l.qty)} ${l.mmdesc}`).join(' · ')}</div>
        </div>
      ))}
    </div>
  );
}

function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = async (f: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await f();
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

function QtyList({ items, qty, setQty, extra, extraLabel }: { items: { codeno: string; mmdesc: string; um?: string; hint: string }[]; qty: Record<string, number | ''>; setQty: (q: Record<string, number | ''>) => void; extra?: (codeno: string) => React.ReactNode; extraLabel?: string }) {
  return (
    <div className="grid max-h-[50vh] gap-2 overflow-y-auto pr-1">
      <div className="flex items-center gap-3 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        <span className="flex-1">Product</span>
        {extraLabel && <span className="w-28 text-right">{extraLabel}</span>}
        <span className="w-28 text-right">Quantity</span>
      </div>
      {items.map((m) => (
        <div key={m.codeno} className="tile flex flex-wrap items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{m.mmdesc}</div>
            <div className="text-[11px] text-slate-500">{m.hint}</div>
          </div>
          {extra?.(m.codeno)}
          <NumberInput className="!w-28 text-right" decimals={3} placeholder="Qty" value={qty[m.codeno] ?? ''} onValue={(v) => setQty({ ...qty, [m.codeno]: v })} aria-label={`Quantity of ${m.mmdesc}`} />
        </div>
      ))}
    </div>
  );
}

const linesOf = (qty: Record<string, number | ''>) => Object.entries(qty).filter(([, q]) => Number(q) > 0).map(([codeno, q]) => ({ codeno, qty: Number(q) }));

function LoadDialog({ plants, onClose, onSave }: { plants: any[]; onClose: () => void; onSave: (a: any) => Promise<boolean> }) {
  const [plntno, setPlnt] = useState(plants[0]?.value ?? '');
  const stock = useRpc<any[]>(plntno ? 'dsr.plantStock' : null, { plntno }, [plntno]);
  const [qty, setQty] = useState<Record<string, number | ''>>({});
  const { busy, run } = useBusy();
  return (
    <Modal open onClose={onClose} title="Load the van" description="Finished goods available at the plant. The stock leaves the plant and goes on the van." size="lg" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} disabled={!linesOf(qty).length} onClick={() => run(() => onSave({ plntno, lines: linesOf(qty) }))}>Load</Button></>}>
      <div className="grid gap-4">
        <Field label="From plant">
          <Select value={plntno} onChange={(e) => (setPlnt(e.target.value), setQty({}))} options={plants} />
        </Field>
        {stock.loading ? <Spinner /> : !stock.data?.length ? <p className="text-sm text-slate-500">No finished goods available at this plant.</p> : <QtyList items={stock.data.map((m) => ({ ...m, hint: `${fmtQty(m.available)} ${m.um} available` }))} qty={qty} setQty={setQty} />}
      </div>
    </Modal>
  );
}

function InvoiceDialog({ tc, stock, walkin, onClose, onSave }: { tc: string; stock: any[]; walkin: string; onClose: () => void; onSave: (a: any) => Promise<boolean> }) {
  const [custno, setCust] = useState('');
  const [refno, setRef] = useState('');
  const [qty, setQty] = useState<Record<string, number | ''>>({});
  const [sp, setSp] = useState<Record<string, number | ''>>(Object.fromEntries(stock.map((s) => [s.codeno, s.sp || ''])));
  const { busy, run } = useBusy();
  const lines = linesOf(qty).map((l) => ({ ...l, sp: Number(sp[l.codeno]) || 0 }));
  const total = lines.reduce((s, l) => s + l.qty * l.sp, 0);
  const charge = tc === CHARGE;
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={charge ? 'Charge sale (ETCI)' : 'Cash sale (ETCSI)'}
      description={charge ? 'Billed to a customer and collected later.' : `Paid in cash; billed to ${walkin}.`}
      footer={
        <>
          <span className="mr-auto text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(total)}</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} disabled={!lines.length || (charge && !custno)} onClick={() => run(() => onSave({ tc, custno, refno, lines }))}>
            Issue invoice
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {charge && (
            <Field label="Customer" required>
              <Combobox lookup="customers" value={custno} onChange={(v) => setCust(v)} placeholder="Find the customer…" />
            </Field>
          )}
          <Field label="Reference" hint="Booth, event or receipt book number">
            <Input value={refno} onChange={(e) => setRef(e.target.value)} />
          </Field>
        </div>
        <QtyList
          items={stock.map((m) => ({ ...m, hint: `${fmtQty(m.expected)} ${m.um} on the van` }))}
          qty={qty}
          setQty={setQty}
          extraLabel="Price"
          extra={(c) => <NumberInput className="!w-28 text-right" placeholder="Price" value={sp[c] ?? ''} onValue={(v) => setSp({ ...sp, [c]: v })} aria-label="Selling price" />}
        />
      </div>
    </Modal>
  );
}

function ReturnDialog({ plants, stock, onClose, onSave }: { plants: any[]; stock: any[]; onClose: () => void; onSave: (a: any) => Promise<boolean> }) {
  const [plntno, setPlnt] = useState(plants[0]?.value ?? '');
  const [qty, setQty] = useState<Record<string, number | ''>>({});
  const { busy, run } = useBusy();
  return (
    <Modal open onClose={onClose} size="lg" title="Return to plant" description="Unsold stock goes back into the plant at the van's cost." footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} disabled={!linesOf(qty).length} onClick={() => run(() => onSave({ plntno, lines: linesOf(qty) }))}>Return</Button></>}>
      <div className="grid gap-4">
        <Field label="To plant">
          <Select value={plntno} onChange={(e) => setPlnt(e.target.value)} options={plants} />
        </Field>
        <QtyList items={stock.map((m) => ({ ...m, hint: `${fmtQty(m.expected)} ${m.um} on the van` }))} qty={qty} setQty={setQty} />
      </div>
    </Modal>
  );
}

function CountDialog({ recon, onClose, onSave }: { recon: any[]; onClose: () => void; onSave: (a: any) => Promise<boolean> }) {
  const [qty, setQty] = useState<Record<string, number | ''>>(Object.fromEntries(recon.map((r) => [r.codeno, r.counted ?? r.expected])));
  const { busy, run } = useBusy();
  return (
    <Modal open onClose={onClose} size="lg" title="PM count" description="Count what is physically on the van now. The expected quantity is filled in; change what differs." footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => run(() => onSave({ lines: recon.map((r) => ({ codeno: r.codeno, qty: Number(qty[r.codeno]) || 0 })) }))}>Save count</Button></>}>
      <QtyList items={recon.map((r) => ({ ...r, hint: `Expected ${fmtQty(r.expected)} ${r.um}` }))} qty={qty} setQty={setQty} />
    </Modal>
  );
}

function CloseDialog({ data, onClose, onSave }: { data: any; onClose: () => void; onSave: (a: any) => Promise<boolean> }) {
  const [note, setNote] = useState(data.header.exceprep ?? '');
  const { busy, run } = useBusy();
  const diffs = data.recon.filter((r: any) => r.variance !== null && r.variance !== 0);
  const open = data.invoices.filter((i: any) => i.status === 'Open');
  return (
    <Modal open onClose={onClose} title={`Close ${data.header.dsrno}`} description="Posts the invoices, books the cost of what was sold and any count difference, and makes tonight's count tomorrow's AM stock." footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" icon={Lock} loading={busy} disabled={!data.counted && data.recon.some((r: any) => r.expected !== 0)} onClick={() => run(() => onSave({ note }))}>Close the day</Button></>}>
      <div className="grid gap-3 text-sm">
        {!data.counted && data.recon.some((r: any) => r.expected !== 0) && <Alert tone="warning">Save the PM count first.</Alert>}
        <ul className="grid gap-1.5 text-slate-700 dark:text-slate-200">
          <li>• {open.length} invoice(s) to post: cash {fmtMoney(data.totals.cash)}, charge {fmtMoney(data.totals.charge)}</li>
          <li>• {diffs.length ? `${diffs.length} product(s) differ from the expected stock (${fmtMoney(data.totals.overage - data.totals.shortage)})` : 'The count matches the expected stock'}</li>
        </ul>
        {diffs.length > 0 && (
          <Field label="Explain the difference" required>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. one case damaged while unloading" />
          </Field>
        )}
      </div>
    </Modal>
  );
}
