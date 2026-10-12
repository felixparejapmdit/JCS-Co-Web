'use client';

import React, { useState } from 'react';
import { useRpc } from '@/lib/api';
import { addDays, fmtDate, today } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Card, Combobox, Field, Input, PageHeader, Spinner, Tabs } from '@/components/ui/kit';

function TrialBalance({ asOf, unposted, onPick }: { asOf: string; unposted: boolean; onPick: (acct: string) => void }) {
  const { data, loading, error } = useRpc<any>('report.trialBalance', { asOf, includeUnposted: unposted });
  if (loading && !data) return <Spinner />;
  if (error) return <div className="p-4"><Alert tone="danger">{error}</Alert></div>;
  return (
    <DataTable
      rows={data?.rows ?? []}
      rowKey={(r) => r.acctno}
      onRowClick={(r) => onPick(r.acctno)}
      pageSize={100}
      columns={[
        { key: 'acctno', header: 'Account', render: (r) => <span className="font-mono text-[13px]">{r.acctno}</span> },
        { key: 'acctdesc', header: 'Title' },
        { key: 'class', header: 'Class', hideOnMobile: true },
        { key: 'debit', header: 'Debit', align: 'right', render: (r) => (r.debit ? fmtMoney(r.debit) : '') },
        { key: 'credit', header: 'Credit', align: 'right', render: (r) => (r.credit ? fmtMoney(r.credit) : '') },
      ]}
      footer={
        <tr>
          <td className="px-4 py-3" colSpan={2}>
            Totals {Math.abs((data?.totalDebit ?? 0) - (data?.totalCredit ?? 0)) < 0.01 ? <Badge tone="success">Balanced</Badge> : <Badge tone="danger">Out of balance</Badge>}
          </td>
          <td className="hidden md:table-cell" />
          <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(data?.totalDebit)}</td>
          <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(data?.totalCredit)}</td>
        </tr>
      }
    />
  );
}

function Ledger({ acctno, from, to, unposted }: { acctno: string; from: string; to: string; unposted: boolean }) {
  const { data, loading, error } = useRpc<any>(acctno ? 'report.ledger' : null, { acctno, from, to, includeUnposted: unposted });
  if (!acctno) return <p className="p-5 text-sm text-slate-500">Choose an account, or click an account in the trial balance.</p>;
  if (loading && !data) return <Spinner />;
  if (error) return <div className="p-4"><Alert tone="danger">{error}</Alert></div>;
  return (
    <div>
      <div className="flex flex-wrap gap-6 border-b border-slate-100 px-5 py-3 text-sm dark:border-white/[0.07]">
        <span>
          Opening balance <strong className="tabular-nums">{fmtMoney(data.opening)}</strong>
        </span>
        <span>
          Closing balance <strong className="tabular-nums">{fmtMoney(data.closing)}</strong>
        </span>
      </div>
      <DataTable
        rows={data.rows}
        rowKey={(r, i) => `${r.docno}-${i}`}
        pageSize={50}
        columns={[
          { key: 'transdate', header: 'Date', render: (r) => fmtDate(r.transdate) },
          { key: 'docno', header: 'Document', render: (r) => <span className="font-mono text-[13px]">{r.docno}</span> },
          { key: 'source', header: 'Source', hideOnMobile: true },
          { key: 'ccno', header: 'Cost center', hideOnMobile: true },
          { key: 'dramt', header: 'Debit', align: 'right', render: (r) => (r.dramt ? fmtMoney(r.dramt) : '') },
          { key: 'cramt', header: 'Credit', align: 'right', render: (r) => (r.cramt ? fmtMoney(r.cramt) : '') },
          { key: 'balance', header: 'Balance', align: 'right', render: (r) => <span className="font-semibold">{fmtMoney(r.balance)}</span> },
          { key: 'glstatus', header: '', render: (r) => (r.glstatus === 'OPEN' ? <Badge tone="warning">Not yet posted</Badge> : '') },
        ]}
      />
    </div>
  );
}

export default function GlReportsPage() {
  const [tab, setTab] = useState('tb');
  const [asOf, setAsOf] = useState(today());
  const [from, setFrom] = useState(addDays(today(), -60));
  const [unposted, setUnposted] = useState(false);
  const [acct, setAcct] = useState('');
  return (
    <RequireRight form="052">
      <PageHeader title="GL Reports" description="Trial balance and account ledgers straight from the general ledger. Click an account to see every entry behind its balance." />
      <Card padded={false}>
        <div className="flex flex-col gap-4 px-4 pt-2 lg:flex-row lg:items-end lg:justify-between">
          <Tabs
            tabs={[
              { id: 'tb', label: 'Trial balance' },
              { id: 'ledger', label: 'Account ledger' },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className="flex flex-wrap items-end gap-3 pb-3">
            {tab === 'ledger' && (
              <>
                <Field label="Account" className="w-72">
                  <Combobox lookup="accounts" value={acct} onChange={setAcct} />
                </Field>
                <Field label="From">
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </Field>
              </>
            )}
            <Field label={tab === 'tb' ? 'As of' : 'To'}>
              <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
            </Field>
            <label className="flex h-9 items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={unposted} onChange={(e) => setUnposted(e.target.checked)} />
              Include entries not yet posted
            </label>
          </div>
        </div>
        {tab === 'tb' ? (
          <TrialBalance
            asOf={asOf}
            unposted={unposted}
            onPick={(a) => {
              setAcct(a);
              setTab('ledger');
            }}
          />
        ) : (
          <Ledger acctno={acct} from={from} to={asOf} unposted={unposted} />
        )}
      </Card>
    </RequireRight>
  );
}
