'use client';

import React, { useState } from 'react';
import { useRpc } from '@/lib/api';
import { addDays, today } from '@/shared/dates';
import { fmtMoney, fmtQty } from '@/shared/money';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Card, EmptyState, Field, Input, PageHeader, Spinner } from '@/components/ui/kit';

export default function CosAspPage() {
  const [from, setFrom] = useState(addDays(today(), -90));
  const [to, setTo] = useState(today());
  const { data, loading, error } = useRpc<any[]>('prod.cosVsAsp', { from, to });
  return (
    <RequireRight form="059">
      <PageHeader
        title="COS vs ASP Analysis"
        description="For every finished product: the cost per unit from production costing (or average stock cost) against the average selling price, net of VAT, and the margin."
        actions={
          <>
            <Field label="Sales from">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </>
        }
      />
      <Card padded={false}>
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : (
          <DataTable
            rows={data ?? []}
            rowKey={(r) => r.codeno}
            empty={<EmptyState title="No finished products sold or produced yet" />}
            columns={[
              { key: 'mmdesc', header: 'Product', render: (r) => <div><div className="font-medium">{r.mmdesc}</div><div className="font-mono text-xs text-slate-500">{r.codeno}</div></div> },
              { key: 'qtySold', header: 'Sold', align: 'right', render: (r) => `${fmtQty(r.qtySold)} ${r.um}` },
              { key: 'sales', header: 'Net sales', align: 'right', hideOnMobile: true, render: (r) => fmtMoney(r.sales) },
              { key: 'asp', header: 'Avg selling price', align: 'right', render: (r) => (r.asp ? fmtMoney(r.asp) : '—') },
              { key: 'unitCost', header: 'Cost per unit', align: 'right', render: (r) => fmtMoney(r.unitCost) },
              { key: 'margin', header: 'Margin per unit', align: 'right', render: (r) => (r.asp ? fmtMoney(r.margin) : '—') },
              { key: 'marginPct', header: 'Margin %', align: 'right', render: (r) => (r.asp ? <Badge tone={r.marginPct >= 25 ? 'success' : r.marginPct >= 10 ? 'warning' : 'danger'}>{r.marginPct}%</Badge> : '—') },
            ]}
          />
        )}
      </Card>
    </RequireRight>
  );
}
