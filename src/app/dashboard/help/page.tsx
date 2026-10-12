'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, Bell, CheckCircle2, CircleHelp, FileCheck2, Keyboard, LayoutGrid, LifeBuoy, Lock, Moon, Search, ShieldCheck, Star, WifiOff } from 'lucide-react';
import { useSession } from '@/components/shell/AppShell';
import { Badge, Card, KeyValue, PageHeader, SearchInput, cx } from '@/components/ui/kit';
import { monthName } from '@/shared/dates';

const TIPS = [
  { icon: Search, title: 'Find any document', text: 'Type a document number, customer or vendor in the search box at the top. Press Enter to open the first match, or Ctrl + K to open search from anywhere.' },
  { icon: LayoutGrid, title: 'Find any screen', text: 'Use “Find a screen…” at the top of the side menu. It also matches older names, so “translog” finds the Audit Trail.' },
  { icon: Star, title: 'Keep your favourites', text: 'Click the star next to a page name to pin it to Favourites at the top of the menu. The legacy MyFavorites list is shared.' },
  { icon: LayoutGrid, title: 'Cards or list', text: 'Every register opens as cards. Switch to List with the toggle above it; Cloud AOS remembers your choice on this device.' },
  { icon: Bell, title: 'My tasks', text: 'The bell lists what waits for you: documents to approve or post, voids to decide, overdue advances and budgets running over.' },
  { icon: ArrowLeftRight, title: 'Switch company', text: 'If you signed in to more than one company, switch from your name at the top right. Each company keeps its own data and header.' },
  { icon: Moon, title: 'Light or dark', text: 'The sun / moon button switches the theme. Dark mode uses true black, easy on the eyes at night.' },
  { icon: WifiOff, title: 'Install and offline', text: 'Install Cloud AOS from your browser menu to open it like an app. If the connection drops, it tells you and recovers when you are back online.' },
];

const FLOW = [
  { step: 'Draft', text: 'Save as often as you like. Nothing reaches stock or the ledger yet.' },
  { step: 'Approve', text: 'Someone with the Approve right checks it against the approval limits.' },
  { step: 'Post', text: 'Stock and the general ledger are updated in the open accounting period.' },
  { step: 'Void', text: 'Mistakes are reversed through a void request, never deleted. The audit trail keeps every step.' },
];

const SHORTCUTS = [
  ['Ctrl + K', 'Open search'],
  ['Ctrl + S', 'Save the document you are editing'],
  ['Enter', 'Open the first search result / pick the highlighted item'],
  ['↑ ↓', 'Move through a picker list'],
  ['Esc', 'Close a dialog or picker'],
];

const FAQ = [
  { q: 'A screen or button is missing.', a: 'Your user group does not include it. Ask your system administrator to tick it in Group Access (the Access Matrix).' },
  { q: 'I cannot pick a date before this month.', a: 'Documents go into the open accounting period only. Finance closes and reopens periods in Accounting Periods.' },
  { q: 'My account is locked.', a: 'After five wrong passwords the account locks. An administrator can unlock it in Users.' },
  { q: 'Can I still use the old system?', a: 'Yes. Cloud AOS works on the same company databases, document numbers and rights, so both stay in step while you move over.' },
  { q: 'I saved a wrong amount on a posted document.', a: 'Request a void and enter it again. Automatic JV entries that are not yet posted can be corrected in Edit Auto JV Entries.' },
  { q: 'Somebody else sees a different menu.', a: 'The menu follows each user group. That is expected: buyers see Purchasing, cashiers see Cashiering, and so on.' },
];

export default function HelpPage() {
  const { info, can } = useSession();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const tips = useMemo(() => TIPS.filter((t) => !query || `${t.title} ${t.text}`.toLowerCase().includes(query)), [query]);
  const faq = useMemo(() => FAQ.filter((f) => !query || `${f.q} ${f.a}`.toLowerCase().includes(query)), [query]);
  const pages = Object.keys(info.rights).length;

  return (
    <>
      <PageHeader eyebrow="Cloud AOS" title="Help & About" description="How to get around, what the document steps mean, and answers to common questions." actions={<SearchInput value={q} onChange={setQ} placeholder="Search help…" className="w-full sm:w-72" />} />
      <div className="grid gap-6">
        {tips.length > 0 && (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
            {tips.map((t) => (
              <div key={t.title} className="tile p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/10 text-brand-600 ring-1 ring-inset ring-brand-500/20 dark:text-brand-300">
                  <t.icon className="h-4 w-4" />
                </span>
                <p className="mt-3 font-semibold text-slate-900 dark:text-white">{t.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{t.text}</p>
              </div>
            ))}
          </div>
        )}

        {!query && (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
            <Card title="How a document moves" icon={FileCheck2}>
              <ol className="grid gap-3">
                {FLOW.map((f, i) => (
                  <li key={f.step} className="flex gap-3">
                    <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold', i === 3 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300' : 'bg-brand-500/15 text-brand-700 dark:text-brand-300')}>{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{f.step}</p>
                      <p className="text-[13px] text-slate-600 dark:text-slate-300">{f.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
            <Card title="Keyboard shortcuts" icon={Keyboard}>
              <ul className="grid gap-2">
                {SHORTCUTS.map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-slate-600 dark:text-slate-300">{v}</span>
                    <kbd className="whitespace-nowrap rounded-lg bg-black/[0.05] px-2 py-0.5 font-mono text-[12px] text-slate-700 ring-1 ring-inset ring-black/[0.08] dark:bg-white/[0.07] dark:text-slate-200 dark:ring-white/[0.1]">{k}</kbd>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {faq.length > 0 && (
          <Card title="Common questions" icon={CircleHelp}>
            <div className="grid gap-2">
              {faq.map((f) => (
                <details key={f.q} className="tile group p-4" open={Boolean(query)}>
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 marker:hidden dark:text-white">
                    <span className="mr-2 text-brand-500 transition group-open:rotate-90">›</span>
                    {f.q}
                  </summary>
                  <p className="mt-2 pl-5 text-[13px] text-slate-600 dark:text-slate-300">{f.a}</p>
                </details>
              ))}
            </div>
          </Card>
        )}
        {query && !tips.length && !faq.length && <p className="text-sm text-slate-500">Nothing in Help matches “{q}”. Try the search box at the top to find a document.</p>}

        {!query && (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
            <Card title="About Cloud AOS" icon={LifeBuoy}>
              <KeyValue
                cols={2}
                items={[
                  { label: 'Version', value: '2.0' },
                  { label: 'Data', value: info.mode === 'demo' ? 'Sample data' : 'Company database' },
                  { label: 'Company', value: info.company.display_name },
                  { label: 'Open period', value: info.openPeriod ? `${monthName(Number(info.openPeriod.slice(5, 7)))} ${info.openPeriod.slice(0, 4)}` : '—' },
                  { label: 'Signed in as', value: `${info.user.fullName} (${info.user.username})` },
                  { label: 'User group', value: info.user.groupName },
                ]}
              />
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Cloud AOS runs on the existing AOS100 company databases: same tables, document numbers, transaction codes and group rights as the legacy system.</p>
            </Card>
            <Card title="Your access" icon={ShieldCheck}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{pages} page(s) in your group</Badge>
                {can('002') && <Badge tone="success">Can view Group Access</Badge>}
                {info.favourites.length > 0 && <Badge tone="warning">{info.favourites.length} favourite(s)</Badge>}
              </div>
              <ul className="mt-4 grid gap-2 text-[13px] text-slate-600 dark:text-slate-300">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> Cloud AOS keeps your password as an Argon2id hash from your first sign-in.
                </li>
                <li className="flex gap-2">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> The sign-in page never lists companies, to keep each client private.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href="/dashboard/account" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
                  Change password
                </Link>
                {can('002') && (
                  <Link href="/dashboard/admin/groups" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
                    Open the Access Matrix
                  </Link>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
