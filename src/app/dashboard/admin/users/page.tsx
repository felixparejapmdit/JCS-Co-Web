'use client';

import React, { useMemo, useState } from 'react';
import { KeyRound, Plus } from 'lucide-react';
import { clearLookups, rpc, useRpc, useLookup } from '@/lib/api';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Button, Card, Combobox, Field, Input, Modal, PageHeader, SearchInput, Select, Spinner, useToast } from '@/components/ui/kit';

export default function UsersPage() {
  const toast = useToast();
  const { can } = useSession();
  const { data, loading, error, reload } = useRpc<any[]>('admin.users');
  const plants = useLookup('plants');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ row: any; isNew: boolean } | null>(null);
  const [temp, setTemp] = useState<{ user: string; password: string; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const rows = useMemo(() => (data ?? []).filter((r) => !q || `${r.username} ${r.userfullname} ${r.groupname}`.toLowerCase().includes(q.toLowerCase())), [data, q]);
  const set = (k: string, v: any) => setEditing((e) => (e ? { ...e, row: { ...e.row, [k]: v } } : e));

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await rpc<{ message: string; tempPassword?: string }>('admin.saveUser', { row: editing.row, isNew: editing.isNew });
      if (res.tempPassword) setTemp({ user: editing.row.username, password: res.tempPassword, message: res.message });
      else toast.success(res.message);
      setEditing(null);
      clearLookups();
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const reset = async (username: string) => {
    try {
      const res = await rpc<{ message: string; tempPassword: string }>('admin.resetUser', { username });
      setTemp({ user: username, password: res.tempPassword, message: res.message });
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <RequireRight form="001">
      <PageHeader
        title="Users"
        description="Who can sign in to this company, their user group and which plants they work with. Locked accounts can be unlocked here with a new temporary password."
        actions={
          can('001', 3) && (
            <Button variant="primary" icon={Plus} onClick={() => setEditing({ row: { username: '', userfullname: '', usergroup: '', stat: 'Active', plants: [] }, isNew: true })}>
              Add user
            </Button>
          )
        }
      />
      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-white/[0.07]">
          <SearchInput value={q} onChange={setQ} placeholder="Search users…" className="max-w-md" />
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
            rowKey={(r) => r.username}
            onRowClick={(r) => {
              setFormError(null);
              setEditing({ row: { ...r }, isNew: false });
            }}
            columns={[
              { key: 'username', header: 'Username', render: (r) => <span className="font-mono text-[13px] font-semibold">{r.username}</span> },
              { key: 'userfullname', header: 'Name' },
              { key: 'groupname', header: 'Group' },
              { key: 'plants', header: 'Plants', hideOnMobile: true, render: (r) => r.plants.join(', ') },
              { key: 'upgraded', header: 'Password', hideOnMobile: true, render: (r) => (r.upgraded ? <Badge tone="success">Secured (Argon2id)</Badge> : <Badge>Legacy until first sign-in</Badge>) },
              { key: 'idstat', header: 'Status', render: (r) => (r.idstat === 'Locked' ? <Badge tone="danger">Locked</Badge> : r.stat === 'Inactive' ? <Badge>Inactive</Badge> : <Badge tone="success">Active</Badge>) },
            ]}
          />
        )}
      </Card>

      <Modal
        side
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.isNew ? 'Add user' : editing?.row.userfullname}
        description={editing?.isNew ? 'A temporary password is created for the new user.' : `Username: ${editing?.row.username}`}
        footer={
          editing &&
          can('001', editing.isNew ? 3 : 2) && (
            <>
              {!editing.isNew && (
                <Button icon={KeyRound} onClick={() => reset(editing.row.username)}>
                  {editing.row.idstat === 'Locked' ? 'Unlock & reset password' : 'Reset password'}
                </Button>
              )}
              <Button variant="primary" loading={saving} onClick={save}>
                Save
              </Button>
            </>
          )
        }
      >
        {editing && (
          <div className="grid gap-4">
            {editing.row.idstat === 'Locked' && <Alert tone="danger">This account is locked after too many failed sign-in attempts.</Alert>}
            <Field label="Username" required hint="Letters, numbers, dots or dashes.">
              <Input value={editing.row.username} disabled={!editing.isNew} onChange={(e) => set('username', e.target.value.toLowerCase())} />
            </Field>
            <Field label="Full name" required>
              <Input value={editing.row.userfullname} onChange={(e) => set('userfullname', e.target.value)} />
            </Field>
            <Field label="User group" required hint="The group decides which screens and actions this user has.">
              <Combobox lookup="groups" value={editing.row.usergroup} onChange={(v) => set('usergroup', v)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={editing.row.useremailaddress ?? ''} onChange={(e) => set('useremailaddress', e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={editing.row.stat ?? 'Active'} onChange={(e) => set('stat', e.target.value)} options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive (cannot sign in)' }]} />
            </Field>
            <Field label="Plant access" hint="Plants and warehouses this user works with.">
              <div className="grid gap-2 sm:grid-cols-2">
                {plants.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-600"
                      checked={(editing.row.plants ?? []).includes(p.value)}
                      onChange={(e) => set('plants', e.target.checked ? [...(editing.row.plants ?? []), p.value] : (editing.row.plants ?? []).filter((x: string) => x !== p.value))}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </Field>
            {formError && <Alert tone="danger">{formError}</Alert>}
          </div>
        )}
      </Modal>

      <Modal open={Boolean(temp)} onClose={() => setTemp(null)} title="Temporary password" description={temp?.message} footer={<Button variant="primary" onClick={() => setTemp(null)}>Done</Button>}>
        {temp && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Give this password to <strong>{temp.user}</strong>. It is shown only once; they should change it after signing in.
            </p>
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-center font-mono text-xl font-bold tracking-wider dark:bg-white/5">{temp.password}</div>
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
