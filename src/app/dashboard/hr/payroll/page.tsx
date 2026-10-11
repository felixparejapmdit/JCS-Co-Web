'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Plus, Printer, Send, Undo2 } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { addDays, fmtDate, monthEnd, parseIso, toIso, today } from '@/shared/dates';
import { fmtMoney, numToEng } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Button, Card, Combobox, EmptyState, Field, Input, Modal, NumberInput, PageHeader, Select, Spinner, StatusBadge, Tabs, useToast } from '@/components/ui/kit';

function nextPeriod(periods: any[]): { from: string; to: string } {
  const last = [...periods].sort((a, b) => String(b.pdateto).localeCompare(String(a.pdateto)))[0];
  const start = last ? addDays(String(last.pdateto), 1) : `${today().slice(0, 8)}01`;
  const d = parseIso(start);
  const to = d.getDate() <= 15 ? toIso(new Date(d.getFullYear(), d.getMonth(), 15)) : monthEnd(d.getFullYear(), d.getMonth() + 1);
  return { from: start, to };
}

function Attendance({ payidno, locked, onSaved }: { payidno: string; locked: boolean; onSaved: () => void }) {
  const toast = useToast();
  const { can } = useSession();
  const { data, loading, error } = useRpc<any>('pay.attendance', { payidno });
  const [rows, setRows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => setRows(data?.rows ?? []), [data]);
  if (loading && !data) return <Spinner />;
  if (error) return <Alert tone="danger">{error}</Alert>;
  const editable = !locked && can('301', 2);
  const set = (i: number, k: string, v: any) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, [k]: v === '' ? 0 : v } : x)));
  const save = async () => {
    setSaving(true);
    try {
      toast.success(await rpc<string>('pay.saveAttendance', { payidno, rows }));
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };
  const cols = [
    { key: 'absent_hrs', label: 'Absent (hrs)' },
    { key: 'late_dhrs', label: 'Late / undertime (hrs)' },
    { key: 'otime_dhrs', label: 'Overtime (hrs)' },
    { key: 'nightdiffhrs', label: 'Night diff. (hrs)' },
    { key: 'holidayhrs', label: 'Holiday (hrs)' },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">Everyone is paid for the full {data.period.workdays} working days. Enter only the exceptions: absences, lates, overtime, night differential and holiday work.</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#24324f]">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-[#24324f] dark:bg-white/[0.02]">
              <th className="px-3 py-2 text-left">Employee</th>
              {cols.map((c) => (
                <th key={c.key} className="px-3 py-2 text-right">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1a2540]">
            {rows.map((r, i) => (
              <tr key={r.empno}>
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-900 dark:text-white">{r.name}</div>
                  <div className="text-xs text-slate-500">
                    {r.empno} · {r.ccno}
                  </div>
                </td>
                {cols.map((c) => (
                  <td key={c.key} className="w-32 px-3 py-2">
                    {editable ? <NumberInput className="h-8" value={r[c.key] || ''} placeholder="0" onValue={(v) => set(i, c.key, v)} /> : <div className="text-right tabular-nums">{r[c.key] || ''}</div>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && (
        <div className="flex justify-end">
          <Button variant="primary" loading={saving} onClick={save}>
            Save attendance
          </Button>
        </div>
      )}
    </div>
  );
}

function Register({ payidno, onSlip }: { payidno: string; onSlip: (empno: string) => void }) {
  const { data, loading, error } = useRpc<any>('pay.register', { payidno });
  if (loading && !data) return <Spinner />;
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!data.rows.length) return <EmptyState icon={Calculator} title="Not computed yet" text="Compute the payroll to see the register and payslips." />;
  const cols = [
    { key: 'basic', label: 'Basic' },
    { key: 'deductionsForTime', label: 'Absences / lates' },
    { key: 'overtime', label: 'OT / ND / holiday' },
    { key: 'other', label: 'Allowance & adj.' },
    { key: 'gross', label: 'Gross' },
    { key: 'sss', label: 'SSS' },
    { key: 'phic', label: 'PhilHealth' },
    { key: 'hdmf', label: 'Pag-IBIG' },
    { key: 'tax', label: 'W/tax' },
    { key: 'loans', label: 'Loans' },
    { key: 'net', label: 'Net pay' },
  ];
  return (
    <DataTable
      rows={data.rows}
      rowKey={(r) => r.empno}
      onRowClick={(r) => onSlip(r.empno)}
      pageSize={50}
      columns={[{ key: 'name', header: 'Employee' }, ...cols.map((c) => ({ key: c.key, header: c.label, align: 'right' as const, hideOnMobile: !['gross', 'net'].includes(c.key), render: (r: any) => (c.key === 'net' ? <span className="font-semibold">{fmtMoney(r[c.key])}</span> : fmtMoney(r[c.key])) }))]}
      footer={
        <tr>
          <td className="px-4 py-3">Totals</td>
          {cols.map((c) => (
            <td key={c.key} className={`px-4 py-3 text-right tabular-nums ${['gross', 'net'].includes(c.key) ? '' : 'hidden md:table-cell'}`}>
              {fmtMoney(data.totals[c.key])}
            </td>
          ))}
        </tr>
      }
    />
  );
}

function Payslip({ payidno, empno, onClose }: { payidno: string; empno: string; onClose: () => void }) {
  const { info } = useSession();
  const { data, loading, error } = useRpc<any>('pay.payslip', { payidno, empno });
  const row = (label: string, value: number) => (
    <div className="flex justify-between py-1 text-sm">
      <span>{label}</span>
      <span className="tabular-nums">{fmtMoney(value)}</span>
    </div>
  );
  return (
    <Modal open onClose={onClose} title="Payslip" footer={<Button icon={Printer} onClick={() => window.print()}>Print payslip</Button>}>
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div id="print-area" className="space-y-4 text-slate-800 dark:text-slate-200">
            <div className="border-b border-slate-200 pb-3 dark:border-[#24324f]">
              <p className="font-bold">{info.legal.bussname}</p>
              <p className="text-xs text-slate-500">
                Payroll {payidno} · {fmtDate(data.period.pdatefr)} to {fmtDate(data.period.pdateto)}
              </p>
              <p className="mt-2 font-semibold">
                {data.slip.empname} <span className="text-xs font-normal text-slate-500">({empno})</span>
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Earnings</p>
                {row('Basic pay', Number(data.earnings.regtime_amt))}
                {Number(data.earnings.absent_amt) > 0 && row('Less absences', -Number(data.earnings.absent_amt))}
                {Number(data.earnings.late_amt) > 0 && row('Less lates / undertime', -Number(data.earnings.late_amt))}
                {Number(data.slip.otime_amt) > 0 && row('Overtime', Number(data.slip.otime_amt))}
                {Number(data.slip.nightdiffamt) > 0 && row('Night differential', Number(data.slip.nightdiffamt))}
                {Number(data.slip.holidayamt) > 0 && row('Holiday pay', Number(data.slip.holidayamt))}
                {Number(data.slip.othearn_amt) > 0 && row('Allowances & adjustments', Number(data.slip.othearn_amt))}
                <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-sm font-semibold dark:border-[#24324f]">
                  <span>Gross pay</span>
                  <span className="tabular-nums">{fmtMoney(Number(data.slip.totalearn))}</span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Deductions</p>
                {row('SSS', Number(data.deductions.sssprem))}
                {row('PhilHealth', Number(data.deductions.phprem))}
                {row('Pag-IBIG', Number(data.deductions.hdmfprem))}
                {row('Withholding tax', Number(data.deductions.taxdue))}
                {Number(data.deductions.otherdeduct) > 0 && row('Loans', Number(data.deductions.otherdeduct))}
                <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-sm font-semibold dark:border-[#24324f]">
                  <span>Total deductions</span>
                  <span className="tabular-nums">{fmtMoney(Number(data.deductions.totaldeduct))}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-teal-50 px-4 py-3 dark:bg-teal-500/10">
              <div className="flex justify-between text-lg font-bold">
                <span>Net pay</span>
                <span className="tabular-nums">₱{fmtMoney(Number(data.slip.netpay))}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{numToEng(Number(data.slip.netpay))}</p>
            </div>
          </div>
        )
      )}
    </Modal>
  );
}

function Adjustments({ payidno, locked, onChanged }: { payidno: string; locked: boolean; onChanged: () => void }) {
  const toast = useToast();
  const { can } = useSession();
  const { data, loading, error, reload } = useRpc<any[]>('pay.adjustments', { payidno });
  const [form, setForm] = useState<any>({ empno: '', adjtamt: '', taxopt: 'T', paycodeno: 'ADJ' });
  const [saving, setSaving] = useState(false);
  const add = async () => {
    setSaving(true);
    try {
      toast.success(await rpc<string>('pay.addAdjustment', { ...form, payidno }));
      setForm({ empno: '', adjtamt: '', taxopt: 'T', paycodeno: 'ADJ' });
      reload();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-4">
      {!locked && can('210', 3) && (
        <div className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-[#24324f] md:grid-cols-[1fr_160px_200px_auto] md:items-end">
          <Field label="Employee">
            <Combobox lookup="employees" value={form.empno} onChange={(v) => setForm({ ...form, empno: v })} />
          </Field>
          <Field label="Amount" hint="Negative to deduct">
            <NumberInput value={form.adjtamt} onValue={(v) => setForm({ ...form, adjtamt: v })} />
          </Field>
          <Field label="Tax treatment">
            <Select value={form.taxopt} onChange={(e) => setForm({ ...form, taxopt: e.target.value })} options={[{ value: 'T', label: 'Taxable' }, { value: 'N', label: 'Non-taxable' }]} />
          </Field>
          <Button variant="primary" loading={saving} onClick={add}>
            Add
          </Button>
        </div>
      )}
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        <DataTable
          rows={data ?? []}
          rowKey={(r, i) => `${r.empno}-${i}`}
          empty={<EmptyState title="No adjustments for this payroll" />}
          columns={[
            { key: 'name', header: 'Employee' },
            { key: 'paycodeno', header: 'Code' },
            { key: 'taxopt', header: 'Tax', render: (r) => (r.taxopt === 'N' ? 'Non-taxable' : 'Taxable') },
            { key: 'adjtamt', header: 'Amount', align: 'right', render: (r) => fmtMoney(r.adjtamt) },
          ]}
        />
      )}
    </div>
  );
}

export default function PayrollPage() {
  const toast = useToast();
  const { can } = useSession();
  const { data, loading, error, reload } = useRpc<any[]>('pay.periods');
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState('attendance');
  const [creating, setCreating] = useState<{ pdatefr: string; pdateto: string; paytype: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [slip, setSlip] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const periods = data ?? [];
  useEffect(() => {
    if (!selected && periods.length) setSelected(periods[0].payidno);
  }, [periods, selected]);
  const current = useMemo(() => periods.find((p) => p.payidno === selected), [periods, selected]);

  const act = async (op: string, label: string) => {
    if (!current) return;
    setBusy(op);
    try {
      toast.success(await rpc<string>(op, { payidno: current.payidno }));
      await reload();
      setKey((k) => k + 1);
      if (op === 'pay.compute') setTab('register');
    } catch (e) {
      toast.error(`${label}: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    if (!creating) return;
    setBusy('create');
    try {
      toast.success(await rpc<string>('pay.create', creating));
      setCreating(null);
      await reload();
      setSelected(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <RequireRight form="204">
      <PageHeader
        title="Payroll"
        description="Semi-monthly payroll: enter attendance exceptions, compute, review the register and payslips, then post to the general ledger. SSS, PhilHealth, Pag-IBIG and withholding tax come from the government rate tables, so a rate change is a table update."
        actions={
          can('204', 3) && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                const n = nextPeriod(periods);
                setCreating({ pdatefr: n.from, pdateto: n.to, paytype: 'Monthly' });
              }}
            >
              New payroll period
            </Button>
          )
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : periods.length === 0 ? (
        <EmptyState title="No payroll periods yet" text="Create the first payroll period to start." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          <Card title="Payroll periods" padded={false}>
            <ul className="divide-y divide-slate-100 dark:divide-[#1a2540]">
              {periods.map((p) => (
                <li key={p.payidno}>
                  <button onClick={() => setSelected(p.payidno)} className={`flex w-full items-center justify-between px-4 py-3 text-left ${p.payidno === selected ? 'bg-teal-50 dark:bg-teal-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'}`}>
                    <div>
                      <div className="font-mono text-sm font-semibold">{p.payidno}</div>
                      <div className="text-xs text-slate-500">
                        {fmtDate(p.pdatefr)} – {fmtDate(p.pdateto)}
                      </div>
                    </div>
                    <StatusBadge status={p.paystat === 'Computed' ? 'For posting' : p.paystat} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          {current && (
            <div className="min-w-0 space-y-4">
              <Card>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payroll {current.payidno}</h2>
                      <Badge tone={current.paystat === 'Posted' ? 'success' : current.paystat === 'Computed' ? 'info' : 'warning'}>{current.paystat === 'Computed' ? 'Computed, ready to post' : current.paystat}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {fmtDate(current.pdatefr)} to {fmtDate(current.pdateto)} · {current.workdays} working days · {current.employees} payslip(s) · gross ₱{fmtMoney(current.gross)} · net ₱{fmtMoney(current.net)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {current.paystat !== 'Posted' && can('204', 2) && (
                      <Button icon={Calculator} variant={current.paystat === 'Open' ? 'primary' : 'secondary'} loading={busy === 'pay.compute'} onClick={() => act('pay.compute', 'Compute')}>
                        {current.paystat === 'Computed' ? 'Compute again' : 'Compute payroll'}
                      </Button>
                    )}
                    {current.paystat === 'Computed' && can('204', 5) && (
                      <Button icon={Send} variant="primary" loading={busy === 'pay.post'} onClick={() => act('pay.post', 'Post')}>
                        Post to general ledger
                      </Button>
                    )}
                    {current.paystat === 'Posted' && can('204', 4) && (
                      <Button icon={Undo2} loading={busy === 'pay.unpost'} onClick={() => act('pay.unpost', 'Reverse')}>
                        Reverse posting
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
              <Card padded={false}>
                <div className="px-4 pt-2">
                  <Tabs
                    tabs={[
                      { id: 'attendance', label: 'Attendance' },
                      { id: 'register', label: 'Register & payslips' },
                      { id: 'adjustments', label: 'Adjustments' },
                    ]}
                    value={tab}
                    onChange={setTab}
                  />
                </div>
                <div className="p-4" key={`${current.payidno}-${key}`}>
                  {tab === 'attendance' && <Attendance payidno={current.payidno} locked={current.paystat === 'Posted'} onSaved={() => reload()} />}
                  {tab === 'register' && <Register payidno={current.payidno} onSlip={setSlip} />}
                  {tab === 'adjustments' && <Adjustments payidno={current.payidno} locked={current.paystat === 'Posted'} onChanged={() => reload()} />}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
      <Modal
        open={Boolean(creating)}
        onClose={() => setCreating(null)}
        title="New payroll period"
        description="The dates continue from the last payroll. Change them if needed."
        footer={
          <>
            <Button onClick={() => setCreating(null)}>Cancel</Button>
            <Button variant="primary" loading={busy === 'create'} onClick={create}>
              Create
            </Button>
          </>
        }
      >
        {creating && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From">
              <Input type="date" value={creating.pdatefr} onChange={(e) => setCreating({ ...creating, pdatefr: e.target.value })} />
            </Field>
            <Field label="To">
              <Input type="date" value={creating.pdateto} onChange={(e) => setCreating({ ...creating, pdateto: e.target.value })} />
            </Field>
            <Field label="Payroll" className="sm:col-span-2">
              <Select value={creating.paytype} onChange={(e) => setCreating({ ...creating, paytype: e.target.value })} options={[{ value: 'Monthly', label: 'Monthly-paid employees (semi-monthly)' }, { value: 'Weekly', label: 'Weekly-paid employees' }]} />
            </Field>
          </div>
        )}
      </Modal>
      {slip && current && <Payslip payidno={current.payidno} empno={slip} onClose={() => setSlip(null)} />}
    </RequireRight>
  );
}
