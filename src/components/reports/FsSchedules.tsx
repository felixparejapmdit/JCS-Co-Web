'use client';

import React, { useState } from 'react';
import { Badge, Card, EmptyState, Segmented, cx } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';

type MY = { month: number; ytd: number };

function Row2({ label, v, strong, sub, indent }: { label: React.ReactNode; v: MY; strong?: boolean; sub?: boolean; indent?: boolean }) {
  return (
    <div className={cx('grid grid-cols-[1fr_auto_auto] gap-4 py-1.5 text-sm', strong && 'border-t border-black/[0.08] font-semibold text-slate-900 dark:border-white/[0.1] dark:text-white', sub && 'text-slate-500', indent && 'pl-4')}>
      <span className="min-w-0">{label}</span>
      <span className="w-32 text-right tabular-nums">{fmtMoney(v.month)}</span>
      <span className="w-32 text-right tabular-nums">{fmtMoney(v.ytd)}</span>
    </div>
  );
}

function Head({ period }: { period: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-black/[0.08] pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-white/[0.1]">
      <span />
      <span className="w-32 text-right">{period}</span>
      <span className="w-32 text-right">Year to date</span>
    </div>
  );
}

export function PnlBySchedule({ d }: { d: any }) {
  const p = d.pnl;
  return (
    <Card title={`Profit and loss, ${d.period}`} subtitle="Legacy layout: the expenses of the overhead and direct-labour cost centres are part of cost of sales; operating expenses follow the expense schedules.">
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <Head period={d.period} />
          <Row2 label="Sales" v={p.sales} />
          <Row2 label="Cost of sales (per ledger)" v={p.cosGl} indent sub />
          <Row2 label="Overhead and direct labour" v={p.overhead} indent sub />
          <Row2 label="Total cost of sales" v={p.cos} />
          <Row2 label="Gross profit" v={p.gross} strong />
          {p.opex.map((o: any) => (
            <Row2 key={o.label} label={o.label} v={o} indent />
          ))}
          <Row2 label="Total operating expenses" v={p.totalOpex} />
          {(p.otherIncome.month || p.otherIncome.ytd) !== 0 && <Row2 label="Other income" v={p.otherIncome} />}
          {(p.otherExpense.month || p.otherExpense.ytd) !== 0 && <Row2 label="Other expenses" v={p.otherExpense} />}
          <Row2 label="Net income" v={p.netIncome} strong />
        </div>
      </div>
    </Card>
  );
}

export function CosSchedule({ d }: { d: any }) {
  const m = d.cosSchedule.month;
  const y = d.cosSchedule.ytd;
  const both = (f: (x: any) => number): MY => ({ month: f(m), ytd: f(y) });
  return (
    <Card title={`Cost of sales schedule, ${d.period}`} subtitle="Roll-forward of materials, work in process and finished goods (including stock on salesmen's vans) from the ledger.">
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <Head period={d.period} />
          <p className="pt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Raw and packaging materials</p>
          <Row2 label="Beginning inventory" v={both((x) => x.materials.beginning)} indent />
          <Row2 label="Add: purchases (receiving reports)" v={both((x) => x.materials.purchases)} indent />
          <Row2 label="Add: other receipts and transfers" v={both((x) => x.materials.otherIn)} indent />
          <Row2 label="Less: ending inventory" v={both((x) => x.materials.ending)} indent />
          <Row2 label="Materials used" v={both((x) => x.materials.used)} strong />
          <p className="pt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Work in process</p>
          <Row2 label="Beginning" v={both((x) => x.wip.beginning)} indent />
          <Row2 label="Ending" v={both((x) => x.wip.ending)} indent />
          <p className="pt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Finished goods</p>
          <Row2 label="Beginning" v={both((x) => x.finishedGoods.beginning)} indent />
          <Row2 label="Produced, received and transferred in" v={both((x) => x.finishedGoods.otherIn + x.finishedGoods.purchases)} indent />
          <Row2 label="Ending" v={both((x) => x.finishedGoods.ending)} indent />
          <p className="pt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Cost of sales</p>
          <Row2 label="Cost of goods sold (per ledger)" v={both((x) => x.costOfSalesGl)} indent />
          <Row2 label="Overhead and direct labour" v={both((x) => x.overhead)} indent />
          <Row2 label="Total cost of sales" v={both((x) => x.total)} strong />
        </div>
      </div>
    </Card>
  );
}

export function ExpenseSchedules({ d }: { d: any }) {
  const [g, setG] = useState<string>(d.schedules[0]?.group ?? '');
  const s = d.schedules.find((x: any) => x.group === g) ?? d.schedules[0];
  if (!s) return <EmptyState title="No expenses in this period" />;
  return (
    <Card
      title={`${s.group} expenses`}
      subtitle={s.costCenters.length ? `Cost centres: ${s.costCenters.join(', ')}` : undefined}
      actions={<Segmented value={s.group} onChange={setG} options={d.schedules.map((x: any) => ({ value: x.group, label: x.group }))} />}
    >
      {!d.legacyGroups && <p className="mb-3 text-xs text-slate-500">Cost centres are grouped by their cost-centre group. Set ccadmin, ccsales, cctech, cclogis and ccprod on the company (batbl) to use the legacy grouping.</p>}
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <Head period={d.period} />
          {s.rows.map((r: any) => (
            <Row2
              key={r.acctno}
              label={
                <>
                  <span className="mr-2 font-mono text-[12px] text-slate-400">{r.acctno}</span>
                  {r.acctdesc}
                </>
              }
              v={r}
            />
          ))}
          <Row2 label={`Total ${s.group.toLowerCase()} expenses`} v={s} strong />
        </div>
      </div>
    </Card>
  );
}

export function PriorYearAdjustments({ d }: { d: any }) {
  return (
    <Card title="Prior years' adjustments" subtitle="Manual journal vouchers marked as correcting a closed year, this year to date." actions={<Badge tone={d.adjustmentsNet >= 0 ? 'success' : 'warning'}>Net {fmtMoney(d.adjustmentsNet)}</Badge>}>
      {!d.adjustments.length ? (
        <p className="text-sm text-slate-500">None this year. Mark a journal voucher as a prior years' adjustment when you enter it.</p>
      ) : (
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {d.adjustments.map((a: any, i: number) => (
            <div key={i} className="tile p-3 text-[13px]">
              <div className="flex justify-between gap-2">
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{a.jvno}</span>
                <span className="text-xs text-slate-500">
                  {fmtDate(a.transdate)} · {a.status}
                </span>
              </div>
              <div className="mt-1 text-slate-700 dark:text-slate-200">
                {a.acctno} {a.acctdesc}
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span className="truncate">{a.remarks}</span>
                <span className="tabular-nums">{a.dramt ? `Dr ${fmtMoney(a.dramt)}` : `Cr ${fmtMoney(a.cramt)}`}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
