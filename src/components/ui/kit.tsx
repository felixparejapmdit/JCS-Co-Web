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
import { ICON_CHIP, ICON_TEXT, TONE_BAR, type Tone, textOf, toneOfText } from './tone';

export { ICON_CHIP, ICON_TEXT, MODULE_TONE, textOf, toneOfForm, toneOfText } from './tone';
export type { Tone } from './tone';

export function cx(...parts: (string | false | null | undefined)[]) {
  return twMerge(parts.filter(Boolean).join(' '));
}

// ---------------------------------------------------------------------------
// Buttons and badges
// ---------------------------------------------------------------------------
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'success';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-glow hover:from-brand-400 hover:to-brand-600 disabled:from-brand-500/50 disabled:to-brand-600/50 disabled:shadow-none',
  secondary:
    'border border-black/[0.08] bg-white/80 text-slate-700 hover:border-black/[0.14] hover:bg-white dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-white/[0.18] dark:hover:bg-white/[0.09]',
  ghost: 'text-slate-600 hover:bg-black/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.06]',
  danger: 'bg-gradient-to-b from-danger-500 to-danger-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-danger-400 hover:to-danger-600',
  subtle: 'bg-brand-500/10 text-brand-700 hover:bg-brand-500/15 dark:bg-brand-400/10 dark:text-brand-300 dark:hover:bg-brand-400/20',
  success: 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-glow-green',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className?: string }>;
  /** Colour of the icon; by default it follows the meaning of the button's text. */
  iconTone?: Tone;
  loading?: boolean;
  href?: string;
}

const FILLED: Variant[] = ['primary', 'danger', 'success'];

export function Button({ variant = 'secondary', size = 'md', icon: Icon, iconTone, loading, className, children, href, disabled, ...rest }: ButtonProps) {
  const iconCls = FILLED.includes(variant) ? '' : ICON_TEXT[iconTone ?? toneOfText(textOf(children) || String(rest.title ?? '') || String(rest['aria-label'] ?? ''))];
  const cls = cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 whitespace-nowrap',
    size === 'sm' ? 'h-8 px-3 text-[13px]' : size === 'lg' ? 'h-11 px-5 text-[15px]' : 'h-9 px-4 text-sm',
    VARIANTS[variant],
    className
  );
  const content = (
    <>
      {loading ? <Loader2 className={cx('h-4 w-4 animate-spin', iconCls)} /> : Icon ? <Icon className={cx('h-4 w-4 flex-shrink-0', iconCls)} /> : null}
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
  neutral: 'bg-slate-500/10 text-slate-700 ring-slate-500/15 dark:text-slate-300 dark:ring-white/10',
  info: 'bg-brand-500/10 text-brand-700 ring-brand-500/20 dark:text-brand-300 dark:ring-brand-400/25',
  warning: 'bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-300 dark:ring-amber-400/25',
  success: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/25',
  danger: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300 dark:ring-rose-400/25',
  accent: 'bg-brand-500/10 text-brand-700 ring-brand-500/20 dark:text-brand-300 dark:ring-brand-400/25',
};
const DOTS: Record<StatusTone, string> = {
  neutral: 'bg-slate-400',
  info: 'bg-brand-500 shadow-[0_0_8px_rgb(var(--brand-500)/0.8)]',
  warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]',
  success: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
  danger: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]',
  accent: 'bg-brand-500 shadow-[0_0_8px_rgb(var(--brand-500)/0.8)]',
};

export function Badge({ tone = 'neutral', children, className, dot = true }: { tone?: StatusTone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', TONES[tone], className)}>
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', DOTS[tone])} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

// ---------------------------------------------------------------------------
// Layout pieces
// ---------------------------------------------------------------------------
export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  padded = true,
  icon: Icon,
  tone,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  padded?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  /** Colour of the icon; by default it follows the title. */
  tone?: Tone;
}) {
  return (
    <section className={cx('glass rounded-2xl', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className={cx('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', ICON_CHIP[tone ?? toneOfText(textOf(title))])}>
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {(title || actions) && <div className="mx-5 h-px bg-gradient-to-r from-transparent via-black/[0.07] to-transparent dark:via-white/[0.08]" />}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions, eyebrow, children }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="neon-text mb-1 text-xs font-semibold uppercase tracking-[0.14em]">{eyebrow}</div>}
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, text, action, tone }: { icon?: React.ComponentType<{ className?: string }>; title: string; text?: string; action?: React.ReactNode; tone?: Tone }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className={cx('mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset', ICON_CHIP[tone ?? toneOfText(title, 'sky')])}>
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
    <div className="delayed-show flex min-h-[40vh] items-center justify-center gap-2 py-12 text-sm text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
      {label}
    </div>
  );
}

export function Alert({ tone = 'info', title, children, onClose }: { tone?: 'info' | 'warning' | 'danger' | 'success'; title?: string; children?: React.ReactNode; onClose?: () => void }) {
  const map = {
    info: ['border-brand-500/20 bg-brand-500/[0.07] text-brand-900 dark:border-brand-400/25 dark:bg-brand-400/[0.08] dark:text-brand-100', Info],
    warning: ['border-amber-500/25 bg-amber-500/[0.08] text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/[0.08] dark:text-amber-100', AlertTriangle],
    danger: ['border-rose-500/25 bg-rose-500/[0.07] text-rose-900 dark:border-rose-400/25 dark:bg-rose-400/[0.08] dark:text-rose-100', XCircle],
    success: ['border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-400/[0.08] dark:text-emerald-100', CheckCircle2],
  } as const;
  const [cls, Icon] = map[tone];
  return (
    <div className={cx('flex gap-3 rounded-2xl border px-4 py-3 text-sm', cls)} role={tone === 'danger' ? 'alert' : 'status'}>
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

const TONE_ICON = ICON_CHIP;

/** A Notion-style stat block: icon, label, a big number and a hint. Clickable when given href. */
export function Stat({ label, value, sub, icon: Icon, tone: given, href }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; tone?: Tone; href?: string }) {
  const tone = given ?? toneOfText(label);
  const body = (
    <div className={cx('glass relative h-full overflow-hidden rounded-2xl p-5', href && 'transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand-400/40')}>
      <div className={cx('absolute inset-x-5 top-0 h-px bg-gradient-to-r opacity-80', TONE_BAR[tone])} />
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className={cx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', TONE_ICON[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-[13px] leading-snug text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Horizontal meter, e.g. budget used. Turns amber near the limit and rose above it. */
export function Progress({ value, max = 100, className, tone }: { value: number; max?: number; className?: string; tone?: 'auto' | Tone }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const ratio = max > 0 ? value / max : 0;
  const auto = ratio > 1.0001 ? 'rose' : ratio >= 0.9 ? 'amber' : 'emerald';
  const t = (!tone || tone === 'auto' ? auto : tone) as Tone;
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]', className)}>
      <div className={cx('h-full rounded-full bg-gradient-to-r transition-all duration-500', TONE_BAR[t])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Money({ value, className, peso = false }: { value: number | null | undefined; className?: string; peso?: boolean }) {
  const n = Number(value ?? 0);
  return <span className={cx('tabular-nums', n < 0 && 'text-rose-600 dark:text-rose-400', className)}>{peso ? '₱' : ''}{fmtMoney(n)}</span>;
}

/** Segmented pill tabs. */
export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string; count?: number | null }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.05]" role="tablist">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cx(
              'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all',
              active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/[0.06] dark:bg-white/[0.1] dark:text-white dark:ring-white/[0.1]' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            {t.label}
            {t.count !== undefined && (
              // Fixed minimum width, and an empty chip while counting, so tabs never shift when numbers arrive.
              <span className={cx('min-w-[1.75rem] rounded-full px-1.5 py-px text-center text-[11px] font-semibold tabular-nums', active ? 'bg-brand-500/15 text-brand-700 dark:bg-brand-400/20 dark:text-brand-200' : 'bg-black/[0.05] text-slate-500 dark:bg-white/[0.06] dark:text-slate-400')}>{t.count ?? ' '}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Small icon toggle, e.g. cards / compact list. */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[] }) {
  return (
    <div className="inline-flex rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.05]" role="radiogroup">
      {options.map((o) => {
        const Icon = o.icon;
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.value)}
            className={cx('flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-medium transition-all', active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/[0.06] dark:bg-white/[0.1] dark:text-white dark:ring-white/[0.1]' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200')}
          >
            {Icon ? <Icon className={cx('h-4 w-4', ICON_TEXT[toneOfText(o.label, 'sky')])} /> : null}
            <span className={Icon ? 'hidden sm:inline' : undefined}>{o.label}</span>
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
  'h-9 w-full rounded-xl border border-black/[0.09] bg-white/85 px-3 text-sm text-slate-900 placeholder-slate-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-colors focus:border-brand-500/70 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-slate-500 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-brand-400/70 dark:focus:bg-white/[0.06] dark:focus:ring-brand-400/15 dark:disabled:bg-white/[0.02]';

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
        <div className="glass-strong absolute z-40 mt-1.5 max-h-72 w-full min-w-[260px] overflow-y-auto rounded-xl p-1">
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
                className={cx('block w-full rounded-lg px-3 py-2 text-left', idx === hi ? 'bg-brand-500/10 dark:bg-brand-400/15' : '', i.value === value && 'font-semibold')}
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
      <Search className={cx('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', ICON_TEXT.sky)} />
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
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm dark:bg-black/60" onClick={onClose} />
      <div
        className={cx(
          'glass-strong relative flex w-full flex-col animate-rise',
          side ? cx('h-full', width, 'rounded-l-3xl') : cx(width, 'max-h-[92vh] rounded-t-3xl sm:rounded-3xl')
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-4 dark:border-white/[0.07]">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-black/[0.05] hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-black/[0.06] px-6 py-3 dark:border-white/[0.07]">{footer}</div>}
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
              'glass-strong pointer-events-auto flex animate-rise items-start gap-3 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100',
              t.tone === 'success' && 'border-emerald-500/30 dark:border-emerald-400/30',
              t.tone === 'error' && 'border-rose-500/30 dark:border-rose-400/30',
              t.tone === 'info' && 'border-brand-500/30 dark:border-brand-400/30'
            )}
          >
            {t.tone === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" /> : t.tone === 'error' ? <XCircle className="h-5 w-5 flex-shrink-0 text-rose-500" /> : <Info className="h-5 w-5 flex-shrink-0 text-brand-500" />}
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
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{i.label}</dt>
          <dd className="mt-1 break-words text-sm text-slate-900 dark:text-slate-100">{i.value === '' || i.value === null || i.value === undefined ? '—' : i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
