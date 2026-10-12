'use client';

import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, BedDouble, Hospital, PackagePlus, Pill, Plus, Stethoscope, Thermometer, XCircle } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, Combobox, EmptyState, Field, Input, Modal, NumberInput, PageHeader, Progress, SearchInput, Select, Spinner, Stat, StatusBadge, Tabs, Textarea, cx, useToast } from '@/components/ui/kit';
import { addDays, fmtDate, today } from '@/shared/dates';

type Visit = Record<string, any>;
const DISP_TONE: Record<string, 'success' | 'info' | 'warning' | 'danger'> = { 'Back to work': 'success', 'Rest in clinic': 'info', 'Sent home': 'warning', 'Referred to hospital': 'danger' };

export default function ClinicPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useRpc<any>('clinic.dashboard');
  const [tab, setTab] = useState('visits');
  const run = async (op: string, args: Record<string, unknown>) => {
    try {
      toast.success(await rpc<string>(op, args));
      await reload();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  return (
    <RequireRight form="088">
      <PageHeader eyebrow="HR & Payroll" title="Clinic" description="Consultations at the company clinic, the medicines and first-aid supplies given, and monthly reports. Records are visible only to groups with the clinic right." />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="grid gap-5">
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
              <Stat label="Visits this month" icon={Stethoscope} value={data.stats.visits} sub={data.stats.topComplaints.map((c: any) => `${c.name} (${c.count})`).join(', ') || 'No visits yet'} />
              <Stat label="Sent home" icon={BedDouble} tone="amber" value={data.stats.sentHome} sub={`${data.stats.restDays} rest day(s) given`} />
              <Stat label="Referred to hospital" icon={Hospital} tone="rose" value={data.stats.referred} />
              <Stat label="Supplies to reorder" icon={Pill} tone={data.stats.lowStock ? 'rose' : 'emerald'} value={data.stats.lowStock} sub={data.stats.lowStock ? 'At or below the reorder level' : 'All above the reorder level'} />
            </div>
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'visits', label: 'Consultations', count: data.visits.length },
                { id: 'supplies', label: 'Medicines & supplies', count: data.supplies.length },
                { id: 'reports', label: 'Reports' },
              ]}
            />
            {tab === 'visits' && <Visits data={data} run={run} />}
            {tab === 'supplies' && <Supplies data={data} run={run} />}
            {tab === 'reports' && <Reports />}
          </div>
        )
      )}
    </RequireRight>
  );
}

type Run = (op: string, args: Record<string, unknown>) => Promise<boolean>;

function Visits({ data, run }: { data: any; run: Run }) {
  const [q, setQ] = useState('');
  const [form, setForm] = useState<Visit | null>(null);
  const [voiding, setVoiding] = useState<{ visitno: string; reason: string } | null>(null);
  const list = data.visits.filter((v: Visit) => !q || `${v.patient} ${v.complaint} ${v.diagnosis} ${v.visitno}`.toLowerCase().includes(q.toLowerCase()));
  const blank = (): Visit => ({ ptype: 'Employee', empno: '', patient: '', transdate: today(), timein: new Date().toTimeString().slice(0, 5), complaint: '', bp: '', temp: '', pulse: '', diagnosis: '', treatment: '', disposition: 'Back to work', restdays: 0, attendedby: '', supplies: [] as { code: string; qty: number }[] });
  const supplyOpts = data.supplies.filter((s: any) => s.status !== 'Inactive').map((s: any) => ({ value: s.code, label: `${s.name} (${s.onhand} ${s.unit})` }));

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Find a patient, complaint or diagnosis…" className="w-full sm:w-80" />
        {data.can.add && (
          <Button variant="primary" icon={Plus} className="ml-auto" onClick={() => setForm(blank())}>
            New consultation
          </Button>
        )}
      </div>
      {!list.length ? (
        <EmptyState icon={Stethoscope} title="No consultations" />
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))]">
          {list.map((v: Visit) => (
            <div key={v.visitno} className={cx('tile flex flex-col p-4', v.status === 'Void' && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900 dark:text-white">{v.patient}</div>
                  <div className="text-xs text-slate-500">
                    {fmtDate(v.transdate)} {v.timein} · {v.ptype}
                    {v.ccno ? ` · ${v.ccno}` : ''}
                  </div>
                </div>
                {v.status === 'Void' ? <StatusBadge status="Void" /> : <Badge tone={DISP_TONE[v.disposition] ?? 'neutral'}>{v.disposition}</Badge>}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{v.complaint}</p>
              {v.diagnosis && <p className="text-[13px] text-slate-600 dark:text-slate-300">{v.diagnosis}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                {v.bp && <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5 dark:bg-white/[0.06]">BP {v.bp}</span>}
                {v.temp && (
                  <span className={cx('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5', Number(v.temp) >= 37.8 ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300' : 'bg-black/[0.04] dark:bg-white/[0.06]')}>
                    <Thermometer className="h-3 w-3" />
                    {v.temp}°C
                  </span>
                )}
                {v.restdays > 0 && <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-amber-800 dark:text-amber-300">Rest {v.restdays} day(s)</span>}
              </div>
              {v.supplies.length > 0 && <p className="mt-2 text-[12px] text-slate-500">Given: {v.supplies.map((s: any) => `${s.qty} ${s.name}`).join(', ')}</p>}
              <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-slate-400">
                <span>
                  {v.visitno} · {v.attendedby}
                </span>
                {data.can.void && v.status !== 'Void' && (
                  <button className="inline-flex items-center gap-1 font-medium text-rose-600 hover:underline dark:text-rose-400" onClick={() => setVoiding({ visitno: v.visitno, reason: '' })}>
                    <XCircle className="h-3.5 w-3.5" /> Void
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        size="lg"
        title="New consultation"
        footer={
          <>
            <Button onClick={() => setForm(null)}>Cancel</Button>
            <Button variant="primary" disabled={!form?.complaint || (form?.ptype === 'Employee' ? !form?.empno : !form?.patient)} onClick={async () => (await run('clinic.saveVisit', form!)) && setForm(null)}>
              Save consultation
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Patient is">
              <Select value={form.ptype} onChange={(e) => setForm({ ...form, ptype: e.target.value })} options={data.patientTypes.map((t: string) => ({ value: t, label: t }))} />
            </Field>
            {form.ptype === 'Employee' ? (
              <Field label="Employee" required className="sm:col-span-2">
                <Combobox items={data.patients} value={form.empno} onChange={(v) => setForm({ ...form, empno: v })} placeholder="Find the employee…" />
              </Field>
            ) : (
              <Field label="Name" required className="sm:col-span-2">
                <Input value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} placeholder={form.ptype === 'Dependent' ? 'Name and relation to the employee' : 'Name and company'} />
              </Field>
            )}
            <Field label="Date">
              <Input type="date" max={today()} value={form.transdate} onChange={(e) => setForm({ ...form, transdate: e.target.value })} />
            </Field>
            <Field label="Time">
              <Input type="time" value={form.timein} onChange={(e) => setForm({ ...form, timein: e.target.value })} />
            </Field>
            <Field label="Attended by">
              <Input value={form.attendedby} onChange={(e) => setForm({ ...form, attendedby: e.target.value })} placeholder="Nurse / physician" />
            </Field>
            <Field label="Chief complaint" required className="sm:col-span-3">
              <Input value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} placeholder="e.g. Headache" />
            </Field>
            <Field label="Blood pressure">
              <Input value={form.bp} onChange={(e) => setForm({ ...form, bp: e.target.value })} placeholder="120/80" />
            </Field>
            <Field label="Temperature °C">
              <NumberInput decimals={1} value={form.temp} onValue={(v) => setForm({ ...form, temp: v })} />
            </Field>
            <Field label="Pulse / min">
              <NumberInput decimals={0} value={form.pulse} onValue={(v) => setForm({ ...form, pulse: v })} />
            </Field>
            <Field label="Assessment / diagnosis" className="sm:col-span-3">
              <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
            </Field>
            <Field label="Treatment and advice" className="sm:col-span-3">
              <Textarea rows={2} value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
            </Field>
            <Field label="After the consultation">
              <Select value={form.disposition} onChange={(e) => setForm({ ...form, disposition: e.target.value })} options={data.dispositions.map((d: string) => ({ value: d, label: d }))} />
            </Field>
            <Field label="Rest days" hint={Number(form.restdays) ? `Back on ${fmtDate(addDays(form.transdate, Math.ceil(Number(form.restdays))))}` : undefined}>
              <NumberInput decimals={1} value={form.restdays} onValue={(v) => setForm({ ...form, restdays: v })} />
            </Field>
            <div className="sm:col-span-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Medicines and supplies given</span>
                <Button size="sm" icon={Plus} onClick={() => setForm({ ...form, supplies: [...form.supplies, { code: supplyOpts[0]?.value ?? '', qty: 1 }] })}>
                  Add
                </Button>
              </div>
              {form.supplies.map((s: any, i: number) => (
                <div key={i} className="mb-2 flex gap-2">
                  <Select className="flex-1" value={s.code} onChange={(e) => setForm({ ...form, supplies: form.supplies.map((x: any, k: number) => (k === i ? { ...x, code: e.target.value } : x)) })} options={supplyOpts} />
                  <NumberInput className="!w-24 text-right" decimals={0} value={s.qty} onValue={(v) => setForm({ ...form, supplies: form.supplies.map((x: any, k: number) => (k === i ? { ...x, qty: v } : x)) })} />
                  <Button variant="ghost" aria-label="Remove" onClick={() => setForm({ ...form, supplies: form.supplies.filter((_: any, k: number) => k !== i) })}>
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
      <Modal open={Boolean(voiding)} onClose={() => setVoiding(null)} title={`Void ${voiding?.visitno}`} description="The supplies given are put back in stock." footer={<><Button onClick={() => setVoiding(null)}>Cancel</Button><Button variant="danger" disabled={!voiding?.reason.trim()} onClick={async () => (await run('clinic.voidVisit', voiding!)) && setVoiding(null)}>Void record</Button></>}>
        {voiding && (
          <Field label="Reason" required>
            <Input value={voiding.reason} onChange={(e) => setVoiding({ ...voiding, reason: e.target.value })} />
          </Field>
        )}
      </Modal>
    </>
  );
}

function Supplies({ data, run }: { data: any; run: Run }) {
  const [form, setForm] = useState<{ code?: string; name: string; unit: string; reorder: number | ''; kind: string } | null>(null);
  const [recv, setRecv] = useState<{ code: string; qty: number | ''; expiry: string; remarks: string } | null>(null);
  return (
    <>
      {data.can.supplies && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button icon={PackagePlus} disabled={!data.supplies.length} onClick={() => setRecv({ code: data.supplies[0]?.code ?? '', qty: '', expiry: '', remarks: '' })}>
            Receive / write off
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setForm({ name: '', unit: 'tab', reorder: 0, kind: 'Medicine' })}>
            New supply
          </Button>
        </div>
      )}
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
        {data.supplies.map((s: any) => (
          <button key={s.code} disabled={!data.can.supplies} onClick={() => setForm({ code: s.code, name: s.name, unit: s.unit, reorder: s.reorder, kind: s.kind })} className={cx('tile-interactive p-4 text-left disabled:cursor-default', s.low && 'border-rose-500/40')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                <div className="text-xs text-slate-500">
                  {s.code} · {s.kind}
                </div>
              </div>
              {s.low && (
                <Badge tone="danger">
                  <AlertTriangle className="h-3 w-3" /> Reorder
                </Badge>
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{s.onhand}</span>
              <span className="text-xs text-slate-500">
                {s.unit} · reorder at {s.reorder}
              </span>
            </div>
            <Progress className="mt-2" value={s.onhand} max={Math.max(s.reorder * 4, s.onhand, 1)} tone={s.low ? 'rose' : 'emerald'} />
          </button>
        ))}
      </div>
      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?.code ? `Edit ${form.code}` : 'New supply'} footer={<><Button onClick={() => setForm(null)}>Cancel</Button><Button variant="primary" disabled={!form?.name.trim()} onClick={async () => (await run('clinic.saveSupply', form!)) && setForm(null)}>Save</Button></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paracetamol 500 mg tablet" />
            </Field>
            <Field label="Kind">
              <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} options={['Medicine', 'First aid', 'Equipment', 'Other'].map((k) => ({ value: k, label: k }))} />
            </Field>
            <Field label="Unit">
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Field>
            <Field label="Reorder at" hint="Warn when the stock falls to this quantity">
              <NumberInput decimals={0} value={form.reorder} onValue={(v) => setForm({ ...form, reorder: v })} />
            </Field>
          </div>
        )}
      </Modal>
      <Modal open={Boolean(recv)} onClose={() => setRecv(null)} title="Receive or write off" description="A negative quantity writes off expired or damaged stock." footer={<><Button onClick={() => setRecv(null)}>Cancel</Button><Button variant="primary" disabled={!Number(recv?.qty)} onClick={async () => (await run('clinic.receive', recv!)) && setRecv(null)}>Save</Button></>}>
        {recv && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Supply" className="sm:col-span-2">
              <Select value={recv.code} onChange={(e) => setRecv({ ...recv, code: e.target.value })} options={data.supplies.map((s: any) => ({ value: s.code, label: `${s.name} (${s.onhand} ${s.unit})` }))} />
            </Field>
            <Field label="Quantity">
              <NumberInput decimals={0} value={recv.qty} onValue={(v) => setRecv({ ...recv, qty: v })} />
            </Field>
            <Field label="Expiry date">
              <Input type="date" value={recv.expiry} onChange={(e) => setRecv({ ...recv, expiry: e.target.value })} />
            </Field>
            <Field label="Remarks" className="sm:col-span-2">
              <Input value={recv.remarks} onChange={(e) => setRecv({ ...recv, remarks: e.target.value })} placeholder="Supplier and receipt, or reason for the write-off" />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

function Reports() {
  const [from, setFrom] = useState(`${today().slice(0, 4)}-01-01`);
  const [to, setTo] = useState(today());
  const { data, loading, error } = useRpc<any>('clinic.report', { from, to }, [from, to]);
  const block = (title: string, rows: any[], extra?: (r: any) => string) => (
    <Card title={title} icon={Activity}>
      {!rows.length ? (
        <p className="text-sm text-slate-500">No data.</p>
      ) : (
        <ul className="grid gap-2">
          {rows.slice(0, 10).map((r) => (
            <li key={r.name ?? r.code} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="truncate capitalize text-slate-700 dark:text-slate-200">{r.name}</span>
                <span className="tabular-nums font-semibold text-slate-900 dark:text-white">{extra ? extra(r) : r.visits}</span>
              </div>
              {r.visits !== undefined && <Progress className="mt-1" tone="brand" value={r.visits} max={rows[0].visits} />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
  const rows = useMemo(() => data, [data]);
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-3">
        <Field label="From">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>
      {loading && !rows ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        rows && (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
            {block(`Complaints (${rows.visits} visits)`, rows.byComplaint)}
            {block('Per cost center', rows.byCostCenter, (r) => `${r.visits} · ${r.restdays} rest day(s)`)}
            {block('After the consultation', rows.byDisposition)}
            {block('Supplies used', rows.suppliesUsed, (r) => `${r.qty} ${r.unit}`)}
          </div>
        )
      )}
    </div>
  );
}
