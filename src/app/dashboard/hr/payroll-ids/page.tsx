'use client';

import React, { useState } from 'react';
import { CalendarRange, Lock, LockOpen, Pencil, Trash2 } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight } from '@/components/shell/AppShell';
import { Alert, Badge, Button, EmptyState, Field, Input, Modal, NumberInput, PageHeader, Select, Spinner, StatusBadge, Tabs, cx, useToast } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';

export default function PayrollIdsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useRpc<any>('pay.ids');
  const [type, setType] = useState('all');
  const [edit, setEdit] = useState<any | null>(null);

  const run = async (op: string, args: Record<string, unknown>, ask?: string) => {
    if (ask && !confirm(ask)) return false;
    try {
      toast.success(await rpc<string>(op, args));
      await reload();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  const rows = (data?.rows ?? []).filter((r: any) => type === 'all' || r.paytype === type);
  const types = data ? data.payTypes.filter((t: string) => data.rows.some((r: any) => r.paytype === t)) : [];

  return (
    <RequireRight form="204">
      <PageHeader eyebrow="HR & Payroll" title="Payroll IDs" description="Payroll periods by pay type, numbered as in the legacy system (M, W, C, PR + period dates). Only one ID per pay type is open at a time; posting a payroll closes its ID." />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        <div className="grid gap-5">
          <Tabs value={type} onChange={setType} tabs={[{ id: 'all', label: 'All', count: data.rows.length }, ...types.map((t: string) => ({ id: t, label: t, count: data.rows.filter((r: any) => r.paytype === t).length }))]} />
          <p className="text-sm text-slate-500 dark:text-slate-400">New payroll IDs are created on the Payroll page.</p>
          {!rows.length ? (
            <EmptyState icon={CalendarRange} title="No payroll IDs" />
          ) : (
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
              {rows.map((p: any) => (
                <div key={p.payidno} className={cx('tile flex flex-col p-4', p.idstat === 'OPEN' && 'border-emerald-500/40')}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[15px] font-semibold text-slate-900 dark:text-white">{p.payidno}</div>
                      <div className="text-xs text-slate-500">
                        {p.paytype}
                        {p.payseq ? ` · ${p.payseq}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={p.idstat === 'OPEN' ? 'success' : 'neutral'}>{p.idstat === 'OPEN' ? 'Open' : 'Closed'}</Badge>
                      <StatusBadge status={p.paystat} />
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                    {fmtDate(p.pdatefr)} – {fmtDate(p.pdateto)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {p.workdays} working day(s) · {p.employees} employee(s)
                    {p.commdate1 ? ` · commission ${fmtDate(p.commdate1)}${p.commdate2 ? ` – ${fmtDate(p.commdate2)}` : ''}` : ''}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    {data.can.edit && p.idstat === 'OPEN' && p.paystat !== 'Posted' && (
                      <Button size="sm" icon={Pencil} onClick={() => setEdit({ payidno: p.payidno, payseq: p.payseq ?? '', workdays: p.workdays, commdate1: p.commdate1 ?? '', commdate2: p.commdate2 ?? '' })}>
                        Edit
                      </Button>
                    )}
                    {data.can.edit && p.paystat !== 'Posted' && (
                      <Button size="sm" icon={p.idstat === 'OPEN' ? Lock : LockOpen} onClick={() => run('pay.setIdStatus', { payidno: p.payidno, status: p.idstat === 'OPEN' ? 'CLOSE' : 'OPEN' })}>
                        {p.idstat === 'OPEN' ? 'Close' : 'Reopen'}
                      </Button>
                    )}
                    {data.can.del && !p.used && p.paystat !== 'Posted' && (
                      <Button size="sm" variant="ghost" icon={Trash2} onClick={() => run('pay.deleteId', { payidno: p.payidno }, `Delete payroll ID ${p.payidno}? It has no attendance or pay data yet.`)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={`Edit ${edit?.payidno}`} footer={<><Button onClick={() => setEdit(null)}>Cancel</Button><Button variant="primary" onClick={async () => (await run('pay.updateId', edit)) && setEdit(null)}>Save</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pay sequence">
              <Select value={edit.payseq} onChange={(e) => setEdit({ ...edit, payseq: e.target.value })} options={[{ value: '', label: '—' }, ...data.paySeqs.map((s: string) => ({ value: s, label: s }))]} />
            </Field>
            <Field label="Working days">
              <NumberInput decimals={0} value={edit.workdays} onValue={(v) => setEdit({ ...edit, workdays: v })} />
            </Field>
            <Field label="Commission from">
              <Input type="date" value={edit.commdate1} onChange={(e) => setEdit({ ...edit, commdate1: e.target.value })} />
            </Field>
            <Field label="Commission to">
              <Input type="date" value={edit.commdate2} onChange={(e) => setEdit({ ...edit, commdate2: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
