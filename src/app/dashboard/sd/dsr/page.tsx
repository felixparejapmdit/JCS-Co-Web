'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Truck, Wallet, CreditCard, ClipboardCheck } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Button, Field, Input, Modal, PageHeader, Select, Spinner, Stat, StatusBadge, Tabs, useToast } from '@/components/ui/kit';
import { fmtDate, today } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';

export default function DsrListPage() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const { data, loading, error } = useRpc<any>('dsr.list', {}, []);
  const [form, setForm] = useState<{ smnno: string; transdate: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = (data?.rows ?? []).filter((r: any) => tab === 'all' || r.status === tab);
  const open = (data?.rows ?? []).filter((r: any) => r.status === 'OPEN');

  const create = async () => {
    if (!form) return;
    setBusy(true);
    try {
      const no = await rpc<string>('dsr.open', form);
      toast.success(`Report ${no} opened.`);
      router.push(`/dashboard/sd/dsr/${encodeURIComponent(no)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <RequireRight form="095">
      <PageHeader
        eyebrow="Sales & Distribution"
        title="Daily Sales Reports"
        description="Van and event sales, one report per salesman per day: load the van, invoice cash and charge sales, return what is left, count the van, then close the day."
        actions={
          data?.canCreate && (
            <Button variant="primary" icon={Plus} onClick={() => setForm({ smnno: data.salesmen.find((s: any) => !s.open)?.smnno ?? data.salesmen[0]?.smnno ?? '', transdate: today() })}>
              Open a report
            </Button>
          )
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="grid gap-6">
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
              <Stat label="Open reports" icon={ClipboardCheck} value={open.length} sub={open.map((r: any) => r.salesman).join(', ') || 'Every van is closed'} tone="amber" />
              <Stat label="Van salesmen" icon={Truck} value={data.salesmen.length} sub="Salesmen of type Event" />
              <Stat label="Cash sales, open reports" icon={Wallet} tone="emerald" value={fmtMoney(open.reduce((s: number, r: any) => s + r.cash, 0))} />
              <Stat label="Charge sales, open reports" icon={CreditCard} tone="blue" value={fmtMoney(open.reduce((s: number, r: any) => s + r.charge, 0))} />
            </div>
            <div className="glass overflow-hidden rounded-2xl">
              <div className="px-4 pt-4">
                <Tabs
                  value={tab}
                  onChange={setTab}
                  tabs={[
                    { id: 'all', label: 'All', count: data.rows.length },
                    { id: 'OPEN', label: 'Open', count: open.length },
                    { id: 'COMPLETED', label: 'Closed', count: data.rows.length - open.length },
                  ]}
                />
              </div>
              <DataTable
                rows={rows}
                rowKey={(r) => r.dsrno}
                rowHref={(r) => `/dashboard/sd/dsr/${encodeURIComponent(r.dsrno)}`}
                columns={[
                  { key: 'dsrno', header: 'DSR no.', card: 'title', render: (r) => <span className="font-mono text-[13px]">{r.dsrno}</span> },
                  { key: 'salesman', header: 'Salesman', card: 'subtitle' },
                  { key: 'transdate', header: 'Date', render: (r) => fmtDate(r.transdate) },
                  { key: 'invoices', header: 'Invoices', align: 'right' },
                  { key: 'cash', header: 'Cash', align: 'right', render: (r) => fmtMoney(r.cash) },
                  { key: 'charge', header: 'Charge', align: 'right', render: (r) => fmtMoney(r.charge) },
                  { key: 'total', header: 'Total', align: 'right', card: 'amount', render: (r) => <b>{fmtMoney(r.total)}</b> },
                  { key: 'status', header: 'Status', card: 'badge', render: (r) => <StatusBadge status={r.status === 'OPEN' ? 'Open' : 'Closed'} /> },
                ]}
              />
            </div>
          </div>
        )
      )}
      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title="Open a daily sales report"
        description="The van starts the day with the stock counted when the last report was closed."
        footer={
          <>
            <Button onClick={() => setForm(null)}>Cancel</Button>
            <Button variant="primary" loading={busy} disabled={!form?.smnno || !form?.transdate} onClick={create}>
              Open report
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Van salesman" required>
              <Select value={form.smnno} onChange={(e) => setForm({ ...form, smnno: e.target.value })} options={(data?.salesmen ?? []).map((s: any) => ({ value: s.smnno, label: `${s.fullname}${s.open ? ` (open: ${s.open})` : ''}` }))} />
            </Field>
            <Field label="Date" required>
              <Input type="date" value={form.transdate} onChange={(e) => setForm({ ...form, transdate: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
