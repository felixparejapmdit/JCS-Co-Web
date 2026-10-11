'use client';

import React, { useState } from 'react';
import { useRpc } from '@/lib/api';
import { addDays, today } from '@/shared/dates';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Card, Combobox, EmptyState, Field, Input, PageHeader, SearchInput, Spinner } from '@/components/ui/kit';

export default function AuditPage() {
  const [q, setQ] = useState('');
  const [user, setUser] = useState('');
  const [from, setFrom] = useState(addDays(today(), -30));
  const [to, setTo] = useState(today());
  const { data, loading, error } = useRpc<any[]>('admin.audit', { q, user, from, to });
  return (
    <RequireRight form="001">
      <PageHeader title="Audit Trail" description="Who did what, when and on which document. Every save, approval, posting, void and print is recorded, in the legacy translog and with before/after snapshots." />
      <Card padded={false}>
        <div className="grid gap-3 border-b border-slate-100 p-4 dark:border-[#1e2a44] md:grid-cols-4">
          <SearchInput value={q} onChange={setQ} placeholder="Document or action…" />
          <Combobox lookup="users" value={user} onChange={setUser} placeholder="Any user" />
          <Field>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4"><Alert tone="danger">{error}</Alert></div>
        ) : (
          <DataTable
            rows={data ?? []}
            rowKey={(r, i) => `${r.datetimelog}-${i}`}
            pageSize={30}
            empty={<EmptyState title="No activity found" />}
            columns={[
              { key: 'datetimelog', header: 'When' },
              { key: 'user', header: 'User' },
              { key: 'trans', header: 'Action' },
              { key: 'docno', header: 'Document', render: (r) => <span className="font-mono text-[13px]">{r.docno}</span> },
              { key: 'form', header: 'Form', hideOnMobile: true },
              { key: 'pcipadd', header: 'From', hideOnMobile: true },
            ]}
          />
        )}
      </Card>
    </RequireRight>
  );
}
