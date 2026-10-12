'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { rpc, useRpc } from '@/lib/api';
import { fmtDate, today } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Card, EmptyState, PageHeader, Select, Spinner, Stat, useToast } from '@/components/ui/kit';

export default function CwtPage() {
  const toast = useToast();
  const { can } = useSession();
  const y = Number(today().slice(0, 4));
  const [year, setYear] = useState(y);
  const [quarter, setQuarter] = useState('');
  const [status, setStatus] = useState('all');
  const { data, loading, error, reload } = useRpc<any[]>('cwt.list', { year, quarter: quarter ? Number(quarter) : undefined, status });
  const rows = data ?? [];
  const missing = rows.filter((r) => !r.received);

  const toggle = async (r: any) => {
    try {
      toast.success(await rpc<string>('cwt.mark', { orno: r.orno, invno: r.invno, received: !r.received }));
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <RequireRight form="066">
      <PageHeader
        title="Customer 2307 Certificates"
        description="Tax withheld by customers when they pay (BIR Form 2307). Tick each certificate as it arrives so nothing is missed when you claim the tax credit."
        actions={
          <>
            <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))} options={[y - 1, y].map((v) => ({ value: String(v), label: String(v) }))} className="w-28" />
            <Select value={quarter} onChange={(e) => setQuarter(e.target.value)} placeholder="All quarters" options={[1, 2, 3, 4].map((q) => ({ value: String(q), label: `Quarter ${q}` }))} className="w-40" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: 'all', label: 'All' }, { value: 'missing', label: 'Not yet received' }, { value: 'received', label: 'Received' }]} className="w-44" />
          </>
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Tax withheld" value={`₱${fmtMoney(rows.reduce((s, r) => s + r.ewt, 0))}`} />
            <Stat label="Certificates received" value={rows.length - missing.length} tone="emerald" />
            <Stat label="Still to collect" value={missing.length} sub={`₱${fmtMoney(missing.reduce((s, r) => s + r.ewt, 0))}`} tone={missing.length ? 'amber' : 'emerald'} />
          </div>
          <Card padded={false}>
            <DataTable
              rows={rows}
              rowKey={(r) => `${r.orno}-${r.invno}`}
              empty={<EmptyState title="No tax withheld in this period" />}
              columns={[
                { key: 'transdate', header: 'Paid on', render: (r) => fmtDate(r.transdate) },
                { key: 'bussname', header: 'Customer' },
                { key: 'orno', header: 'OR', render: (r) => <Link href={`/dashboard/doc/or/${encodeURIComponent(r.orno)}`} className="font-mono text-[13px] text-brand-700 hover:underline dark:text-brand-400">{r.orno}</Link> },
                { key: 'invno', header: 'Invoice', hideOnMobile: true },
                { key: 'quarter', header: 'Quarter', hideOnMobile: true, render: (r) => `Q${r.quarter}` },
                { key: 'ewt', header: 'Tax withheld', align: 'right', render: (r) => fmtMoney(r.ewt) },
                {
                  key: 'received',
                  header: '2307 received',
                  render: (r) =>
                    can('066', 2) ? (
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={r.received} onChange={() => toggle(r)} />
                        {r.received ? <Badge tone="success">Received</Badge> : <Badge tone="warning">Missing</Badge>}
                      </label>
                    ) : r.received ? (
                      <Badge tone="success">Received</Badge>
                    ) : (
                      <Badge tone="warning">Missing</Badge>
                    ),
                },
              ]}
            />
          </Card>
        </div>
      )}
    </RequireRight>
  );
}
