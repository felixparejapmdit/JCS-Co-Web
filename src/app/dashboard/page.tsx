'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Banknote, Boxes, ClipboardCheck, FilePlus2, HandCoins, PackagePlus, Receipt, ShoppingCart, Truck, Wallet } from 'lucide-react';
import { useRpc } from '@/lib/api';
import { fmtDate } from '@/shared/dates';
import { fmtMoney } from '@/shared/money';
import { useSession } from '@/components/shell/AppShell';
import { Alert, Card, EmptyState, Spinner, Stat } from '@/components/ui/kit';

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
      <div className="flex h-48 items-end gap-3 sm:gap-6">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end justify-center gap-1">
              <div className="w-1/2 max-w-[22px] rounded-t-md bg-teal-500" style={{ height: `${(d.revenue / max) * 100}%` }} title={`Revenue ${fmtMoney(d.revenue)}`} />
              <div className="w-1/2 max-w-[22px] rounded-t-md bg-slate-300 dark:bg-slate-600" style={{ height: `${(d.costs / max) * 100}%` }} title={`Costs ${fmtMoney(d.costs)}`} />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-teal-500" /> Revenue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" /> Cost of sales and expenses
        </span>
        <span>Includes entries still waiting for JV posting.</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { info, can } = useSession();
  const { data, loading, error } = useRpc<any>('home.dashboard');
  const [hideIntro, setHideIntro] = useState(true);
  useEffect(() => {
    try {
      setHideIntro(localStorage.getItem('cloudaos_intro_hidden') === '1');
    } catch {
      setHideIntro(false);
    }
  }, []);

  const quick = [
    { label: 'New sales order', href: '/dashboard/doc/so/new', form: '017', icon: ShoppingCart },
    { label: 'Record a payment', href: '/dashboard/doc/or/new', form: '010', icon: HandCoins },
    { label: 'Receive goods', href: '/dashboard/doc/mmrr/new', form: '050', icon: PackagePlus },
    { label: 'Deliver / transfer', href: '/dashboard/doc/do/new', form: '007', icon: Truck },
    { label: 'Enter a supplier bill', href: '/dashboard/doc/vp/new', form: '023', icon: Receipt },
    { label: 'Journal voucher', href: '/dashboard/doc/jv/new', form: '052', icon: FilePlus2 },
    { label: 'Request materials', href: '/dashboard/doc/riv/new', form: '054', icon: ClipboardCheck },
  ].filter((q) => can(q.form, 3));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-400">{info.company.display_name}</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {greeting()}, {info.user.fullName.split(' ')[0]}
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{fmtDate(data?.asOf ?? new Date().toISOString().slice(0, 10))}</p>
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {data.cash && <Stat label="Cash position" value={compact(data.cash.onHand + data.cash.inBank)} sub={`On hand ${compact(data.cash.onHand)} · Banks ${compact(data.cash.inBank)}`} icon={Banknote} tone="teal" href="/dashboard/fi/gl-reports" />}
              {data.ar && <Stat label="Receivables" value={compact(data.ar.total)} sub={data.ar.overdue > 0 ? `${compact(data.ar.overdue)} overdue` : 'Nothing overdue'} icon={HandCoins} tone={data.ar.overdue > 0 ? 'amber' : 'emerald'} href="/dashboard/fi/ar" />}
              {data.ap && <Stat label="Payables" value={compact(data.ap.total)} sub={`${compact(data.ap.dueThisWeek)} due within 7 days`} icon={Wallet} tone="violet" href="/dashboard/fi/ap" />}
              {data.inventory && <Stat label="Inventory value" value={compact(data.inventory.value)} sub={data.inventory.alerts ? `${data.inventory.alerts} item(s) below reorder level` : 'Stock levels healthy'} icon={Boxes} tone={data.inventory.alerts ? 'rose' : 'sky'} href="/dashboard/mm/stock" />}
              {data.sales && <Stat label="Sales this month" value={compact(data.sales.mtd)} sub={`${data.sales.invoices} invoice(s) · collected ${compact(data.sales.collections)}`} icon={ShoppingCart} tone="emerald" href="/dashboard/sd/reports" />}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card title="Waiting for you" subtitle="Work that needs your action, based on your access" className="lg:col-span-2" padded={false}>
                {data.tasks.length === 0 ? (
                  <EmptyState icon={ClipboardCheck} title="You are all caught up" text="New approvals and postings will appear here." />
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-[#1a2540]">
                    {data.tasks.map((t: any) => (
                      <li key={t.label}>
                        <Link href={t.href} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.label}</span>
                          <span className="flex items-center gap-3">
                            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-sm font-bold text-teal-800 dark:bg-teal-500/20 dark:text-teal-200">{t.count}</span>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card title="Quick actions">
                {quick.length === 0 ? (
                  <p className="text-sm text-slate-500">Your access is view-only.</p>
                ) : (
                  <div className="grid gap-2">
                    {quick.map((q) => (
                      <Link key={q.href} href={q.href} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-teal-400 hover:bg-teal-50/60 dark:border-[#24324f] dark:text-slate-200 dark:hover:bg-teal-500/10">
                        <q.icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        {q.label}
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {data.trend && (
                <Card title="Revenue and costs" subtitle={`Last ${data.trend.length} months`} className="lg:col-span-2">
                  <Trend data={data.trend} />
                </Card>
              )}
              {data.inventory && (
                <Card title="Inventory by plant" subtitle="Stock value per plant and warehouse" padded={false}>
                  <ul className="divide-y divide-slate-100 dark:divide-[#1a2540]">
                    {data.inventory.byPlant.map((p: any) => (
                      <li key={p.plntno}>
                        <Link href={`/dashboard/mm/stock?plant=${p.plntno}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">{p.plntname}</span>
                            <span className="text-xs text-slate-500">
                              {p.plntno} · {p.items} item(s){p.invset === 'N' ? ' · inventory not tracked' : ''}
                              {p.alerts ? ` · ${p.alerts} alert(s)` : ''}
                            </span>
                          </span>
                          <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">{compact(p.value)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            <Card title="Recent activity" padded={false}>
              {data.activity.length === 0 ? (
                <EmptyState title="No activity yet" />
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-[#1a2540]">
                  {data.activity.map((a: any, i: number) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">{a.user}</span> · {a.trans} {a.docno && <span className="font-mono text-xs text-slate-500">{a.docno}</span>}
                      </span>
                      <span className="text-xs text-slate-500">{a.when}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )
      )}
    </div>
  );
}
