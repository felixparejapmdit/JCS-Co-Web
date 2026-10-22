import { matrixForms, permissionPairs } from '@/shared/permissions';
import { openAdvances } from './funds';
import { openDeposits } from './depapp';
import { budgetMonitor } from './budget';
import type { Db, Row } from '../db';
import { ACTION, FORM, FORM_CATALOG, INVOICE_TCS, TC, statusTone } from '@/shared/codes';
import { addDays, monthEnd, monthName, monthStart, nowStamp, today, ym } from '@/shared/dates';
import { r2, sum } from '@/shared/money';
import { hashPassword, legacyEncode, passwordProblem } from '../auth';
import { Ctx, audit, fail, isAllowed, need, num, openPeriodDate, requireRight, rightsOf, str, truthy } from './context';
import { actOnDoc, allDocServices, docService } from './docs';
import { ledgerLines } from './gl';
import { stockReport } from './inventory';
import { openInvoices } from './receivables';

// ===========================================================================
// Company profile and the client's sidebar header (AOSappConfig.aspx, form 001)
// ===========================================================================
export interface Branding {
  ba: string;
  display_name: string;
  tagline: string;
  logo_text: string;
  accent: string;
  logo_data: string | null;
  show_code: string;
}

export async function companyProfile(ctx: Ctx): Promise<{ company: Row; branding: Branding }> {
  const company = (await ctx.db.one('batbl', { ba: ctx.ba })) ?? { ba: ctx.ba };
  const b = await ctx.db.one('ng_company_branding', { ba: ctx.ba });
  const name = str(company.bussname) || ctx.ba;
  return {
    company,
    branding: {
      ba: ctx.ba,
      display_name: str(b?.display_name) || name,
      tagline: str(b?.tagline) || str(company.address).split(',').slice(-2).join(',').trim(),
      logo_text: str(b?.logo_text) || initials(str(company.shrtname) || name),
      accent: str(b?.accent) || '#2f7fff',
      logo_data: b?.logo_data ? String(b.logo_data) : null,
      show_code: str(b?.show_code) || 'Y',
    },
  };
}

function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !['inc', 'corp', 'corporation', 'the', 'of', 'and'].includes(w.toLowerCase()));
  return (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? 'CA').slice(0, 2)).toUpperCase();
}

export async function saveCompanyProfile(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.APP_CONTROL, ACTION.EDIT, 'change company settings');
  const accent = str(input.accent) || '#2f7fff';
  if (!/^#[0-9a-f]{6}$/i.test(accent)) fail('Choose a color in #RRGGBB format.');
  const logo = input.logo_data ? String(input.logo_data) : null;
  if (logo && (!/^data:image\/(png|jpeg|svg\+xml|webp);base64,/.test(logo) || logo.length > 300_000)) fail('Upload a PNG, JPG, SVG or WebP logo under 200 KB.');
  const logoText = str(input.logo_text).slice(0, 3).toUpperCase();
  return ctx.db.tx(async (db) => {
    const company = await db.one('batbl', { ba: ctx.ba });
    const companyPatch = {
      bussname: need(str(input.bussname), 'Enter the registered business name.'),
      shrtname: str(input.shrtname),
      address: str(input.address),
      cotin1: str(input.cotin1),
      bir_sign: str(input.bir_sign),
      bir_sign_poss: str(input.bir_sign_poss),
    };
    if (company) await db.update('batbl', { ba: ctx.ba }, companyPatch);
    else await db.insert('batbl', { ba: ctx.ba, ...companyPatch, stat: 'Active' });
    const branding = {
      ba: ctx.ba,
      display_name: str(input.display_name),
      tagline: str(input.tagline).slice(0, 80),
      logo_text: logoText,
      accent,
      logo_data: logo,
      show_code: input.show_code === 'N' ? 'N' : 'Y',
      updated_by: ctx.user,
      updated_at: nowStamp(),
    };
    if (await db.one('ng_company_branding', { ba: ctx.ba })) await db.update('ng_company_branding', { ba: ctx.ba }, branding);
    else await db.insert('ng_company_branding', branding);
    await audit({ ...ctx, db }, { form: FORM.APP_CONTROL, docno: ctx.ba, trans: 'Update company profile and branding', table: 'ng_company_branding', before: company, after: { ...companyPatch, ...branding, logo_data: logo ? '[image]' : null } });
    return 'Company profile saved. The sidebar header now shows your branding.';
  });
}

// ===========================================================================
// Users (UserMaintenance.aspx, form 001)
// ===========================================================================
function tempPassword(): string {
  const words = ['Amber', 'Cedar', 'Delta', 'Ember', 'Falcon', 'Harbor', 'Island', 'Juniper', 'Lotus', 'Maple', 'Nova', 'Orchid', 'Pearl', 'Quartz', 'River', 'Summit'];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}${Math.floor(1000 + Math.random() * 9000)}!`;
}

export async function listUsers(ctx: Ctx) {
  await requireRight(ctx, FORM.USERS, ACTION.VIEW, 'view users');
  const users = await ctx.db.all('sys_userrecords', { orderBy: [['username', 'asc']] });
  const groups = await ctx.db.all('sys_usergroup');
  const plants = await ctx.db.all('userplnttbl');
  const creds = await ctx.db.all('ng_user_credentials');
  return users.map((u) => {
    const c = creds.find((x) => String(x.username).toLowerCase() === String(u.username).toLowerCase());
    return {
      username: u.username,
      userfullname: u.userfullname,
      usergroup: u.usergroup,
      groupname: groups.find((g) => g.ug_code === u.usergroup)?.ug_name ?? u.usergroup,
      idstat: u.idstat || 'Open',
      stat: u.stat || 'Active',
      useremailaddress: u.useremailaddress,
      usertelno: u.usertelno,
      empno: u.empno,
      plants: plants.filter((p) => p.user === u.username).map((p) => p.plntno),
      upgraded: Boolean(c),
      lastChange: c?.updated_at ?? null,
    };
  });
}

export async function saveUser(ctx: Ctx, input: Row, isNew: boolean): Promise<{ message: string; tempPassword?: string }> {
  await requireRight(ctx, FORM.USERS, isNew ? ACTION.INSERT : ACTION.EDIT, `${isNew ? 'create' : 'change'} users`);
  const username = need(str(input.username).toLowerCase(), 'Enter a username.');
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) fail('Usernames use 3-30 letters, numbers, dots, dashes or underscores.');
  const group = need(str(input.usergroup), 'Choose the user group.');
  if (!(await ctx.db.one('sys_usergroup', { ug_code: group }))) fail(`User group ${group} does not exist.`);
  const temp = isNew ? tempPassword() : undefined;
  const hash = temp ? await hashPassword(temp) : undefined;
  return ctx.db.tx(async (db) => {
    const existing = await db.one('sys_userrecords', { username });
    if (isNew && existing) fail(`User ${username} already exists.`);
    if (!isNew && !existing) fail(`User ${username} was not found.`);
    const row = {
      username,
      user: username,
      userfullname: need(str(input.userfullname), 'Enter the full name.'),
      usergroup: group,
      useremailaddress: str(input.useremailaddress),
      usertelno: str(input.usertelno),
      empno: str(input.empno),
      userloc: str(input.userloc) || 'MAIN',
      stat: str(input.stat) || 'Active',
    };
    if (isNew) {
      // The legacy screens still read sys_userrecords during the transition, so the temporary
      // password is stored there too; it is cleared when legacy login is retired (PLAN.md 8.3).
      await db.insert('sys_userrecords', { ...row, userpassword: legacyEncode(temp!), idstat: 'Open', pdate: today() });
      await db.insert('ng_user_credentials', { username, password_hash: hash!, failed_attempts: 0, locked_at: null, updated_at: nowStamp() });
    } else {
      await db.update('sys_userrecords', { username }, row);
    }
    if (Array.isArray(input.plants)) {
      await db.remove('userplnttbl', { user: username });
      for (const p of input.plants) await db.insert('userplnttbl', { user: username, userid: username, plntno: str(p) });
    }
    await audit({ ...ctx, db }, { form: FORM.USERS, docno: username, trans: `${isNew ? 'Create' : 'Edit'} user ${username}`, table: 'sys_userrecords', before: existing ? { ...existing, userpassword: '***' } : null, after: row });
    return { message: isNew ? `User ${username} created. Give them the temporary password below; they will be asked to change it.` : `User ${username} updated.`, tempPassword: temp };
  });
}

export async function resetUser(ctx: Ctx, username: string): Promise<{ message: string; tempPassword: string }> {
  await requireRight(ctx, FORM.USERS, ACTION.EDIT, 'unlock users');
  const temp = tempPassword();
  const hash = await hashPassword(temp);
  return ctx.db.tx(async (db) => {
    const u = await db.one('sys_userrecords', { username });
    if (!u) fail(`User ${username} was not found.`);
    await db.update('sys_userrecords', { username }, { idstat: 'Open', userpassword: legacyEncode(temp), pdate: today() });
    if (await db.one('ng_user_credentials', { username })) await db.update('ng_user_credentials', { username }, { password_hash: hash, failed_attempts: 0, locked_at: null, updated_at: nowStamp() });
    else await db.insert('ng_user_credentials', { username, password_hash: hash, failed_attempts: 0, locked_at: null, updated_at: nowStamp() });
    await audit({ ...ctx, db }, { form: FORM.USERS, docno: username, trans: `Unlock and reset password of ${username}`, table: 'sys_userrecords' });
    return { message: `${u.userfullname} is unlocked. Share the temporary password below.`, tempPassword: temp };
  });
}

export async function changePassword(ctx: Ctx, current: string, next: string): Promise<string> {
  const problem = passwordProblem(next);
  if (problem) fail(problem);
  const { verifyLogin } = await import('./session');
  const ok = await verifyLogin(ctx.db, ctx.user, current);
  if (ok !== 'ok') fail('Your current password is not correct.');
  const hash = await hashPassword(next);
  return ctx.db.tx(async (db) => {
    await db.update('sys_userrecords', { username: ctx.user }, { userpassword: legacyEncode(next), pdate: today() });
    if (await db.one('ng_user_credentials', { username: ctx.user })) await db.update('ng_user_credentials', { username: ctx.user }, { password_hash: hash, failed_attempts: 0, updated_at: nowStamp() });
    else await db.insert('ng_user_credentials', { username: ctx.user, password_hash: hash, failed_attempts: 0, locked_at: null, updated_at: nowStamp() });
    await audit({ ...ctx, db }, { form: FORM.USERS, docno: ctx.user, trans: 'Change own password', table: 'sys_userrecords' });
    return 'Your password was changed.';
  });
}

// ===========================================================================
// Groups and rights (UserGrpAccess.aspx, form 002)
// ===========================================================================
export async function groupsWithRights(ctx: Ctx) {
  await requireRight(ctx, FORM.GROUP_ACCESS, ACTION.VIEW, 'view group access');
  const groups = await ctx.db.all('sys_usergroup', { orderBy: [['ug_code', 'asc']] });
  const users = await ctx.db.all('sys_userrecords');
  const out: Row[] = [];
  for (const g of groups) out.push({ ...g, members: users.filter((u) => u.usergroup === g.ug_code).length, locked: g.ug_code === ADMIN_GROUP, rights: await rightsOf(ctx.db, g.ug_code) });
  return { groups: out, forms: FORM_CATALOG, canEdit: await isAllowed(ctx.db, ctx.group, FORM.GROUP_ACCESS, ACTION.EDIT), myGroup: ctx.group };
}

/** The administrator group always keeps every right (the matrix shows it as "always"). */
export const ADMIN_GROUP = 'ADMIN';

/**
 * Writes the rights of one group for the given forms only. Rights of forms (and actions) the
 * matrix does not show are kept as they are, so legacy-only forms are never lost.
 */
async function writeRights(db: Db, group: string, rights: Record<string, number[]>, forms: string[], shown: Map<string, Set<number>>) {
  for (const form of forms) {
    const old = await db.one('sys_usergrouprights', { gr_groupcode: group, gr_formcode: form });
    const oldActs = old ? [1, 2, 3, 4, 5].filter((a) => truthy(old[RIGHT_COL[a]])) : [];
    const visible = shown.get(form) ?? new Set([1, 2, 3, 4, 5]);
    const acts = new Set<number>([...oldActs.filter((a) => !visible.has(a)), ...(rights[form] ?? []).filter((a) => visible.has(a))]);
    if (old) await db.remove('sys_usergrouprights', { gr_groupcode: group, gr_formcode: form });
    if (!acts.size && !(old && (truthy(old.gr_autosave) || truthy(old.gr_remember)))) continue;
    await db.insert('sys_usergrouprights', {
      gr_groupcode: group,
      gr_formcode: form,
      gr_viewrights: acts.has(1) ? 1 : 0,
      gr_editrights: acts.has(2) ? 1 : 0,
      gr_insertrights: acts.has(3) ? 1 : 0,
      gr_deleterights: acts.has(4) ? 1 : 0,
      gr_releaserights: acts.has(5) ? 1 : 0,
      gr_autosave: old ? old.gr_autosave ?? 0 : 0,
      gr_remember: old ? old.gr_remember ?? 0 : 0,
    });
  }
}

const RIGHT_COL: Record<number, string> = { 1: 'gr_viewrights', 2: 'gr_editrights', 3: 'gr_insertrights', 4: 'gr_deleterights', 5: 'gr_releaserights' };

function shownActions(): Map<string, Set<number>> {
  const m = new Map<string, Set<number>>();
  for (const p of permissionPairs()) m.set(p.form, new Set([...(m.get(p.form) ?? []), p.action]));
  return m;
}

export async function saveGroupRights(ctx: Ctx, group: string, rights: Record<string, number[]>, info?: { ug_name?: string; ug_notes?: string }): Promise<string> {
  await requireRight(ctx, FORM.GROUP_ACCESS, ACTION.EDIT, 'change group access');
  if (group === ctx.group && group !== ADMIN_GROUP && !(rights[FORM.GROUP_ACCESS] ?? []).includes(ACTION.EDIT)) fail("You cannot remove your own group's right to edit Group Access.");
  return ctx.db.tx(async (db) => {
    let g = await db.one('sys_usergroup', { ug_code: group });
    if (!g) {
      if (!info?.ug_name) fail('Enter a name for the new group.');
      if (!/^[A-Z0-9_-]{2,12}$/i.test(group)) fail('The group code uses 2 to 12 letters or digits.');
      await db.insert('sys_usergroup', { ug_code: group.toUpperCase(), ug_name: info.ug_name, ug_notes: info.ug_notes ?? '' });
      g = { ug_code: group };
    } else if (info?.ug_name) {
      await db.update('sys_usergroup', { ug_code: group }, { ug_name: info.ug_name, ug_notes: info.ug_notes ?? g.ug_notes });
    }
    const shown = shownActions();
    if (group === ADMIN_GROUP) rights = Object.fromEntries([...shown.entries()].map(([f, acts]) => [f, [...acts]]));
    const forms = [...new Set([...matrixForms(), ...Object.keys(rights)])];
    await writeRights(db, group, rights, forms, shown);
    await audit({ ...ctx, db }, { form: FORM.GROUP_ACCESS, docno: group, trans: `Update rights of group ${group}`, table: 'sys_usergrouprights', after: rights });
    return `Rights of group ${group} saved. Members see the change when they next open a page.`;
  });
}

/** Access Matrix: saves the changed groups in one go. */
export async function saveAccessMatrix(ctx: Ctx, changes: Record<string, Record<string, number[]>>): Promise<string> {
  await requireRight(ctx, FORM.GROUP_ACCESS, ACTION.EDIT, 'change group access');
  const groups = Object.keys(changes ?? {});
  if (!groups.length) fail('There are no changes to save.');
  const mine = changes[ctx.group];
  if (mine && ctx.group !== ADMIN_GROUP && !(mine[FORM.GROUP_ACCESS] ?? []).includes(ACTION.EDIT)) fail("You cannot remove your own group's right to change group access.");
  const shown = shownActions();
  return ctx.db.tx(async (db) => {
    for (const group of groups) {
      if (!(await db.one('sys_usergroup', { ug_code: group }))) fail(`Group ${group} does not exist.`);
      const rights = group === ADMIN_GROUP ? Object.fromEntries([...shown.entries()].map(([f, a]) => [f, [...a]])) : changes[group];
      await writeRights(db, group, rights, matrixForms(), shown);
      await audit({ ...ctx, db }, { form: FORM.GROUP_ACCESS, docno: group, trans: `Update access matrix for ${group}`, table: 'sys_usergrouprights', after: rights });
    }
    return `Access saved for ${groups.length} group(s). Members see the change when they next open a page.`;
  });
}

// ===========================================================================
// User groups (form 002): the groups themselves. What each group may do is set in the Access Matrix.
// ===========================================================================
const GROUP_CODE = /^[A-Z0-9_-]{2,12}$/;

/** Active API keys that read with a group's rights (none when the ng_api_keys table is not there yet). */
async function keysOfGroup(db: Db, code: string): Promise<number> {
  try {
    return (await db.all('ng_api_keys', { where: { ug_code: code } })).filter((k) => !k.revoked_at).length;
  } catch {
    return 0;
  }
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export async function listGroups(ctx: Ctx) {
  await requireRight(ctx, FORM.GROUP_ACCESS, ACTION.VIEW, 'view user groups');
  const groups = await ctx.db.all('sys_usergroup', { orderBy: [['ug_code', 'asc']] });
  const users = await ctx.db.all('sys_userrecords');
  const rights = await ctx.db.all('sys_usergrouprights');
  const allowed = (a: Parameters<typeof isAllowed>[3]) => isAllowed(ctx.db, ctx.group, FORM.GROUP_ACCESS, a);
  return {
    groups: await Promise.all(
      groups.map(async (g) => {
        const code = String(g.ug_code);
        return {
          code,
          name: str(g.ug_name) || code,
          notes: str(g.ug_notes),
          members: users.filter((u) => u.usergroup === code).length,
          pages: code === ADMIN_GROUP ? matrixForms().length : rights.filter((r) => r.gr_groupcode === code && truthy(r.gr_viewrights)).length,
          apiKeys: await keysOfGroup(ctx.db, code),
          locked: code === ADMIN_GROUP,
          mine: code === ctx.group,
        };
      })
    ),
    canAdd: await allowed(ACTION.INSERT),
    canEdit: await allowed(ACTION.EDIT),
    canDelete: await allowed(ACTION.DELETE),
  };
}

/** Adds a group, with no access or with a copy of another group's access. */
export async function createGroup(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.GROUP_ACCESS, ACTION.INSERT, 'add user groups');
  const code = str(input.code).toUpperCase();
  const name = need(str(input.name), 'Enter a name for the new group.');
  if (!GROUP_CODE.test(code)) fail('The group code uses 2 to 12 letters, digits, dashes or underscores.');
  const copyFrom = str(input.copyFrom).toUpperCase();
  return ctx.db.tx(async (db) => {
    if (await db.one('sys_usergroup', { ug_code: code })) fail(`Group ${code} already exists.`);
    if (copyFrom && !(await db.one('sys_usergroup', { ug_code: copyFrom }))) fail(`Group ${copyFrom} does not exist.`);
    await db.insert('sys_usergroup', { ug_code: code, ug_name: name, ug_notes: str(input.notes) });
    let copied = 0;
    if (copyFrom === ADMIN_GROUP) {
      const shown = shownActions();
      await writeRights(db, code, Object.fromEntries([...shown.entries()].map(([f, acts]) => [f, [...acts]])), matrixForms(), shown);
      copied = matrixForms().length;
    } else if (copyFrom) {
      for (const r of await db.all('sys_usergrouprights', { where: { gr_groupcode: copyFrom } })) {
        await db.insert('sys_usergrouprights', { ...r, gr_groupcode: code });
        copied++;
      }
    }
    await audit({ ...ctx, db }, { form: FORM.GROUP_ACCESS, docno: code, trans: `Add user group ${code}${copyFrom ? ` (access copied from ${copyFrom})` : ''}`, table: 'sys_usergroup', after: { ug_code: code, ug_name: name } });
    return copyFrom ? `Group ${code} added with the access of ${copyFrom} (${plural(copied, 'page')}).` : `Group ${code} added with no access yet. Tick its pages in the Access Matrix.`;
  });
}

/** Renames a group or changes its description; the code stays, since users and rights refer to it. */
export async function updateGroup(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.GROUP_ACCESS, ACTION.EDIT, 'change user groups');
  const code = str(input.code).toUpperCase();
  const name = need(str(input.name), 'Enter the group name.');
  return ctx.db.tx(async (db) => {
    const old = await db.one('sys_usergroup', { ug_code: code });
    if (!old) fail(`Group ${code} does not exist.`);
    const after = { ug_name: name, ug_notes: str(input.notes) };
    await db.update('sys_usergroup', { ug_code: code }, after);
    await audit({ ...ctx, db }, { form: FORM.GROUP_ACCESS, docno: code, trans: `Change user group ${code}`, table: 'sys_usergroup', before: { ug_name: old!.ug_name, ug_notes: old!.ug_notes }, after });
    return `Group ${code} saved.`;
  });
}

/** Deletes an unused group with its rights. A group that still has users or API keys is refused. */
export async function deleteGroup(ctx: Ctx, codeIn: unknown): Promise<string> {
  await requireRight(ctx, FORM.GROUP_ACCESS, ACTION.DELETE, 'delete user groups');
  const code = str(codeIn).toUpperCase();
  if (code === ADMIN_GROUP) fail('The administrator group cannot be deleted.');
  if (code === ctx.group) fail('You cannot delete your own group.');
  return ctx.db.tx(async (db) => {
    const old = await db.one('sys_usergroup', { ug_code: code });
    if (!old) fail(`Group ${code} does not exist.`);
    const members = (await db.all('sys_userrecords', { where: { usergroup: code } })).length;
    if (members) fail(`Group ${code} still has ${plural(members, 'user')}. Move them to another group in Users first.`);
    const keys = await keysOfGroup(db, code);
    if (keys) fail(`${plural(keys, 'API key')} still use the rights of ${code}. Revoke them in API Keys first.`);
    const rights = await db.remove('sys_usergrouprights', { gr_groupcode: code });
    await db.remove('sys_usergroup', { ug_code: code });
    await audit({ ...ctx, db }, { form: FORM.GROUP_ACCESS, docno: code, trans: `Delete user group ${code} (${plural(rights, 'page right')})`, table: 'sys_usergroup', before: { ug_code: code, ug_name: old!.ug_name, ug_notes: old!.ug_notes } });
    return `Group ${code} deleted.`;
  });
}

// ===========================================================================
// Approval limits (AuthConfig.aspx, form 045)
// ===========================================================================
export const LIMIT_FORMS = [
  { form: 'PurcApp', label: 'Purchase orders' },
  { form: 'APapp', label: 'Vouchers payable' },
  { form: 'SOapp', label: 'Sales orders' },
];

export async function approvalLimits(ctx: Ctx) {
  await requireRight(ctx, FORM.AUTH_CONFIG, ACTION.VIEW, 'view approval limits');
  const rows = await ctx.db.all('authtbl', { orderBy: [['userid', 'asc']] });
  const users = await ctx.db.all('sys_userrecords');
  return { rows: rows.map((r) => ({ ...r, userfullname: users.find((u) => u.username === r.userid)?.userfullname ?? r.userid })), forms: LIMIT_FORMS };
}

export async function saveApprovalLimit(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.AUTH_CONFIG, ACTION.EDIT, 'change approval limits');
  const userid = need(str(input.userid), 'Choose the approver.');
  const form = need(str(input.form), 'Choose what the limit applies to.');
  if (!LIMIT_FORMS.some((f) => f.form === form)) fail('Unknown approval type.');
  const maxamt = r2(num(input.maxamt));
  return ctx.db.tx(async (db) => {
    await db.remove('authtbl', { userid, form });
    if (maxamt > 0) await db.insert('authtbl', { userid, user: userid, form, module: LIMIT_FORMS.find((f) => f.form === form)!.label, maxamt, appstat: 'POST', tc: '' });
    await audit({ ...ctx, db }, { form: FORM.AUTH_CONFIG, docno: userid, trans: maxamt > 0 ? `Set ${form} limit to ${maxamt}` : `Remove ${form} limit`, table: 'authtbl' });
    return maxamt > 0 ? 'Approval limit saved.' : 'Approval limit removed (no limit applies).';
  });
}

// ===========================================================================
// Void requests (VoidReq.aspx / VoidApproval.aspx, form 003)
// ===========================================================================
function serviceForTc(tc: string) {
  return allDocServices().find((s) => s.tc === tc);
}

export async function listVoidRequests(ctx: Ctx) {
  await requireRight(ctx, FORM.VOID, ACTION.VIEW, 'view void requests');
  const rows = await ctx.db.all('voidreqtbl', { orderBy: [['transdate', 'desc']] });
  return {
    rows: rows.map((r) => ({ ...r, document: serviceForTc(r.tc)?.title ?? `TC ${r.tc}`, type: serviceForTc(r.tc)?.type })),
    canApprove: await isAllowed(ctx.db, ctx.group, FORM.VOID, ACTION.RELEASE),
    voidable: allDocServices()
      .filter((s) => s.tc)
      .map((s) => ({ tc: s.tc, title: s.title, type: s.type })),
  };
}

export async function requestVoid(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.VOID, ACTION.INSERT, 'request voids');
  const type = need(str(input.type), 'Choose the document type.');
  const svc = docService(type);
  const docno = need(str(input.docno), 'Enter the document number.');
  const remarks = need(str(input.remarks), 'Explain why the document should be voided.');
  const doc = await svc.load(ctx, docno);
  if (!doc) fail(`${svc.title} ${docno} was not found.`);
  if (String(doc.h.status) === 'Void') fail(`${svc.title} ${docno} is already void.`);
  return ctx.db.tx(async (db) => {
    const pending = await db.one('voidreqtbl', { docno, tc: svc.tc!, reqstat: 'Pending' });
    if (pending) fail(`There is already a pending void request for ${docno}.`);
    await db.insert('voidreqtbl', { docno, tc: svc.tc, remarks, reqstat: 'Pending', user: ctx.user, transdate: nowStamp(), pdate: today() });
    await audit({ ...ctx, db }, { form: FORM.VOID, tc: svc.tc, docno, trans: `Request void: ${remarks}`, table: 'voidreqtbl' });
    return `Void request for ${svc.title} ${docno} sent for approval.`;
  });
}

export async function decideVoid(ctx: Ctx, docno: string, tc: string, approve: boolean, note: string): Promise<string> {
  await requireRight(ctx, FORM.VOID, ACTION.RELEASE, 'approve void requests');
  const req = await ctx.db.one('voidreqtbl', { docno, tc, reqstat: 'Pending' });
  if (!req) fail('That void request is no longer pending.');
  if (approve) {
    const svc = serviceForTc(tc);
    if (!svc) fail('This document type cannot be voided here.');
    await actOnDoc(ctx, svc.type, docno, 'void');
  }
  return ctx.db.tx(async (db) => {
    await db.update('voidreqtbl', { docno, tc, reqstat: 'Pending' }, { reqstat: approve ? 'Approved' : 'Rejected', appby: ctx.user, appdate: today(), remarks: note ? `${req.remarks} | ${note}` : req.remarks });
    await audit({ ...ctx, db }, { form: FORM.VOID, tc, docno, trans: `${approve ? 'Approve' : 'Reject'} void request`, table: 'voidreqtbl' });
    return approve ? `${docno} was voided.` : `Void request for ${docno} rejected.`;
  });
}

// ===========================================================================
// Document query (DocQuery.aspx) and audit trail (translog)
// ===========================================================================
export async function findDocuments(ctx: Ctx, q: string) {
  const term = str(q);
  if (term.length < 2) return [];
  const out: Row[] = [];
  for (const svc of allDocServices()) {
    if (!(await isAllowed(ctx.db, ctx.group, svc.form, ACTION.VIEW))) continue;
    const res = await svc.list(ctx, { q: term });
    for (const r of res.rows.slice(0, 8)) out.push({ type: svc.type, title: svc.title, no: r.no, status: r.status, tone: statusTone(r.status), date: r.transdate, party: r.party, amount: r.amount });
  }
  return out.sort((a, b) => (String(a.no).toLowerCase().startsWith(term.toLowerCase()) ? -1 : 1) - (String(b.no).toLowerCase().startsWith(term.toLowerCase()) ? -1 : 1)).slice(0, 30);
}

export async function auditTrail(ctx: Ctx, f: { q?: string; user?: string; from?: string; to?: string }) {
  await requireRight(ctx, FORM.USERS, ACTION.VIEW, 'view the audit trail');
  const where: Row = {};
  if (f.user) where.user = f.user;
  if (f.from || f.to) where.datetimelog = { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: `${f.to} 23:59:59` } : {}) };
  let rows = await ctx.db.all('translog', { where, orderBy: [['datetimelog', 'desc']], limit: 500 });
  if (f.q) {
    const q = f.q.toLowerCase();
    rows = rows.filter((r) => `${r.docno} ${r.trans} ${r.form}`.toLowerCase().includes(q));
  }
  return rows;
}

// ===========================================================================
// Home dashboard (Home.aspx)
// ===========================================================================
const TASKS: { type: string; status: string; form: string; action: number; label: string }[] = [
  { type: 'riv', status: 'Open', form: FORM.RIV_APPROVAL, action: ACTION.RELEASE, label: 'Requisitions to approve' },
  { type: 'po', status: 'Open', form: FORM.PO_APPROVAL, action: ACTION.RELEASE, label: 'Purchase orders to approve' },
  { type: 'so', status: 'Open', form: FORM.SO_APPROVAL, action: ACTION.RELEASE, label: 'Sales orders to approve' },
  { type: 'mmrr', status: 'Open', form: FORM.RECEIVING, action: ACTION.RELEASE, label: 'Receipts to post' },
  { type: 'do', status: 'Open', form: FORM.DELIVERY_ORDER, action: ACTION.RELEASE, label: 'Deliveries / issuances to post' },
  { type: 'si', status: 'Open', form: FORM.SALES_INVOICE, action: ACTION.RELEASE, label: 'Invoices to post' },
  { type: 'vp', status: 'Open', form: FORM.DOCUMENT_POSTING, action: ACTION.RELEASE, label: 'Vouchers to approve & post' },
  { type: 'cv', status: 'Open', form: FORM.CHECK_VOUCHER, action: ACTION.RELEASE, label: 'Cheques to approve' },
  { type: 'cv', status: 'Approved', form: FORM.CHECK_VOUCHER, action: ACTION.RELEASE, label: 'Cheques to release' },
  { type: 'jv', status: 'Open', form: FORM.JOURNAL_VOUCHER, action: ACTION.RELEASE, label: 'Journal vouchers to approve' },
  { type: 'jv', status: 'Approved', form: FORM.JV_POSTING, action: ACTION.RELEASE, label: 'Journal vouchers to post' },
  { type: 'or', status: 'Open', form: FORM.COLLECTION, action: ACTION.RELEASE, label: 'Receipts to issue' },
  { type: 'cm', status: 'Open', form: FORM.CREDIT_MEMO, action: ACTION.RELEASE, label: 'Credit memos to approve' },
  { type: 'dm', status: 'Open', form: FORM.DEBIT_MEMO, action: ACTION.RELEASE, label: 'Debit memos to approve' },
  { type: 'pcv', status: 'Open', form: FORM.PETTY_CASH, action: ACTION.RELEASE, label: 'Petty cash vouchers to post' },
  { type: 'rfv', status: 'Open', form: FORM.PETTY_CASH, action: ACTION.RELEASE, label: 'Revolving fund vouchers to post' },
  { type: 'liq', status: 'Open', form: FORM.CA_LIQUIDATION, action: ACTION.RELEASE, label: 'Liquidations to post' },
];

export async function myTasks(ctx: Ctx) {
  const tasks: Row[] = [];
  for (const t of TASKS) {
    if (!(await isAllowed(ctx.db, ctx.group, t.form, t.action as 1))) continue;
    const svc = docService(t.type);
    const n = await ctx.db.count(svc.table, { status: t.status, ...(svc.tc && ['invhdrtbl', 'saleshdrtbl', 'exphdrtbl', 'colhdrtbl', 'custdmcmhdrtbl'].includes(svc.table) ? { tc: svc.tc } : {}) });
    if (n) tasks.push({ label: t.label, count: n, href: `/dashboard/doc/${t.type}?status=${encodeURIComponent(t.status)}` });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.LAB_MONITORING, ACTION.EDIT)) {
    const n = await ctx.db.count('invhdrtbl', { tc: { in: [TC.RECEIVING, TC.PROD_RECEIPT] }, status: 'Posted', labstat: 'Pending' });
    if (n) tasks.push({ label: 'Lots waiting for lab results', count: n, href: '/dashboard/mm/lab' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.VOID, ACTION.RELEASE)) {
    const n = await ctx.db.count('voidreqtbl', { reqstat: 'Pending' });
    if (n) tasks.push({ label: 'Void requests to decide', count: n, href: '/dashboard/admin/voids' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.JV_POSTING, ACTION.RELEASE)) {
    const n = await ctx.db.count('gltranstbl', { glstatus: 'OPEN' });
    if (n) tasks.push({ label: 'Subledger entries waiting for JV posting', count: n, href: '/dashboard/fi/posting' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.PAYROLL_MONTHLY, ACTION.RELEASE)) {
    const n = await ctx.db.count('payidtbl', { paystat: 'Computed' });
    if (n) tasks.push({ label: 'Payrolls ready to post', count: n, href: '/dashboard/hr/payroll' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.VOUCHER_PAYABLE, ACTION.INSERT)) {
    const reps = await ctx.db.all('fundrepltbl', { where: { status: 'unpaid' } });
    const n = reps.filter((r) => !r.vpno || r.vpno === '0').length;
    if (n) tasks.push({ label: 'Fund replenishments needing a voucher', count: n, href: '/dashboard/doc/fr?status=Unpaid' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.CA_LIQUIDATION, ACTION.INSERT)) {
    const n = (await openAdvances(ctx.db)).filter((a) => a.days > 30).length;
    if (n) tasks.push({ label: 'Cash advances over 30 days to liquidate', count: n, href: '/dashboard/doc/liq' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.BUDGET, ACTION.VIEW)) {
    const periods = await ctx.db.all('buddettbl', { where: { datefr: { lte: today() }, dateto: { gte: today() } }, limit: 1 });
    if (periods.length) {
      const m = await budgetMonitor(ctx, String(periods[0].datefr), String(periods[0].dateto));
      const n = m.centers.filter((c) => c.state === 'Over budget').length;
      if (n) tasks.push({ label: 'Cost centers over budget this period', count: n, href: '/dashboard/fi/budget' });
    }
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.DEPOSIT_APPLICATION, ACTION.RELEASE)) {
    const n = new Set((await ctx.db.all('depapptbl', { where: { savestat: 'Open' } })).map((r) => r.transid)).size;
    if (n) tasks.push({ label: 'Deposit applications to post', count: n, href: '/dashboard/doc/da?status=Open' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.DEPOSIT_APPLICATION, ACTION.INSERT)) {
    const n = (await openDeposits(ctx.db)).length;
    if (n) tasks.push({ label: 'Customer deposits not yet applied', count: n, href: '/dashboard/doc/da/new' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.EVENT_SALES, ACTION.RELEASE)) {
    const n = await ctx.db.count('dsrnotbl', { status: 'OPEN', transdate: { lt: today() } });
    if (n) tasks.push({ label: 'Daily sales reports of past days to close', count: n, href: '/dashboard/sd/dsr' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.SALES_MANAGER, ACTION.RELEASE)) {
    const n = await ctx.db.count('reqsohdrtbl', { status: 'Requested' });
    if (n) tasks.push({ label: 'Order requests from salesmen', count: n, href: '/dashboard/sd/requests' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.CUSTOMER, ACTION.INSERT)) {
    const n = await ctx.db.count('qryreqttbl', { reqtype: 'Customer No.', stat: 'Requested' });
    if (n) tasks.push({ label: 'Customer number requests', count: n, href: '/dashboard/sd/customer-tools' });
  }
  if (await isAllowed(ctx.db, ctx.group, FORM.CLINIC, ACTION.EDIT)) {
    const supplies = await ctx.db.all('ng_clinic_supply');
    if (supplies.length) {
      const moves = await ctx.db.all('ng_clinic_stock');
      const n = supplies.filter((x) => sum(moves.filter((m) => m.code === x.code), (m) => num(m.qty)) <= num(x.reorder)).length;
      if (n) tasks.push({ label: 'Clinic supplies to reorder', count: n, href: '/dashboard/hr/clinic' });
    }
  }
  return tasks;
}

export async function dashboard(ctx: Ctx) {
  const can = async (form: string) => isAllowed(ctx.db, ctx.group, form, ACTION.VIEW);
  const t = today();
  const { transyear, transmon } = ym(t);
  const mFrom = monthStart(transyear, transmon);
  const out: Row = { asOf: t, period: await openPeriodDate(ctx.db) };
  const lines = await ledgerLines(ctx.db, { to: t, includeUnposted: true });
  const bal = (accts: string[]) => r2(lines.filter((l) => accts.includes(l.acctno)).reduce((s, l) => s + num(l.dramt) - num(l.cramt), 0));
  if (await can(FORM.GL_REPORTS)) {
    const banks = (await ctx.db.all('banktbl')).map((b) => b.acctno);
    out.cash = { onHand: bal(['1110100', '1110200']), inBank: bal(banks) };
    const trend: Row[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(transyear, transmon - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const from = monthStart(y, m);
      const to = monthEnd(y, m);
      const inMonth = lines.filter((l) => l.transdate >= from && l.transdate <= to);
      const revenue = r2(inMonth.filter((l) => String(l.acctno).startsWith('4')).reduce((s, l) => s + num(l.cramt) - num(l.dramt), 0));
      const costs = r2(inMonth.filter((l) => /^[568]/.test(String(l.acctno))).reduce((s, l) => s + num(l.dramt) - num(l.cramt), 0));
      trend.push({ label: monthName(m).slice(0, 3), revenue, costs, profit: r2(revenue - costs) });
    }
    // Months before the books have any activity would only show empty bars.
    while (trend.length > 3 && trend[0].revenue === 0 && trend[0].costs === 0) trend.shift();
    out.trend = trend;
  }
  if (await can(FORM.AR_REPORTS)) {
    const inv = await openInvoices(ctx.db);
    out.ar = { total: sum(inv, (i) => i.balance), overdue: sum(inv.filter((i) => i.daysOverdue > 0), (i) => i.balance), customers: new Set(inv.map((i) => i.custno)).size };
  }
  if (await can(FORM.AP_REPORTS)) {
    const vps = await ctx.db.all('exphdrtbl', { where: { tc: TC.VOUCHER_PAYABLE, status: 'Posted', vpbals: { gt: 0 } } });
    const vens = await ctx.db.all('venmasttbl');
    const due = vps.filter((v) => addDays(v.invdate || v.transdate, num(vens.find((x) => x.venno === v.venno)?.terms)) <= addDays(t, 7));
    out.ap = { total: sum(vps, (v) => num(v.vpbals)), dueThisWeek: sum(due, (v) => num(v.vpbals)), vouchers: vps.length };
  }
  if (await can(FORM.INVENTORY_REPORTS)) {
    const s = await stockReport(ctx, {});
    out.inventory = { value: s.totalValue, alerts: s.rows.filter((r) => r.alert === 'Below reorder level').length, labHold: s.rows.filter((r) => r.labHold > 0).length, byPlant: s.byPlant };
  }
  if (await can(FORM.SALES_INVOICE)) {
    const sales = await ctx.db.all('saleshdrtbl', { where: { tc: { in: INVOICE_TCS }, status: 'Posted', transdate: { gte: mFrom, lte: t } } });
    const cols = await ctx.db.all('colhdrtbl', { where: { tc: TC.COLLECTION, status: 'Posted', transdate: { gte: mFrom, lte: t } } });
    out.sales = { mtd: sum(sales, (s) => num(s.netamt) - num(s.vat)), invoices: sales.length, collections: sum(cols, (c) => num(c.colamt)) };
  }
  out.tasks = await myTasks(ctx);
  out.activity = (await ctx.db.all('translog', { orderBy: [['datetimelog', 'desc']], limit: 8 })).map((r) => ({ when: r.datetimelog, user: r.user, trans: r.trans, docno: r.docno }));
  return out;
}
