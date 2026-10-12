'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Send } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { fmtDate, today } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { TC_DOC, TC_NAMES } from '@/shared/codes';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Button, Card, EmptyState, Field, Input, PageHeader, Spinner, Stat, useToast } from '@/components/ui/kit';

export default function PostingPage() {
  const toast = useToast();
  const { can } = useSession();
  const { data, loading, error, reload } = useRpc<any>('gl.openEntries');
  const [upTo, setUpTo] = useState(today());
  const [busy, setBusy] = useState(false);

  const post = async () => {
    setBusy(true);
    try {
      const res = await rpc<{ jvnos: string[]; lines: number }>('gl.postOpen', { upTo });
      toast.success(res.jvnos.length ? `${res.lines} entries posted through automatic JV ${res.jvnos.join(', ')}.` : 'There was nothing to post up to that date.');
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequireRight form="038">
      <PageHeader
        title="JV Posting"
        description="Receipts, deliveries, invoices, vouchers, payments and payroll create their accounting entries automatically. Posting bundles them into one automatic journal voucher per month and updates the general ledger."
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Stat label="Entries waiting" value={data.count} sub={`${data.byDoc.length} document(s)`} />
              <Stat label="Debits" value={`₱${fmtMoney(data.debit)}`} tone="sky" />
              <Stat label="Credits" value={`₱${fmtMoney(data.credit)}`} tone="violet" sub={Math.abs(data.debit - data.credit) < 0.01 ? 'Balanced' : 'Out of balance'} />
            </div>
            {can('038', 5) && data.count > 0 && (
              <Card>
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <Field label="Post entries dated up to" hint="Entries in closed periods are never touched." className="md:w-64">
                    <Input type="date" value={upTo} onChange={(e) => setUpTo(e.target.value)} />
                  </Field>
                  <Button variant="primary" icon={Send} loading={busy} onClick={post}>
                    Post to the general ledger
                  </Button>
                </div>
              </Card>
            )}
            <Card title="Documents waiting for posting" padded={false}>
              <DataTable
                rows={data.byDoc}
                rowKey={(r) => `${r.tc}-${r.docno}`}
                empty={<EmptyState icon={CheckCircle2} title="Everything is posted" text="New documents will appear here as soon as they are saved and posted in their modules." />}
                columns={[
                  { key: 'transdate', header: 'Date', render: (r) => fmtDate(r.transdate) },
                  { key: 'tc', header: 'Document type', render: (r) => TC_NAMES[r.tc]?.document ?? r.source },
                  {
                    key: 'docno',
                    header: 'Document',
                    render: (r) =>
                      TC_DOC[r.tc] ? (
                        <Link href={`/dashboard/doc/${TC_DOC[r.tc]}/${encodeURIComponent(r.docno)}`} className="font-mono text-[13px] text-brand-700 hover:underline dark:text-brand-400">
                          {r.docno}
                        </Link>
                      ) : (
                        <span className="font-mono text-[13px]">{r.docno}</span>
                      ),
                  },
                  { key: 'lines', header: 'Lines', align: 'right' },
                  { key: 'debit', header: 'Debit', align: 'right', render: (r) => fmtMoney(r.debit) },
                  { key: 'credit', header: 'Credit', align: 'right', render: (r) => fmtMoney(r.credit) },
                ]}
              />
            </Card>
          </div>
        )
      )}
    </RequireRight>
  );
}
