'use client';

import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { fmtMoney } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Button, Card, Combobox, Field, Input, Modal, NumberInput, PageHeader, SearchInput, Select, Spinner, StatusBadge, useToast } from '@/components/ui/kit';

const STATUSES = ['Regular', 'Probationary', 'Contractual', 'Resigned'].map((s) => ({ value: s, label: s }));

export default function EmployeesPage() {
  const toast = useToast();
  const { can } = useSession();
  const { data, loading, error, reload } = useRpc<any[]>('hr.employees');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ row: any; isNew: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const rows = useMemo(() => (data ?? []).filter((r) => !q || `${r.empno} ${r.lastname} ${r.firstname} ${r.ccno}`.toLowerCase().includes(q.toLowerCase())), [data, q]);
  const canEdit = editing ? can('100', editing.isNew ? 3 : 2) : false;
  const set = (k: string, v: any) => setEditing((e) => (e ? { ...e, row: { ...e.row, [k]: v } } : e));

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      toast.success(await rpc<string>('hr.saveEmployee', { row: editing.row, isNew: editing.isNew }));
      setEditing(null);
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireRight form="100">
      <PageHeader
        title="Employees"
        description="Employee masterfile and pay setup. Hourly rates are derived from the monthly basic pay automatically."
        actions={
          can('100', 3) && (
            <Button variant="primary" icon={Plus} onClick={() => setEditing({ row: { empstat: 'Regular', paytype: 'Monthly', paymode: 'ATM', basicpay: '', allowance: 0 }, isNew: true })}>
              Add employee
            </Button>
          )
        }
      />
      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-[#1e2a44]">
          <SearchInput value={q} onChange={setQ} placeholder="Search employees…" className="max-w-md" />
        </div>
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.empno}
            onRowClick={(r) => {
              setFormError(null);
              setEditing({ row: { ...r }, isNew: false });
            }}
            columns={[
              { key: 'empno', header: 'Employee no.', render: (r) => <span className="font-mono text-[13px]">{r.empno}</span> },
              { key: 'lastname', header: 'Name', render: (r) => `${r.lastname}, ${r.firstname}` },
              { key: 'ccno', header: 'Cost center' },
              { key: 'basicpay', header: 'Monthly basic', align: 'right', render: (r) => fmtMoney(r.basicpay) },
              { key: 'allowance', header: 'Allowance', align: 'right', hideOnMobile: true, render: (r) => fmtMoney(r.allowance) },
              { key: 'paymode', header: 'Paid by', hideOnMobile: true },
              { key: 'empstat', header: 'Status', render: (r) => <StatusBadge status={r.empstat === 'Resigned' ? 'Inactive' : 'Active'} /> },
            ]}
          />
        )}
      </Card>
      <Modal
        side
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.isNew ? 'Add employee' : `${editing?.row.lastname ?? ''}, ${editing?.row.firstname ?? ''}`}
        footer={
          canEdit && (
            <>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" loading={saving} onClick={save}>
                Save
              </Button>
            </>
          )
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employee no." hint={editing.isNew ? 'Leave blank to number automatically.' : undefined}>
              <Input value={editing.row.empno ?? ''} disabled={!editing.isNew} onChange={(e) => set('empno', e.target.value)} placeholder="Automatic" />
            </Field>
            <Field label="Status">
              <Select value={editing.row.empstat} disabled={!canEdit} options={STATUSES} onChange={(e) => set('empstat', e.target.value)} />
            </Field>
            <Field label="Last name" required>
              <Input value={editing.row.lastname ?? ''} disabled={!canEdit} onChange={(e) => set('lastname', e.target.value)} />
            </Field>
            <Field label="First name" required>
              <Input value={editing.row.firstname ?? ''} disabled={!canEdit} onChange={(e) => set('firstname', e.target.value)} />
            </Field>
            <Field label="Cost center" required className="sm:col-span-2">
              <Combobox lookup="costCenters" value={editing.row.ccno} disabled={!canEdit} onChange={(v) => set('ccno', v)} />
            </Field>
            <Field label="Monthly basic pay" required>
              <NumberInput value={editing.row.basicpay} disabled={!canEdit} onValue={(v) => set('basicpay', v)} />
            </Field>
            <Field label="Monthly allowance (non-taxable)">
              <NumberInput value={editing.row.allowance} disabled={!canEdit} onValue={(v) => set('allowance', v)} />
            </Field>
            <Field label="Payroll">
              <Select value={editing.row.paytype} disabled={!canEdit} options={[{ value: 'Monthly', label: 'Monthly-paid (semi-monthly payroll)' }, { value: 'Weekly', label: 'Weekly' }]} onChange={(e) => set('paytype', e.target.value)} />
            </Field>
            <Field label="Paid by">
              <Select value={editing.row.paymode} disabled={!canEdit} options={[{ value: 'ATM', label: 'ATM / bank credit' }, { value: 'Cash', label: 'Cash' }, { value: 'Check', label: 'Cheque' }]} onChange={(e) => set('paymode', e.target.value)} />
            </Field>
            {formError && (
              <div className="sm:col-span-2">
                <Alert tone="danger">{formError}</Alert>
              </div>
            )}
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
