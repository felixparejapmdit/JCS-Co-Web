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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-[#24324f]">
                <th className="py-2">Voucher</th>
                <th className="py-2">Invoice</th>
                <th className="py-2">Due</th>
                <th className="py-2 text-right">Unpaid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1a2540]">
              {vendor.vouchers.map((v: any) => (
                <tr key={v.docno}>
                  <td className="py-2">
                    <Link href={`/dashboard/doc/vp/${encodeURIComponent(v.docno)}`} className="font-mono text-xs text-teal-700 hover:underline dark:text-teal-400">
                      {v.docno}
                    </Link>
                  </td>
                  <td className="py-2">{v.refdoc}</td>
                  <td className="py-2">
                    {fmtDate(v.duedate)} {v.days > 0 && <Badge tone="danger">{v.days}d late</Badge>}
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums">{fmtMoney(v.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </RequireRight>
  );
}
