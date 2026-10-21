/**
 * API keys for the public API (/api/v1). Administration > System > API Keys.
 *
 * - A key belongs to one company and acts with the rights of one user group, so the Access Matrix
 *   decides what it can read, exactly as for a person in that group.
 * - The key is shown once, when it is created. Only its SHA-256 hash is stored (ng_api_keys), so a
 *   copy of the database does not reveal usable keys.
 * - Format: caos_<business area>_<32 random characters>. The business area tells the API which
 *   company database to check, without trying every company.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Row } from '../db';
import { companyInfo, getDb, isActiveCompany } from '../db';
import { nowStamp } from '@/shared/dates';
import type { Session } from '../auth';
import { Ctx, audit, fail } from './context';
import { FORM } from '@/shared/codes';
import { store } from '../platform/store';
import { generation, invalidateCompany } from '../platform/read-cache';

const TABLE = 'ng_api_keys';
const KEY_RE = /^caos_(\d{4})_([A-Za-z0-9_-]{32})$/;
const AUTH_CACHE_TTL = 60; // seconds an accepted key is remembered before it is checked again

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

function requireAdmin(ctx: Ctx) {
  if (ctx.group !== 'ADMIN') fail('Only the ADMIN group can manage API keys.', 403);
}

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  ug_code: string;
  created_by: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

function publicRow(r: Row): ApiKeyRow {
  return {
    id: String(r.id),
    name: String(r.name),
    prefix: String(r.prefix),
    ug_code: String(r.ug_code),
    created_by: String(r.created_by ?? ''),
    created_at: String(r.created_at ?? ''),
    last_used_at: r.last_used_at ? String(r.last_used_at) : null,
    revoked_at: r.revoked_at ? String(r.revoked_at) : null,
  };
}

export async function listKeys(ctx: Ctx) {
  requireAdmin(ctx);
  const rows = await ctx.db.all(TABLE, { orderBy: [['created_at', 'desc']] });
  const groups = await ctx.db.all('sys_usergroup', { orderBy: [['ug_code', 'asc']] });
  return {
    keys: rows.map(publicRow),
    groups: groups.map((g) => ({ code: String(g.ug_code), name: String(g.ug_name ?? g.ug_code) })),
  };
}

export async function createKey(ctx: Ctx, input: { name: string; group: string }) {
  requireAdmin(ctx);
  const name = input.name.trim().slice(0, 80);
  if (!name) fail('Give the key a name that says who uses it, e.g. "JCS head office reports".');
  const group = await ctx.db.one('sys_usergroup', { ug_code: input.group });
  if (!group) fail('Choose the user group whose rights the key will have.');
  const secret = randomBytes(24).toString('base64url'); // 32 characters
  const key = `caos_${ctx.ba}_${secret}`;
  const row = {
    id: `key_${randomBytes(9).toString('base64url')}`,
    name,
    prefix: key.slice(0, 14),
    hash: sha256(key),
    ug_code: String(group.ug_code),
    created_by: ctx.user,
    created_at: nowStamp(),
    last_used_at: null,
    revoked_at: null,
  };
  await ctx.db.insert(TABLE, row);
  await audit(ctx, { form: FORM.APP_CONTROL, docno: row.id, trans: `Create API key "${name}" with the rights of ${row.ug_code}`, table: TABLE });
  return { key, record: publicRow(row) };
}

export async function revokeKey(ctx: Ctx, id: string) {
  requireAdmin(ctx);
  const row = await ctx.db.one(TABLE, { id });
  if (!row) fail('That API key does not exist.', 404);
  if (row.revoked_at) return `${row.name} was already revoked.`;
  await ctx.db.update(TABLE, { id }, { revoked_at: nowStamp() });
  await invalidateCompany(ctx.ba); // forgets accepted keys at once (runOp also does this after a save)
  await audit(ctx, { form: FORM.APP_CONTROL, docno: id, trans: `Revoke API key "${row.name}"`, table: TABLE });
  return `${row.name} is revoked. Programs using it can no longer read anything.`;
}

/**
 * Checks a key from a request. Returns the session the public API acts as, or null. Accepted keys
 * are remembered for a minute (store.ts), under the company's cache generation: any change in the
 * company (revoking a key, reloading data) forgets them at once.
 */
export async function authenticateKey(raw: string | null | undefined): Promise<{ session: Session; keyId: string; name: string } | null> {
  const m = raw ? KEY_RE.exec(raw.trim()) : null;
  if (!m) return null;
  const ba = m[1];
  if (!isActiveCompany(ba)) return null;
  const hash = sha256(raw!.trim());
  const memo = `apikey:${ba}:${await generation(ba)}:${hash}`;
  const cached = await store().get(memo);
  let row: Row | null = cached ? (JSON.parse(cached) as Row) : null;
  if (!row) {
    companyInfo(ba);
    const db = await getDb(ba);
    row = await db.one(TABLE, { hash });
    if (!row || row.revoked_at) return null;
    // Constant-time check of the stored hash (defence in depth; the lookup already matched it).
    if (!timingSafeEqual(Buffer.from(String(row.hash)), Buffer.from(hash))) return null;
    await store().set(memo, JSON.stringify({ id: row.id, name: row.name, ug_code: row.ug_code }), AUTH_CACHE_TTL);
    if (db.mode === 'demo' || process.env.DATABASE_ALLOW_WRITES === 'true') {
      await db.update(TABLE, { id: row.id }, { last_used_at: nowStamp() }).catch(() => undefined);
    }
  }
  const keyId = String(row.id);
  return {
    keyId,
    name: String(row.name),
    session: { u: `api:${keyId}`, n: `API key ${row.name}`, g: String(row.ug_code), ba, cos: [ba] },
  };
}
