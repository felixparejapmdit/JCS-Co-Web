'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Landmark } from 'lucide-react';
import { useRpc } from '@/lib/api';
import { fmtDate, today } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { AgingBar, AgingTable } from '@/components/reports/Aging';
import { Alert, Badge, Button, Card, Field, Input, Modal, PageHeader, Spinner, Stat } from '@/components/ui/kit';

export default function ApPage() {
  const { can } = useSession();
  const [asOf, setAsOf] = useState(today());
  const [vendor, setVendor] = useState<any | null>(null);
  const { data, loading, error } = useRpc<any>('ap.aging', { asOf });
  return (
    <RequireRight form="032">
      <PageHeader
        title="A/P Aging"
        description="What the company owes each supplier and when it falls due. Click a vendor to see the vouchers and pay them."
        actions={
          <Field label="As of">
            <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </Field>
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Stat label="Total payables" value={`₱${fmtMoney(data.totals.total)}`} tone="violet" />
              <Stat label="Due within 7 days" value={`₱${fmtMoney(data.dueThisWeek)}`} tone="amber" />
              <Stat label="Past due" value={`₱${fmtMoney(data.totals.total - data.totals.current)}`} tone="rose" />
            </div>
            <Card>
              <AgingBar totals={data.totals} />
            </Card>
            <Card padded={false}>
              <AgingTable rows={data.rows} nameKey="venname" nameLabel="Vendor" totals={data.totals} onRowClick={setVendor} />
            </Card>
          </div>
        )
      )}
      <Modal
        open={Boolean(vendor)}
        onClose={() => setVendor(null)}
        side
        size="lg"
        title={vendor?.venname ?? ''}
        description="Unpaid vouchers"
        footer={
          vendor &&
          can('024', 3) && (
            <Button variant="primary" icon={Landmark} href={`/dashboard/doc/cv/new?venno=${encodeURIComponent(vendor.venno)}`}>
              Pay this vendor
            </Button>
          )
        }
      >
        {vendor && (
          <div className="grid gap-2">
            {vendor.vouchers.map((v: any) => (
              <Link key={v.docno} href={`/dashboard/doc/vp/${encodeURIComponent(v.docno)}`} className="tile-interactive flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{v.docno}</div>
                  <div className="truncate text-sm text-slate-600 dark:text-slate-300">{v.refdoc || 'No invoice reference'}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    Due {fmtDate(v.duedate)} {v.days > 0 && <Badge tone="danger">{v.days}d late</Badge>}
                  </div>
                </div>
                <div className="text-right font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(v.balance)}</div>
              </Link>
            ))}
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
