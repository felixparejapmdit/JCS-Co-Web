'use client';

import React, { useState } from 'react';
import { History } from 'lucide-react';
import { useRpc } from '@/lib/api';
import { addDays, today } from '@/shared/dates';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Card, EmptyState, Modal, PageHeader, Select, Spinner } from '@/components/ui/kit';
import { LogFilter, LogFilters, downloadCsv } from '@/components/logs/LogFilters';

interface Change {
  field: string;
  before: string;
  after: string;
}

interface Row {
  when: string;
  user: string;
  ip: string;
  table: string;
  record: string;
  docno: string;
  action: string;
  kind: 'Created' | 'Changed' | 'Deleted' | 'Action';
  changes: Change[];
}

const KIND_TONE = { Created: 'success', Changed: 'info', Deleted: 'danger', Action: 'neutral' } as const;

/** Names for the legacy columns people meet most; any other column is spelled out from its name. */
const FIELD_NAMES: Record<string, string> = {
  ug_code: 'Group code', ug_name: 'Group name', ug_notes: 'Description',
  username: 'Username', userfullname: 'Full name', usergroup: 'User group', useremailaddress: 'E-mail', usertelno: 'Phone',
  userloc: 'Location', empno: 'Employee no.', stat: 'Status', idstat: 'Sign-in status', pdate: 'Password set on',
  status: 'Status', transdate: 'Date', remarks: 'Remarks', custno: 'Customer', venno: 'Vendor', plntno: 'Plant',
  bussname: 'Name', address: 'Address', tin: 'TIN', creditlimit: 'Credit limit', terms: 'Terms', smnno: 'Salesman', areano: 'Area',
  acctno: 'Account', acctdesc: 'Account name', ccno: 'Cost center', netamt: 'Net amount', vat: 'VAT', amount: 'Amount',
  approvedby: 'Approved by', postedby: 'Posted by', preparedby: 'Prepared by', apppostdate: 'Approved on', postdate: 'Posted on',
};

/** A column name as a person would say it: "credit_limit" → "Credit limit", "a.b" → "A › b". */
const fieldLabel = (f: string) => FIELD_NAMES[f] ?? f.replace(/_/g, ' ').replace(/\./g, ' › ').replace(/^./, (c) => c.toUpperCase());

function Value({ v, tone }: { v: string; tone: 'old' | 'new' }) {
  if (!v) return <span className="italic text-slate-400">empty</span>;
  return <span className={tone === 'old' ? 'text-rose-700 line-through decoration-rose-400/60 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}>{v.length > 140 ? `${v.slice(0, 140)}…` : v}</span>;
}

export default function ChangeHistoryPage() {
  const [f, setF] = useState<LogFilter>({ from: addDays(today(), -30), to: today(), user: '', q: '' });
  const [table, setTable] = useState('');
  const [open, setOpen] = useState<Row | null>(null);
  const { data, loading, error } = useRpc<{ rows: Row[]; tables: { value: string; label: string }[]; capped: boolean }>('logs.changes', { ...f, table });
  const rows = data?.rows ?? [];

  const exportCsv = () =>
    downloadCsv(
      `change-history-${f.from}-${f.to}.csv`,
      ['When', 'User', 'Record', 'Key', 'Action', 'Field', 'Before', 'After', 'From'],
      rows.flatMap((r) => (r.changes.length ? r.changes : [{ field: '', before: '', after: '' }]).map((c) => [r.when, r.user, r.record, r.docno, r.action, c.field, c.before, c.after, r.ip]))
    );

  return (
    <RequireRight form="001">
      <PageHeader title="Change History" description="What each change did to a record, field by field: the value before and after, who changed it and when. Covers users, groups, master data, settings and document actions that keep a snapshot." />
      <Card padded={false}>
        <LogFilters
          value={f}
          onChange={setF}
          placeholder="Record, field or value…"
          onExport={exportCsv}
          exportDisabled={!rows.length}
          extra={<Select aria-label="Record type" className="w-full sm:w-48" value={table} onChange={(e) => setTable(e.target.value)} placeholder="Every record type" options={data?.tables ?? []} />}
        />
        {data?.capped && <div className="px-4 pt-3"><Alert tone="info">Showing the latest 1,000 changes. Narrow the period or pick a user to see older ones.</Alert></div>}
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4"><Alert tone="danger">{error}</Alert></div>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r, i) => `${r.when}-${r.docno}-${i}`}
            pageSize={30}
            onRowClick={setOpen}
            empty={<EmptyState icon={History} title="No changes in this period" text="Change the dates or the filters above." />}
            columns={[
              { key: 'when', header: 'When', card: 'meta' },
              { key: 'user', header: 'User', card: 'meta' },
              { key: 'record', header: 'Record', card: 'title', render: (r) => <span><span className="font-medium text-slate-900 dark:text-white">{r.record}</span> <span className="font-mono text-[12px] text-slate-500">{r.docno}</span></span> },
              { key: 'kind', header: 'Change', card: 'badge', render: (r) => <Badge tone={KIND_TONE[r.kind]}>{r.kind}</Badge> },
              {
                key: 'changes',
                header: 'Fields',
                card: 'subtitle',
                render: (r) =>
                  r.kind === 'Changed' ? (
                    <span className="text-[13px] text-slate-600 dark:text-slate-300">
                      {r.changes.slice(0, 3).map((c) => fieldLabel(c.field)).join(', ')}
                      {r.changes.length > 3 && <span className="text-slate-400"> +{r.changes.length - 3} more</span>}
                      {!r.changes.length && <span className="text-slate-400">no field changed</span>}
                    </span>
                  ) : (
                    <span className="text-[13px] text-slate-500">{r.action}</span>
                  ),
              },
              { key: 'ip', header: 'From', hideOnMobile: true, card: 'hide' },
            ]}
          />
        )}
      </Card>

      <Modal side size="lg" open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.record} ${open.docno}` : ''} description={open ? `${open.action} · ${open.user} · ${open.when}${open.ip ? ` · from ${open.ip}` : ''}` : undefined}>
        {open && (
          <div className="space-y-3">
            <Badge tone={KIND_TONE[open.kind]}>{open.kind}</Badge>
            {open.kind === 'Action' && <p className="text-sm text-slate-500">Logged before Cloud AOS kept the record after an action; this is the record as it was before.</p>}
            {open.changes.length ? (
              <div className="overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
                <table className="w-full text-sm">
                  <thead className="bg-black/[0.03] text-left text-[11px] uppercase tracking-[0.1em] text-slate-500 dark:bg-white/[0.04]">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Field</th>
                      <th className="px-3 py-2 font-semibold">Before</th>
                      {open.kind !== 'Action' && <th className="px-3 py-2 font-semibold">After</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {open.changes.map((c) => (
                      <tr key={c.field} className="border-t border-black/[0.05] align-top dark:border-white/[0.06]">
                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{fieldLabel(c.field)}</td>
                        <td className="break-words px-3 py-2">{open.kind === 'Created' ? <span className="text-slate-400">—</span> : <Value v={c.before} tone="old" />}</td>
                        {open.kind !== 'Action' && <td className="break-words px-3 py-2">{open.kind === 'Deleted' ? <span className="text-slate-400">—</span> : <Value v={c.after} tone="new" />}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">The record was saved without any field changing.</p>
            )}
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
