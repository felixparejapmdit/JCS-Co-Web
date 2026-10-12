'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Clock, FileUp, ListChecks, UserX } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Button, Card, Field, PageHeader, Select, Spinner, Stat, Textarea, cx, useToast } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';

/** Biometric export: employee no., date (YYYY-MM-DD), time in, time out; tab, comma or semicolon separated. */
function parse(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(/\t|,|;/).map((x) => x.trim()))
    .filter((c) => c[0] && !/^emp/i.test(c[0]))
    .map(([empno, transdate, timein, timeout]) => ({ empno, transdate, timein: timein ?? '', timeout: timeout ?? '' }));
}

export default function DtrPage() {
  const toast = useToast();
  const { can } = useSession();
  const ids = useRpc<any>('pay.ids');
  const [payidno, setPayid] = useState('');
  useEffect(() => {
    if (!payidno && ids.data?.rows?.length) setPayid((ids.data.rows.find((r: any) => r.idstat === 'OPEN') ?? ids.data.rows[0]).payidno);
  }, [ids.data, payidno]);
  const summary = useRpc<any>(payidno ? 'dtr.summary' : null, { payidno }, [payidno]);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => parse(text), [text]);
  const open = summary.data?.period?.idstat === 'OPEN' && summary.data?.period?.paystat !== 'Posted';

  const call = async (op: string, args: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await rpc<any>(op, args);
      if (typeof r === 'string') {
        toast.success(r);
        await summary.reload();
      }
      return r;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const s = summary.data;
  const good = preview?.filter((p) => p.ok).length ?? 0;

  return (
    <RequireRight form="301">
      <PageHeader eyebrow="HR & Payroll" title="DTR Upload" description="Load the time records exported from the biometric or time-keeping system. Lates and undertime against the 8:00–17:00 shift and absences are summed per employee, then applied to the payroll's attendance." />
      <div className="grid gap-6">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Payroll ID" className="w-full sm:w-80">
            <Select value={payidno} onChange={(e) => (setPayid(e.target.value), setPreview(null))} options={(ids.data?.rows ?? []).map((r: any) => ({ value: r.payidno, label: `${r.payidno} · ${r.paytype} · ${fmtDate(r.pdatefr)}–${fmtDate(r.pdateto)}${r.idstat === 'OPEN' ? '' : ' (closed)'}` }))} />
          </Field>
          {s && !open && <Badge tone="neutral">This payroll ID is closed; reopen it in Payroll IDs to change its attendance.</Badge>}
        </div>

        {summary.loading && !s ? (
          <Spinner />
        ) : summary.error ? (
          <Alert tone="danger">{summary.error}</Alert>
        ) : (
          s && (
            <>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
                <Stat label="DTR lines in the period" icon={ListChecks} value={s.lines} sub={s.complete ? `${s.period.workdays} working day(s)` : `${s.daysSoFar} of ${s.period.workdays} working day(s) so far`} />
                <Stat label="Employees with records" icon={Clock} tone="emerald" value={`${s.rows.filter((r: any) => r.records).length} of ${s.rows.length}`} />
                <Stat label={s.complete ? 'Absent days' : 'Absent days so far'} icon={UserX} tone="amber" value={s.rows.reduce((a: number, r: any) => a + r.absentDays, 0)} sub={`${s.rows.reduce((a: number, r: any) => a + r.lateHrs, 0).toFixed(2)} late / undertime hours`} />
              </div>

              {can('301', 3) && open && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <Card title="Paste the DTR export" subtitle="Columns: employee no., date (YYYY-MM-DD), time in, time out. A header row is skipped." icon={FileUp}>
                    <Textarea rows={9} className="font-mono text-[13px]" value={text} onChange={(e) => (setText(e.target.value), setPreview(null))} placeholder={'E001\t2026-10-01\t07:58\t17:05\nE002\t2026-10-01\t08:20\t17:00'} />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500">{rows.length} line(s) read</span>
                      <Button className="ml-auto" loading={busy} disabled={!rows.length} onClick={async () => setPreview(await call('dtr.preview', { payidno, rows }))}>
                        Check
                      </Button>
                      <Button variant="primary" loading={busy} disabled={!good} onClick={async () => (await call('dtr.upload', { payidno, rows })) && (setText(''), setPreview(null))}>
                        Save {good || ''} line(s)
                      </Button>
                    </div>
                  </Card>
                  <Card title="Apply to attendance" subtitle="Sets each employee's absences and late / undertime hours from the DTR. Overtime, night differential and holiday hours stay as entered on the Payroll page.">
                    <Button variant="primary" disabled={!s.lines || !can('301', 2)} loading={busy} onClick={() => confirm('Replace the absences and lates of this payroll with the DTR totals?') && call('dtr.apply', { payidno })}>
                      Apply DTR to attendance
                    </Button>
                  </Card>
                </div>
              )}

              {preview && (
                <Card title="Checked lines">
                  <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]">
                    {preview.map((p) => (
                      <div key={p.line} className={cx('tile p-3 text-[13px]', !p.ok && 'border-rose-500/40')}>
                        <div className="flex justify-between gap-2">
                          <b className="truncate text-slate-900 dark:text-white">{p.name || p.empno}</b>
                          <span className="text-[11px] text-slate-400">#{p.line}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.transdate} · {p.timein || '—'} → {p.timeout || '—'}
                        </div>
                        {p.ok ? <div className="mt-1 text-xs">{p.absent ? 'Absent' : `Late ${p.late} h · undertime ${p.undertime} h`}</div> : <div className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{p.problem}</div>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <div className="glass overflow-hidden rounded-2xl">
                <DataTable
                  rows={s.rows}
                  rowKey={(r) => r.empno}
                  columns={[
                    { key: 'name', header: 'Employee', card: 'title' },
                    { key: 'ccno', header: 'Cost center', card: 'subtitle' },
                    { key: 'records', header: 'DTR days', align: 'right' },
                    { key: 'present', header: 'Present', align: 'right' },
                    { key: 'absentDays', header: 'Absent days', align: 'right', render: (r) => (r.absentDays ? <b className="text-amber-700 dark:text-amber-300">{r.absentDays}</b> : 0) },
                    { key: 'lateHrs', header: 'Late / UT hours', align: 'right', card: 'amount', render: (r) => r.lateHrs.toFixed(2) },
                  ]}
                />
              </div>
            </>
          )
        )}
      </div>
    </RequireRight>
  );
}
