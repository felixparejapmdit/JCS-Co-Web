'use client';

import React, { useState } from 'react';
import { Globe2, Lock, LogIn, ShieldAlert, TriangleAlert, Users } from 'lucide-react';
import Link from 'next/link';
import { useRpc } from '@/lib/api';
import { addDays, today } from '@/shared/dates';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Card, EmptyState, PageHeader, Segmented, Spinner, Stat } from '@/components/ui/kit';
import { LogFilter, LogFilters, downloadCsv } from '@/components/logs/LogFilters';
import type { StatusTone } from '@/shared/codes';

interface Row {
  when: string;
  user: string;
  outcome: string;
  result: string;
  failed: boolean;
  detail: string;
  ip: string;
  device: string;
  userAgent: string;
  flag: string;
}

interface Data {
  ready: boolean;
  rows: Row[];
  capped: boolean;
  summary: { signIns: number; failed: number; users: number; addresses: number; flagged: number };
  locked: { username: string; name: string }[];
}

const TONE: Record<string, StatusTone> = {
  success: 'success',
  signed_out: 'neutral',
  wrong_password: 'warning',
  unknown_user: 'warning',
  rate_limited: 'danger',
  locked: 'danger',
  locked_out: 'danger',
  inactive: 'neutral',
  maintenance: 'info',
};

export default function SignInLogPage() {
  const [f, setF] = useState<LogFilter>({ from: addDays(today(), -7), to: today(), user: '', q: '' });
  const [outcome, setOutcome] = useState('all');
  const { data, loading, error } = useRpc<Data>('logs.signins', { ...f, outcome });
  const rows = data?.rows ?? [];
  const s = data?.summary;

  const exportCsv = () =>
    downloadCsv(
      `sign-in-log-${f.from}-${f.to}.csv`,
      ['When', 'Username', 'Result', 'Warning', 'IP address', 'Device', 'Detail', 'User agent'],
      rows.map((r) => [r.when, r.user, r.result, r.flag, r.ip, r.device, r.detail, r.userAgent])
    );

  return (
    <RequireRight form="001">
      <PageHeader title="Sign-in Log" description="Every sign-in to this company, successful or not, with the address and browser it came from. Repeated failures and sign-ins from a new address are marked. Entries are kept for 12 months." />
      {data && !data.ready && (
        <div className="mb-4">
          <Alert tone="warning" title="The sign-in log table is not in this database yet">
            Run <code className="font-mono">database/mysql/004_ng_signin_log.sql</code> in the company database. It only adds a new table, and sign-ins are recorded from then on.
          </Alert>
        </div>
      )}
      {s && (
        <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat label="Sign-ins" value={s.signIns} sub={`${s.users} different user${s.users === 1 ? '' : 's'}`} icon={LogIn} tone="emerald" />
          <Stat label="Failed attempts" value={s.failed} sub="Wrong password, unknown user, locked, too many tries" icon={TriangleAlert} tone={s.failed ? 'amber' : 'slate'} />
          <Stat label="Marked for attention" value={s.flagged} sub="New address, or 3 failures within 15 minutes" icon={ShieldAlert} tone={s.flagged ? 'rose' : 'slate'} />
          <Stat label="IP addresses" value={s.addresses} sub="Different addresses in the period" icon={Globe2} tone="sky" />
        </div>
      )}
      {data?.locked.length ? (
        <div className="mb-4">
          <Alert tone="danger" title={`${data.locked.length} account${data.locked.length === 1 ? ' is' : 's are'} locked`}>
            {data.locked.map((u) => `${u.name} (${u.username})`).join(', ')}. Unlock {data.locked.length === 1 ? 'it' : 'them'} with a new temporary password in{' '}
            <Link href="/dashboard/admin/users" className="font-medium underline">
              Users
            </Link>
            .
          </Alert>
        </div>
      ) : null}
      <Card padded={false}>
        <LogFilters
          value={f}
          onChange={setF}
          placeholder="User, address or browser…"
          onExport={exportCsv}
          exportDisabled={!rows.length}
          extra={
            <Segmented
              value={outcome}
              onChange={setOutcome}
              options={[
                { value: 'all', label: 'All' },
                { value: 'success', label: 'Signed in' },
                { value: 'failed', label: 'Failed' },
                { value: 'signed_out', label: 'Signed out' },
              ]}
            />
          }
        />
        {data?.capped && <div className="px-4 pt-3"><Alert tone="info">Showing the latest 1,000 entries. Narrow the period or pick a user to see older ones.</Alert></div>}
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4"><Alert tone="danger">{error}</Alert></div>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r, i) => `${r.when}-${r.user}-${i}`}
            pageSize={30}
            empty={<EmptyState icon={Users} title="No sign-ins in this period" text="Change the dates or the filters above." />}
            columns={[
              { key: 'when', header: 'When', card: 'meta' },
              { key: 'user', header: 'Username', card: 'title', render: (r) => <span className="font-mono text-[13px] font-semibold">{r.user}</span> },
              {
                key: 'result',
                header: 'Result',
                card: 'badge',
                render: (r) => (
                  <Badge tone={TONE[r.outcome] ?? 'neutral'}>
                    {(r.outcome === 'locked' || r.outcome === 'locked_out') && <Lock className="mr-1 inline h-3 w-3" />}
                    {r.result}
                  </Badge>
                ),
              },
              { key: 'flag', header: 'Warning', card: 'subtitle', render: (r) => (r.flag ? <span className="inline-flex items-center gap-1 text-[13px] font-medium text-rose-600 dark:text-rose-400"><ShieldAlert className="h-3.5 w-3.5" />{r.flag}</span> : r.detail ? <span className="text-[13px] text-slate-500">{r.detail}</span> : '') },
              { key: 'ip', header: 'IP address', card: 'meta', render: (r) => <span className="font-mono text-[12px]">{r.ip || '—'}</span> },
              { key: 'device', header: 'Device', hideOnMobile: true, card: 'meta', render: (r) => <span title={r.userAgent}>{r.device || '—'}</span> },
            ]}
          />
        )}
      </Card>
    </RequireRight>
  );
}
