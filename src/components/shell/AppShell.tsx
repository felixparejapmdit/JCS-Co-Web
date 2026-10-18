'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  Bell,
  ChevronDown,
  ChevronRight,
  Home,
  KeyRound,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Search,
  Star,
  Sun,
  Wrench,
  X,
} from 'lucide-react';
import { ApiError, CHANGED_EVENT, clearLookups, forgetSession, rpc } from '@/lib/api';
import { fmtDate, monthName } from '@/shared/dates';
import { Badge, ICON_TEXT, MODULE_TONE, Modal, Spinner, ToastProvider, cx } from '@/components/ui/kit';
import { NAV, findNav } from './nav';

export interface Branding {
  ba: string;
  display_name: string;
  tagline: string;
  logo_text: string;
  accent: string;
  logo_data: string | null;
  show_code: string;
}

export interface SessionInfo {
  user: { username: string; fullName: string; group: string; groupName: string };
  company: Branding;
  legal: { bussname: string; address: string; tin: string };
  otherCompanies: { ba: string; name: string }[];
  rights: Record<string, number[]>;
  openPeriod: string;
  mode: 'demo' | 'mysql';
  /** memory | mysql-sample | mysql (Administration > Data Source) */
  source?: 'memory' | 'mysql-sample' | 'mysql';
  favourites: { href: string; label: string; section: string; form: string }[];
  maintenance: { on: boolean; message: string; bypass: boolean };
}

interface SessionCtxValue {
  info: SessionInfo;
  can: (form: string, action?: number) => boolean;
  refresh: () => Promise<void>;
}

const SessionCtx = createContext<SessionCtxValue | null>(null);

/** This tab's last session info, so a reload paints the shell at once (cleared on sign-out and company switch). */
const SESSION_KEY = 'cloudaos_session_info';

export function useSession(): SessionCtxValue {
  const v = useContext(SessionCtx);
  if (!v) throw new Error('useSession must be used inside the app shell');
  return v;
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : p[0]?.[1] ?? '')).toUpperCase();
}

/** The client's own header at the top of the sidebar. It shows only the signed-in company. */
export function ClientHeader({ b, period }: { b: Branding; period?: string }) {
  return (
    <div className="relative overflow-hidden px-4 pb-4 pt-5">
      <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: b.accent }} />
      <div className="absolute inset-x-4 top-0 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${b.accent}, transparent)` }} />
      <div className="relative flex items-center gap-3">
        {b.logo_data ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.logo_data} alt={`${b.display_name} logo`} className="h-11 w-11 flex-shrink-0 rounded-2xl bg-white object-contain p-1 shadow-sm ring-1 ring-black/[0.06]" />
        ) : (
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-[15px] font-bold tracking-tight text-white ring-1 ring-white/20" style={{ background: b.accent, boxShadow: `0 8px 24px -6px ${b.accent}` }}>
            {b.logo_text}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">{b.display_name}</div>
          {b.tagline && <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{b.tagline}</div>}
        </div>
      </div>
      {(b.show_code === 'Y' || period) && (
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          {b.show_code === 'Y' && <span className="rounded-lg bg-black/[0.05] px-2 py-0.5 font-medium dark:bg-white/[0.07]">BA {b.ba}</span>}
          {period && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/[0.05] px-2 py-0.5 dark:bg-white/[0.07]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              Open period: {monthName(Number(period.slice(5, 7)))} {period.slice(0, 4)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem('aos100_theme_mode', next ? 'dark' : 'light');
    } catch {}
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
    document.documentElement.style.backgroundColor = next ? '#000000' : '#f3f4f7';
  };
  return { dark, toggle };
}

function Sidebar({ info, can, onNavigate }: { info: SessionInfo; can: SessionCtxValue['can']; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [filter, setFilter] = useState('');
  const current = findNav(pathname).group?.id;
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    let saved: Record<string, boolean> = {};
    try {
      saved = JSON.parse(localStorage.getItem('cloudaos_nav') || '{}');
    } catch {}
    return current ? { ...saved, [current]: true } : saved;
  });

  useEffect(() => {
    if (current) setOpen((o) => ({ ...o, [current]: true }));
  }, [current]);

  const toggle = (id: string) =>
    setOpen((o) => {
      const n = { ...o, [id]: !o[id] };
      try {
        localStorage.setItem('cloudaos_nav', JSON.stringify(n));
      } catch {}
      return n;
    });

  const groups = NAV.filter((g) => g.id !== 'reports')
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.form) && (!filter || `${i.label} ${g.label} ${i.keywords ?? ''}`.toLowerCase().includes(filter.toLowerCase()))) }))
    .filter((g) => g.items.length);
  const favs = (info.favourites ?? []).filter((f) => !filter || `${f.label} ${f.section}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="glass glass-float flex h-full flex-col overflow-hidden rounded-3xl text-slate-700 dark:text-slate-300">
      <ClientHeader b={info.company} period={info.openPeriod} />
      <div className="px-3 py-3">
        <div className="relative">
          <Search className={cx('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', ICON_TEXT.sky)} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find a screen…"
            className="h-9 w-full rounded-xl border border-black/[0.07] bg-white/60 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500/60 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
          />
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Main menu">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors', pathname === '/dashboard' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/[0.05] dark:bg-white/[0.09] dark:text-white dark:ring-white/[0.08]' : 'hover:bg-black/[0.04] hover:text-slate-900 dark:hover:bg-white/[0.05] dark:hover:text-white')}
        >
          <Home className={cx('h-4 w-4', ICON_TEXT.brand)} />
          Home
        </Link>
        {favs.length > 0 && (
          <div className="pb-1">
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-900 dark:text-white">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Favourites
            </div>
            <div className="mb-1 ml-5 border-l border-black/[0.08] pl-2 dark:border-white/[0.08]">
              {favs.map((f) => {
                const active = pathname === f.href || pathname.startsWith(f.href + '/');
                return (
                  <Link
                    key={f.href}
                    href={f.href}
                    onClick={onNavigate}
                    title={f.section}
                    className={cx('relative block truncate rounded-lg px-3 py-1.5 text-[13px] transition-colors', active ? 'bg-white font-semibold text-slate-900 shadow-sm ring-1 ring-black/[0.05] dark:bg-white/[0.09] dark:text-white dark:ring-white/[0.08]' : 'text-slate-500 hover:bg-black/[0.04] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white')}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        {groups.map((g) => {
          const Icon = g.icon;
          const isOpen = filter ? true : open[g.id];
          return (
            <div key={g.id}>
              <button
                onClick={() => toggle(g.id)}
                className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors', current === g.id ? 'text-slate-900 dark:text-white' : 'hover:bg-black/[0.04] hover:text-slate-900 dark:hover:bg-white/[0.05] dark:hover:text-white')}
                aria-expanded={isOpen}
              >
                <Icon className={cx('h-4 w-4 flex-shrink-0', ICON_TEXT[MODULE_TONE[g.id] ?? 'brand'])} />
                <span className="flex-1 truncate text-left">{g.label}</span>
                <ChevronRight className={cx('h-4 w-4 text-slate-400 transition-transform', isOpen && 'rotate-90')} />
              </button>
              {isOpen && (
                <div className="mb-1 ml-5 border-l border-black/[0.08] pl-2 dark:border-white/[0.08]">
                  {g.items.map((i) => {
                    const active = pathname === i.href || pathname.startsWith(i.href + '/');
                    return (
                      <Link
                        key={i.href}
                        href={i.href}
                        onClick={onNavigate}
                        className={cx('relative block rounded-lg px-3 py-1.5 text-[13px] transition-colors', active ? 'bg-white font-semibold text-slate-900 shadow-sm ring-1 ring-black/[0.05] dark:bg-white/[0.09] dark:text-white dark:ring-white/[0.08]' : 'text-slate-500 hover:bg-black/[0.04] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white')}
                      >
                        {active && <span className="absolute -left-[9px] top-1.5 bottom-1.5 w-[3px] rounded-full" style={{ background: info.company.accent, boxShadow: `0 0 10px ${info.company.accent}` }} />}
                        {i.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!groups.length && <p className="px-3 py-4 text-sm text-slate-400">No screen matches “{filter}”.</p>}
      </nav>
      <div className="border-t border-black/[0.06] px-4 py-3 text-[11px] text-slate-500 dark:border-white/[0.07] dark:text-slate-400">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold tracking-wide text-slate-700 dark:text-slate-200">
            Cloud <span className="neon-text">AOS</span>
          </span>
          <Link href="/dashboard/help" onClick={onNavigate} className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 hover:bg-black/[0.04] hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-white">
            <LifeBuoy className={cx('h-3.5 w-3.5', ICON_TEXT.sky)} /> Help
          </Link>
          <span>{info.source === 'mysql-sample' ? 'Sample data · MySQL' : info.mode === 'demo' ? 'Sample data' : 'Company database'}</span>
        </div>
      </div>
    </div>
  );
}

function GlobalSearch({ onDone, autoFocus }: { onDone?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setBusy(true);
    const t = setTimeout(() => {
      rpc<any[]>('search', { q })
        .then((r) => {
          setResults(r);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setBusy(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const go = (r: any) => {
    setOpen(false);
    setQ('');
    onDone?.();
    router.push(`/dashboard/doc/${r.type}/${encodeURIComponent(r.no)}`);
  };

  return (
    <div ref={box} className="relative w-full">
      <Search className={cx('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', ICON_TEXT.sky)} />
      <input
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && results[0] && go(results[0])}
        placeholder="Find a document: PO, invoice, receipt, customer…"
        className="h-9 w-full rounded-xl border border-black/[0.07] bg-white/60 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500/60 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-100 dark:focus:bg-white/[0.07]"
      />
      {open && q.trim().length >= 2 && (
        <div className="glass-strong absolute z-50 mt-1.5 max-h-96 w-full overflow-y-auto rounded-2xl p-1">
          {busy && !results.length ? (
            <div className="px-4 py-3 text-sm text-slate-500">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">No documents found for “{q}”.</div>
          ) : (
            results.map((r) => (
              <button key={`${r.type}-${r.no}`} onClick={() => go(r)} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-brand-500/10 dark:hover:bg-brand-400/10">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {r.title} {r.no}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {r.party} {r.date ? `· ${fmtDate(r.date)}` : ''}
                  </div>
                </div>
                <Badge tone={r.tone}>{r.status}</Badge>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TasksBell() {
  const [tasks, setTasks] = useState<{ label: string; count: number; href: string }[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fetchTasks = () =>
      rpc<any[]>('home.tasks')
        .then(setTasks)
        .catch(() => {});
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(fetchTasks, 1200);
    };
    fetchTasks();
    const every = setInterval(fetchTasks, 120_000);
    window.addEventListener(CHANGED_EVENT, soon);
    return () => {
      clearTimeout(timer);
      clearInterval(every);
      window.removeEventListener(CHANGED_EVENT, soon);
    };
  }, []);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const total = tasks.reduce((s, t) => s + t.count, 0);
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white" aria-label={`${total} tasks waiting`}>
        <Bell className={cx('h-5 w-5', ICON_TEXT.amber)} />
        {total > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-b from-brand-500 to-brand-600 px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(47,127,255,0.8)]">{total > 99 ? '99+' : total}</span>}
      </button>
      {open && (
        <div className="glass-strong absolute right-0 z-50 mt-2 w-80 rounded-2xl p-2">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Waiting for you</p>
          {tasks.length === 0 ? (
            <p className="px-2 py-3 text-sm text-slate-500">You are all caught up.</p>
          ) : (
            tasks.map((t) => (
              <Link key={t.label} href={t.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-black/[0.04] dark:text-slate-200 dark:hover:bg-white/5">
                <span>{t.label}</span>
                <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-bold tabular-nums text-brand-700 dark:bg-brand-400/20 dark:text-brand-200">{t.count}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function UserMenu({ info, onSwitch }: { info: SessionInfo; onSwitch: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const signOut = async () => {
    try {
      await rpc('auth.logout');
    } catch {}
    forgetSession();
    router.replace('/');
  };
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100 dark:hover:bg-white/5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: info.company.accent }}>
          {initials(info.user.fullName)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[160px] truncate text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">{info.user.fullName}</span>
          <span className="block max-w-[160px] truncate text-xs text-slate-500 dark:text-slate-400">{info.user.groupName}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
      </button>
      {open && (
        <div className="glass-strong absolute right-0 z-50 mt-2 w-64 rounded-2xl p-1.5">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{info.user.fullName}</p>
            <p className="text-xs text-slate-500">
              {info.user.username} · {info.user.groupName}
            </p>
          </div>
          <div className="my-1 border-t border-slate-100 dark:border-white/[0.07]" />
          {info.otherCompanies.length > 0 && (
            <button
              onClick={() => {
                setOpen(false);
                onSwitch();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-black/[0.04] dark:text-slate-200 dark:hover:bg-white/5"
            >
              <ArrowLeftRight className={cx('h-4 w-4', ICON_TEXT.violet)} /> Switch company
            </button>
          )}
          <Link href="/dashboard/account" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-black/[0.04] dark:text-slate-200 dark:hover:bg-white/5">
            <KeyRound className={cx('h-4 w-4', ICON_TEXT.amber)} /> Change password
          </Link>
          <Link href="/dashboard/help" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-black/[0.04] dark:text-slate-200 dark:hover:bg-white/5">
            <LifeBuoy className={cx('h-4 w-4', ICON_TEXT.sky)} /> Help &amp; About
          </Link>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const { dark, toggle } = useTheme();

  const load = useCallback(async () => {
    try {
      const fresh = await rpc<SessionInfo>('auth.session');
      setInfo(fresh);
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
      } catch {}
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        forgetSession();
        router.replace('/?expired=1');
      } else setFailed(e instanceof Error ? e.message : String(e));
    }
  }, [router]);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) setInfo(JSON.parse(cached));
    } catch {}
    load();
  }, [load]);

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const can = useCallback((form: string, action = 1) => Boolean(info?.rights[form]?.includes(action)), [info]);
  const ctx = useMemo(() => (info ? { info, can, refresh: load } : null), [info, can, load]);

  if (failed)
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">Cloud AOS could not load your workspace.</p>
          <p className="mt-1 text-sm text-slate-500">{failed}</p>
          <button className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  if (!info || !ctx) return <Spinner label="Opening your workspace…" />;
  if (info.maintenance?.on && !info.maintenance.bypass) return <MaintenanceScreen info={info} onRetry={load} />;

  const here = findNav(pathname);
  const doSwitch = async (ba: string) => {
    setSwitching(ba);
    try {
      await rpc('auth.switch', { ba });
      forgetSession();
      window.location.href = '/dashboard';
    } catch (e) {
      setSwitching(null);
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <SessionCtx.Provider value={ctx}>
      <ToastProvider>
        <div className="min-h-screen">
          {/* Desktop sidebar: a floating glass panel */}
          <aside className="fixed inset-y-3 left-3 z-30 hidden w-[264px] lg:block">
            <Sidebar info={info} can={can} />
          </aside>
          {/* Mobile drawer */}
          {drawer && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
              <div className="absolute inset-y-2 left-2 w-[86vw] max-w-[300px]">
                <button onClick={() => setDrawer(false)} className="absolute right-3 top-3 z-10 rounded-xl p-1.5 text-slate-500 hover:bg-black/[0.05] dark:text-slate-300 dark:hover:bg-white/10" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
                <Sidebar info={info} can={can} onNavigate={() => setDrawer(false)} />
              </div>
            </div>
          )}

          <div className="lg:pl-[279px]">
            <header className="glass glass-float sticky top-0 z-20 flex h-16 items-center gap-3 rounded-b-2xl border-t-0 px-4 sm:px-6 lg:top-3 lg:mx-3 lg:rounded-2xl lg:border-t">
              <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 lg:hidden" aria-label="Open menu">
                <Menu className={cx('h-5 w-5', ICON_TEXT.violet)} />
              </button>
              <div className="hidden min-w-0 items-center gap-1.5 whitespace-nowrap text-sm md:flex">
                <Link href="/dashboard" className="text-slate-500 hover:text-brand-700 dark:text-slate-400">
                  Home
                </Link>
                {here.group && (
                  <>
                    <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 xl:block" />
                    <span className="hidden text-slate-500 dark:text-slate-400 xl:inline">{here.group.label}</span>
                  </>
                )}
                {here.item && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    <Link href={here.item.href} className="max-w-[220px] truncate font-semibold text-slate-800 dark:text-slate-100">
                      {here.item.label}
                    </Link>
                  </>
                )}
              </div>
              {here.item && <FavStar href={here.item.href} label={here.item.label} info={info} onChanged={load} />}
              <div className="ml-auto hidden w-full max-w-md sm:block">
                <GlobalSearch />
              </div>
              <div className="ml-auto flex items-center gap-1 sm:ml-2">
                {(info.mode === 'demo' || info.source === 'mysql-sample') && <span className="hidden whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 2xl:inline">{info.source === 'mysql-sample' ? 'Sample data · MySQL' : 'Sample data'}</span>}
                <button onClick={toggle} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white" aria-label="Switch light or dark theme">
                  {dark ? <Sun className={cx('h-5 w-5', ICON_TEXT.amber)} /> : <Moon className={cx('h-5 w-5', ICON_TEXT.indigo)} />}
                </button>
                <TasksBell />
                <UserMenu info={info} onSwitch={() => setSwitchOpen(true)} />
              </div>
            </header>
            <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-6 sm:px-6 lg:px-6 lg:pb-10 lg:pt-8">
              {info.maintenance?.on && (
                <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200" role="status">
                  <Wrench className={cx('h-4 w-4 shrink-0', ICON_TEXT.amber)} />
                  <span className="min-w-0 flex-1">
                    <b>Maintenance mode is on.</b> Only administrators can work in this company until it is switched off.
                  </span>
                  <Link href="/dashboard/admin/maintenance" className="font-semibold underline-offset-2 hover:underline">
                    Manage
                  </Link>
                </div>
              )}
              {children}
            </main>
          </div>

          {/* Mobile bottom bar */}
          <nav className="glass glass-float fixed inset-x-2 bottom-2 z-30 flex h-16 items-center justify-around rounded-2xl lg:hidden">
            <Link href="/dashboard" className={cx('flex flex-1 flex-col items-center gap-0.5 text-[11px] font-medium', pathname === '/dashboard' ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500')}>
              <Home className={cx('h-5 w-5', ICON_TEXT.brand)} /> Home
            </Link>
            <button onClick={() => setSearchOpen(true)} className="flex flex-1 flex-col items-center gap-0.5 text-[11px] font-medium text-slate-500">
              <Search className={cx('h-5 w-5', ICON_TEXT.sky)} /> Find
            </button>
            <button onClick={() => setDrawer(true)} className="flex flex-1 flex-col items-center gap-0.5 text-[11px] font-medium text-slate-500">
              <LayoutGrid className={cx('h-5 w-5', ICON_TEXT.violet)} /> Menu
            </button>
          </nav>

          <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Find a document">
            <div className="min-h-[300px]">
              <GlobalSearch autoFocus onDone={() => setSearchOpen(false)} />
            </div>
          </Modal>

          <Modal open={switchOpen} onClose={() => setSwitchOpen(false)} title="Switch company" description="These are the companies you signed in to.">
            <div className="grid gap-2">
              {info.otherCompanies.map((c) => (
                <button key={c.ba} onClick={() => doSwitch(c.ba)} disabled={Boolean(switching)} className="tile-interactive flex items-center justify-between px-4 py-3 text-left">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</span>
                  <span className="text-sm text-slate-500">{switching === c.ba ? 'Opening…' : 'Open'}</span>
                </button>
              ))}
            </div>
          </Modal>
        </div>
      </ToastProvider>
    </SessionCtx.Provider>
  );
}

/** Adds or removes the current page from the user's Favourites (legacy sys_mymenu). */
function FavStar({ href, label, info, onChanged }: { href: string; label: string; info: SessionInfo; onChanged: () => Promise<void> }) {
  const on = (info.favourites ?? []).some((f) => f.href === href);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try {
      await rpc('system.favToggle', { href });
      await onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      aria-label={on ? `Remove ${label} from Favourites` : `Add ${label} to Favourites`}
      title={on ? 'Remove from Favourites' : 'Add to Favourites'}
      className="hidden rounded-lg p-1.5 text-amber-500 transition hover:bg-amber-500/10 disabled:opacity-50 md:block"
    >
      <Star className={cx('h-4 w-4', on && 'fill-amber-400 text-amber-400')} />
    </button>
  );
}

function MaintenanceScreen({ info, onRetry }: { info: SessionInfo; onRetry: () => Promise<void> }) {
  const router = useRouter();
  const signOut = async () => {
    try {
      await rpc('auth.logout');
    } catch {}
    forgetSession();
    router.replace('/');
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass w-full max-w-lg rounded-3xl p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 ring-1 ring-inset ring-amber-500/30">
          <Wrench className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{info.company.display_name} is under maintenance</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{info.maintenance.message}</p>
        <p className="mt-2 text-xs text-slate-500">Your work is safe. You can sign in again once maintenance is finished.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => onRetry()} className="rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-glow">
            Try again
          </button>
          <button onClick={signOut} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-black/10 hover:bg-black/[0.04] dark:text-slate-200 dark:ring-white/15 dark:hover:bg-white/5">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

/** Wraps a page section that needs a right; shows a friendly message otherwise. */
export function RequireRight({ form, action = 1, children }: { form: string; action?: number; children: React.ReactNode }) {
  const { can } = useSession();
  if (!can(form, action))
    return (
      <div className="glass mx-auto mt-16 max-w-lg rounded-3xl p-8 text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">This screen is not part of your access</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your user group does not have the right to open it (form {form}). If you need it for your work, ask your system administrator to update Group Access.</p>
        <Link href="/dashboard" className="mt-5 inline-flex rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-glow">
          Back to Home
        </Link>
      </div>
    );
  return <>{children}</>;
}
