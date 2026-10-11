'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';
import { AlertTriangle, CheckCircle2, ChevronDown, Info, Loader2, Search, X, XCircle } from 'lucide-react';
import type { LookupItem } from '@/lib/api';
import { useLookup } from '@/lib/api';
import type { StatusTone } from '@/shared/codes';
import { statusTone } from '@/shared/codes';
import { fmtMoney } from '@/shared/money';

export function cx(...parts: (string | false | null | undefined)[]) {
  return twMerge(parts.filter(Boolean).join(' '));
}

// ---------------------------------------------------------------------------
// Buttons and badges
// ---------------------------------------------------------------------------
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm disabled:bg-teal-600/50',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-[#15213a] dark:text-slate-200 dark:border-[#2a3a5c] dark:hover:bg-[#1b2a48]',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  subtle: 'bg-teal-50 text-teal-800 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/20',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  href?: string;
}

export function Button({ variant = 'secondary', size = 'md', icon: Icon, loading, className, children, href, disabled, ...rest }: ButtonProps) {
  const cls = cx(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap',
    size === 'sm' ? 'h-8 px-3 text-[13px]' : size === 'lg' ? 'h-11 px-5 text-[15px]' : 'h-9 px-4 text-sm',
    VARIANTS[variant],
    className
  );
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}

const TONES: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10',
  info: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  danger: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
  accent: 'bg-teal-50 text-teal-800 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/20',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: StatusTone; children: React.ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap', TONES[tone], className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

// ---------------------------------------------------------------------------
// Layout pieces
// ---------------------------------------------------------------------------
export function Card({ title, subtitle, actions, children, className, padded = true }: { title?: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cx('rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2a44] dark:bg-[#111a2e]', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-[#1e2a44]">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions, eyebrow, children }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, text, action }: { icon?: React.ComponentType<{ className?: string }>; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500 dark:text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

export function Alert({ tone = 'info', title, children, onClose }: { tone?: 'info' | 'warning' | 'danger' | 'success'; title?: string; children?: React.ReactNode; onClose?: () => void }) {
  const map = {
    info: ['border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200', Info],
    warning: ['border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200', AlertTriangle],
    danger: ['border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200', XCircle],
    success: ['border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200', CheckCircle2],
  } as const;
  const [cls, Icon] = map[tone];
  return (
    <div className={cx('flex gap-3 rounded-lg border px-4 py-3 text-sm', cls)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx('whitespace-pre-line', title && 'mt-0.5')}>{children}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function Stat({ label, value, sub, icon: Icon, tone = 'teal', href }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; tone?: 'teal' | 'sky' | 'amber' | 'rose' | 'violet' | 'emerald'; href?: string }) {
  const toneCls = {
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  }[tone];
  const body = (
    <div className="flex h-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-[#1e2a44] dark:bg-[#111a2e]">
      {Icon && (
        <div className={cx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg', toneCls)}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">{value}</p>
        {sub && <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:[&>div]:border-teal-400 dark:hover:[&>div]:border-teal-500/60">
      {body}
    </Link>
  ) : (
    body
  );
}

export function Money({ value, className, peso = false }: { value: number | null | undefined; className?: string; peso?: boolean }) {
  const n = Number(value ?? 0);
  return <span className={cx('tabular-nums', n < 0 && 'text-rose-600 dark:text-rose-400', className)}>{peso ? '₱' : ''}{fmtMoney(n)}</span>;
}

export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string; count?: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="-mb-px flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-[#1e2a44]" role="tablist">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cx(
              'flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cx('rounded-full px-1.5 py-0.5 text-[11px] font-semibold', active ? 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400')}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------
export const inputCls =
  'h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-[#2a3a5c] dark:bg-[#0d1527] dark:text-slate-100 dark:placeholder-slate-500 dark:disabled:bg-[#0f182b]';

export function Field({ label, hint, error, required, children, className }: { label?: string; hint?: React.ReactNode; error?: string | null; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
      )}
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
    </label>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(inputCls, className)} {...rest} />;
});

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputCls, 'h-auto min-h-[72px] py-2', className)} {...rest} />;
}

export function Select({ options, placeholder, className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select className={cx(inputCls, 'pr-8', className)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Number input that keeps what the user types but reports a number. */
export function NumberInput({ value, onValue, className, decimals = 2, ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: number | string | null | undefined; onValue: (n: number | '') => void; decimals?: number }) {
  const [text, setText] = useState(value === null || value === undefined ? '' : String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(value === null || value === undefined || value === '' ? '' : String(value));
  }, [value]);
  return (
    <input
      inputMode="decimal"
      className={cx(inputCls, 'text-right tabular-nums', className)}
      value={text}
      onFocus={(e) => {
        focused.current = true;
        e.target.select();
      }}
      onBlur={() => {
        focused.current = false;
        const n = text.trim() === '' ? '' : Number(text.replace(/,/g, ''));
        if (n === '' || Number.isFinite(n)) {
          onValue(n === '' ? '' : Math.round((n as number) * 10 ** decimals) / 10 ** decimals);
          setText(n === '' ? '' : String(Math.round((n as number) * 10 ** decimals) / 10 ** decimals));
        }
      }}
      onChange={(e) => {
        const t = e.target.value;
        if (/^-?[\d,]*\.?\d*$/.test(t)) {
          setText(t);
          const n = Number(t.replace(/,/g, ''));
          if (t.trim() === '') onValue('');
          else if (Number.isFinite(n)) onValue(n);
        }
      }}
      {...rest}
    />
  );
}

/** Type-ahead picker over a server lookup (vendors, materials, accounts, ...). */
export function Combobox({
  lookup,
  items: given,
  value,
  onChange,
  placeholder = 'Search…',
  disabled,
  className,
  compact,
}: {
  lookup?: string;
  items?: LookupItem[];
  value: string | null | undefined;
  onChange: (value: string, item?: LookupItem) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const loaded = useLookup(given ? undefined : lookup);
  const items = given ?? loaded;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const selected = items.find((i) => i.value === value);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = t ? items.filter((i) => `${i.value} ${i.label} ${i.sub ?? ''}`.toLowerCase().includes(t)) : items;
    return list.slice(0, 60);
  }, [items, q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (i: LookupItem) => {
    onChange(i.value, i);
    setOpen(false);
    setQ('');
  };

  return (
    <div ref={box} className={cx('relative', className)}>
      <div className="relative">
        <input
          ref={input}
          disabled={disabled}
          className={cx(inputCls, 'pr-8', compact && 'h-8 text-[13px]')}
          placeholder={selected ? '' : placeholder}
          value={open ? q : selected ? `${selected.label}` : value ?? ''}
          title={selected ? `${selected.value} · ${selected.label}` : undefined}
          onFocus={() => {
            setOpen(true);
            setQ('');
            setHi(0);
          }}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setHi(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHi((h) => Math.min(h + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHi((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter' && open && filtered[hi]) {
              e.preventDefault();
              pick(filtered[hi]);
            } else if (e.key === 'Escape') setOpen(false);
          }}
        />
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {open && !disabled && (
        <div className="absolute z-40 mt-1 max-h-72 w-full min-w-[260px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-[#2a3a5c] dark:bg-[#111a2e]">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
          ) : (
            filtered.map((i, idx) => (
              <button
                type="button"
                key={i.value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(i)}
                onMouseEnter={() => setHi(idx)}
                className={cx('block w-full px-3 py-2 text-left', idx === hi ? 'bg-teal-50 dark:bg-teal-500/10' : '', i.value === value && 'font-semibold')}
              >
                <div className="truncate text-sm text-slate-900 dark:text-slate-100">{i.label}</div>
                {i.sub && <div className="truncate text-xs text-slate-500 dark:text-slate-400">{i.sub}</div>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input className={cx(inputCls, 'pl-9')} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700" onClick={() => onChange('')} aria-label="Clear search">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------
export function Modal({ open, onClose, title, description, children, footer, size = 'md', side = false }: { open: boolean; onClose: () => void; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; side?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <div className={cx('fixed inset-0 z-[60] flex', side ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-4')} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cx(
          'relative flex w-full flex-col bg-white shadow-2xl dark:bg-[#0f182b]',
          side ? cx('h-full', width, 'border-l border-slate-200 dark:border-[#1e2a44]') : cx(width, 'max-h-[92vh] rounded-t-2xl sm:rounded-2xl')
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-[#1e2a44]">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-[#1e2a44]">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
type ToastItem = { id: number; tone: 'success' | 'error' | 'info'; text: string };
const ToastCtx = createContext<{ push: (tone: ToastItem['tone'], text: string) => void }>({ push: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((tone: ToastItem['tone'], text: string) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, tone, text }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), tone === 'error' ? 8000 : 4500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[70] flex w-[min(92vw,420px)] flex-col gap-2 lg:bottom-6">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg',
              t.tone === 'success' && 'border-emerald-200 bg-white text-slate-800 dark:border-emerald-500/30 dark:bg-[#0f182b] dark:text-slate-100',
              t.tone === 'error' && 'border-rose-200 bg-white text-slate-800 dark:border-rose-500/30 dark:bg-[#0f182b] dark:text-slate-100',
              t.tone === 'info' && 'border-sky-200 bg-white text-slate-800 dark:border-sky-500/30 dark:bg-[#0f182b] dark:text-slate-100'
            )}
          >
            {t.tone === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" /> : t.tone === 'error' ? <XCircle className="h-5 w-5 flex-shrink-0 text-rose-600" /> : <Info className="h-5 w-5 flex-shrink-0 text-sky-600" />}
            <p className="whitespace-pre-line">{t.text}</p>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const { push } = useContext(ToastCtx);
  return useMemo(() => ({ success: (t: string) => push('success', t), error: (t: string) => push('error', t), info: (t: string) => push('info', t) }), [push]);
}

export function KeyValue({ items, cols = 3 }: { items: { label: string; value: React.ReactNode }[]; cols?: 2 | 3 | 4 }) {
  return (
    <dl className={cx('grid gap-x-6 gap-y-4', cols === 2 ? 'sm:grid-cols-2' : cols === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3')}>
      {items.map((i, idx) => (
        <div key={idx} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{i.label}</dt>
          <dd className="mt-1 break-words text-sm text-slate-900 dark:text-slate-100">{i.value === '' || i.value === null || i.value === undefined ? '—' : i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
