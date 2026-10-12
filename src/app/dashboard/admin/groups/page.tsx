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
              <ul className="grid gap-1.5 p-2">
                {data.groups.map((g: any) => (
                  <li key={g.ug_code}>
                    <button
                      onClick={() => {
                        if (dirty && !confirm('Discard unsaved changes?')) return;
                        setGroup(g.ug_code);
                      }}
                      className={cx('w-full rounded-xl px-3 py-2.5 text-left transition', g.ug_code === group ? 'bg-white shadow-sm ring-1 ring-black/[0.06] dark:bg-white/[0.09] dark:ring-white/[0.08]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]')}
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
              <div className="space-y-6 p-4">
                {byGroup.map(([g, forms]) => (
                  <section key={g}>
                    <h3 className="neon-text mb-2 text-xs font-semibold uppercase tracking-[0.14em]">{g}</h3>
                    <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr))]">
                      {forms.map((f: any) => {
                        const has = rights[f.code] ?? [];
                        return (
                          <div key={f.code} className={cx('tile flex flex-col gap-2.5 p-3', has.length > 0 && 'border-brand-500/30 dark:border-brand-400/25')}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{f.description}</span>
                              <span className="font-mono text-[11px] text-slate-400">{f.code}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {ACTIONS.map((a) => {
                                const on = has.includes(a.n);
                                return (
                                  <button
                                    key={a.n}
                                    type="button"
                                    disabled={!data.canEdit}
                                    onClick={() => toggle(f.code, a.n)}
                                    aria-pressed={on}
                                    aria-label={`${a.label} ${f.description}`}
                                    className={cx(
                                      'rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ring-inset transition disabled:cursor-not-allowed',
                                      on ? 'bg-brand-500/15 text-brand-700 ring-brand-500/30 dark:bg-brand-400/15 dark:text-brand-200 dark:ring-brand-400/30' : 'bg-transparent text-slate-500 ring-black/[0.08] hover:ring-brand-500/40 dark:text-slate-400 dark:ring-white/[0.1]'
                                    )}
                                  >
                                    {a.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
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
