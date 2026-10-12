'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Circle, UserRound, Wand2 } from 'lucide-react';
import { rpc } from '@/lib/api';
import { autoApply, ewtForSettlement } from '@/shared/collections';
import { fmtDate, today } from '@/shared/dates';
import { fmtMoney, fmtQty, r2 } from '@/shared/money';
import { Alert, Button, EmptyState, NumberInput, SearchInput, Spinner, cx } from '@/components/ui/kit';
import type { Draft } from './configs';

type SetDraft = (fn: (d: Draft) => Draft) => void;

const GRID = 'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]';

/** A card that can be ticked on or off; the whole card is the toggle. */
function PickCard({ selected, onToggle, label, children }: { selected: boolean; onToggle: () => void; label: string; children: React.ReactNode }) {
  return (
    <div
      className={cx(
        'tile flex flex-col gap-3 p-4 transition duration-200',
        selected ? 'border-brand-500/50 bg-brand-500/[0.06] ring-1 ring-inset ring-brand-500/30 dark:border-brand-400/40 dark:bg-brand-400/[0.07]' : 'hover:border-black/[0.12] dark:hover:border-white/[0.14]'
      )}
    >
      <button type="button" onClick={onToggle} className="flex items-start justify-between gap-2 text-left" aria-pressed={selected} aria-label={label}>
        {children}
        {selected ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-brand-600 dark:text-brand-300" /> : <Circle className="h-5 w-5 flex-shrink-0 text-slate-300 dark:text-slate-600" />}
      </button>
    </div>
  );
}

function Figure({ label, children, tone }: { label: string; children: React.ReactNode; tone?: 'danger' | 'good' }) {
  return (
    <div className="min-w-0">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">{label}</div>
      <div className={cx('text-[13px] tabular-nums text-slate-700 dark:text-slate-300', tone === 'danger' && 'font-semibold text-rose-600 dark:text-rose-400', tone === 'good' && 'text-emerald-600 dark:text-emerald-400')}>{children}</div>
    </div>
  );
}

/** Official receipt: pick which open invoices the payment settles. */
export function ApplyInvoices({ draft, setDraft }: { draft: Draft; setDraft: SetDraft }) {
  const [data, setData] = useState<{ invoices: any[]; ewtRate: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!draft.custno) {
      setData(null);
      return;
    }
    setError(null);
    rpc<{ invoices: any[]; ewtRate: number }>('ar.openInvoices', { custno: draft.custno })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [draft.custno]);

  if (!draft.custno) return <p className="text-sm text-slate-500">Choose the customer to see their open invoices.</p>;
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!data) return <Spinner />;
  if (!data.invoices.length) return <EmptyState title="This customer has no open invoices" text="The whole amount will be recorded as a customer deposit you can apply later." />;

  const lines: Draft[] = draft.lines ?? [];
  const lineFor = (invno: string) => lines.find((l) => l.invno === invno);
  const setLines = (next: Draft[]) => setDraft((d) => ({ ...d, lines: next }));
  const full = (inv: any) => {
    const ewt = ewtForSettlement(inv.balance, data.ewtRate, inv.vatable);
    return { invno: inv.invno, oramt: r2(inv.balance - ewt), ewt };
  };
  const auto = () => setLines(autoApply(data.invoices, Number(draft.colamt) || 0, data.ewtRate).lines);
  const payAll = () => {
    const all = data.invoices.map(full);
    setDraft((d) => ({ ...d, lines: all, colamt: r2(all.reduce((s, l) => s + l.oramt, 0)) }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {data.ewtRate ? `This customer withholds ${data.ewtRate}% tax (BIR 2307) on the VAT-exclusive amount; it is computed for you.` : 'This customer does not withhold tax.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon={Wand2} onClick={auto} disabled={!Number(draft.colamt)}>
            Apply amount received (oldest first)
          </Button>
          <Button size="sm" onClick={payAll}>
            Pay everything in full
          </Button>
        </div>
      </div>
      <div className={GRID}>
        {data.invoices.map((inv) => {
          const l = lineFor(inv.invno);
          const left = r2(inv.balance - (l ? Number(l.oramt || 0) + Number(l.ewt || 0) : 0));
          return (
            <div key={inv.invno} className="flex flex-col gap-2">
              <PickCard selected={Boolean(l)} label={`Pay invoice ${inv.invno}`} onToggle={() => setLines(l ? lines.filter((x) => x.invno !== inv.invno) : [...lines, full(inv)])}>
                <div className="min-w-0">
                  <div className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{inv.invno}</div>
                  <div className="text-xs text-slate-500">
                    {fmtDate(inv.transdate)} · due {fmtDate(inv.duedate)}
                  </div>
                  {inv.daysOverdue > 0 && <div className="mt-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">{inv.daysOverdue} days overdue</div>}
                  <div className="mt-2 text-lg font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">{fmtMoney(inv.balance)}</div>
                </div>
              </PickCard>
              {l && (
                <div className="tile grid grid-cols-3 gap-2 p-3">
                  <label className="col-span-1 block">
                    <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Paid now</span>
                    <NumberInput value={l.oramt ?? ''} onValue={(v) => setLines(lines.map((x) => (x.invno === inv.invno ? { ...x, oramt: v } : x)))} className="h-8" />
                  </label>
                  <label className="col-span-1 block">
                    <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">2307 tax</span>
                    <NumberInput value={l.ewt ?? ''} onValue={(v) => setLines(lines.map((x) => (x.invno === inv.invno ? { ...x, ewt: v } : x)))} className="h-8" />
                  </label>
                  <Figure label="Left after" tone={left < -0.005 ? 'danger' : left <= 0.005 ? 'good' : undefined}>
                    <span className="mt-2 block text-right">{fmtMoney(left)}</span>
                  </Figure>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Check voucher: choose the posted vouchers (or liquidation reimbursements) this cheque pays. */
export function PayVouchers({ draft, setDraft }: { draft: Draft; setDraft: SetDraft }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!draft.venno) {
      setRows(null);
      return;
    }
    setError(null);
    rpc<any[]>('ap.openVouchers', { venno: draft.venno })
      .then((r) => {
        // While editing, the vouchers already on this cheque stay selectable.
        const mine: Draft[] = draft.lines ?? [];
        const extra = mine.filter((m) => !r.some((x) => x.vpno === m.vpno)).map((m) => ({ vpno: m.vpno, transdate: m.vpdate, refdoc: '', docamt: m.dramt, balance: m.dramt, duedate: m.vpdate }));
        setRows([...r, ...extra]);
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.venno]);

  if (!draft.venno) return <p className="text-sm text-slate-500">Choose the vendor to see their unpaid vouchers.</p>;
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!rows) return <Spinner />;
  if (!rows.length) return <EmptyState title="Nothing to pay" text="This vendor has no posted, unpaid vouchers." />;

  const lines: Draft[] = draft.lines ?? [];
  const setLines = (next: Draft[]) => setDraft((d) => ({ ...d, lines: next }));
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setLines(rows.map((r) => ({ vpno: r.vpno, dramt: r.balance })))}>
          Pay all
        </Button>
      </div>
      <div className={GRID}>
        {rows.map((r) => {
          const l = lines.find((x) => x.vpno === r.vpno);
          const due = r.duedate && r.duedate < today();
          return (
            <div key={r.vpno} className="flex flex-col gap-2">
              <PickCard selected={Boolean(l)} label={`Pay voucher ${r.vpno}`} onToggle={() => setLines(l ? lines.filter((x) => x.vpno !== r.vpno) : [...lines, { vpno: r.vpno, dramt: r.balance }])}>
                <div className="min-w-0">
                  <div className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{r.vpno}</div>
                  <div className="truncate text-xs text-slate-500">{r.refdoc || 'No invoice reference'}</div>
                  <div className={cx('mt-0.5 text-xs', due ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-slate-500')}>Due {fmtDate(r.duedate)}</div>
                  <div className="mt-2 text-lg font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">{fmtMoney(r.balance)}</div>
                </div>
              </PickCard>
              {l && (
                <label className="tile block p-3">
                  <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Pay now</span>
                  <NumberInput value={l.dramt ?? ''} onValue={(v) => setLines(lines.map((x) => (x.vpno === r.vpno ? { ...x, dramt: v } : x)))} className="h-8" />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Physical count: the system's quantity per lot, the counted quantity and the difference. */
export function CountSheet({ draft, setDraft }: { draft: Draft; setDraft: SetDraft }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!draft.plntno) {
      setRows(null);
      return;
    }
    setError(null);
    rpc<any>('inv.stock', { plntno: draft.plntno })
      .then((res) => {
        const out: any[] = [];
        for (const r of res.rows) for (const l of r.lots) out.push({ codeno: r.codeno, mmdesc: r.mmdesc, um: r.um, lotno: l.lotno, system: l.qty, expdate: l.expdate });
        setRows(out);
      })
      .catch((e) => setError(e.message));
  }, [draft.plntno]);

  const counted: Record<string, any> = useMemo(() => Object.fromEntries((draft.lines ?? []).map((l: Draft) => [`${l.codeno}|${l.lotno}`, l.counted])), [draft.lines]);
  if (!draft.plntno) return <p className="text-sm text-slate-500">Choose the plant you counted.</p>;
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!rows) return <Spinner />;
  if (!rows.length) return <EmptyState title="No stock recorded at this plant" />;

  const setCount = (r: any, v: number | '') =>
    setDraft((d) => {
      const others = (d.lines ?? []).filter((l: Draft) => !(l.codeno === r.codeno && l.lotno === r.lotno));
      return { ...d, lines: v === '' ? others : [...others, { codeno: r.codeno, lotno: r.lotno, counted: v }] };
    });
  const shown = rows.filter((r) => !q || `${r.codeno} ${r.mmdesc} ${r.lotno}`.toLowerCase().includes(q.toLowerCase()));
  const diffs = (draft.lines ?? []).filter((l: Draft) => {
    const r = rows.find((x) => x.codeno === l.codeno && x.lotno === l.lotno);
    return r && Math.abs(Number(l.counted) - r.system) > 0.0001;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Find a material or lot…" className="w-full sm:max-w-xs" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enter only what you counted. {draft.lines?.length ?? 0} line(s) counted, {diffs} with a difference.
        </p>
      </div>
      <div className={GRID}>
        {shown.map((r) => {
          const c = counted[`${r.codeno}|${r.lotno}`];
          const diff = c === undefined || c === '' ? null : r2(Number(c) - r.system);
          return (
            <div key={`${r.codeno}|${r.lotno}`} className={cx('tile flex flex-col gap-3 p-4', diff !== null && Math.abs(diff) > 0.0001 && 'border-amber-500/40 dark:border-amber-400/30')}>
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-900 dark:text-white">{r.mmdesc}</div>
                <div className="font-mono text-xs text-slate-500">
                  {r.codeno} · lot {r.lotno}
                </div>
              </div>
              <div className="grid grid-cols-3 items-end gap-2">
                <Figure label="System">
                  {fmtQty(r.system)} <span className="text-xs text-slate-500">{r.um}</span>
                </Figure>
                <label className="block">
                  <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Counted</span>
                  <NumberInput value={c ?? ''} decimals={3} onValue={(v) => setCount(r, v)} className="h-8" placeholder="—" />
                </label>
                <Figure label="Difference" tone={diff && diff < 0 ? 'danger' : diff && diff > 0 ? 'good' : undefined}>
                  <span className="block text-right">{diff === null ? '—' : `${diff > 0 ? '+' : ''}${fmtQty(diff)}`}</span>
                </Figure>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Remarks exactly as the legacy Fund Replenishment page writes them (preview; the server writes the same). */
function replRemarks(fund: string, picked: string[], series: string[]): string {
  const sorted = [...picked].sort();
  if (!sorted.length) return '';
  if (sorted.length === 1) return `Representing ${fund} replenishment from Doc. No ${sorted[0]}`;
  const all = [...series].sort();
  const whole = all.length === sorted.length && all.every((d, i) => d === sorted[i]);
  return whole ? `Representing ${fund} replenishment from Doc. Nos ${sorted[0]} to ${sorted[sorted.length - 1]}` : `Representing ${fund} replenishment for Doc. Nos ${sorted.join(', ')}`;
}

/** Fund replenishment: the custodian's posted vouchers, all selected unless one is disallowed. */
export function FundVouchers({ draft, setDraft }: { draft: Draft; setDraft: SetDraft }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [custodians, setCustodians] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const autoPicked = useRef(false);
  const fund = draft.tc === '44' ? 'Revolving Fund' : 'Petty Cash Fund';

  useEffect(() => {
    if (!draft.tc) return;
    rpc<any[]>('fund.custodians', { tc: draft.tc })
      .then(setCustodians)
      .catch(() => setCustodians([]));
  }, [draft.tc]);

  useEffect(() => {
    if (!draft.tc || !draft.user) {
      setRows(null);
      return;
    }
    setError(null);
    rpc<any[]>('fund.openVouchers', { tc: draft.tc, user: draft.user, replno: draft.no ?? '' })
      .then((r) => {
        setRows(r);
        // Automation: on a new replenishment every waiting voucher is included.
        if (!draft.no && !(draft.lines ?? []).length && r.length) {
          autoPicked.current = true;
          setDraft((d) => ({ ...d, lines: r.map((v) => ({ docno: v.docno, amount: v.amount })) }));
        }
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.tc, draft.user]);

  const lines: Draft[] = draft.lines ?? [];
  const picked = lines.map((l) => String(l.docno));
  const preview = rows ? replRemarks(fund, picked, rows.map((r) => r.docno)) : '';

  return (
    <div className="space-y-4">
      {custodians.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Waiting to be replenished:</span>
          {custodians.map((c) => (
            <button
              key={c.username}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, user: c.username, lines: [] }))}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition',
                draft.user === c.username ? 'bg-brand-500/15 text-brand-700 ring-brand-500/30 dark:text-brand-200' : 'bg-black/[0.03] text-slate-600 ring-black/[0.08] hover:ring-brand-500/40 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/[0.1]'
              )}
            >
              <UserRound className="h-3.5 w-3.5" />
              {c.name} · {c.count} · ₱{fmtMoney(c.amount)}
            </button>
          ))}
        </div>
      )}
      {!draft.user ? (
        <p className="text-sm text-slate-500">Choose whose vouchers to replenish.</p>
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : !rows ? (
        <Spinner />
      ) : !rows.length ? (
        <EmptyState title="Nothing to replenish" text={`There are no posted ${fund.toLowerCase()} vouchers of this custodian waiting for replenishment.`} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">Every posted voucher is included. Untick a voucher to leave it out (for example a disallowed expense).</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setDraft((d) => ({ ...d, lines: rows.map((v) => ({ docno: v.docno, amount: v.amount })) }))}>
                Select all
              </Button>
            </div>
          </div>
          <div className={GRID}>
            {rows.map((v) => {
              const on = picked.includes(v.docno);
              return (
                <PickCard
                  key={v.docno}
                  selected={on}
                  label={`${on ? 'Leave out' : 'Include'} voucher ${v.docno}`}
                  onToggle={() => setDraft((d) => ({ ...d, lines: on ? (d.lines ?? []).filter((l: Draft) => l.docno !== v.docno) : [...(d.lines ?? []), { docno: v.docno, amount: v.amount }] }))}
                >
                  <div className="min-w-0">
                    <div className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{v.docno}</div>
                    <div className="truncate text-xs text-slate-500">
                      {fmtDate(v.transdate)} · {v.payee}
                    </div>
                    {v.remarks && <div className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{v.remarks}</div>}
                    <div className="mt-2 text-lg font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">{fmtMoney(v.amount)}</div>
                  </div>
                </PickCard>
              );
            })}
          </div>
          {preview && !draft.remarks && (
            <p className="rounded-2xl bg-black/[0.03] px-4 py-3 text-xs text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
              <span className="font-semibold">Remarks that will be written:</span> {preview}
            </p>
          )}
        </>
      )}
    </div>
  );
}
