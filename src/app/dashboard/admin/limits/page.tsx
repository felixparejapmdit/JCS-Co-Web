'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { fmtMoney } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Button, Card, Combobox, EmptyState, Field, Modal, NumberInput, PageHeader, Select, Spinner, useToast } from '@/components/ui/kit';

export default function LimitsPage() {
  const toast = useToast();
  const { can } = useSession();
  const { data, loading, error, reload } = useRpc<any>('admin.limits');
  const [form, setForm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      toast.success(await rpc<string>('admin.saveLimit', form));
      setForm(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <RequireRight form="045">
      <PageHeader
        title="Approval Limits"
        description="The highest amount each person may approve. A purchase order, voucher or sales order above someone's limit has to be approved by a person with a higher limit. People without a limit can approve any amount their group allows."
        actions={can('045', 2) && <Button variant="primary" icon={Plus} onClick={() => setForm({ userid: '', form: 'PurcApp', maxamt: '' })}>Set a limit</Button>}
      />
      <Card padded={false}>
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-4"><Alert tone="danger">{error}</Alert></div>
        ) : (
          <DataTable
            rows={data?.rows ?? []}
            rowKey={(r) => `${r.userid}-${r.form}`}
            onRowClick={can('045', 2) ? (r) => setForm({ userid: r.userid, form: r.form, maxamt: r.maxamt }) : undefined}
            empty={<EmptyState title="No limits set" text="Approvers can approve any amount their group allows." />}
            columns={[
              { key: 'userfullname', header: 'Approver', render: (r) => <div><div className="font-medium">{r.userfullname}</div><div className="text-xs text-slate-500">{r.userid}</div></div> },
              { key: 'form', header: 'Applies to', render: (r) => data.forms.find((f: any) => f.form === r.form)?.label ?? r.form },
              { key: 'maxamt', header: 'Maximum amount', align: 'right', render: (r) => `₱${fmtMoney(r.maxamt)}` },
            ]}
          />
        )}
      </Card>
      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title="Approval limit"
        description="Set the amount to 0 to remove the limit."
        footer={
          <>
            <Button onClick={() => setForm(null)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={save}>
              Save
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4">
            <Field label="Approver" required>
              <Combobox lookup="users" value={form.userid} onChange={(v) => setForm({ ...form, userid: v })} />
            </Field>
            <Field label="Applies to" required>
              <Select value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })} options={(data?.forms ?? []).map((f: any) => ({ value: f.form, label: f.label }))} />
            </Field>
            <Field label="Maximum amount (₱)" required>
              <NumberInput value={form.maxamt} onValue={(v) => setForm({ ...form, maxamt: v })} />
            </Field>
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
