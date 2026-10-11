import type { Db, Row, Where } from '../db';
import { DbError } from '../db';
import { nowStamp, today, ym } from '@/shared/dates';
import type { ActionNo } from '@/shared/codes';

/** Everything a service needs to know about the signed-in user and their company. */
export interface Ctx {
  db: Db;
  ba: string;
  user: string;
  fullName: string;
  group: string;
  ip?: string;
}

/** A business-rule failure shown to the user as a friendly message. */
export class AppError extends DbError {
  constructor(message: string, status = 400) {
    super(message, status);
  }
}

export function fail(message: string, status = 400): never {
  throw new AppError(message, status);
}

export function need<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined || value === '') fail(message);
  return value as T;
}

// ---------------------------------------------------------------------------
// Rights: the legacy IsAllowed(group, form, action) over sys_usergrouprights.
// ---------------------------------------------------------------------------
const RIGHT_COLUMN: Record<number, string> = {
  1: 'gr_viewrights',
  2: 'gr_editrights',
  3: 'gr_insertrights',
  4: 'gr_deleterights',
  5: 'gr_releaserights',
};

export async function isAllowed(db: Db, group: string, form: string, action: ActionNo): Promise<boolean> {
  const row = await db.one('sys_usergrouprights', { gr_groupcode: group, gr_formcode: form });
  if (!row) return false;
  return truthy(row[RIGHT_COLUMN[action]]);
}

export async function requireRight(ctx: Ctx, form: string, action: ActionNo, what = 'do this'): Promise<void> {
  if (!(await isAllowed(ctx.db, ctx.group, form, action))) {
    fail(`Your user group (${ctx.group}) is not allowed to ${what}. Ask your administrator to update Group Access for form ${form}.`, 403);
  }
}

/** All rights of a group, keyed by form code: { '023': [1,2,3], ... } */
export async function rightsOf(db: Db, group: string): Promise<Record<string, number[]>> {
  const rows = await db.all('sys_usergrouprights', { where: { gr_groupcode: group } });
  const out: Record<string, number[]> = {};
  for (const r of rows) {
    const acts: number[] = [];
    for (const [n, col] of Object.entries(RIGHT_COLUMN)) if (truthy(r[col])) acts.push(Number(n));
    if (acts.length) out[r.gr_formcode] = acts;
  }
  return out;
}

export function truthy(v: unknown): boolean {
  if (typeof v === 'string') return ['1', 'y', 'yes', 'true', 't'].includes(v.toLowerCase());
  return Boolean(v);
}

// ---------------------------------------------------------------------------
// Audit: the legacy translog row (so legacy log reports keep working) plus a
// before/after snapshot in ng_audit_log.
// ---------------------------------------------------------------------------
export async function audit(
  ctx: Ctx,
  entry: { form: string; tc?: string; docno: string; trans: string; table?: string; before?: Row | null; after?: Row | null }
): Promise<void> {
  const stamp = nowStamp();
  await ctx.db.insert('translog', {
    user: ctx.user,
    form: entry.form,
    tc: entry.tc ?? '',
    docno: entry.docno,
    trans: entry.trans,
    pcipadd: ctx.ip ?? 'cloud-aos',
    datetimelog: stamp,
  });
  await ctx.db.insert('ng_audit_log', {
    occurred_at: stamp,
    username: ctx.user,
    ip_address: ctx.ip ?? null,
    tc: entry.tc ?? null,
    table_name: entry.table ?? '',
    doc_no: entry.docno,
    action: entry.trans.split(' ')[0].toUpperCase().slice(0, 20),
    before_json: entry.before ? JSON.stringify(entry.before) : null,
    after_json: entry.after ? JSON.stringify(entry.after) : null,
  });
}

// ---------------------------------------------------------------------------
// Document numbers. The demo continues the highest number already in the table;
// in Phase 1 this is pointed at the legacy numbering source (PLAN.md section 8.3).
// ---------------------------------------------------------------------------
export async function nextDocNo(db: Db, table: string, column: string, prefix: string, where: Where = {}, width = 5): Promise<string> {
  const rows = await db.all(table, { where: { ...where, [column]: { like: prefix } } });
  let max = 0;
  for (const r of rows) {
    const v = String(r[column] ?? '');
    if (!v.startsWith(prefix)) continue;
    const n = Number(v.slice(prefix.length).replace(/\D/g, ''));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
}

/** Prefix used for this year's documents, e.g. "PO-26-". */
export function yearPrefix(code: string, date = today()): string {
  return `${code}-${date.slice(2, 4)}-`;
}

// ---------------------------------------------------------------------------
// Period control: gltransmonstatus (month) and modtranstattbl (module / tc).
// ---------------------------------------------------------------------------
export async function periodStatus(db: Db, date: string): Promise<{ open: boolean; reason?: string }> {
  const { transyear, transmon } = ym(date);
  const p = await db.one('gltransmonstatus', { transyear, transmon });
  if (!p) return { open: false, reason: `There is no accounting period for ${date.slice(0, 7)} yet. Open it in Period Closing first.` };
  if (String(p.yearstat).toUpperCase() !== 'OPEN') return { open: false, reason: `Year ${transyear} is already closed.` };
  if (String(p.monstat).toUpperCase() !== 'OPEN') return { open: false, reason: `The period ${date.slice(0, 7)} is closed. Use a date in an open period or ask Finance to reopen it.` };
  return { open: true };
}

export async function assertOpenPeriod(db: Db, date: string, tc?: string): Promise<void> {
  const st = await periodStatus(db, date);
  if (!st.open) fail(st.reason!);
  if (tc) {
    const { transyear, transmon } = ym(date);
    const m = await db.one('modtranstattbl', { transyear, transmon, tc });
    if (m && String(m.monstat).toUpperCase() === 'CLOSE') {
      fail(`This module is already closed for ${date.slice(0, 7)}. Use a date in an open period.`);
    }
  }
}

export async function openPeriodDate(db: Db): Promise<string> {
  const rows = await db.all('gltransmonstatus', {
    where: { yearstat: 'OPEN', monstat: 'OPEN' },
    orderBy: [['transyear', 'asc'], ['transmon', 'asc']],
  });
  const t = today();
  // Prefer today if its month is open, otherwise the latest open period's last day.
  const { transyear, transmon } = ym(t);
  if (rows.some((r) => Number(r.transyear) === transyear && Number(r.transmon) === transmon)) return t;
  const last = rows[rows.length - 1];
  return last ? String(last.dto).slice(0, 10) : t;
}

/** Lines are numbered 1..n the way legacy detail tables store itemno / itmno. */
export function numberLines<T extends Row>(lines: T[], col = 'itemno'): T[] {
  return lines.map((l, i) => ({ ...l, [col]: i + 1 }));
}

export function str(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
