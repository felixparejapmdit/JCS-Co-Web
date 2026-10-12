'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { fmtDate } from '@/shared/dates';
import { fmtQty } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Spinner, Tabs, useToast } from '@/components/ui/kit';

export default function LabPage() {
  const toast = useToast();
  const { can } = useSession();
  const [status, setStatus] = useState('Pending');
  const { data, loading, error, reload } = useRpc<any[]>('lab.queue', { status });
  const [deciding, setDeciding] = useState<{ row: any; result: 'Passed' | 'Rejected' } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const decide = async () => {
    if (!deciding) return;
    setBusy(true);
    try {
      toast.success(await rpc<string>('lab.set', { docno: deciding.row.docno, result: deciding.result, remarks }));
      setDeciding(null);
      setRemarks('');
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequireRight form="087">
      <PageHeader title="Lab Monitoring" description="Raw materials and produced lots wait here for quality inspection. Passing a lot makes it available for production and delivery; rejected lots stay blocked." />
      <Card padded={false}>
        <div className="px-4 pt-2">
          <Tabs
            tabs={[
              { id: 'Pending', label: 'Waiting for results' },
              { id: 'Passed', label: 'Passed' },
              { id: 'Rejected', label: 'Rejected' },
              { id: 'all', label: 'All' },
            ]}
            value={status}
            onChange={setStatus}
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
            rows={data ?? []}
            rowKey={(r) => `${r.docno}-${r.lotno}`}
            empty={<EmptyState icon={FlaskConical} title={status === 'Pending' ? 'Nothing waiting for inspection' : 'No lots in this list'} />}
            columns={[
              {
                key: 'docno',
                header: 'Receipt',
                render: (r) =>
                  r.source === 'Receiving' ? (
                    <Link href={`/dashboard/doc/mmrr/${encodeURIComponent(r.docno)}`} className="font-mono text-[13px] text-brand-700 hover:underline dark:text-brand-400">
                      {r.docno}
                    </Link>
                  ) : (
                    <span className="font-mono text-[13px]">{r.docno}</span>
                  ),
              },
              { key: 'transdate', header: 'Received', render: (r) => fmtDate(r.transdate) },
              {
                key: 'mmdesc',
                header: 'Material',
                render: (r) => (
                  <div>
                    <div className="font-medium">{r.mmdesc}</div>
                    <div className="font-mono text-xs text-slate-500">
                      {r.codeno} · lot {r.lotno}
                    </div>
                  </div>
                ),
              },
              { key: 'venname', header: 'From', hideOnMobile: true },
              { key: 'qty', header: 'Quantity', align: 'right', render: (r) => `${fmtQty(r.qty)} ${r.um ?? ''}` },
              { key: 'days', header: 'Waiting', align: 'right', hideOnMobile: true, render: (r) => (r.labstat === 'Pending' ? <Badge tone={r.days > 3 ? 'warning' : 'neutral'}>{r.days} day(s)</Badge> : '') },
              {
                key: 'labstat',
                header: 'Result',
                sortable: false,
                render: (r) =>
                  r.labstat === 'Pending' && can('087', 2) ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" onClick={() => setDeciding({ row: r, result: 'Passed' })}>
                        Pass
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeciding({ row: r, result: 'Rejected' })}>
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Badge tone={r.labstat === 'Passed' ? 'success' : r.labstat === 'Rejected' ? 'danger' : 'warning'}>{r.labstat}</Badge>
                  ),
              },
            ]}
          />
        )}
      </Card>
      <Modal
        open={Boolean(deciding)}
        onClose={() => setDeciding(null)}
        title={deciding?.result === 'Passed' ? 'Pass this lot' : 'Reject this lot'}
        description={deciding ? `${deciding.row.mmdesc} · lot ${deciding.row.lotno} · receipt ${deciding.row.docno}` : ''}
        footer={
          <>
            <Button onClick={() => setDeciding(null)}>Cancel</Button>
            <Button variant={deciding?.result === 'Passed' ? 'primary' : 'danger'} loading={busy} onClick={decide}>
              {deciding?.result === 'Passed' ? 'Pass lot' : 'Reject lot'}
            </Button>
          </>
        }
      >
        <Field label="Inspection remarks" hint="Optional; kept on the receipt and in the audit trail.">
          <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder={deciding?.result === 'Passed' ? 'e.g. Assay within specification' : 'e.g. Moisture above limit'} />
        </Field>
      </Modal>
    </RequireRight>
  );
}
