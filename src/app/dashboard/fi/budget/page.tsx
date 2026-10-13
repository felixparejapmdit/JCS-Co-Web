'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, FileText, Gauge, PencilLine, PiggyBank, Plus, Receipt, Target, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { fmtDate } from '@/shared/dates';
import { fmtMoney, r2 } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, Combobox, EmptyState, Field, Modal, NumberInput, PageHeader, Progress, Select, Spinner, Stat, cx, useToast } from '@/components/ui/kit';
import type { StatusTone } from '@/shared/codes';

type State = 'Over budget' | 'Near limit' | 'Within budget' | 'No budget';
interface Line {
  ccno: string;
  acctno: string;
  acctdesc: string;
  budget: number;
  actual: number;
  variance: number;
  used: number | null;
  state: State;
}
interface Center {
  ccno: string;
  ccdesc: string;
  budget: number;
  actual: number;
  variance: number;
  used: number | null;
  state: State;
  over: number;
  lines: Line[];
}
interface Monitor {
  datefr: string;
  dateto: string;
  label: string;
  centers: Center[];
  totals: { budget: number; actual: number; over: number };
}

const TONE: Record<State, StatusTone> = { 'Over budget': 'danger', 'Near limit': 'warning', 'Within budget': 'success', 'No budget': 'neutral' };
const DOC_LABEL: Record<string, string> = { pcv: 'Petty cash', rfv: 'Revolving fund', vp: 'Voucher', cv: 'Cheque', liq: 'Liquidation' };

function Meter({ budget, actual }: { budget: number; actual: number }) {
  const pct = budget > 0 ? Math.round((actual / budget) * 100) : null;
  return (
    <div className="space-y-1.5">
      <Progress value={actual} max={budget > 0 ? budget : Math.max(actual, 1)} tone={budget > 0 ? 'auto' : 'violet'} />
      <div className="flex items-center justify-between text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
        <span>{pct === null ? 'No budget set' : `${pct}% used`}</span>
        <span>
          ₱{fmtMoney(actual)} of ₱{fmtMoney(budget)}
        </span>
      </div>
    </div>
  );
}

export default function BudgetPage() {
  const { can } = useSession();
  const toast = useToast();
  const { data: periods, error: pErr } = useRpc<{ datefr: string; dateto: string; label: string }[]>('budget.periods');
  const [period, setPeriod] = useState('');
  const [cc, setCc] = useState<string | null>(null);
  const [detail, setDetail] = useState<Line | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!period && periods?.length) {
      const today = new Date().toISOString().slice(0, 10);
      const current = periods.find((p) => p.datefr <= today && p.dateto >= today) ?? periods[0];
      setPeriod(`${current.datefr}|${current.dateto}`);
    }
  }, [periods, period]);

  const [datefr, dateto] = period.split('|');
  const { data, loading, error, reload } = useRpc<Monitor>(period ? 'budget.monitor' : null, { datefr, dateto });
  const center = data?.centers.find((c) => c.ccno === cc) ?? null;
  const remaining = data ? r2(data.totals.budget - data.totals.actual) : 0;

  return (
    <RequireRight form="079">
      <PageHeader
        eyebrow="General Ledger"
        title="Budget Monitoring"
        description="Budget against actual spending for every cost center. Actual spending comes from posted fund vouchers, vouchers payable, cheques, payroll and liquidations, as in the legacy Budget Monitor."
        actions={
          <>
            {periods && periods.length > 0 && (
              <Select
                aria-label="Budget period"
                className="w-48"
                value={period}
                options={periods.map((p) => ({ value: `${p.datefr}|${p.dateto}`, label: p.label }))}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  setCc(null);
                }}
              />
            )}
            {can('079', 2) && (
              <Button variant="primary" icon={PencilLine} onClick={() => setEditing(true)} disabled={!period}>
                {center ? `Edit ${center.ccno} budget` : 'Edit a budget'}
              </Button>
            )}
          </>
        }
      />
      {pErr && <Alert tone="danger">{pErr}</Alert>}
      {periods && periods.length === 0 && (
        <Card>
          <EmptyState icon={Target} title="No budgets yet" text="Create the first budget: choose a cost center, enter the period and the amount per account." action={can('079', 2) ? <Button variant="primary" icon={Plus} onClick={() => setEditing(true)}>Create a budget</Button> : undefined} />
        </Card>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      {loading && !data ? (
        <Spinner />
      ) : (
        data && (
          <div className="space-y-6">
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
              <Stat label={`Budget · ${data.label}`} value={`₱${fmtMoney(data.totals.budget)}`} sub={`${data.centers.length} cost centers`} icon={PiggyBank} tone="blue" />
              <Stat label="Actual spending" value={`₱${fmtMoney(data.totals.actual)}`} sub={data.totals.budget ? `${Math.round((data.totals.actual / data.totals.budget) * 100)}% of the budget` : undefined} icon={Receipt} tone="violet" />
              <Stat label={remaining >= 0 ? 'Remaining' : 'Over budget'} value={`₱${fmtMoney(Math.abs(remaining))}`} sub={remaining >= 0 ? 'Still available this period' : 'Spent above the budget'} icon={remaining >= 0 ? TrendingDown : TrendingUp} tone={remaining >= 0 ? 'emerald' : 'rose'} />
              <Stat label="Cost centers over budget" value={data.totals.over} sub={data.totals.over ? 'Open a cost center to see which accounts' : 'Everyone is within budget'} icon={Gauge} tone={data.totals.over ? 'amber' : 'emerald'} />
            </div>

            {!center ? (
              <Card title="Cost centers" subtitle="Click a cost center to see its accounts" icon={Building2} padded={false}>
                <div className="grid gap-3 p-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
                  {data.centers.map((c) => (
                    <button key={c.ccno} onClick={() => setCc(c.ccno)} className="tile-interactive flex flex-col gap-3 p-4 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold tracking-tight text-slate-900 dark:text-white">{c.ccdesc}</div>
                          <div className="font-mono text-xs text-slate-500">{c.ccno}</div>
                        </div>
                        <Badge tone={TONE[c.state]}>{c.state}</Badge>
                      </div>
                      <Meter budget={c.budget} actual={c.actual} />
                      <div className="flex items-center justify-between border-t border-black/[0.05] pt-3 text-[13px] dark:border-white/[0.06]">
                        <span className="text-slate-500">{c.lines.length} account(s)</span>
                        <span className={cx('font-semibold tabular-nums', c.variance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                          {c.variance < 0 ? `₱${fmtMoney(-c.variance)} over` : `₱${fmtMoney(c.variance)} left`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            ) : (
              <Card
                title={`${center.ccdesc} (${center.ccno})`}
                subtitle={`${data.label} · click an account to see the documents behind it`}
                icon={Building2}
                actions={
                  <Button size="sm" icon={ArrowLeft} onClick={() => setCc(null)}>
                    All cost centers
                  </Button>
                }
                padded={false}
              >
                <div className="px-5 pt-4">
                  <Meter budget={center.budget} actual={center.actual} />
                </div>
                <div className="grid gap-3 p-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,270px),1fr))]">
                  {center.lines.map((l) => (
                    <button key={l.acctno} onClick={() => setDetail(l)} className="tile-interactive flex flex-col gap-3 p-4 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold tracking-tight text-slate-900 dark:text-white">{l.acctdesc}</div>
                          <div className="font-mono text-xs text-slate-500">{l.acctno}</div>
                        </div>
                        <Badge tone={TONE[l.state]}>{l.state}</Badge>
                      </div>
                      <Meter budget={l.budget} actual={l.actual} />
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )
      )}

      {detail && data && <ActualDocs line={detail} datefr={data.datefr} dateto={data.dateto} onClose={() => setDetail(null)} />}
      {editing && data && (
        <BudgetEditor
          datefr={data.datefr}
          dateto={data.dateto}
          label={data.label}
          centers={data.centers}
          initial={center?.ccno ?? ''}
          onClose={() => setEditing(false)}
          onSaved={async (msg) => {
            toast.success(msg);
            setEditing(false);
            await reload();
          }}
        />
      )}
    </RequireRight>
  );
}

function ActualDocs({ line, datefr, dateto, onClose }: { line: Line; datefr: string; dateto: string; onClose: () => void }) {
  const { data, error } = useRpc<any[]>('budget.detail', { datefr, dateto, ccno: line.ccno, acctno: line.acctno });
  return (
    <Modal open side size="md" onClose={onClose} title={line.acctdesc} description={`${line.ccno} · ₱${fmtMoney(line.actual)} spent of ₱${fmtMoney(line.budget)}`}>
      {error ? (
        <Alert tone="danger">{error}</Alert>
      ) : !data ? (
        <Spinner />
      ) : !data.length ? (
        <EmptyState icon={FileText} title="No spending yet" text="Nothing has been charged to this account in this period." />
      ) : (
        <div className="grid gap-2">
          {data.map((d) => {
            const body = (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{d.docno}</div>
                  <div className="truncate text-xs text-slate-500">
                    {DOC_LABEL[d.type] ?? (d.tc === '45' ? 'Payroll' : `TC ${d.tc}`)} · {fmtDate(d.transdate)}
                    {d.payee ? ` · ${d.payee}` : ''}
                  </div>
                </div>
                <div className="text-right font-semibold tabular-nums text-slate-900 dark:text-white">₱{fmtMoney(d.amount)}</div>
              </div>
            );
            return d.type ? (
              <Link key={`${d.tc}-${d.docno}`} href={`/dashboard/doc/${d.type}/${encodeURIComponent(d.docno)}`} className="tile-interactive block px-4 py-3">
                {body}
              </Link>
            ) : (
              <div key={`${d.tc}-${d.docno}`} className="tile px-4 py-3">
                {body}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function BudgetEditor({
  datefr,
  dateto,
  label,
  centers,
  initial,
  onClose,
  onSaved,
}: {
  datefr: string;
  dateto: string;
  label: string;
  centers: Center[];
  initial: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [ccno, setCcno] = useState(initial);
  const [lines, setLines] = useState<{ acctno: string; budamt: number | '' }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = centers.find((x) => x.ccno === ccno);
    setLines(c ? c.lines.filter((l) => l.budget > 0 || l.actual > 0).map((l) => ({ acctno: l.acctno, budamt: l.budget || '' })) : [{ acctno: '', budamt: '' }]);
  }, [ccno, centers]);

  const total = useMemo(() => lines.reduce((s, l) => s + (Number(l.budamt) || 0), 0), [lines]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await rpc<string>('budget.save', { datefr, dateto, ccno, lines }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      side
      size="lg"
      onClose={onClose}
      title={`Budget for ${label}`}
      description="One amount per account. Accounts already spent on this period are listed so nothing is forgotten."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} disabled={!ccno} onClick={save}>
            Save budget · ₱{fmtMoney(total)}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Cost center" required>
          <Combobox lookup="costCenters" value={ccno} onChange={(v) => setCcno(v)} placeholder="Choose the cost center" />
        </Field>
        {ccno && (
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="tile grid grid-cols-[1fr_9rem_2.25rem] items-end gap-2 p-2">
                <Field label={i === 0 ? 'Account' : undefined}>
                  <Combobox compact lookup="accounts" value={l.acctno} onChange={(v) => setLines(lines.map((x, j) => (j === i ? { ...x, acctno: v } : x)))} placeholder="Account" />
                </Field>
                <Field label={i === 0 ? 'Budget' : undefined}>
                  <NumberInput className="h-8" value={l.budamt} onValue={(v) => setLines(lines.map((x, j) => (j === i ? { ...x, budamt: v } : x)))} />
                </Field>
                <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="mb-0.5 rounded-lg p-1.5 text-rose-500/80 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400/80" aria-label={`Remove line ${i + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setLines([...lines, { acctno: '', budamt: '' }])}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-black/[0.12] py-2.5 text-sm font-medium text-slate-500 transition hover:border-brand-500/50 hover:text-brand-700 dark:border-white/[0.12] dark:text-slate-400 dark:hover:text-brand-300"
            >
              <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Add account
            </button>
          </div>
        )}
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    </Modal>
  );
}
