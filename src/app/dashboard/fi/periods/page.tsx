'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, LockOpen } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { today } from '@/shared/dates';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from '@/components/ui/kit';

export default function PeriodsPage() {
  const toast = useToast();
  const { can, refresh } = useSession();
  const thisYear = Number(today().slice(0, 4));
  const [year, setYear] = useState(thisYear);
  const { data, loading, error, reload } = useRpc<any[]>('gl.periods', { year });
  const [reopen, setReopen] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const canRelease = can('006', 5);

  const close = async (p: any) => {
    setBusy(p.label);
    try {
      toast.success(await rpc<string>('gl.close', { year: p.transyear, month: p.transmon }));
      reload();
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const doReopen = async () => {
    if (!reopen) return;
    setBusy(reopen.label);
    try {
      toast.success(await rpc<string>('gl.reopen', { year: reopen.transyear, month: reopen.transmon, reason }));
      setReopen(null);
      setReason('');
      reload();
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <RequireRight form="006">
      <PageHeader
        title="Period Closing"
        description="Close a month once everything in it is posted. The checks run automatically: unposted subledger entries and open journal vouchers must be cleared first. Closing a month opens the next one."
        actions={
          <Select
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
            options={[thisYear - 1, thisYear, thisYear + 1].map((y) => ({ value: String(y), label: String(y) }))}
            className="w-32"
          />
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(data ?? []).map((p) => {
            const open = p.monstat === 'OPEN';
            const blocked = open && (p.unposted > 0 || p.pendingJv > 0);
            return (
              <Card key={p.label} className={!p.exists ? 'opacity-60' : ''}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{p.label}</p>
                    <p className="text-xs text-slate-500">
                      {p.dfrom} to {p.dto}
                    </p>
                  </div>
                  {p.exists ? <Badge tone={open ? 'success' : 'neutral'}>{open ? 'Open' : 'Closed'}</Badge> : <Badge>Not opened</Badge>}
                </div>
                {p.exists && open && (
                  <ul className="mt-4 space-y-1.5 text-sm">
                    <li className={p.unposted ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}>
                      {p.unposted ? (
                        <Link href="/dashboard/fi/posting" className="underline">
                          {p.unposted} entries waiting for JV posting
                        </Link>
                      ) : (
                        'All subledger entries posted'
                      )}
                    </li>
                    <li className={p.pendingJv ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}>
                      {p.pendingJv ? (
                        <Link href="/dashboard/doc/jv?status=Open" className="underline">
                          {p.pendingJv} journal voucher(s) not yet posted
                        </Link>
                      ) : (
                        'No open journal vouchers'
                      )}
                    </li>
                  </ul>
                )}
                {p.reopened && <p className="mt-2 text-xs text-slate-500">Reopened before</p>}
                {canRelease && p.exists && (
                  <div className="mt-4">
                    {open ? (
                      <Button size="sm" variant={blocked ? 'secondary' : 'primary'} icon={Lock} disabled={blocked} loading={busy === p.label} onClick={() => close(p)} title={blocked ? 'Clear the items above first' : undefined}>
                        Close {p.label.split(' ')[0]}
                      </Button>
                    ) : (
                      <Button size="sm" icon={LockOpen} onClick={() => setReopen(p)}>
                        Reopen
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <Modal
        open={Boolean(reopen)}
        onClose={() => setReopen(null)}
        title={`Reopen ${reopen?.label ?? ''}`}
        description="Reopening lets people post into this month again. The reason is kept in the audit trail."
        footer={
          <>
            <Button onClick={() => setReopen(null)}>Cancel</Button>
            <Button variant="primary" loading={Boolean(busy)} disabled={!reason.trim()} onClick={doReopen}>
              Reopen period
            </Button>
          </>
        }
      >
        <Field label="Reason" required>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Late supplier invoice for September" />
        </Field>
      </Modal>
    </RequireRight>
  );
}
