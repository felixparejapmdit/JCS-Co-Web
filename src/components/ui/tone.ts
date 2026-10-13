// Colour of every icon in Cloud AOS. An icon takes the colour of the text it stands for:
// the module it opens, or the meaning of the button or label next to it. The same word gives
// the same colour everywhere (Void is rose, Save is emerald, Print is blue, Help is sky...).
import type React from 'react';
import { PERMISSIONS } from '@/shared/permissions';

export type Tone = 'brand' | 'blue' | 'sky' | 'cyan' | 'teal' | 'emerald' | 'lime' | 'amber' | 'orange' | 'rose' | 'pink' | 'fuchsia' | 'violet' | 'indigo' | 'slate';

/** Icon colour on its own (light / dark). */
export const ICON_TEXT: Record<Tone, string> = {
  brand: 'text-brand-600 dark:text-brand-300',
  blue: 'text-blue-600 dark:text-blue-400',
  sky: 'text-sky-600 dark:text-sky-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  teal: 'text-teal-600 dark:text-teal-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  lime: 'text-lime-600 dark:text-lime-400',
  amber: 'text-amber-600 dark:text-amber-400',
  orange: 'text-orange-600 dark:text-orange-400',
  rose: 'text-rose-600 dark:text-rose-400',
  pink: 'text-pink-600 dark:text-pink-400',
  fuchsia: 'text-fuchsia-600 dark:text-fuchsia-400',
  violet: 'text-violet-600 dark:text-violet-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  slate: 'text-slate-500 dark:text-slate-400',
};

/** Icon in a small tinted square (cards, stats, empty states). */
export const ICON_CHIP: Record<Tone, string> = {
  brand: 'bg-brand-500/10 text-brand-600 ring-brand-500/20 dark:text-brand-300',
  blue: 'bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-300',
  sky: 'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-300',
  cyan: 'bg-cyan-500/10 text-cyan-600 ring-cyan-500/20 dark:text-cyan-300',
  teal: 'bg-teal-500/10 text-teal-600 ring-teal-500/20 dark:text-teal-300',
  emerald: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300',
  lime: 'bg-lime-500/10 text-lime-700 ring-lime-500/20 dark:text-lime-300',
  amber: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-300',
  orange: 'bg-orange-500/10 text-orange-600 ring-orange-500/20 dark:text-orange-300',
  rose: 'bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-300',
  pink: 'bg-pink-500/10 text-pink-600 ring-pink-500/20 dark:text-pink-300',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-600 ring-fuchsia-500/20 dark:text-fuchsia-300',
  violet: 'bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-300',
  indigo: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-300',
  slate: 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300',
};

/** Thin accent line on top of a stat block. */
export const TONE_BAR: Record<Tone, string> = {
  brand: 'from-brand-500 to-brand-300',
  blue: 'from-blue-500 to-blue-300',
  sky: 'from-sky-500 to-sky-300',
  cyan: 'from-cyan-500 to-cyan-300',
  teal: 'from-teal-500 to-teal-300',
  emerald: 'from-emerald-500 to-emerald-300',
  lime: 'from-lime-500 to-lime-300',
  amber: 'from-amber-500 to-amber-300',
  orange: 'from-orange-500 to-orange-300',
  rose: 'from-rose-500 to-rose-300',
  pink: 'from-pink-500 to-pink-300',
  fuchsia: 'from-fuchsia-500 to-fuchsia-300',
  violet: 'from-violet-500 to-violet-300',
  indigo: 'from-indigo-500 to-indigo-300',
  slate: 'from-slate-500 to-slate-300',
};

/** One colour per module, used wherever the module appears (menu, reports, access matrix). */
export const MODULE_TONE: Record<string, Tone> = {
  home: 'brand',
  gl: 'indigo',
  ap: 'amber',
  ar: 'emerald',
  sd: 'violet',
  mm: 'cyan',
  pur: 'sky',
  pp: 'orange',
  hr: 'pink',
  reports: 'blue',
  admin: 'teal',
};

// First match wins: the more specific meanings come first.
const RULES: [RegExp, Tone][] = [
  [/\b(void|delete|remove|reject|sign out|log ?out|write.?off|shortage|overdue|danger|error|failed|referred|not part of your access|over budget|sent home|absent)/i, 'rose'],
  [/\b(lock|close|closed|hold|discard|reset|reopen|maintenance|warning|pending|waiting|wait|favourite|favorite|star|task|bell|password|key|budget|limit|late|undertime|reorder)/i, 'amber'],
  [/\b(print|cheque|check voucher|voucher)/i, 'blue'],
  [/\b(export|csv|excel|download|upload|import|paste|file|dtr)/i, 'teal'],
  [/\b(edit|correct|change|update|transfer|switch|move|request|order|sales|salesman|customer|cards|matrix|access|rights|permission|group|shield)/i, 'violet'],
  [/\b(ledger|journal|statement|report|register|schedule|gl\b|account|moon|dark|theme|p&l|profit|chart)/i, 'indigo'],
  [/\b(stock|inventory|van|truck|load|plant|warehouse|material|product|item|deliver|receiving|lot|count)/i, 'cyan'],
  [/\b(production|cost|factory|lab|worksheet|costing)/i, 'orange'],
  [/\b(employee|payroll|hr\b|user|people|patient|clinic|medicine|supply|supplies|consult|member|attendance|staff|nurse)/i, 'pink'],
  [/\b(save|apply|approve|post|issue|create|new|add|send|release|receive|collect|deposit|cash|paid|confirm|done|make|open a|record|switch on|ready|match|within|back to work|success)/i, 'emerald'],
  [/\b(search|find|filter|refresh|view|open|help|info|about|question|time|clock|calendar|date|list|sync)/i, 'sky'],
  [/\b(sun|light)/i, 'amber'],
  [/\b(fund|petty|payable|bank|money|amount|total|sale)/i, 'amber'],
  [/\b(document|setup|company|branding|setting|admin)/i, 'teal'],
];

/** Colour for a label: the meaning of its words. */
export function toneOfText(text: string | undefined | null, fallback: Tone = 'brand'): Tone {
  const t = String(text ?? '').trim();
  if (!t) return fallback;
  for (const [re, tone] of RULES) if (re.test(t)) return tone;
  return fallback;
}

/** Plain text of React children, for working out a label's colour. */
export function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (typeof node === 'object' && 'props' in (node as object)) return textOf((node as { props: { children?: React.ReactNode } }).props.children);
  return '';
}

/** Colour of the module a legacy form code belongs to (the side-menu colour). */
export function toneOfForm(form: string, fallback: Tone = 'brand'): Tone {
  const section = PERMISSIONS.find((s) => s.forms.some((f) => f.form === form));
  return (section && MODULE_TONE[section.id]) || fallback;
}
