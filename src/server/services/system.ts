// System pages: favourites (legacy MyFavorites, sys_mymenu), maintenance mode (legacy
// Maintenance.aspx + App_Data/MainStat.txt), document setup (legacy DocConfig.aspx,
// batbl.dloadstat) and the about box of Help.
import type { Db, Row } from '../db';
import { ACTION, FORM } from '@/shared/codes';
import { nowStamp } from '@/shared/dates';
import { NAV } from '@/components/shell/nav';
import { Ctx, audit, fail, isAllowed, requireRight } from './context';
import { allDocServices } from './docs';

// ---------------------------------------------------------------------------
// Settings kept by Cloud AOS only (ng_settings, one row per company and key).
// ---------------------------------------------------------------------------
export async function getSetting<T>(db: Db, key: string, fallback: T): Promise<T> {
  const row = await db.one('ng_settings', { ba: db.ba, skey: key });
  if (!row?.svalue) return fallback;
  try {
    return { ...fallback, ...JSON.parse(String(row.svalue)) };
  } catch {
    return fallback;
  }
}

async function putSetting(db: Db, key: string, value: Row, user: string) {
  const row = { svalue: JSON.stringify(value), updated_by: user, updated_at: nowStamp() };
  if (await db.one('ng_settings', { ba: db.ba, skey: key })) await db.update('ng_settings', { ba: db.ba, skey: key }, row);
  else await db.insert('ng_settings', { ba: db.ba, skey: key, ...row });
}

// ---------------------------------------------------------------------------
// Favourites. The legacy pages write (code = form code, description, user); Cloud AOS
// also fills menudesc / menulabel and keeps the page address in `web`, so both
// systems read the same list.
// ---------------------------------------------------------------------------
export interface Favourite {
  href: string;
  label: string;
  section: string;
  form: string;
}

const NAV_ITEMS = NAV.filter((g) => g.id !== 'reports').flatMap((g) => g.items.map((i) => ({ ...i, section: g.label })));

function pageOf(r: Row) {
  if (r.web) return NAV_ITEMS.find((i) => i.href === r.web);
  const code = String(r.code ?? '');
  const desc = String(r.description ?? r.menulabel ?? '').toLowerCase();
  return NAV_ITEMS.find((i) => i.form === code && i.label.toLowerCase() === desc) ?? NAV_ITEMS.find((i) => i.form === code);
}

async function favRows(db: Db, user: string): Promise<Row[]> {
  const a = await db.all('sys_mymenu', { where: { user } });
  const b = await db.all('sys_mymenu', { where: { userid: user } });
  return [...a, ...b.filter((r) => !a.includes(r) && !a.some((x) => x.code === r.code && x.web === r.web && x.description === r.description))];
}

export async function favourites(db: Db, user: string, group: string): Promise<Favourite[]> {
  const out: Favourite[] = [];
  for (const r of await favRows(db, user)) {
    const p = pageOf(r);
    if (!p || out.some((f) => f.href === p.href)) continue;
    if (!(await isAllowed(db, group, p.form, ACTION.VIEW))) continue;
    out.push({ href: p.href, label: p.label, section: p.section, form: p.form });
  }
  return out;
}

export async function toggleFavourite(ctx: Ctx, href: string): Promise<{ favourite: boolean; list: Favourite[] }> {
  const page = NAV_ITEMS.find((i) => i.href === href);
  if (!page) fail('Only pages of the menu can be added to Favourites.');
  await requireRight(ctx, page.form, ACTION.VIEW, 'open this page');
  const favourite = await ctx.db.tx(async (db) => {
    const mine = (await favRows(db, ctx.user)).filter((r) => pageOf(r)?.href === href);
    if (mine.length) {
      for (const r of mine) await db.remove('sys_mymenu', r.web ? { user: r.user ?? ctx.user, web: r.web } : { user: r.user ?? ctx.user, code: r.code, description: r.description });
      return false;
    }
    await db.insert('sys_mymenu', { code: page.form, description: page.label, menudesc: page.section, menulabel: page.label, user: ctx.user, userid: ctx.user, web: page.href });
    return true;
  });
  return { favourite, list: await favourites(ctx.db, ctx.user, ctx.group) };
}

// ---------------------------------------------------------------------------
// Maintenance mode. When it is on, only administrators can work in the company;
// everyone else sees the message (legacy: "No" in MainStat.txt means off).
// ---------------------------------------------------------------------------
export interface Maintenance {
  on: boolean;
  message: string;
  until: string;
  by: string;
  at: string;
}

const MAINT_DEFAULT: Maintenance = { on: false, message: 'Cloud AOS is being updated. Please try again in a little while.', until: '', by: '', at: '' };

export async function maintenance(db: Db): Promise<Maintenance> {
  return getSetting(db, 'maintenance', MAINT_DEFAULT);
}

/** Administrators and groups allowed to switch maintenance mode keep working while it is on. */
export async function bypassesMaintenance(db: Db, group: string): Promise<boolean> {
  return group === 'ADMIN' || isAllowed(db, group, FORM.APP_CONTROL, ACTION.RELEASE);
}

export function maintenanceText(m: Maintenance): string {
  return `${m.message}${m.until ? ` Expected back: ${m.until}.` : ''}`;
}

/** Throws when the company is in maintenance and this group may not work during it. */
export async function guardMaintenance(db: Db, group: string): Promise<void> {
  const m = await maintenance(db);
  if (m.on && !(await bypassesMaintenance(db, group))) fail(`Under maintenance: ${maintenanceText(m)}`, 503);
}

export async function setMaintenance(ctx: Ctx, input: { on?: unknown; message?: unknown; until?: unknown }): Promise<Maintenance> {
  await requireRight(ctx, FORM.APP_CONTROL, ACTION.RELEASE, 'switch maintenance mode');
  const message = String(input.message ?? '').trim() || MAINT_DEFAULT.message;
  if (message.length > 300) fail('Keep the message under 300 characters.');
  const next: Maintenance = { on: Boolean(input.on), message, until: String(input.until ?? '').trim().slice(0, 60), by: ctx.user, at: nowStamp() };
  await ctx.db.tx(async (db) => {
    const before = await maintenance(db);
    await putSetting(db, 'maintenance', next, ctx.user);
    await audit({ ...ctx, db }, { form: FORM.APP_CONTROL, docno: 'MAINTENANCE', trans: next.on ? 'Maintenance mode switched on' : before.on ? 'Maintenance mode switched off' : 'Maintenance message updated', table: 'ng_settings', before: before as unknown as Row, after: next as unknown as Row });
  });
  return next;
}

export async function maintenancePage(ctx: Ctx) {
  await requireRight(ctx, FORM.APP_CONTROL, ACTION.VIEW, 'view maintenance mode');
  const users = await ctx.db.all('sys_userrecords');
  const groups = await ctx.db.all('sys_usergroup');
  const keep: string[] = [];
  for (const g of groups) if (await bypassesMaintenance(ctx.db, String(g.ug_code))) keep.push(String(g.ug_code));
  const active = users.filter((u) => String(u.stat ?? 'Active').toLowerCase() !== 'inactive');
  return {
    ...(await maintenance(ctx.db)),
    canSwitch: await isAllowed(ctx.db, ctx.group, FORM.APP_CONTROL, ACTION.RELEASE),
    keepWorking: groups.filter((g) => keep.includes(String(g.ug_code))).map((g) => String(g.ug_name)),
    blockedUsers: active.filter((u) => !keep.includes(String(u.usergroup))).length,
    totalUsers: active.length,
  };
}

// ---------------------------------------------------------------------------
// Document setup: numbering overview of every document type, and the hold on the
// AOS mobile app data download (batbl.dloadstat Open / Close).
// ---------------------------------------------------------------------------
export async function docSetup(ctx: Ctx) {
  await requireRight(ctx, FORM.APP_CONTROL, ACTION.VIEW, 'view document setup');
  const company = await ctx.db.one('batbl', { ba: ctx.ba });
  const docs: Row[] = [];
  for (const svc of allDocServices()) {
    let rows: Row[] = [];
    try {
      rows = (await svc.list(ctx, { limit: 100000 })).rows;
    } catch {
      rows = [];
    }
    const nos = rows.map((r) => String(r.no ?? r[svc.noColumn] ?? '')).filter(Boolean);
    const latest = [...nos].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0] ?? '';
    const dates = rows.map((r) => String(r.date ?? r.transdate ?? '')).filter(Boolean).sort();
    docs.push({
      type: svc.type,
      title: svc.title,
      form: svc.form,
      tc: svc.tc ?? '',
      table: svc.table,
      column: svc.noColumn,
      count: rows.length,
      latest,
      prefix: latest.replace(/\d+$/, ''),
      digits: (latest.match(/\d+$/)?.[0] ?? '').length,
      lastDate: dates[dates.length - 1] ?? '',
      canView: await isAllowed(ctx.db, ctx.group, svc.form, ACTION.VIEW),
    });
  }
  return {
    download: downloadState(company?.dloadstat),
    downloadRaw: String(company?.dloadstat ?? ''),
    canEdit: await isAllowed(ctx.db, ctx.group, FORM.APP_CONTROL, ACTION.EDIT),
    docs,
  };
}

function downloadState(v: unknown): 'held' | 'released' {
  return String(v ?? '').trim().toLowerCase() === 'close' ? 'held' : 'released';
}

export async function setDownloadHold(ctx: Ctx, hold: boolean): Promise<string> {
  await requireRight(ctx, FORM.APP_CONTROL, ACTION.EDIT, 'hold or release the app download');
  const value = hold ? 'Close' : 'Open';
  await ctx.db.tx(async (db) => {
    const before = await db.one('batbl', { ba: ctx.ba });
    if (!before) fail('The company record (batbl) was not found.');
    await db.update('batbl', { ba: ctx.ba }, { dloadstat: value });
    await audit({ ...ctx, db }, { form: FORM.APP_CONTROL, docno: 'DLOADSTAT', trans: `Upload status switched to ${value}`, table: 'batbl', before: { dloadstat: before.dloadstat }, after: { dloadstat: value } });
  });
  return hold ? 'The app data download is on hold.' : 'The app data download is released.';
}
