'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { rpc } from '@/lib/api';
import { autoApply, ewtForSettlement } from '@/shared/collections';
import { fmtDate, today } from '@/shared/dates';
import { fmtMoney, fmtQty, r2 } from '@/shared/money';
import { Alert, Button, EmptyState, NumberInput, SearchInput, Spinner, cx } from '@/components/ui/kit';
import type { Draft } from './configs';

type SetDraft = (fn: (d: Draft) => Draft) => void;

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
  const auto = () => {
    const res = autoApply(data.invoices, Number(draft.colamt) || 0, data.ewtRate);
    setLines(res.lines);
  };
  const payAll = () => {
    const all = data.invoices.map(full);
    setDraft((d) => ({ ...d, lines: all, colamt: r2(all.reduce((s, l) => s + l.oramt, 0)) }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {data.ewtRate ? `This customer withholds ${data.ewtRate}% tax (BIR 2307) on the VAT-exclusive amount; it is computed for you.` : 'This customer does not withhold tax.'}
        </p>
        <div className="flex gap-2">
          <Button size="sm" icon={Wand2} onClick={auto} disabled={!Number(draft.colamt)}>
            Apply amount received (oldest first)
          </Button>
          <Button size="sm" onClick={payAll}>
            Pay everything in full
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#24324f]">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-[#24324f] dark:bg-white/[0.02]">
              <th className="w-10 px-3 py-2" />
              <th className="px-3 py-2 text-left">Invoice</th>
              <th className="px-3 py-2 text-left">Due</th>
              <th className="px-3 py-2 text-right">Balance</th>
              <th className="px-3 py-2 text-right">Paid now</th>
              <th className="px-3 py-2 text-right">2307 tax</th>
              <th className="px-3 py-2 text-right">Left after</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2540]">
            {data.invoices.map((inv) => {
              const l = lineFor(inv.invno);
              const left = r2(inv.balance - (l ? Number(l.oramt || 0) + Number(l.ewt || 0) : 0));
              return (
                <tr key={inv.invno} className={cx(l && 'bg-teal-50/50 dark:bg-teal-500/5')}>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-teal-600"
                      checked={Boolean(l)}
                      onChange={(e) => setLines(e.target.checked ? [...lines, full(inv)] : lines.filter((x) => x.invno !== inv.invno))}
                      aria-label={`Pay invoice ${inv.invno}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{inv.invno}</div>
                    <div className="text-xs text-slate-500">{fmtDate(inv.transdate)}</div>
                  </td>
                  <td className={cx('px-3 py-2', inv.daysOverdue > 0 && 'font-medium text-rose-600')}>
                    {fmtDate(inv.duedate)}
                    {inv.daysOverdue > 0 && <div className="text-xs">{inv.daysOverdue} days overdue</div>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(inv.balance)}</td>
                  <td className="w-36 px-3 py-2">
                    <NumberInput value={l?.oramt ?? ''} disabled={!l} onValue={(v) => setLines(lines.map((x) => (x.invno === inv.invno ? { ...x, oramt: v } : x)))} className="h-8" />
                  </td>
                  <td className="w-32 px-3 py-2">
                    <NumberInput value={l?.ewt ?? ''} disabled={!l} onValue={(v) => setLines(lines.map((x) => (x.invno === inv.invno ? { ...x, ewt: v } : x)))} className="h-8" />
                  </td>
                  <td className={cx('px-3 py-2 text-right tabular-nums', left < -0.005 ? 'font-semibold text-rose-600' : 'text-slate-600 dark:text-slate-400')}>{fmtMoney(left)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Check voucher: choose the posted vouchers this cheque pays. */
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
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setLines(rows.map((r) => ({ vpno: r.vpno, dramt: r.balance })))}>
          Pay all
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#24324f]">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-[#24324f] dark:bg-white/[0.02]">
              <th className="w-10 px-3 py-2" />
              <th className="px-3 py-2 text-left">Voucher</th>
              <th className="px-3 py-2 text-left">Vendor invoice</th>
              <th className="px-3 py-2 text-left">Due</th>
              <th className="px-3 py-2 text-right">Unpaid</th>
              <th className="px-3 py-2 text-right">Pay now</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2540]">
            {rows.map((r) => {
              const l = lines.find((x) => x.vpno === r.vpno);
              const due = r.duedate && r.duedate < today();
              return (
                <tr key={r.vpno} className={cx(l && 'bg-teal-50/50 dark:bg-teal-500/5')}>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" className="h-4 w-4 accent-teal-600" checked={Boolean(l)} onChange={(e) => setLines(e.target.checked ? [...lines, { vpno: r.vpno, dramt: r.balance }] : lines.filter((x) => x.vpno !== r.vpno))} aria-label={`Pay voucher ${r.vpno}`} />
                  </td>
                  <td className="px-3 py-2 font-mono text-[13px] font-semibold">{r.vpno}</td>
                  <td className="px-3 py-2">{r.refdoc}</td>
                  <td className={cx('px-3 py-2', due && 'font-medium text-rose-600')}>{fmtDate(r.duedate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.balance)}</td>
                  <td className="w-40 px-3 py-2">
                    <NumberInput value={l?.dramt ?? ''} disabled={!l} onValue={(v) => setLines(lines.map((x) => (x.vpno === r.vpno ? { ...x, dramt: v } : x)))} className="h-8" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Find a material or lot…" className="w-full sm:max-w-xs" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enter only what you counted. {draft.lines?.length ?? 0} line(s) counted, {diffs} with a difference.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#24324f]">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-[#24324f] dark:bg-white/[0.02]">
              <th className="px-3 py-2 text-left">Material</th>
              <th className="px-3 py-2 text-left">Lot</th>
              <th className="px-3 py-2 text-right">System</th>
              <th className="px-3 py-2 text-right">Counted</th>
              <th className="px-3 py-2 text-right">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2540]">
            {shown.map((r) => {
              const c = counted[`${r.codeno}|${r.lotno}`];
              const diff = c === undefined || c === '' ? null : r2(Number(c) - r.system);
              return (
                <tr key={`${r.codeno}|${r.lotno}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900 dark:text-white">{r.mmdesc}</div>
                    <div className="font-mono text-xs text-slate-500">{r.codeno}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.lotno}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtQty(r.system)} <span className="text-xs text-slate-500">{r.um}</span>
                  </td>
                  <td className="w-36 px-3 py-2">
                    <NumberInput value={c ?? ''} decimals={3} onValue={(v) => setCount(r, v)} className="h-8" placeholder="—" />
                  </td>
                  <td className={cx('px-3 py-2 text-right tabular-nums', diff && diff < 0 ? 'text-rose-600' : diff && diff > 0 ? 'text-emerald-600' : 'text-slate-500')}>{diff === null ? '' : `${diff > 0 ? '+' : ''}${fmtQty(diff)}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
