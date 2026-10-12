'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HandCoins, Printer } from 'lucide-react';
import { useRpc } from '@/lib/api';
import { fmtDate, today } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { AgingBar, AgingTable } from '@/components/reports/Aging';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, KeyValue, Modal, PageHeader, Spinner } from '@/components/ui/kit';

function Statement({ custno, onClose }: { custno: string; onClose: () => void }) {
  const { can } = useSession();
  const { data, loading, error } = useRpc<any>('ar.soa', { custno });
  return (
    <Modal
      open
      side
      size="lg"
      onClose={onClose}
      title={data?.customer.bussname ?? 'Statement of account'}
      description="Statement of account"
      footer={
        <>
          <Button icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          {can('010', 3) && (
            <Button variant="primary" icon={HandCoins} href={`/dashboard/doc/or/new?custno=${encodeURIComponent(custno)}`}>
              Record a payment
            </Button>
          )}
        </>
      }
    >
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div id="print-area" className="space-y-5">
            <KeyValue
              cols={2}
              items={[
                { label: 'Customer', value: `${data.customer.bussname} (${data.customer.custno})` },
                { label: 'Address', value: data.customer.address },
                { label: 'Terms', value: `${data.customer.term} days` },
                { label: 'Credit limit', value: `₱${fmtMoney(data.customer.crlimit)}` },
                { label: 'Open orders and deliveries not yet billed', value: `₱${fmtMoney(data.exposure.openOrders)}` },
                { label: 'Unapplied payments (deposits)', value: `₱${fmtMoney(data.unapplied)}` },
              ]}
            />
            {data.invoices.length === 0 ? (
              <EmptyState title="Nothing outstanding" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[0.07] text-left text-xs uppercase text-slate-500 dark:border-white/[0.08]">
                    <th className="py-2">Invoice</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Due</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {data.invoices.map((i: any) => (
                    <tr key={i.invno}>
                      <td className="py-2">
                        <Link href={`/dashboard/doc/si/${encodeURIComponent(i.invno)}`} className="font-mono text-xs text-brand-700 hover:underline dark:text-brand-400">
                          {i.invno}
                        </Link>
                      </td>
                      <td className="py-2">{fmtDate(i.transdate)}</td>
                      <td className="py-2">
                        {fmtDate(i.duedate)} {i.daysOverdue > 0 && <Badge tone="danger">{i.daysOverdue}d overdue</Badge>}
                      </td>
                      <td className="py-2 text-right tabular-nums">{fmtMoney(i.netamt)}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{fmtMoney(i.balance)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} className="py-2 text-right font-semibold">
                      Total due
                    </td>
                    <td className="py-2 text-right font-bold tabular-nums">{fmtMoney(data.total)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )
      )}
    </Modal>
  );
}

export default function ArPage() {
  const [asOf, setAsOf] = useState(today());
  const [cust, setCust] = useState<string | null>(null);
  const { data, loading, error } = useRpc<any>('ar.aging', { asOf });
  return (
    <RequireRight form="014">
      <PageHeader
        title="A/R Aging & Statements"
        description="What every customer owes, grouped by how late it is. Click a customer for their statement of account."
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
            <Card>
              <AgingBar totals={data.totals} />
            </Card>
            <Card padded={false}>
              <AgingTable rows={data.rows} nameKey="bussname" nameLabel="Customer" totals={data.totals} onRowClick={(r) => setCust(r.custno)} />
            </Card>
          </div>
        )
      )}
      {cust && <Statement custno={cust} onClose={() => setCust(null)} />}
    </RequireRight>
  );
}
