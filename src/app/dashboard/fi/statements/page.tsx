'use client';

import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { useRpc } from '@/lib/api';
import { monthName, today } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, PageHeader, Select, Spinner, cx } from '@/components/ui/kit';

function Section({ title, rows, total, totalLabel }: { title: string; rows: any[]; total: number; totalLabel: string }) {
  return (
    <div className="mb-5">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-50 dark:border-white/[0.03]">
              <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">
                {r.acctno && <span className="mr-2 font-mono text-xs text-slate-400">{r.acctno}</span>}
                {r.acctdesc}
              </td>
              <td className="py-1.5 text-right tabular-nums">{fmtMoney(r.amount)}</td>
            </tr>
          ))}
          <tr>
            <td className="py-2 font-semibold text-slate-900 dark:text-white">{totalLabel}</td>
            <td className="border-t border-black/[0.1] py-2 text-right font-semibold tabular-nums dark:border-slate-600">{fmtMoney(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={cx('flex justify-between py-1.5 text-sm', strong && 'border-t border-black/[0.07] font-semibold text-slate-900 dark:border-white/[0.08] dark:text-white')}>
      <span>{label}</span>
      <span className={cx('tabular-nums', value < 0 && 'text-rose-600')}>{fmtMoney(value)}</span>
    </div>
  );
}

function Income({ d }: { d: any }) {
  return (
    <div>
      <Section title="Revenue" rows={d.revenue} total={d.totalRevenue} totalLabel="Total revenue" />
      <Section title="Cost of sales" rows={d.cos} total={d.totalCos} totalLabel="Total cost of sales" />
      <Line label="Gross profit" value={d.gross} strong />
      <div className="mt-4">
        <Section title="Operating expenses" rows={d.expenses} total={d.totalExpenses} totalLabel="Total operating expenses" />
      </div>
      <Line label="Operating income" value={d.operating} strong />
      <Line label="Net income" value={d.net} strong />
    </div>
  );
}

export default function StatementsPage() {
  const { info } = useSession();
  const t = today();
  const [year, setYear] = useState(Number(t.slice(0, 4)));
  const [month, setMonth] = useState(Number(t.slice(5, 7)));
  const [unposted, setUnposted] = useState(true);
  const { data, loading, error } = useRpc<any>('report.fs', { year, month, includeUnposted: unposted });
  return (
    <RequireRight form="063">
      <PageHeader
        title="Financial Statements"
        description={`Balance sheet and income statement of ${info.legal.bussname}, computed live from the general ledger.`}
        actions={
          <>
            <Select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))} options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthName(i + 1) }))} className="w-40" />
            <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))} options={[year - 1, year, year + 1].map((y) => ({ value: String(y), label: String(y) }))} className="w-28" />
            <Button icon={Printer} onClick={() => window.print()}>
              Print
            </Button>
          </>
        }
      >
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={unposted} onChange={(e) => setUnposted(e.target.checked)} />
          Include entries that are still waiting for JV posting (real-time view)
        </label>
      </PageHeader>
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div id="print-area" className="grid gap-6 xl:grid-cols-2">
            <Card title={`Balance sheet as of ${data.asOf}`} actions={data.balanceSheet.balanced ? <Badge tone="success">Balanced</Badge> : <Badge tone="danger">Not balanced</Badge>}>
              <Section title="Assets" rows={data.balanceSheet.assets} total={data.balanceSheet.totalAssets} totalLabel="Total assets" />
              <Section title="Liabilities" rows={data.balanceSheet.liabilities} total={data.balanceSheet.totalLiabilities} totalLabel="Total liabilities" />
              <Section title="Equity" rows={data.balanceSheet.equity} total={data.balanceSheet.totalEquity} totalLabel="Total equity" />
              <Line label="Total liabilities and equity" value={data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquity} strong />
            </Card>
            <div className="space-y-6">
              <Card title={`Income statement, ${data.period}`}>
                <Income d={data.incomeMonth} />
              </Card>
              <Card title={`Income statement, year to date`}>
                <Income d={data.incomeYtd} />
              </Card>
            </div>
          </div>
        )
      )}
    </RequireRight>
  );
}
