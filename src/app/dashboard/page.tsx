'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Banknote, Boxes, ClipboardCheck, Coins, FilePlus2, HandCoins, Inbox, PackagePlus, Receipt, ShoppingCart, Sparkles, TrendingUp, Truck, Wallet, Warehouse } from 'lucide-react';
import { useRpc } from '@/lib/api';
import { fmtDate, monthName } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { useSession } from '@/components/shell/AppShell';
import { Alert, Card, EmptyState, ICON_CHIP, ICON_TEXT, Spinner, Stat, cx, toneOfForm, toneOfText } from '@/components/ui/kit';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function compact(n: number) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
  if (a >= 10_000) return `₱${(n / 1_000).toFixed(0)}K`;
  return `₱${fmtMoney(n)}`;
}

function Trend({ data }: { data: { label: string; revenue: number; costs: number; profit: number }[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.revenue, d.costs]));
  return (
    <div>
      <div className="flex h-56 items-end gap-3 sm:gap-6">
        {data.map((d) => (
          <div key={d.label} className="group flex flex-1 flex-col items-center gap-2">
            <span className={cx('text-[11px] font-semibold tabular-nums opacity-70 transition group-hover:opacity-100', d.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {d.revenue || d.costs ? `${d.profit >= 0 ? '+' : ''}${compact(d.profit)}` : ''}
            </span>
            <div className="flex h-40 w-full items-end justify-center gap-1.5">
              <div
                className="w-1/2 max-w-[26px] rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 shadow-[0_0_18px_-2px_rgba(47,127,255,0.55)] transition-all duration-500"
                style={{ height: `${Math.max(1, (d.revenue / max) * 100)}%` }}
                title={`Revenue ₱${fmtMoney(d.revenue)}`}
              />
              <div className="w-1/2 max-w-[26px] rounded-t-lg bg-gradient-to-t from-slate-400 to-slate-300 transition-all duration-500 dark:from-slate-600 dark:to-slate-500" style={{ height: `${Math.max(1, (d.costs / max) * 100)}%` }} title={`Costs ₱${fmtMoney(d.costs)}`} />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(47,127,255,0.8)]" /> Revenue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Cost of sales and expenses
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Profit
        </span>
        <span>Includes entries still waiting for JV posting.</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { info, can } = useSession();
  const { data, loading, error } = useRpc<any>('home.dashboard');
  // Read before the first paint (the dashboard only renders in the browser), so the intro never jumps.
  const [hideIntro, setHideIntro] = useState(() => {
    try {
      return localStorage.getItem('cloudaos_intro_hidden') === '1';
    } catch {
      return false;
    }
  });

  const quick = [
    { label: 'New sales order', href: '/dashboard/doc/so/new', form: '017', icon: ShoppingCart },
    { label: 'Record a payment', href: '/dashboard/doc/or/new', form: '010', icon: HandCoins },
    { label: 'Receive goods', href: '/dashboard/doc/mmrr/new', form: '050', icon: PackagePlus },
    { label: 'Deliver / transfer', href: '/dashboard/doc/do/new', form: '007', icon: Truck },
    { label: 'Enter a supplier bill', href: '/dashboard/doc/vp/new', form: '023', icon: Receipt },
    { label: 'Petty cash voucher', href: '/dashboard/doc/pcv/new', form: '026', icon: Coins },
    { label: 'Liquidate an advance', href: '/dashboard/doc/liq', form: '038', icon: Wallet },
    { label: 'Journal voucher', href: '/dashboard/doc/jv/new', form: '052', icon: FilePlus2 },
    { label: 'Request materials', href: '/dashboard/doc/riv/new', form: '054', icon: ClipboardCheck },
  ].filter((q) => can(q.form, 3));

  const first = info.user.fullName.split(' ')[0];
  const period = info.openPeriod ? `${monthName(Number(info.openPeriod.slice(5, 7)))} ${info.openPeriod.slice(0, 4)}` : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="neon-text text-xs font-semibold uppercase tracking-[0.16em]">{info.company.display_name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[40px] sm:leading-[1.1]">
            {greeting()}, <span className="neon-text">{first}</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          {period && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" /> Open period: {period}
            </span>
          )}
          <span className="rounded-full bg-black/[0.04] px-3 py-1 text-xs dark:bg-white/[0.06]">{fmtDate(data?.asOf ?? new Date().toISOString().slice(0, 10))}</span>
        </div>
      </div>

      {info.mode === 'demo' && !hideIntro && (
        <Alert
          tone="info"
          title="This is the Cloud AOS preview with sample data"
          onClose={() => {
            setHideIntro(true);
            try {
              localStorage.setItem('cloudaos_intro_hidden', '1');
            } catch {}
          }}
        >
          Every screen works like the real system: documents number themselves, stock and accounts update automatically, and approvals follow your access rights. In the live system the same screens read and write your existing AOS100 database.
        </Alert>
      )}

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,188px),1fr))]">
              {data.cash && <Stat label="Cash position" value={compact(data.cash.onHand + data.cash.inBank)} sub={`On hand ${compact(data.cash.onHand)} · Banks ${compact(data.cash.inBank)}`} icon={Banknote} tone="teal" href="/dashboard/fi/gl-reports" />}
              {data.ar && <Stat label="Receivables" value={compact(data.ar.total)} sub={data.ar.overdue > 0 ? `${compact(data.ar.overdue)} overdue` : 'Nothing overdue'} icon={HandCoins} tone="emerald" href="/dashboard/fi/ar" />}
              {data.ap && <Stat label="Payables" value={compact(data.ap.total)} sub={`${compact(data.ap.dueThisWeek)} due within 7 days`} icon={Wallet} tone="amber" href="/dashboard/fi/ap" />}
              {data.inventory && <Stat label="Inventory value" value={compact(data.inventory.value)} sub={data.inventory.alerts ? `${data.inventory.alerts} item(s) below reorder level` : 'Stock levels healthy'} icon={Boxes} tone="cyan" href="/dashboard/mm/stock" />}
              {data.sales && <Stat label="Sales this month" value={compact(data.sales.mtd)} sub={`${data.sales.invoices} invoice(s) · collected ${compact(data.sales.collections)}`} icon={TrendingUp} tone="violet" href="/dashboard/sd/reports" />}
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <Card title="Waiting for you" subtitle="Work that needs your action, based on your access" icon={Inbox} className="lg:col-span-7" padded={false}>
                {data.tasks.length === 0 ? (
                  <EmptyState icon={ClipboardCheck} title="You are all caught up" text="New approvals and postings will appear here." />
                ) : (
                  <div className="grid gap-2 p-4 sm:grid-cols-2">
                    {data.tasks.map((t: any) => (
                      <Link key={t.label} href={t.href} className="tile-interactive flex items-center justify-between gap-3 px-4 py-3">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.label}</span>
                        <span className="flex items-center gap-2">
                          <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-sm font-bold tabular-nums text-brand-700 ring-1 ring-inset ring-brand-500/20 dark:bg-brand-400/15 dark:text-brand-200">{t.count}</span>
                          <ArrowRight className={cx('h-4 w-4', ICON_TEXT[toneOfText(t.label)])} />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
              <Card title="Quick actions" subtitle="Start the most common documents" icon={Sparkles} className="lg:col-span-5">
                {quick.length === 0 ? (
                  <p className="text-sm text-slate-500">Your access is view-only.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {quick.map((q) => (
                      <Link key={q.href} href={q.href} className="tile-interactive flex flex-col gap-2 p-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <span className={cx('flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-inset', ICON_CHIP[toneOfForm(q.form)])}>
                          <q.icon className="h-4 w-4" />
                        </span>
                        {q.label}
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {data.trend && (
                <Card title="Revenue and costs" subtitle={`Last ${data.trend.length} months`} icon={TrendingUp} className="lg:col-span-8">
                  <Trend data={data.trend} />
                </Card>
              )}
              {data.inventory && (
                <Card title="Inventory by plant" subtitle="Stock value per plant and warehouse" icon={Warehouse} className="lg:col-span-4" padded={false}>
                  <div className="grid grid-cols-[minmax(0,1fr)] gap-2 p-4">
                    {data.inventory.byPlant.map((p: any) => (
                      <Link key={p.plntno} href={`/dashboard/mm/stock?plant=${p.plntno}`} className="tile-interactive flex items-center justify-between gap-3 px-4 py-3">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">{p.plntname}</span>
                          <span className="text-xs text-slate-500">
                            {p.plntno} · {p.items} item(s){p.invset === 'N' ? ' · inventory not tracked' : ''}
                            {p.alerts ? ` · ${p.alerts} alert(s)` : ''}
                          </span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{compact(p.value)}</span>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <Card title="Recent activity" subtitle="Everything done in this company, newest first" icon={Activity}>
              {data.activity.length === 0 ? (
                <EmptyState title="No activity yet" />
              ) : (
                <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-black/[0.08] dark:before:bg-white/[0.08]">
                  {data.activity.map((a: any, i: number) => (
                    <li key={i} className="relative flex flex-wrap items-start justify-between gap-2 pl-6 text-sm">
                      <span className={cx('absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full ring-4 ring-white/80 dark:ring-black/60', i === 0 ? 'bg-brand-500 shadow-[0_0_10px_rgba(47,127,255,0.9)]' : 'bg-slate-300 dark:bg-slate-600')} />
                      <span className="text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">{a.user}</span> · {a.trans} {a.docno && <span className="font-mono text-xs text-slate-500">{a.docno}</span>}
                      </span>
                      <span className="text-xs tabular-nums text-slate-500">{a.when}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </>
        )
      )}
    </div>
  );
}
