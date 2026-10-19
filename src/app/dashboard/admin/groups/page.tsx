'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Lock, Minus, Plus, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { NAV } from '@/components/shell/nav';
import { Alert, Badge, Button, Card, Field, ICON_CHIP, Input, MODULE_TONE, Modal, PageHeader, SearchInput, Segmented, Spinner, cx, useToast } from '@/components/ui/kit';
import { ACTION_VERB, ActionNo, PERMISSIONS, PermForm, PermSection } from '@/shared/permissions';
import type { StatusTone } from '@/shared/codes';

type Rights = Record<string, number[]>;
type Matrix = Record<string, Rights>;
type Tri = boolean | 'mixed';

const ADMIN = 'ADMIN';
const TONES: StatusTone[] = ['info', 'success', 'warning', 'accent', 'danger', 'neutral'];
const ACTION_ORDER: ActionNo[] = [1, 3, 2, 4, 5];

interface Perm {
  key: string; // `${form}:${action}`
  form: string;
  action: ActionNo;
  label: string;
  slug: string;
}

const permsOf = (f: PermForm): Perm[] =>
  ACTION_ORDER.filter((a) => f.actions[a]).map((a) => ({ key: `${f.form}:${a}`, form: f.form, action: a, label: f.actions[a]!, slug: `${f.slug}.${ACTION_VERB[a]}` }));

const ALL_PERMS = PERMISSIONS.flatMap((s) => s.forms.flatMap(permsOf));
const has = (m: Matrix, g: string, p: Perm) => g === ADMIN || (m[g]?.[p.form] ?? []).includes(p.action);
const triOf = (m: Matrix, g: string, perms: Perm[]): Tri => {
  const n = perms.filter((p) => has(m, g, p)).length;
  return n === 0 ? false : n === perms.length ? true : 'mixed';
};

/** Sets a list of permissions on or off for one group, keeping View in step with the other buttons. */
function apply(m: Matrix, g: string, perms: Perm[], on: boolean): Matrix {
  const rights: Rights = { ...(m[g] ?? {}) };
  for (const p of perms) {
    const cur = new Set(rights[p.form] ?? []);
    if (on) {
      cur.add(p.action);
      cur.add(1); // a button is useless without its page
    } else {
      cur.delete(p.action);
      if (p.action === 1) cur.clear(); // no page, no buttons
    }
    rights[p.form] = [...cur].sort();
  }
  return { ...m, [g]: rights };
}

const sameRights = (a: Rights = {}, b: Rights = {}) => ALL_PERMS.every((p) => (a[p.form] ?? []).includes(p.action) === (b[p.form] ?? []).includes(p.action));

export default function AccessMatrixPage() {
  const toast = useToast();
  const { refresh } = useSession();
  const { data, loading, error, reload } = useRpc<any>('admin.groups');
  const [base, setBase] = useState<Matrix>({});
  const [draft, setDraft] = useState<Matrix>({});
  const [filter, setFilter] = useState('');
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState<{ code: string; name: string; notes: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'all' | 'one'>('all');
  useEffect(() => {
    // Phones show one group at a time; pick it from the list above the matrix.
    if (window.matchMedia('(max-width: 639px)').matches) setView('one');
  }, []);

  useEffect(() => {
    if (!data) return;
    const m: Matrix = Object.fromEntries(data.groups.map((g: any) => [g.ug_code, g.rights ?? {}]));
    setBase(m);
    setDraft(m);
    setSelected((s) => (s && data.groups.some((g: any) => g.ug_code === s) ? s : data.groups[0]?.ug_code ?? null));
  }, [data]);

  const allGroups: any[] = data?.groups ?? [];
  const groups = view === 'one' ? allGroups.filter((g) => g.ug_code === selected) : allGroups;

  const pick = (code: string) => {
    setSelected(code);
    if (view === 'all') requestAnimationFrame(() => document.getElementById(`col-${code}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }));
  };
  const canEdit = Boolean(data?.canEdit);
  const changed = allGroups.filter((g) => g.ug_code !== ADMIN && !sameRights(base[g.ug_code], draft[g.ug_code])).map((g) => g.ug_code as string);
  const dirty = changed.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const sections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return PERMISSIONS.map((s) => {
      const all = s.forms.flatMap(permsOf);
      if (!q || s.label.toLowerCase().includes(q)) return { s, perms: all, all };
      return { s, perms: all.filter((p) => `${p.label} ${p.slug} ${p.form}`.toLowerCase().includes(q)), all };
    }).filter((x) => x.perms.length);
  }, [filter]);

  const set = (g: string, perms: Perm[], on: boolean) => {
    if (!canEdit || g === ADMIN) return;
    setDraft((m) => apply(m, g, perms, on));
  };

  const save = async () => {
    const mine = data?.myGroup;
    if (mine && changed.includes(mine) && !(draft[mine]?.['002'] ?? []).includes(2)) {
      toast.error("You cannot remove your own group's right to change group access.");
      return;
    }
    setSaving(true);
    try {
      toast.success(await rpc<string>('admin.saveMatrix', { changes: Object.fromEntries(changed.map((g) => [g, draft[g] ?? {}])) }));
      await reload();
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const createGroup = async () => {
    if (!adding) return;
    setSaving(true);
    try {
      toast.success(await rpc<string>('admin.saveGroup', { group: adding.code.toUpperCase(), rights: {}, info: { ug_name: adding.name, ug_notes: adding.notes } }));
      setAdding(null);
      await reload();
      pick(adding.code.toUpperCase());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const cols = `minmax(min(230px, 52vw), 2.2fr) repeat(${Math.max(groups.length, 1)}, minmax(${view === 'one' ? 140 : 104}px, 1fr))`;
  const tone = (code: string) => TONES[Math.max(0, allGroups.findIndex((g) => g.ug_code === code)) % TONES.length];
  const countOf = (code: string) => ALL_PERMS.filter((p) => has(draft, code, p)).length;

  return (
    <RequireRight form="002">
      <PageHeader
        eyebrow="Group Access"
        title="Access Matrix"
        description="Tick which pages and buttons each role can use. These are the same rights the legacy system checks, so both systems stay in step."
        actions={
          canEdit && (
            <Button icon={Plus} disabled={dirty} title={dirty ? 'Save or discard your changes first' : undefined} onClick={() => setAdding({ code: '', name: '', notes: '' })}>
              New group
            </Button>
          )
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <Card title="Groups" padded={false} className="lg:self-start">
              <ul className="grid gap-1.5 p-2 max-lg:max-h-72 max-lg:overflow-y-auto sm:max-lg:grid-cols-2">
                {allGroups.map((g) => {
                  const locked = g.ug_code === ADMIN;
                  const edited = changed.includes(g.ug_code);
                  return (
                    <li key={g.ug_code}>
                      <button
                        onClick={() => pick(g.ug_code)}
                        aria-current={g.ug_code === selected}
                        className={cx('flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left transition', g.ug_code === selected ? 'bg-white shadow-sm ring-1 ring-black/[0.06] dark:bg-white/[0.09] dark:ring-white/[0.08]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]')}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                            <span className="truncate">{g.ug_name}</span>
                            {locked && <Lock className="h-3 w-3 shrink-0 text-emerald-500" aria-label="Always has every right" />}
                            {edited && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500 shadow-[0_0_8px_rgb(var(--brand-500)/0.8)]" title="Unsaved changes" />}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {g.ug_code} · {g.members} user(s)
                          </span>
                        </span>
                        <span className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                          {countOf(g.ug_code)}/{ALL_PERMS.length}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <div className="glass min-w-0 overflow-hidden rounded-3xl">
              <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] p-3 dark:border-white/[0.07] sm:p-4">
                <SearchInput value={filter} onChange={setFilter} placeholder="Filter pages, buttons or keys…" className="w-full sm:w-64" />
                <Segmented
                  value={view}
                  onChange={(v) => setView(v)}
                  options={[
                    { value: 'all', label: 'All groups' },
                    { value: 'one', label: 'Selected group' },
                  ]}
                />
                <p className="min-w-0 flex-1 basis-56 text-xs text-slate-500 dark:text-slate-400">
                  {canEdit ? 'Ticking a button also ticks its View; clearing View clears the page. Members see changes the next time they open a page.' : 'You can view the matrix. Ask an administrator to change it.'}
                </p>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Button icon={RotateCcw} disabled={!dirty || saving} onClick={() => setDraft(base)}>
                      Discard
                    </Button>
                    <Button variant="primary" icon={Save} disabled={!dirty} loading={saving} onClick={save}>
                      Save Permissions{dirty ? ` (${changed.length})` : ''}
                    </Button>
                  </div>
                )}
              </div>

              <div className="max-h-[calc(100dvh-15rem)] overflow-auto" role="table" aria-label="Access matrix">
                <div className="min-w-max" style={{ display: 'grid', gridTemplateColumns: cols }}>
                  {/* Header: one column per group */}
                  <div role="columnheader" className="sticky left-0 top-0 z-30 flex items-end bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-[#07080b] dark:text-slate-400">
                    Page / button
                  </div>
                  {groups.map((g) => {
                    const locked = g.ug_code === ADMIN;
                    const edited = changed.includes(g.ug_code);
                    const sel = g.ug_code === selected && view === 'all';
                    return (
                      <div
                        key={g.ug_code}
                        id={`col-${g.ug_code}`}
                        role="columnheader"
                        className={cx('sticky top-0 z-20 flex flex-col items-center gap-1.5 px-2 py-3 text-center', sel ? 'bg-brand-50 dark:bg-[#07142b]' : 'bg-white dark:bg-[#07080b]', edited && 'shadow-[inset_0_-2px_0_rgb(var(--brand-500)/0.9)]')}
                      >
                        <button type="button" onClick={() => pick(g.ug_code)} className="max-w-full" title={`${g.ug_name}${g.ug_notes ? ` — ${g.ug_notes}` : ''}`}>
                          <Badge tone={locked ? 'success' : tone(g.ug_code)} dot={!locked} className="max-w-full">
                            {locked && <ShieldCheck className="h-3 w-3" />}
                            <span className="truncate">{g.ug_code}</span>
                          </Badge>
                        </button>
                        <span className="line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">{g.ug_name}</span>
                        <span className="font-mono text-[11px] tabular-nums text-slate-400">
                          {countOf(g.ug_code)} / {ALL_PERMS.length}
                        </span>
                        {locked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Lock className="h-3 w-3" /> always
                          </span>
                        ) : (
                          <TriBox value={triOf(draft, g.ug_code, ALL_PERMS)} disabled={!canEdit} label={`All permissions for ${g.ug_name}`} onChange={(on) => set(g.ug_code, ALL_PERMS, on)} />
                        )}
                      </div>
                    );
                  })}

                  {sections.map(({ s, perms, all }) => (
                    <SectionRows key={s.id} section={s} perms={perms} all={all} groups={groups} selected={view === 'all' ? selected : null} draft={draft} base={base} canEdit={canEdit} open={!closed.has(s.id) || Boolean(filter)} onToggleOpen={() => setClosed((c) => { const n = new Set(c); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })} onSet={set} />
                  ))}
                  {!sections.length && (
                    <div className="px-4 py-10 text-center text-sm text-slate-500" style={{ gridColumn: '1 / -1' }}>
                      No page or button matches “{filter}”.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      <Modal
        open={Boolean(adding)}
        onClose={() => setAdding(null)}
        title="New user group"
        description="The group starts with no access. Tick its pages and buttons in the matrix, then save."
        footer={
          <>
            <Button onClick={() => setAdding(null)}>Cancel</Button>
            <Button variant="primary" loading={saving} disabled={!adding?.code || !adding?.name} onClick={createGroup}>
              Create group
            </Button>
          </>
        }
      >
        {adding && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Group code" hint="2 to 12 letters or digits" required>
              <Input value={adding.code} maxLength={12} onChange={(e) => setAdding({ ...adding, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} />
            </Field>
            <Field label="Group name" required>
              <Input value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Input value={adding.notes} placeholder="What this group does" onChange={(e) => setAdding({ ...adding, notes: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}

function SectionRows({
  section,
  perms,
  all,
  groups,
  selected,
  draft,
  base,
  canEdit,
  open,
  onToggleOpen,
  onSet,
}: {
  section: PermSection;
  perms: Perm[];
  all: Perm[];
  groups: any[];
  selected: string | null;
  draft: Matrix;
  base: Matrix;
  canEdit: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onSet: (g: string, perms: Perm[], on: boolean) => void;
}) {
  const Icon = NAV.find((n) => n.id === section.id)?.icon ?? ShieldCheck;
  return (
    <>
      <div role="rowheader" className="sticky left-0 z-10 border-t border-black/[0.06] bg-slate-50 dark:border-white/[0.07] dark:bg-[#0b0d12]">
        <button onClick={onToggleOpen} aria-expanded={open} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left">
          <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ring-inset', ICON_CHIP[MODULE_TONE[section.id] ?? 'brand'])}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{section.label}</span>
          <span className="font-mono text-[11px] text-slate-400">{all.length}</span>
          <ChevronDown className={cx('h-4 w-4 text-slate-400 transition', !open && '-rotate-90')} />
        </button>
      </div>
      {groups.map((g) => (
        <div key={g.ug_code} role="cell" className={cx('grid place-items-center border-t border-black/[0.06] dark:border-white/[0.07]', g.ug_code === selected ? 'bg-brand-500/[0.09]' : 'bg-slate-50/80 dark:bg-white/[0.025]')}>
          {g.ug_code === ADMIN ? <LockedMark /> : <TriBox value={triOf(draft, g.ug_code, all)} disabled={!canEdit} label={`${section.label} for ${g.ug_name}`} onChange={(on) => onSet(g.ug_code, all, on)} />}
        </div>
      ))}
      {open &&
        perms.map((p) => (
          <React.Fragment key={p.key}>
            <div role="rowheader" className="group sticky left-0 z-10 border-t border-black/[0.04] bg-white px-4 py-2 pl-14 dark:border-white/[0.04] dark:bg-[#07080b]">
              <div className="text-[13px] text-slate-800 dark:text-slate-200">{p.label}</div>
              <div className="font-mono text-[11px] text-slate-400">
                {p.slug} <span className="text-slate-300 dark:text-slate-600">·</span> {p.form}
              </div>
            </div>
            {groups.map((g) => {
              const on = has(draft, g.ug_code, p);
              const was = has(base, g.ug_code, p);
              return (
                <div key={g.ug_code} role="cell" className={cx('grid place-items-center border-t border-black/[0.04] dark:border-white/[0.04]', on !== was ? 'bg-brand-500/[0.12]' : g.ug_code === selected && 'bg-brand-500/[0.045]')}>
                  {g.ug_code === ADMIN ? <LockedMark /> : <TriBox value={on} disabled={!canEdit} label={`${p.label} for ${g.ug_name}`} onChange={(v) => onSet(g.ug_code, [p], v)} />}
                </div>
              );
            })}
          </React.Fragment>
        ))}
    </>
  );
}

function LockedMark() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" title="The administrator group always has every right">
      <Check className="h-3.5 w-3.5" />
    </span>
  );
}

/** Checkbox with a third, "some ticked" state. */
function TriBox({ value, onChange, disabled, label }: { value: Tri; onChange: (on: boolean) => void; disabled?: boolean; label: string }) {
  const on = value === true;
  const mixed = value === 'mixed';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? 'mixed' : on}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cx(
        'grid h-5 w-5 place-items-center rounded-md ring-1 ring-inset transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-60',
        on || mixed ? 'bg-brand-500 text-white ring-brand-500 shadow-[0_0_10px_rgb(var(--brand-500)/0.55)]' : 'bg-white/60 ring-black/15 hover:ring-brand-500/60 dark:bg-white/[0.04] dark:ring-white/20'
      )}
    >
      {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {mixed && <Minus className="h-3.5 w-3.5" strokeWidth={3} />}
    </button>
  );
}
