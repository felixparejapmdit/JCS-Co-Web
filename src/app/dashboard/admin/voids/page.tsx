'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ban } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, StatusBadge, useToast } from '@/components/ui/kit';

export default function VoidsPage() {
  const toast = useToast();
  const { can } = useSession();
  const { data, loading, error, reload } = useRpc<any>('admin.voids');
  const [req, setReq] = useState<any | null>(null);
  const [decision, setDecision] = useState<{ row: any; approve: boolean } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      toast.success(await rpc<string>('admin.requestVoid', req));
      setReq(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const decide = async () => {
    if (!decision) return;
    setBusy(true);
    try {
      toast.success(await rpc<string>('admin.decideVoid', { docno: decision.row.docno, tc: decision.row.tc, approve: decision.approve, note }));
      setDecision(null);
      setNote('');
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequireRight form="003">
      <PageHeader
        title="Void Requests"
        description="Ask for a document to be cancelled and let an approver decide. Approving a request voids the document and reverses its stock and accounting entries automatically."
        actions={can('003', 3) && <Button variant="primary" icon={Ban} onClick={() => setReq({ type: data?.voidable?.[0]?.type ?? 'si', docno: '', remarks: '' })}>Request a void</Button>}
      />
      <Card padded={false}>
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4"><Alert tone="danger">{error}</Alert></div>
        ) : (
          <DataTable
            rows={data?.rows ?? []}
            rowKey={(r, i) => `${r.docno}-${i}`}
            empty={<EmptyState title="No void requests" />}
            columns={[
              { key: 'transdate', header: 'Requested' },
              { key: 'document', header: 'Document', render: (r) => <div><div>{r.document}</div>{r.type ? <Link href={`/dashboard/doc/${r.type}/${encodeURIComponent(r.docno)}`} className="font-mono text-xs text-brand-700 hover:underline dark:text-brand-400">{r.docno}</Link> : <span className="font-mono text-xs">{r.docno}</span>}</div> },
              { key: 'user', header: 'By' },
              { key: 'remarks', header: 'Reason' },
              { key: 'reqstat', header: 'Status', render: (r) => <StatusBadge status={r.reqstat} /> },
              {
                key: 'act',
                header: '',
                sortable: false,
                render: (r) =>
                  r.reqstat === 'Pending' && data.canApprove ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="danger" onClick={() => setDecision({ row: r, approve: true })}>Void it</Button>
                      <Button size="sm" onClick={() => setDecision({ row: r, approve: false })}>Reject</Button>
                    </div>
                  ) : r.appby ? (
                    <span className="text-xs text-slate-500">by {r.appby}</span>
                  ) : (
                    <Badge tone="warning">Waiting</Badge>
                  ),
              },
            ]}
          />
        )}
      </Card>
      <Modal
        open={Boolean(req)}
        onClose={() => setReq(null)}
        title="Request a void"
        footer={
          <>
            <Button onClick={() => setReq(null)}>Cancel</Button>
            <Button variant="primary" loading={busy} onClick={submit}>Send request</Button>
          </>
        }
      >
        {req && (
          <div className="grid gap-4">
            <Field label="Document type" required>
              <Select value={req.type} onChange={(e) => setReq({ ...req, type: e.target.value })} options={(data?.voidable ?? []).map((v: any) => ({ value: v.type, label: v.title }))} />
            </Field>
            <Field label="Document number" required>
              <Input value={req.docno} onChange={(e) => setReq({ ...req, docno: e.target.value.toUpperCase() })} placeholder="e.g. SI-26-00012" />
            </Field>
            <Field label="Reason" required>
              <Input value={req.remarks} onChange={(e) => setReq({ ...req, remarks: e.target.value })} placeholder="e.g. Duplicate entry" />
            </Field>
          </div>
        )}
      </Modal>
      <Modal
        open={Boolean(decision)}
        onClose={() => setDecision(null)}
        title={decision?.approve ? `Void ${decision?.row.docno}?` : `Reject the request for ${decision?.row.docno}?`}
        description={decision?.approve ? 'The document is cancelled and its stock and accounting entries are reversed.' : 'The document stays as it is.'}
        footer={
          <>
            <Button onClick={() => setDecision(null)}>Cancel</Button>
            <Button variant={decision?.approve ? 'danger' : 'primary'} loading={busy} onClick={decide}>{decision?.approve ? 'Void document' : 'Reject request'}</Button>
          </>
        }
      >
        <Field label="Note (optional)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Modal>
    </RequireRight>
  );
}
