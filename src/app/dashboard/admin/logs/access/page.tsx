'use client';

import React, { useState } from 'react';
import { KeyRound, Minus, Plus, ShieldCheck, UserCog, UsersRound } from 'lucide-react';
import { useRpc } from '@/lib/api';
import { addDays, today } from '@/shared/dates';
import { RequireRight } from '@/components/shell/AppShell';
import { Alert, Card, EmptyState, ICON_TEXT, PageHeader, Segmented, Spinner, cx } from '@/components/ui/kit';
import { LogFilter, LogFilters, downloadCsv } from '@/components/logs/LogFilters';

interface Row {
  when: string;
  by: string;
  ip: string;
  subject: string;
  title: string;
  kind: 'rights' | 'group' | 'user' | 'apikey';
  added: string[];
  removed: string[];
  note: string;
}

const KIND = {
  rights: { label: 'Rights', icon: ShieldCheck, tone: 'violet' },
  group: { label: 'Group', icon: UsersRound, tone: 'indigo' },
  user: { label: 'User', icon: UserCog, tone: 'sky' },
  apikey: { label: 'API key', icon: KeyRound, tone: 'amber' },
} as const;

/** How many lines of a change show before "Show all". */
const SHORT = 6;

function Entry({ r }: { r: Row }) {
  const [all, setAll] = useState(false);
  const k = KIND[r.kind];
  const lines = [...r.added.map((t) => ({ t, on: true })), ...r.removed.map((t) => ({ t, on: false }))];
  const shown = all ? lines : lines.slice(0, SHORT);
  return (
    <li className="flex gap-3 px-4 py-3.5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
        <k.icon className={cx('h-4 w-4', ICON_TEXT[k.tone])} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{r.title}</p>
          <p className="text-xs tabular-nums text-slate-500">{r.when}</p>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          by <span className="font-medium text-slate-700 dark:text-slate-300">{r.by}</span>
          {r.ip && <> · from <span className="font-mono">{r.ip}</span></>}
          {(r.added.length > 0 || r.removed.length > 0) && (
            <>
              {' '}· <span className="text-emerald-600 dark:text-emerald-400">+{r.added.length} given</span>, <span className="text-rose-600 dark:text-rose-400">−{r.removed.length} taken away</span>
            </>
          )}
        </p>
        {r.note && <p className="mt-1.5 text-[13px] text-slate-600 dark:text-slate-300">{r.note}</p>}
        {lines.length > 0 && (
          <ul className="mt-2 space-y-1">
            {shown.map((l) => (
              <li key={`${l.on}-${l.t}`} className={cx('flex items-start gap-1.5 text-[13px]', l.on ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>
                {l.on ? <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                <span>{l.t}</span>
              </li>
            ))}
          </ul>
        )}
        {lines.length > SHORT && (
          <button type="button" onClick={() => setAll(!all)} className="mt-1.5 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300">
            {all ? 'Show fewer' : `Show all ${lines.length}`}
          </button>
        )}
      </div>
    </li>
  );
}

export default function AccessChangesPage() {
  const [f, setF] = useState<LogFilter>({ from: addDays(today(), -90), to: today(), user: '', q: '' });
  const [kind, setKind] = useState('all');
  const { data, loading, error } = useRpc<{ rows: Row[] }>('logs.access', { ...f, kind });
  const rows = data?.rows ?? [];
  const [limit, setLimit] = useState(50);

  const exportCsv = () =>
    downloadCsv(
      `access-changes-${f.from}-${f.to}.csv`,
      ['When', 'Changed by', 'Kind', 'Subject', 'Change', 'Given', 'Taken away', 'Note', 'From'],
      rows.map((r) => [r.when, r.by, KIND[r.kind].label, r.subject, r.title, r.added.join('; '), r.removed.join('; '), r.note, r.ip])
    );

  return (
    <RequireRight form="001">
      <PageHeader title="Access Changes" description="Who changed what people can do: rights given or taken away in the Access Matrix, groups added, renamed or deleted, users moved to another group, deactivated or unlocked, and API keys created or revoked." />
      <Card padded={false}>
        <LogFilters
          value={f}
          onChange={setF}
          placeholder="Group, user or right…"
          onExport={exportCsv}
          exportDisabled={!rows.length}
          extra={
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: 'all', label: 'All' },
                { value: 'rights', label: 'Rights' },
                { value: 'group', label: 'Groups' },
                { value: 'user', label: 'Users' },
                { value: 'apikey', label: 'API keys' },
              ]}
            />
          }
        />
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4"><Alert tone="danger">{error}</Alert></div>
        ) : !rows.length ? (
          <EmptyState icon={ShieldCheck} title="No access changes in this period" text="Change the dates or the filters above." />
        ) : (
          <>
            <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
              {rows.slice(0, limit).map((r, i) => (
                <Entry key={`${r.when}-${r.subject}-${i}`} r={r} />
              ))}
            </ul>
            {rows.length > limit && (
              <div className="border-t border-black/[0.05] p-3 text-center dark:border-white/[0.06]">
                <button type="button" onClick={() => setLimit(limit + 50)} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
                  Show more ({rows.length - limit} older)
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </RequireRight>
  );
}
