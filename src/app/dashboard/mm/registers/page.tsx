'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRpc } from '@/lib/api';
import { addDays, fmtDate, today } from '@/shared/dates';
import { fmtMoney, fmtQty } from '@/shared/money';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Card, Field, Input, PageHeader, Spinner, Tabs } from '@/components/ui/kit';

export default function RegistersPage() {
  const [kind, setKind] = useState<'receipts' | 'issues'>('receipts');
  const [from, setFrom] = useState(addDays(today(), -90));
  const [to, setTo] = useState(today());
  const { data, loading, error } = useRpc<any>('inv.register', { kind, from, to });
  return (
    <RequireRight form="034">
      <PageHeader title="Materials Registers" description="Every posted receipt and issuance in a period, line by line, with quantities and cost." />
      <Card padded={false}>
        <div className="flex flex-col gap-4 px-4 pt-2 md:flex-row md:items-end md:justify-between">
          <Tabs
            tabs={[
              { id: 'receipts', label: 'Receipts' },
              { id: 'issues', label: 'Issuances & deliveries' },
            ]}
            value={kind}
            onChange={(v) => setKind(v as 'receipts' | 'issues')}
          />
          <div className="flex gap-3 pb-3">
            <Field label="From">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
        </div>
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : (
          <DataTable
            rows={data?.rows ?? []}
            rowKey={(r, i) => `${r.docno}-${i}`}
            pageSize={25}
            columns={[
              { key: 'transdate', header: 'Date', render: (r) => fmtDate(r.transdate) },
              {
                key: 'docno',
                header: 'Document',
                render: (r) =>
                  kind === 'issues' || r.tc === '10' ? (
                    <Link className="font-mono text-[13px] text-brand-700 hover:underline dark:text-brand-400" href={`/dashboard/doc/${kind === 'issues' ? 'do' : 'mmrr'}/${encodeURIComponent(r.docno)}`}>
                      {r.docno}
                    </Link>
                  ) : (
                    <span className="font-mono text-[13px]">{r.docno}</span>
                  ),
              },
              { key: 'plntno', header: 'Plant' },
              { key: 'party', header: kind === 'receipts' ? 'Vendor / source' : 'Customer / destination', hideOnMobile: true },
              { key: 'mmdesc', header: 'Material' },
              { key: 'lotno', header: 'Lot', hideOnMobile: true },
              { key: 'qty', header: 'Quantity', align: 'right', render: (r) => fmtQty(r.qty) },
              { key: 'amount', header: 'Cost', align: 'right', render: (r) => fmtMoney(r.amount) },
            ]}
            footer={
              <tr>
                <td colSpan={7} className="px-4 py-3 text-right">
                  Total cost
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(data?.total)}</td>
              </tr>
            }
          />
        )}
      </Card>
    </RequireRight>
  );
}
