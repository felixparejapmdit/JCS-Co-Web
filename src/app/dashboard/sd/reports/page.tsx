'use client';

import React, { useState } from 'react';
import { useRpc } from '@/lib/api';
import { addDays, fmtDate, today } from '@/shared/dates';
import { fmtMoney, fmtQty } from '@/shared/money';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Card, EmptyState, Field, Input, PageHeader, Spinner, Stat, Tabs } from '@/components/ui/kit';

export default function SalesReportsPage() {
  const [groupBy, setGroupBy] = useState<'customer' | 'product' | 'invoice'>('customer');
  const [from, setFrom] = useState(addDays(today(), -90));
  const [to, setTo] = useState(today());
  const { data, loading, error } = useRpc<any[]>('sales.register', { from, to, groupBy });
  const rows = data ?? [];
  const total = rows.reduce((s, r) => s + r.total, 0);
  const net = rows.reduce((s, r) => s + r.net, 0);
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <RequireRight form="017">
      <PageHeader
        title="Sales Reports"
        description="Posted sales for any period, by customer, by product or invoice by invoice."
        actions={
          <>
            <Field label="From">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Stat label="Net sales (VAT excluded)" value={`₱${fmtMoney(net)}`} />
        <Stat label="Output VAT" value={`₱${fmtMoney(total - net)}`} tone="sky" />
        <Stat label="Gross billed" value={`₱${fmtMoney(total)}`} tone="emerald" />
      </div>
      <Card padded={false}>
        <div className="px-4 pt-2">
          <Tabs
            tabs={[
              { id: 'customer', label: 'By customer' },
              { id: 'product', label: 'By product' },
              { id: 'invoice', label: 'Invoice register' },
            ]}
            value={groupBy}
            onChange={(v) => setGroupBy(v as 'customer' | 'product' | 'invoice')}
          />
        </div>
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => String(r.key)}
            rowHref={groupBy === 'invoice' ? (r) => `/dashboard/doc/si/${encodeURIComponent(r.key)}` : undefined}
            empty={<EmptyState title="No posted sales in this period" />}
            pageSize={25}
            columns={[
              ...(groupBy === 'invoice'
                ? [
                    { key: 'key', header: 'Invoice', render: (r: any) => <span className="font-mono text-[13px]">{r.key}</span> },
                    { key: 'date', header: 'Date', render: (r: any) => fmtDate(r.date) },
                    { key: 'label', header: 'Customer' },
                  ]
                : [
                    { key: 'label', header: groupBy === 'customer' ? 'Customer' : 'Product' },
                    ...(groupBy === 'product' ? [{ key: 'qty', header: 'Quantity', align: 'right' as const, render: (r: any) => fmtQty(r.qty) }] : []),
                    {
                      key: 'share',
                      header: 'Share',
                      sortable: false,
                      hideOnMobile: true,
                      render: (r: any) => (
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                          <div className="h-full rounded-full bg-teal-500" style={{ width: `${(r.total / max) * 100}%` }} />
                        </div>
                      ),
                    },
                  ]),
              { key: 'net', header: 'Net of VAT', align: 'right', render: (r) => fmtMoney(r.net) },
              { key: 'vat', header: 'VAT', align: 'right', hideOnMobile: true, render: (r) => fmtMoney(r.vat) },
              { key: 'total', header: 'Total', align: 'right', render: (r) => <span className="font-semibold">{fmtMoney(r.total)}</span> },
            ]}
          />
        )}
      </Card>
    </RequireRight>
  );
}
