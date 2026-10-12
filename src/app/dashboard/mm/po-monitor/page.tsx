'use client';

import React from 'react';
import { useRpc } from '@/lib/api';
import { fmtDate } from '@/shared/dates';
import { fmtMoney, fmtQty } from '@/shared/money';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Card, EmptyState, PageHeader, Spinner, StatusBadge } from '@/components/ui/kit';

export default function PoMonitorPage() {
  const { data, loading, error } = useRpc<any[]>('po.monitor');
  const overdue = (data ?? []).filter((r) => r.overdue).length;
  return (
    <RequireRight form="037">
      <PageHeader title="PO Monitoring" description="Approved purchase orders and how much of each has been received. Late deliveries are flagged so you can follow up with the supplier." />
      {overdue > 0 && (
        <div className="mb-4">
          <Alert tone="warning">{overdue} purchase order(s) are past their delivery date and not fully received.</Alert>
        </div>
      )}
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
            rowKey={(r) => r.pono}
            rowHref={(r) => `/dashboard/doc/po/${encodeURIComponent(r.pono)}`}
            empty={<EmptyState title="No approved purchase orders" />}
            columns={[
              { key: 'pono', header: 'PO', render: (r) => <span className="font-mono text-[13px] font-semibold">{r.pono}</span> },
              { key: 'venname', header: 'Vendor' },
              { key: 'plntno', header: 'Deliver to', hideOnMobile: true },
              { key: 'datereq', header: 'Due', render: (r) => <span className={r.overdue ? 'font-semibold text-rose-600' : ''}>{fmtDate(r.datereq)}</span> },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => fmtMoney(r.amount) },
              { key: 'received', header: 'Received', align: 'right', render: (r) => `${fmtQty(r.received)} of ${fmtQty(r.ordered)}` },
              {
                key: 'pct',
                header: 'Progress',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{r.pct}%</span>
                  </div>
                ),
              },
              { key: 'servstat', header: 'Status', render: (r) => (r.overdue ? <Badge tone="danger">Late</Badge> : <StatusBadge status={r.servstat} />) },
            ]}
          />
        )}
      </Card>
    </RequireRight>
  );
}
