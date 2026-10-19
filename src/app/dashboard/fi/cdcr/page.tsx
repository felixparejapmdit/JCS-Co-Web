'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Landmark, ListChecks } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { fmtDate, today } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Button, Card, Combobox, EmptyState, Field, Input, Modal, PageHeader, Spinner, StatusBadge, useToast } from '@/components/ui/kit';

export default function CdcrPage() {
  const toast = useToast();
  const { can } = useSession();
  const [asOf, setAsOf] = useState(today());
  const cand = useRpc<any[]>('cdcr.candidates', { asOf });
  const list = useRpc<any[]>('cdcr.list');
  const deps = useRpc<any[]>('deposit.list');
  const [busy, setBusy] = useState(false);
  const [deposit, setDeposit] = useState<{ cdcrnos: string[]; acctno: string; transdate: string } | null>(null);
  const [open, setOpen] = useState<any | null>(null);

  const ready = (cand.data ?? []).filter((c) => !c.pdcHeld);
  const held = (cand.data ?? []).filter((c) => c.pdcHeld);
  const reloadAll = () => {
    cand.reload();
    list.reload();
    deps.reload();
  };

  const generate = async () => {
    setBusy(true);
    try {
      const r = await rpc<{ message: string }>('cdcr.generate', { asOf });
      toast.success(r.message);
      reloadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const doDeposit = async () => {
    if (!deposit) return;
    setBusy(true);
    try {
      const r = await rpc<{ message: string }>('deposit.create', deposit);
      toast.success(r.message);
      setDeposit(null);
      reloadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const openCdcrs = (list.data ?? []).filter((c) => c.status === 'Open');
  // The three lists load together; show the page once all have arrived, so no card pushes another down.
  const firstLoad = [cand, list, deps].some((r) => r.loading && !r.data);

  return (
    <RequireRight form="011">
      <PageHeader
        title="CDCR & Bank Deposits"
        description="At the end of the day, prepare the Cashier's Daily Collection Report in one click. It totals cash, cheques and online payments for you. Post-dated cheques wait until their date. Then record the bank deposit."
      />
      {firstLoad ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          <Card
            title="Collections not yet in a CDCR"
            subtitle={`${ready.length} receipt(s) ready${held.length ? `, ${held.length} post-dated cheque(s) held` : ''}`}
            actions={
              can('011', 3) && (
                <div className="flex items-end gap-2">
                  <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="w-40" />
                  <Button variant="primary" icon={ListChecks} loading={busy} disabled={!ready.length} onClick={generate}>
                    Prepare CDCR
                  </Button>
                </div>
              )
            }
            padded={false}
          >
            <DataTable
              rows={cand.data ?? []}
              rowKey={(r) => r.orno}
              rowHref={(r) => `/dashboard/doc/or/${encodeURIComponent(r.orno)}`}
              empty={<EmptyState title="Nothing to report" text="All posted receipts are already in a CDCR." />}
              columns={[
                { key: 'orno', header: 'OR no.', render: (r) => <span className="font-mono text-[13px]">{r.orno}</span> },
                { key: 'transdate', header: 'Date', render: (r) => fmtDate(r.transdate) },
                { key: 'bussname', header: 'Customer' },
                { key: 'coltype', header: 'Tender' },
                { key: 'chno', header: 'Cheque', hideOnMobile: true, render: (r) => (r.chno ? `${r.bank} #${r.chno}` : '') },
                { key: 'colamt', header: 'Amount', align: 'right', render: (r) => fmtMoney(r.colamt) },
                { key: 'pdcHeld', header: '', render: (r) => (r.pdcHeld ? <Badge tone="warning">PDC dated {fmtDate(r.pdate)}</Badge> : '') },
              ]}
            />
          </Card>

          <Card
            title="Daily collection reports"
            actions={
              can('011', 5) &&
              openCdcrs.length > 0 && (
                <Button icon={Landmark} onClick={() => setDeposit({ cdcrnos: openCdcrs.map((c) => c.cdcrno), acctno: '', transdate: today() })}>
                  Deposit open CDCRs
                </Button>
              )
            }
            padded={false}
          >
            <DataTable
              rows={list.data ?? []}
              rowKey={(r) => r.cdcrno}
              onRowClick={setOpen}
              empty={<EmptyState title="No CDCR prepared yet" />}
              columns={[
                { key: 'cdcrno', header: 'CDCR no.', render: (r) => <span className="font-mono text-[13px]">{r.cdcrno}</span> },
                { key: 'transdate', header: 'Date', render: (r) => fmtDate(r.transdate) },
                { key: 'cashamt', header: 'Cash', align: 'right', render: (r) => fmtMoney(r.cashamt) },
                { key: 'checkamt', header: 'Cheques', align: 'right', render: (r) => fmtMoney(r.checkamt) },
                { key: 'onlineamt', header: 'Online', align: 'right', hideOnMobile: true, render: (r) => fmtMoney(r.onlineamt) },
                { key: 'total', header: 'Total', align: 'right', render: (r) => <span className="font-semibold">{fmtMoney(r.total)}</span> },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              ]}
            />
          </Card>

          <Card title="Bank deposits" padded={false}>
            <DataTable
              rows={deps.data ?? []}
              rowKey={(r) => r.depno}
              empty={<EmptyState title="No deposits recorded yet" />}
              columns={[
                { key: 'depno', header: 'Deposit no.', render: (r) => <span className="font-mono text-[13px]">{r.depno}</span> },
                { key: 'transdate', header: 'Date', render: (r) => fmtDate(r.transdate) },
                { key: 'bank', header: 'Bank' },
                { key: 'cdcrs', header: 'CDCRs', render: (r) => r.cdcrs.join(', ') },
                { key: 'total', header: 'Amount', align: 'right', render: (r) => fmtMoney(r.total) },
              ]}
            />
          </Card>
        </div>
      )}

      <Modal
        open={Boolean(deposit)}
        onClose={() => setDeposit(null)}
        title="Record bank deposit"
        description={deposit ? `${deposit.cdcrnos.length} CDCR(s): ${deposit.cdcrnos.join(', ')}` : ''}
        footer={
          <>
            <Button onClick={() => setDeposit(null)}>Cancel</Button>
            <Button variant="primary" loading={busy} disabled={!deposit?.acctno} onClick={doDeposit}>
              Record deposit
            </Button>
          </>
        }
      >
        {deposit && (
          <div className="grid gap-4">
            <Field label="Deposited to" required>
              <Combobox lookup="banks" value={deposit.acctno} onChange={(v) => setDeposit({ ...deposit, acctno: v })} />
            </Field>
            <Field label="Deposit date" required>
              <Input type="date" value={deposit.transdate} onChange={(e) => setDeposit({ ...deposit, transdate: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={`CDCR ${open?.cdcrno ?? ''}`} description={open ? `${fmtDate(open.transdate)} · prepared by ${open.headcash}` : ''} size="lg">
        {open && (
          <div className="grid gap-2 sm:grid-cols-2">
            {open.receipts.map((r: any) => (
              <Link key={r.orno} href={`/dashboard/doc/or/${encodeURIComponent(r.orno)}`} className="tile-interactive flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{r.orno}</div>
                  <div className="truncate text-sm text-slate-600 dark:text-slate-300">{r.bussname}</div>
                  <div className="text-xs text-slate-500">{r.coltype === 'Check' ? `${r.bank} #${r.chno}` : r.coltype}</div>
                </div>
                <div className="text-right font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(r.colamt)}</div>
              </Link>
            ))}
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
