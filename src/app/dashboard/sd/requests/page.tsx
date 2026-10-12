'use client';

import React, { useState } from 'react';
import { CheckCircle2, Inbox, XCircle } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight } from '@/components/shell/AppShell';
import { RequestCard } from '@/components/sales/RequestCard';
import { Alert, Button, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, Tabs, cx, useToast } from '@/components/ui/kit';
import { fmtMoney } from '@/shared/money';

export default function OrderRequestsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useRpc<any>('salesman.queue');
  const [tab, setTab] = useState('Requested');
  const [decide, setDecide] = useState<{ q: any; approve: boolean; plntno: string; note: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = (data?.rows ?? []).filter((q: any) => tab === 'all' || q.status === tab);
  const count = (s: string) => (data?.rows ?? []).filter((q: any) => q.status === s).length;

  const save = async () => {
    if (!decide) return;
    setBusy(true);
    try {
      toast.success(await rpc<string>('salesman.decide', { reqno: decide.q.reqno, approve: decide.approve, plntno: decide.plntno, note: decide.note }));
      setDecide(null);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequireRight form="077">
      <PageHeader eyebrow="Sales & Distribution" title="Order Requests" description="Requests sent by salesmen. Check the customer's credit, then turn the request into a sales order or send it back with a reason." />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        <div className="grid gap-5">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'Requested', label: 'Waiting', count: count('Requested') },
              { id: 'Approved', label: 'Approved', count: count('Approved') },
              { id: 'Rejected', label: 'Rejected', count: count('Rejected') },
              { id: 'all', label: 'All', count: data.rows.length },
            ]}
          />
          {!rows.length ? (
            <EmptyState icon={Inbox} title="Nothing here" text={tab === 'Requested' ? 'No order request is waiting for you.' : undefined} />
          ) : (
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))]">
              {rows.map((q: any) => (
                <RequestCard key={q.reqno} q={q}>
                  {q.exposure && (
                    <div className={cx('mt-3 rounded-xl px-3 py-2 text-[12px]', q.exposure.over > 0 || q.exposure.overdue > 0 ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300')}>
                      Open A/R {fmtMoney(q.exposure.openAr)}
                      {q.exposure.overdue > 0 && `, ${fmtMoney(q.exposure.overdue)} overdue`}
                      {q.exposure.limit ? (q.exposure.over > 0 ? ` · ${fmtMoney(q.exposure.over)} over the limit with this order` : ` · within the ${fmtMoney(q.exposure.limit)} limit`) : ' · no credit limit'}
                    </div>
                  )}
                  {data.canDecide && q.status === 'Requested' && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => setDecide({ q, approve: true, plntno: data.plants[0]?.value ?? '', note: '' })}>
                        Make sales order
                      </Button>
                      <Button size="sm" variant="ghost" icon={XCircle} onClick={() => setDecide({ q, approve: false, plntno: '', note: '' })}>
                        Reject
                      </Button>
                    </div>
                  )}
                </RequestCard>
              ))}
            </div>
          )}
        </div>
      )}
      <Modal
        open={Boolean(decide)}
        onClose={() => setDecide(null)}
        title={decide?.approve ? `Make a sales order from ${decide?.q.reqno}` : `Reject ${decide?.q.reqno}`}
        description={decide?.approve ? 'The sales order is created in Open status and then goes through the usual credit approval.' : 'The salesman sees your reason on the request.'}
        footer={
          <>
            <Button onClick={() => setDecide(null)}>Cancel</Button>
            <Button variant={decide?.approve ? 'primary' : 'danger'} loading={busy} disabled={decide ? (decide.approve ? !decide.plntno : !decide.note.trim()) : true} onClick={save}>
              {decide?.approve ? 'Create sales order' : 'Reject request'}
            </Button>
          </>
        }
      >
        {decide &&
          (decide.approve ? (
            <Field label="Deliver from plant" required>
              <Select value={decide.plntno} onChange={(e) => setDecide({ ...decide, plntno: e.target.value })} options={data?.plants ?? []} />
            </Field>
          ) : (
            <Field label="Reason" required>
              <Input value={decide.note} onChange={(e) => setDecide({ ...decide, note: e.target.value })} placeholder="e.g. customer is over the credit limit" />
            </Field>
          ))}
      </Modal>
    </RequireRight>
  );
}
