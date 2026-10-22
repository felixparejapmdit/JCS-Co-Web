/**
 * Logs (Administration > Logs): Change History, Sign-in Log and Access Changes.
 *
 * Change History and Access Changes read what audit() already writes: the legacy translog line
 * (who, what, when) and the ng_audit_log snapshot (the record before and after), which share the
 * same time stamp. The Sign-in Log has its own table, ng_signin_log
 * (database/mysql/004_ng_signin_log.sql), written by session.signIn for every attempt.
 */
import type { Db, Row } from '../db';
import { ACTION, FORM } from '@/shared/codes';
import { addDays, nowStamp, today } from '@/shared/dates';
import { PERMISSIONS } from '@/shared/permissions';
import { Ctx, requireRight, str } from './context';
import { allDocServices } from './docs';

const MAX_ROWS = 1000;
const SECRET = /pass|hash|token|secret/i;

function range(from?: unknown, to?: unknown): { gte: string; lte: string } {
  const f = str(from) || addDays(today(), -30);
  const t = str(to) || today();
  return { gte: `${f} 00:00:00`, lte: `${t} 23:59:59` };
}

/** A stored snapshot: a JSON column comes back parsed from MySQL and as text from the sample data. */
function snapshot(v: unknown): Row | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'object') return v as Row;
  try {
    const o = JSON.parse(String(v));
    return o && typeof o === 'object' ? o : null;
  } catch {
    return null;
  }
}

const stamp = (v: unknown) => str(v).replace('T', ' ').slice(0, 19);

/**
 * translog lines of the period, by user, document, second and first word: the description that
 * goes with a snapshot (audit() writes both with the same stamp; ng_audit_log.action is that word).
 */
const firstWord = (trans: unknown) => str(trans).split(' ')[0].toUpperCase().slice(0, 20);

async function descriptions(db: Db, when: { gte: string; lte: string }) {
  const lines = await db.all('translog', { where: { datetimelog: when } });
  const map = new Map<string, Row>();
  for (const l of lines) map.set(`${str(l.user)}|${str(l.docno)}|${stamp(l.datetimelog)}|${firstWord(l.trans)}`, l);
  return map;
}

async function snapshots(ctx: Ctx, f: Row, tables?: string[]) {
  const when = range(f.from, f.to);
  const where: Row = { occurred_at: when };
  if (str(f.user)) where.username = str(f.user);
  if (tables) where.table_name = { in: tables };
  else if (str(f.table)) where.table_name = str(f.table);
  const rows = await ctx.db.all('ng_audit_log', { where, orderBy: [['occurred_at', 'desc']], limit: MAX_ROWS });
  const words = await descriptions(ctx.db, when);
  return rows.map((r) => {
    const t = words.get(`${str(r.username)}|${str(r.doc_no)}|${stamp(r.occurred_at)}|${str(r.action)}`);
    return { r, trans: str(t?.trans) || str(r.action), form: str(t?.form) };
  });
}

// ---------------------------------------------------------------------------
// 1. Change History: what each change did to the record, field by field.
// ---------------------------------------------------------------------------
const TABLE_LABELS: Record<string, string> = {
  sys_userrecords: 'User',
  sys_usergroup: 'User group',
  sys_usergrouprights: 'Group access',
  ng_api_keys: 'API key',
  ng_company_branding: 'Company & branding',
  ng_cheque_layouts: 'Cheque layout',
  ng_settings: 'Setting',
  custmasttbl: 'Customer',
  venmasttbl: 'Vendor',
  mmasttbl: 'Material',
  acctcharttbl: 'Account',
  costcentertbl: 'Cost center',
  banktbl: 'Bank account',
  budgettbl: 'Budget',
  payidtbl: 'Payroll ID',
};

/** A table as people know it: a document's name for its header table, else the label above. */
function tableLabel(table: string): string {
  if (TABLE_LABELS[table]) return TABLE_LABELS[table];
  const docs = allDocServices().filter((d) => d.table === table);
  if (docs.length === 1) return docs[0].title;
  if (docs.length > 1) return docs.map((d) => d.title).join(' / ').slice(0, 60);
  return table;
}

export interface FieldChange {
  field: string;
  before: string;
  after: string;
}

function flat(o: Row | null, prefix = '', out: Record<string, string> = {}, depth = 0): Record<string, string> {
  if (!o) return out;
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && depth < 2) flat(v as Row, key, out, depth + 1);
    else out[key] = SECRET.test(k) ? '***' : v === null || v === undefined ? '' : Array.isArray(v) || typeof v === 'object' ? JSON.stringify(v) : String(v);
  }
  return out;
}

/** The fields that differ between two snapshots (empty, null and missing count as the same). */
export function diff(before: Row | null, after: Row | null): FieldChange[] {
  const a = flat(before);
  const b = flat(after);
  const out: FieldChange[] = [];
  for (const field of [...new Set([...Object.keys(a), ...Object.keys(b)])]) {
    const x = a[field] ?? '';
    const y = b[field] ?? '';
    if (x !== y && !(Number(x) === Number(y) && x.trim() !== '' && y.trim() !== '')) out.push({ field, before: x, after: y });
  }
  return out;
}

export async function changeHistory(ctx: Ctx, f: Row) {
  await requireRight(ctx, FORM.USERS, ACTION.VIEW, 'view the change history');
  const q = str(f.q).toLowerCase();
  const all = await snapshots(ctx, f);
  const rows = all
    .filter(({ r }) => r.before_json || r.after_json)
    .map(({ r, trans }) => {
      const before = snapshot(r.before_json);
      const after = snapshot(r.after_json);
      const table = str(r.table_name);
      // Only the record before it was kept: a delete, or a document action logged before
      // after-snapshots were kept (then the record as it was is shown, not a change).
      const kind = !before ? 'Created' : after ? 'Changed' : /^(delete|remove)/i.test(trans) ? 'Deleted' : 'Action';
      const changes = kind === 'Action' ? diff(before, null).map((c) => ({ ...c, after: '' })) : diff(before, after);
      return {
        when: stamp(r.occurred_at),
        user: str(r.username),
        ip: str(r.ip_address),
        table,
        record: tableLabel(table),
        docno: str(r.doc_no),
        action: trans,
        kind,
        changes,
      };
    })
    .filter((r) => !q || `${r.docno} ${r.action} ${r.record} ${r.changes.map((c) => `${c.field} ${c.before} ${c.after}`).join(' ')}`.toLowerCase().includes(q));
  const tables = [...new Set(all.map(({ r }) => str(r.table_name)).filter(Boolean))].map((t) => ({ value: t, label: tableLabel(t) })).sort((a, b) => a.label.localeCompare(b.label));
  return { rows, tables, capped: all.length >= MAX_ROWS };
}

// ---------------------------------------------------------------------------
// 2. Sign-in Log
// ---------------------------------------------------------------------------
export type SignInOutcome = 'success' | 'wrong_password' | 'unknown_user' | 'locked' | 'locked_out' | 'inactive' | 'maintenance' | 'rate_limited' | 'signed_out';

export const OUTCOME_LABEL: Record<SignInOutcome, string> = {
  success: 'Signed in',
  wrong_password: 'Wrong password',
  unknown_user: 'Unknown username',
  locked: 'Account locked',
  locked_out: 'Locked out (5 failures)',
  inactive: 'Account inactive',
  maintenance: 'Refused: maintenance',
  rate_limited: 'Too many attempts',
  signed_out: 'Signed out',
};

const FAILED: SignInOutcome[] = ['wrong_password', 'unknown_user', 'locked', 'locked_out', 'inactive', 'rate_limited'];
const KEEP_MONTHS = 12;
let warned = false;

/** Writes one sign-in attempt. Never throws: a log that cannot be written must not stop a sign-in. */
export async function recordSignIn(db: Db, e: { username: string; outcome: SignInOutcome; detail?: string; ip?: string; userAgent?: string }) {
  try {
    await db.insert('ng_signin_log', {
      occurred_at: nowStamp(),
      username: e.username.slice(0, 50),
      outcome: e.outcome,
      detail: (e.detail ?? '').slice(0, 255) || null,
      ip_address: e.ip ? e.ip.slice(0, 45) : null,
      user_agent: e.userAgent ? e.userAgent.slice(0, 255) : null,
    });
    // Now and then, forget attempts older than a year (they hold IP addresses).
    if (Math.random() < 0.02) await db.remove('ng_signin_log', { occurred_at: { lt: `${addDays(today(), -KEEP_MONTHS * 30)} 00:00:00` } });
  } catch (err) {
    if (!warned) {
      warned = true;
      console.warn('[cloud-aos] sign-in log not written (run database/mysql/004_ng_signin_log.sql):', err instanceof Error ? err.message : err);
    }
  }
}

/** "Chrome 141 on Windows" from a user agent; rough on purpose. */
export function deviceOf(ua: string): string {
  if (!ua) return '';
  const browser =
    /Edg\/(\d+)/.exec(ua)?.[1] ? `Edge ${/Edg\/(\d+)/.exec(ua)![1]}` :
    /OPR\/(\d+)/.exec(ua)?.[1] ? `Opera ${/OPR\/(\d+)/.exec(ua)![1]}` :
    /Firefox\/(\d+)/.exec(ua)?.[1] ? `Firefox ${/Firefox\/(\d+)/.exec(ua)![1]}` :
    /Chrome\/(\d+)/.exec(ua)?.[1] ? `Chrome ${/Chrome\/(\d+)/.exec(ua)![1]}` :
    /Version\/(\d+).*Safari/.exec(ua)?.[1] ? `Safari ${/Version\/(\d+).*Safari/.exec(ua)![1]}` :
    /curl|node|python|postman/i.test(ua) ? ua.split(/[ /]/)[0] : 'Browser';
  const os = /iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return os ? `${browser} on ${os}` : browser;
}

export async function signInLog(ctx: Ctx, f: Row) {
  await requireRight(ctx, FORM.USERS, ACTION.VIEW, 'view the sign-in log');
  const when = range(f.from, f.to);
  const where: Row = { occurred_at: when };
  if (str(f.user)) where.username = str(f.user);
  let rows: Row[] = [];
  let ready = true;
  try {
    rows = await ctx.db.all('ng_signin_log', { where, orderBy: [['occurred_at', 'desc']], limit: MAX_ROWS });
  } catch {
    ready = false; // the table is not there yet (004_ng_signin_log.sql not run)
  }
  // Addresses a user signed in from before this period, to flag a new one.
  const known = new Map<string, Set<string>>();
  if (ready && rows.length) {
    const earlier = await ctx.db.all('ng_signin_log', { where: { outcome: 'success', occurred_at: { lt: when.gte } }, orderBy: [['occurred_at', 'desc']], limit: 5000 });
    for (const r of earlier) {
      const u = str(r.username);
      if (!known.has(u)) known.set(u, new Set());
      known.get(u)!.add(str(r.ip_address));
    }
  }
  const asc = [...rows].reverse();
  const out: Row[] = [];
  const recentFails = new Map<string, number[]>();
  for (const r of asc) {
    const u = str(r.username);
    const ip = str(r.ip_address);
    const outcome = str(r.outcome) as SignInOutcome;
    const t = new Date(stamp(r.occurred_at).replace(' ', 'T')).getTime();
    let flag = '';
    if (outcome === 'success') {
      const seen = known.get(u);
      if (seen && ip && !seen.has(ip)) flag = 'New address';
      if (!known.has(u)) known.set(u, new Set());
      known.get(u)!.add(ip);
    }
    if (FAILED.includes(outcome)) {
      const list = (recentFails.get(u) ?? []).filter((x) => t - x < 15 * 60_000);
      list.push(t);
      recentFails.set(u, list);
      if (list.length >= 3) flag = `${list.length} failures in 15 min`;
    }
    out.push({
      when: stamp(r.occurred_at),
      user: u,
      outcome,
      result: OUTCOME_LABEL[outcome] ?? outcome,
      failed: FAILED.includes(outcome),
      detail: str(r.detail),
      ip,
      device: deviceOf(str(r.user_agent)),
      userAgent: str(r.user_agent),
      flag,
    });
  }
  out.reverse();
  const outcome = str(f.outcome);
  const shown = out.filter((r) => !outcome || outcome === 'all' || (outcome === 'failed' ? r.failed : r.outcome === outcome));
  const q = str(f.q).toLowerCase();
  const filtered = shown.filter((r) => !q || `${r.user} ${r.ip} ${r.device} ${r.result} ${r.detail}`.toLowerCase().includes(q));
  const locked = (await ctx.db.all('sys_userrecords', { where: { idstat: 'Locked' } })).map((u) => ({ username: str(u.username), name: str(u.userfullname) }));
  return {
    ready,
    rows: filtered,
    capped: rows.length >= MAX_ROWS,
    summary: {
      signIns: out.filter((r) => r.outcome === 'success').length,
      failed: out.filter((r) => r.failed).length,
      users: new Set(out.filter((r) => r.outcome === 'success').map((r) => r.user)).size,
      addresses: new Set(out.map((r) => r.ip).filter(Boolean)).size,
      flagged: out.filter((r) => r.flag).length,
    },
    locked,
  };
}

// ---------------------------------------------------------------------------
// 3. Access Changes: groups, their rights, who is in which group, API keys.
// ---------------------------------------------------------------------------
const PERM_LABEL = new Map<string, string>();
for (const s of PERMISSIONS) for (const fm of s.forms) for (const [a, label] of Object.entries(fm.actions)) PERM_LABEL.set(`${fm.form}:${a}`, `${s.label}: ${label}`);

function rightsDiff(before: Row | null, after: Row | null): { added: string[]; removed: string[] } {
  const set = (m: Row | null) => new Set(Object.entries(m ?? {}).flatMap(([form, acts]) => (Array.isArray(acts) ? acts : []).map((a) => `${form}:${a}`)));
  const a = set(before);
  const b = set(after);
  const label = (k: string) => PERM_LABEL.get(k);
  return {
    added: [...b].filter((k) => !a.has(k)).map(label).filter((x): x is string => Boolean(x)).sort(),
    removed: [...a].filter((k) => !b.has(k)).map(label).filter((x): x is string => Boolean(x)).sort(),
  };
}

const ACCESS_TABLES = ['sys_usergrouprights', 'sys_usergroup', 'sys_userrecords', 'ng_api_keys'];

export async function accessChanges(ctx: Ctx, f: Row) {
  await requireRight(ctx, FORM.USERS, ACTION.VIEW, 'view access changes');
  const q = str(f.q).toLowerCase();
  const kindWanted = str(f.kind);
  const out: Row[] = [];
  for (const { r, trans } of await snapshots(ctx, f, ACCESS_TABLES)) {
    const table = str(r.table_name);
    const before = snapshot(r.before_json);
    const after = snapshot(r.after_json);
    const base = { when: stamp(r.occurred_at), by: str(r.username), ip: str(r.ip_address), subject: str(r.doc_no), title: trans };
    if (table === 'sys_usergrouprights') {
      if (!before) {
        const n = rightsDiff(null, after).added.length;
        out.push({ ...base, kind: 'rights', added: [], removed: [], note: `Access set to ${n} right${n === 1 ? '' : 's'} (saved before changes were recorded one by one).` });
        continue;
      }
      const d = rightsDiff(before, after);
      if (!d.added.length && !d.removed.length) continue;
      out.push({ ...base, kind: 'rights', ...d, note: '' });
    } else if (table === 'sys_usergroup') {
      const lines: string[] = [];
      if (!before && after) lines.push(`Added “${str(after.ug_name)}”`);
      else if (before && !after) lines.push(`Deleted “${str(before.ug_name)}”`);
      else for (const c of diff(before, after)) lines.push(`${c.field === 'ug_name' ? 'Name' : c.field === 'ug_notes' ? 'Description' : c.field}: “${c.before}” → “${c.after}”`);
      out.push({ ...base, kind: 'group', added: [], removed: [], note: lines.join(' · ') });
    } else if (table === 'sys_userrecords') {
      const lines: string[] = [];
      if (!before && after) lines.push(`New user in group ${str(after.usergroup)}`);
      else if (before && after) {
        if (str(before.usergroup) !== str(after.usergroup)) lines.push(`Moved from group ${str(before.usergroup)} to ${str(after.usergroup)}`);
        if (str(before.stat || 'Active') !== str(after.stat || 'Active')) lines.push(str(after.stat) === 'Inactive' ? 'Deactivated: can no longer sign in' : 'Reactivated');
      } else if (/unlock|reset/i.test(trans)) lines.push('Unlocked, with a new temporary password');
      if (!lines.length) continue; // a name or e-mail edit: in Change History, not an access change
      out.push({ ...base, kind: 'user', added: [], removed: [], note: lines.join(' · ') });
    } else if (table === 'ng_api_keys') {
      out.push({ ...base, kind: 'apikey', added: [], removed: [], note: '' });
    }
  }
  const rows = out.filter(
    (x) => (!kindWanted || kindWanted === 'all' || x.kind === kindWanted) && (!q || `${x.subject} ${x.title} ${x.note} ${x.added.join(' ')} ${x.removed.join(' ')}`.toLowerCase().includes(q))
  );
  return { rows };
}
