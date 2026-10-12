'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { clearLookups, rpc, useRpc } from '@/lib/api';
import { fmtMoney } from '@/shared/money';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Button, Card, Combobox, Field, Input, Modal, NumberInput, PageHeader, SearchInput, Select, Spinner, StatusBadge, Textarea, useToast } from '@/components/ui/kit';

interface MasterField {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  lookup?: string;
  help?: string;
  keyField?: boolean;
  width?: string;
  default?: unknown;
  list?: boolean;
}

interface Meta {
  id: string;
  title: string;
  singular: string;
  description: string;
  key: string;
  form: string;
  fields: MasterField[];
  autoKey: boolean;
}

const YESNO = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' },
];

function MasterScreen({ id }: { id: string }) {
  const toast = useToast();
  const { data: meta, error: metaError } = useRpc<Meta>('master.meta', { id });
  const { data, loading, error, reload } = useRpc<{ rows: any[]; canInsert: boolean; canEdit: boolean }>('master.list', { id });
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ row: any; isNew: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const r = data?.rows ?? [];
    if (!q) return r;
    const t = q.toLowerCase();
    return r.filter((x) => Object.values(x).some((v) => String(v ?? '').toLowerCase().includes(t)));
  }, [data, q]);

  if (metaError) return <Alert tone="danger">{metaError}</Alert>;
  if (!meta) return <Spinner />;

  const listFields = meta.fields.filter((f) => f.list);
  const extraCols = id === 'accounts' ? [{ key: 'class', header: 'Class' }] : id === 'priceList' ? [{ key: 'mmdesc', header: 'Material' }] : [];
  const columns = [
    ...listFields.map((f) => ({
      key: f.key,
      header: f.label,
      align: (f.type === 'money' || f.type === 'number' ? 'right' : 'left') as 'right' | 'left',
      render: (r: any) => {
        const v = r[f.key];
        if (f.key === 'status' || f.key === 'currstat' || f.key === 'stat') return <StatusBadge status={v} />;
        if (f.type === 'money') return fmtMoney(Number(v));
        if (f.type === 'yesno') return v === 'Y' ? 'Yes' : v === 'N' ? 'No' : '';
        if (f.options) return f.options.find((o) => o.value === v)?.label ?? v;
        if (f.keyField) return <span className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{v}</span>;
        return v ?? '';
      },
    })),
    ...extraCols,
  ];

  const openNew = () => {
    const row: any = {};
    for (const f of meta.fields) row[f.key] = f.default ?? '';
    setFormError(null);
    setEditing({ row, isNew: true });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await rpc<{ message: string }>('master.save', { id, row: editing.row, isNew: editing.isNew });
      toast.success(res.message);
      clearLookups();
      setEditing(null);
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const readOnly = editing ? (editing.isNew ? !data?.canInsert : !data?.canEdit) : true;
  const set = (k: string, v: any) => setEditing((e) => (e ? { ...e, row: { ...e.row, [k]: v } } : e));

  return (
    <RequireRight form={meta.form}>
      <PageHeader
        title={meta.title}
        description={meta.description}
        actions={
          data?.canInsert && (
            <Button variant="primary" icon={Plus} onClick={openNew}>
              Add {meta.singular.toLowerCase()}
            </Button>
          )
        }
      />
      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-white/[0.07]">
          <SearchInput value={q} onChange={setQ} placeholder={`Search ${meta.title.toLowerCase()}…`} className="max-w-md" />
        </div>
        {loading && !data ? <Spinner /> : error ? <div className="p-4"><Alert tone="danger">{error}</Alert></div> : <DataTable rows={rows} columns={columns} rowKey={(r) => String(r[meta.key])} onRowClick={(r) => { setFormError(null); setEditing({ row: { ...r }, isNew: false }); }} pageSize={20} />}
      </Card>

      <Modal
        side
        size="md"
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.isNew ? `Add ${meta.singular.toLowerCase()}` : `${meta.singular} ${editing?.row[meta.key] ?? ''}`}
        description={readOnly ? 'You can view this record but not change it.' : undefined}
        footer={
          !readOnly && (
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
            {meta.fields.map((f) => {
              const v = editing.row[f.key] ?? '';
              const disabled = readOnly || (f.keyField && !editing.isNew);
              const input =
                f.type === 'select' ? (
                  <Select value={v} disabled={disabled} options={f.options ?? []} onChange={(e) => set(f.key, e.target.value)} />
                ) : f.type === 'yesno' ? (
                  <Select value={v} disabled={disabled} options={YESNO} onChange={(e) => set(f.key, e.target.value)} />
                ) : f.type === 'lookup' ? (
                  <Combobox lookup={f.lookup} value={v} disabled={disabled} onChange={(val) => set(f.key, val)} />
                ) : f.type === 'number' || f.type === 'money' ? (
                  <NumberInput value={v} disabled={disabled} onValue={(n) => set(f.key, n)} />
                ) : f.type === 'textarea' ? (
                  <Textarea value={v} disabled={disabled} onChange={(e) => set(f.key, e.target.value)} />
                ) : (
                  <Input type={f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'} value={v} disabled={disabled} placeholder={f.keyField && meta.autoKey && editing.isNew ? 'Automatic' : undefined} onChange={(e) => set(f.key, e.target.value)} />
                );
              return (
                <Field key={f.key} label={f.label} required={f.required} hint={f.help} className={f.width === 'full' ? 'sm:col-span-2' : ''}>
                  {input}
                </Field>
              );
            })}
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

export default function MasterPage() {
  const { id } = useParams<{ id: string }>();
  return <MasterScreen key={id} id={id} />;
}
