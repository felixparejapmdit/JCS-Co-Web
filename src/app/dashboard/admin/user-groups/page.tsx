'use client';

import React, { useMemo, useState } from 'react';
import { Lock, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { clearLookups, rpc, useRpc } from '@/lib/api';
import { RequireRight } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Button, Card, Field, Input, Modal, PageHeader, SearchInput, Select, Spinner, useToast } from '@/components/ui/kit';

interface Group {
  code: string;
  name: string;
  notes: string;
  members: number;
  pages: number;
  apiKeys: number;
  locked: boolean;
  mine: boolean;
}

interface Data {
  groups: Group[];
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

type Form = { code: string; name: string; notes: string; copyFrom: string };

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/** Why a group cannot be deleted, or null when it can. */
function deleteBlock(g: Group): string | null {
  if (g.locked) return 'The administrator group cannot be deleted.';
  if (g.mine) return 'You cannot delete your own group.';
  if (g.members) return `Move its ${plural(g.members, 'user')} to another group in Users first.`;
  if (g.apiKeys) return `Revoke its ${plural(g.apiKeys, 'API key')} in API Keys first.`;
  return null;
}

export default function UserGroupsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useRpc<Data>('groups.list');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ form: Form; group: Group | null } | null>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const groups = data?.groups ?? [];
  const rows = useMemo(() => groups.filter((g) => !q || `${g.code} ${g.name} ${g.notes}`.toLowerCase().includes(q.toLowerCase())), [groups, q]);
  const set = (k: keyof Form, v: string) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  const open = (group: Group | null) => {
    setFormError(null);
    setEditing({ group, form: group ? { code: group.code, name: group.name, notes: group.notes, copyFrom: '' } : { code: '', name: '', notes: '', copyFrom: '' } });
  };

  const run = async (op: string, args: Record<string, unknown>) => {
    setSaving(true);
    setFormError(null);
    try {
      toast.success(await rpc<string>(op, args));
      clearLookups(); // the user-group choices in Users and API Keys
      await reload();
      return true;
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!editing) return;
    const { form, group } = editing;
    if (await run(group ? 'groups.update' : 'groups.create', form)) setEditing(null);
  };

  const remove = async () => {
    if (deleting && (await run('groups.delete', { code: deleting.code }))) {
      setDeleting(null);
      setEditing(null);
    }
  };

  const canSave = editing && (editing.group ? data?.canEdit && !editing.group.locked : data?.canAdd);

  return (
    <RequireRight form="002">
      <PageHeader
        title="User Groups"
        description="The groups users belong to. A group decides what its users can see and do: add, rename or delete groups here, then set what each one may do in the Access Matrix."
        actions={
          <>
            <Button icon={ShieldCheck} href="/dashboard/admin/groups">
              Access Matrix
            </Button>
            {data?.canAdd && (
              <Button variant="primary" icon={Plus} onClick={() => open(null)}>
                Add group
              </Button>
            )}
          </>
        }
      />
      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-white/[0.07]">
          <SearchInput value={q} onChange={setQ} placeholder="Search groups…" className="max-w-md" />
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
            rowKey={(g) => g.code}
            onRowClick={(g) => open(g)}
            empty="No group matches your search."
            columns={[
              { key: 'code', header: 'Code', render: (g) => <span className="font-mono text-[13px] font-semibold">{g.code}</span> },
              {
                key: 'name',
                header: 'Name',
                render: (g) => (
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-slate-900 dark:text-white">{g.name}</span>
                      {g.locked && (
                        <Badge tone="accent">
                          <Lock className="mr-1 inline h-3 w-3" />
                          Always all access
                        </Badge>
                      )}
                      {g.mine && <Badge tone="info">Your group</Badge>}
                    </div>
                    {g.notes && <div className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{g.notes}</div>}
                  </div>
                ),
              },
              { key: 'members', header: 'Users', align: 'right', render: (g) => g.members },
              { key: 'pages', header: 'Pages', align: 'right', hideOnMobile: true, render: (g) => g.pages },
              { key: 'apiKeys', header: 'API keys', align: 'right', hideOnMobile: true, card: 'hide', render: (g) => g.apiKeys || '' },
            ]}
          />
        )}
      </Card>

      <Modal
        side
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.group ? editing.group.name : 'Add group'}
        description={editing?.group ? `Code: ${editing.group.code} · ${plural(editing.group.members, 'user')} · ${plural(editing.group.pages, 'page')}` : 'Start with no access, or copy the access of an existing group.'}
        footer={
          editing && (
            <>
              {editing.group && data?.canDelete && !editing.group.locked && (
                <Button variant="danger" icon={Trash2} className="mr-auto" disabled={Boolean(deleteBlock(editing.group))} title={deleteBlock(editing.group) ?? undefined} onClick={() => setDeleting(editing.group)}>
                  Delete
                </Button>
              )}
              {editing.group && (
                <Button icon={ShieldCheck} href={`/dashboard/admin/groups?group=${encodeURIComponent(editing.group.code)}`}>
                  Edit access
                </Button>
              )}
              {canSave && (
                <Button variant="primary" loading={saving} disabled={!editing.form.code || !editing.form.name.trim()} onClick={save}>
                  {editing.group ? 'Save' : 'Add group'}
                </Button>
              )}
            </>
          )
        }
      >
        {editing && (
          <div className="grid gap-4">
            {editing.group?.locked && <Alert tone="info">The administrator group always has every right. Its name can be read here but not changed.</Alert>}
            <Field label="Group code" required hint={editing.group ? 'The code cannot change: users and rights refer to it.' : '2 to 12 letters or digits, e.g. WHSE or AP_CLERK.'}>
              <Input value={editing.form.code} maxLength={12} disabled={Boolean(editing.group)} onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} />
            </Field>
            <Field label="Name" required>
              <Input value={editing.form.name} disabled={Boolean(editing.group && !canSave)} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Description">
              <Input value={editing.form.notes} placeholder="What this group does" disabled={Boolean(editing.group && !canSave)} onChange={(e) => set('notes', e.target.value)} />
            </Field>
            {!editing.group && (
              <Field label="Start with the access of" hint="The new group gets a copy; changing it later does not change the original.">
                <Select value={editing.form.copyFrom} onChange={(e) => set('copyFrom', e.target.value)} placeholder="No access (tick pages in the Access Matrix)" options={groups.map((g) => ({ value: g.code, label: `${g.name} (${g.code})` }))} />
              </Field>
            )}
            {editing.group && data?.canDelete && !editing.group.locked && deleteBlock(editing.group) && (
              <p className="text-xs text-slate-500 dark:text-slate-400">To delete this group: {deleteBlock(editing.group)}</p>
            )}
            {formError && <Alert tone="danger">{formError}</Alert>}
          </div>
        )}
      </Modal>

      <Modal
        size="sm"
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete group ${deleting?.code ?? ''}?`}
        description="The group and its page rights are removed. This cannot be undone."
        footer={
          <>
            <Button onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" icon={Trash2} loading={saving} onClick={remove}>
              Delete group
            </Button>
          </>
        }
      >
        {deleting && <p className="text-sm text-slate-600 dark:text-slate-400">{deleting.name}{deleting.notes ? ` — ${deleting.notes}` : ''}</p>}
        {deleting && formError && <Alert tone="danger">{formError}</Alert>}
      </Modal>
    </RequireRight>
  );
}
