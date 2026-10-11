'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Button, Card, Field, Input, Modal, PageHeader, Spinner, cx, useToast } from '@/components/ui/kit';

const ACTIONS = [
  { n: 1, label: 'View' },
  { n: 2, label: 'Edit' },
  { n: 3, label: 'Add' },
  { n: 4, label: 'Void / delete' },
  { n: 5, label: 'Approve / post' },
];

export default function GroupsPage() {
  const toast = useToast();
  const { refresh } = useSession();
  const { data, loading, error, reload } = useRpc<any>('admin.groups');
  const [group, setGroup] = useState<string | null>(null);
  const [rights, setRights] = useState<Record<string, number[]>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState<{ code: string; name: string } | null>(null);

  useEffect(() => {
    if (data && !group && data.groups.length) setGroup(data.groups[0].ug_code);
  }, [data, group]);
  useEffect(() => {
    const g = data?.groups.find((x: any) => x.ug_code === group);
    setRights(g ? JSON.parse(JSON.stringify(g.rights)) : {});
    setDirty(false);
  }, [data, group]);

  const byGroup = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const f of data?.forms ?? []) m.set(f.group, [...(m.get(f.group) ?? []), f]);
    return [...m.entries()];
  }, [data]);

  const toggle = (form: string, n: number) => {
    if (!data?.canEdit) return;
    setDirty(true);
    setRights((r) => {
      const cur = new Set(r[form] ?? []);
      if (cur.has(n)) {
        cur.delete(n);
        if (n === 1) cur.clear(); // without view nothing else makes sense
      } else {
        cur.add(n);
        cur.add(1);
      }
      return { ...r, [form]: [...cur].sort() };
    });
  };

  const save = async (info?: { ug_name: string }) => {
    const code = adding ? adding.code.toUpperCase() : group;
    if (!code) return;
    setSaving(true);
    try {
      toast.success(await rpc<string>('admin.saveGroup', { group: code, rights: adding ? {} : rights, info }));
      setAdding(null);
      setDirty(false);
      await reload();
      setGroup(code);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const current = data?.groups.find((x: any) => x.ug_code === group);

  return (
    <RequireRight form="002">
      <PageHeader
        title="Group Access"
        description="What each user group can do, form by form: the same rights the legacy system checks (view, edit, add, void, approve). Changes apply the next time members open a page."
        actions={
          data?.canEdit && (
            <>
              <Button icon={Plus} onClick={() => setAdding({ code: '', name: '' })}>
                New group
              </Button>
              <Button variant="primary" disabled={!dirty} loading={saving} onClick={() => save()}>
                Save rights
              </Button>
            </>
          )
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <Card title="Groups" padded={false}>
              <ul className="divide-y divide-slate-100 dark:divide-[#1a2540]">
                {data.groups.map((g: any) => (
                  <li key={g.ug_code}>
                    <button
                      onClick={() => {
                        if (dirty && !confirm('Discard unsaved changes?')) return;
                        setGroup(g.ug_code);
                      }}
                      className={cx('w-full px-4 py-3 text-left', g.ug_code === group ? 'bg-teal-50 dark:bg-teal-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]')}
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{g.ug_name}</div>
                      <div className="text-xs text-slate-500">
                        {g.ug_code} · {g.members} user(s)
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title={current ? `${current.ug_name} (${current.ug_code})` : 'Rights'} subtitle={current?.ug_notes} padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-[#24324f] dark:bg-white/[0.02]">
                      <th className="px-4 py-2 text-left">Form</th>
                      {ACTIONS.map((a) => (
                        <th key={a.n} className="px-3 py-2 text-center">
                          {a.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byGroup.map(([g, forms]) => (
                      <React.Fragment key={g}>
                        <tr>
                          <td colSpan={6} className="bg-slate-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:bg-white/[0.02] dark:text-teal-400">
                            {g}
                          </td>
                        </tr>
                        {forms.map((f: any) => (
                          <tr key={f.code} className="border-b border-slate-100 dark:border-[#1a2540]">
                            <td className="px-4 py-2">
                              <span className="mr-2 font-mono text-xs text-slate-400">{f.code}</span>
                              {f.description}
                            </td>
                            {ACTIONS.map((a) => (
                              <td key={a.n} className="px-3 py-2 text-center">
                                <input type="checkbox" className="h-4 w-4 accent-teal-600" disabled={!data.canEdit} checked={(rights[f.code] ?? []).includes(a.n)} onChange={() => toggle(f.code, a.n)} aria-label={`${a.label} ${f.description}`} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )
      )}
      <Modal
        open={Boolean(adding)}
        onClose={() => setAdding(null)}
        title="New user group"
        description="Start with no rights, then tick what the group may do."
        footer={
          <>
            <Button onClick={() => setAdding(null)}>Cancel</Button>
            <Button variant="primary" loading={saving} disabled={!adding?.code || !adding?.name} onClick={() => save({ ug_name: adding!.name })}>
              Create group
            </Button>
          </>
        }
      >
        {adding && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Group code" required>
              <Input value={adding.code} maxLength={10} onChange={(e) => setAdding({ ...adding, code: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Group name" required>
              <Input value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
