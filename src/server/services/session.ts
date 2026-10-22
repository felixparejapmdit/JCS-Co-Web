import { mysqlHoldsSampleData } from '../db/source';
import { bypassesMaintenance, favourites, maintenance, maintenanceText } from './system';
import type { Db } from '../db';
import { companies, getDb, isActiveCompany } from '../db';
import { nowStamp } from '@/shared/dates';
import { Session, hashPassword, legacyMatches, verifyPassword } from '../auth';
import { AppError, num, openPeriodDate, rightsOf, truthy } from './context';
import { companyProfile } from './admin';
import { SignInOutcome, recordSignIn } from './logs';

const MAX_STRIKES = 5;

/** lockout: this attempt was the 5th failure and locked the account; locked: it was locked already. */
type Verdict = 'ok' | 'bad' | 'locked' | 'lockout' | 'unknown' | 'inactive';

// Strike counter for users who have not signed in to NextGen yet (no ng_user_credentials row).
const g = globalThis as unknown as { __cloudAosStrikes?: Map<string, number> };
const strikes = (g.__cloudAosStrikes ??= new Map());

/**
 * Checks a password the way PLAN.md section 5.1 describes: Argon2id from ng_user_credentials when
 * present; otherwise the legacy Base64 password once, after which the Argon2id hash is created.
 */
export async function verifyLogin(db: Db, username: string, password: string): Promise<Verdict> {
  const user = await db.one('sys_userrecords', { username });
  if (!user) return 'unknown';
  if (String(user.idstat ?? 'Open') === 'Locked') return 'locked';
  if (String(user.stat ?? 'Active').toLowerCase() === 'inactive') return 'inactive';
  const cred = await db.one('ng_user_credentials', { username });
  const key = `${db.ba}:${String(username).toLowerCase()}`;
  let ok = false;
  if (cred?.password_hash) ok = await verifyPassword(String(cred.password_hash), password);
  else ok = legacyMatches(user.userpassword, password);

  if (ok) {
    strikes.delete(key);
    try {
      if (!cred) {
        await db.insert('ng_user_credentials', { username: user.username, password_hash: await hashPassword(password), failed_attempts: 0, locked_at: null, updated_at: nowStamp() });
      } else if (num(cred.failed_attempts) > 0) {
        await db.update('ng_user_credentials', { username }, { failed_attempts: 0 });
      }
    } catch {
      // A read-only connection cannot store the upgraded hash; sign-in still succeeds.
    }
    return 'ok';
  }

  const n = (cred ? num(cred.failed_attempts) : strikes.get(key) ?? 0) + 1;
  try {
    if (cred) await db.update('ng_user_credentials', { username }, { failed_attempts: n });
    else strikes.set(key, n);
    if (n >= MAX_STRIKES) {
      // Same rule as legacy Login.aspx: the account locks after 5 strikes until an admin resets it.
      await db.update('sys_userrecords', { username }, { idstat: 'Locked' });
      if (cred) await db.update('ng_user_credentials', { username }, { locked_at: nowStamp() });
      return 'lockout';
    }
  } catch {
    strikes.set(key, n);
  }
  return 'bad';
}

export interface LoginResult {
  session?: Session;
  choose?: { ba: string; name: string }[];
  error?: string;
  locked?: boolean;
  maintenance?: boolean;
}

/** Where a sign-in attempt came from, for the Sign-in Log. */
export interface SignInMeta {
  ip?: string;
  userAgent?: string;
}

const OUTCOME_OF: Partial<Record<Verdict, SignInOutcome>> = { bad: 'wrong_password', locked: 'locked', lockout: 'locked_out', inactive: 'inactive' };

/**
 * Logs an attempt in each company whose database knows the username; an unknown username is
 * logged in every company, so a guessing attack shows up for its administrators.
 */
export async function logSignInAttempt(username: string, outcome: SignInOutcome, meta: SignInMeta = {}, detail?: string) {
  const dbs = await Promise.all(companies().map((c) => getDb(c.ba)));
  const known = [];
  for (const db of dbs) if (await db.one('sys_userrecords', { username })) known.push(db);
  for (const db of known.length ? known : dbs) await recordSignIn(db, { username, outcome: known.length ? outcome : 'unknown_user', detail, ...meta });
}

/**
 * Signs a user in without asking them to pick a company. The username is checked against every
 * company database; only companies where the password matches are offered, so nobody can see
 * which organisations exist before they have authenticated.
 */
export async function signIn(usernameRaw: string, password: string, chosenBa?: string, meta: SignInMeta = {}): Promise<LoginResult> {
  const username = usernameRaw.trim().toLowerCase();
  if (!username || !password) return { error: 'Enter your username and password.' };
  const matched: { ba: string; name: string; group: string; fullName: string }[] = [];
  let locked = false;
  const refused: { db: Db; verdict: Verdict }[] = [];
  for (const c of companies()) {
    const db = await getDb(c.ba);
    const verdict = await verifyLogin(db, username, password);
    if (verdict === 'locked' || verdict === 'lockout') locked = true;
    if (verdict !== 'ok') refused.push({ db, verdict });
    if (verdict === 'ok') {
      const u = await db.one('sys_userrecords', { username });
      const { branding } = await companyProfile({ db, ba: c.ba, user: username, fullName: '', group: '' });
      matched.push({ ba: c.ba, name: branding.display_name, group: String(u!.usergroup), fullName: String(u!.userfullname) });
    }
  }
  if (!matched.length) {
    const known = refused.filter((r) => r.verdict !== 'unknown');
    for (const r of known.length ? known : refused) await recordSignIn(r.db, { username, outcome: OUTCOME_OF[r.verdict] ?? 'unknown_user', ...meta });
    return locked
      ? { error: 'This account is locked after too many failed attempts. Ask your system administrator to unlock it.', locked: true }
      : { error: 'The username or password is not correct.' };
  }
  const pick = chosenBa ? matched.find((m) => m.ba === chosenBa) : matched.length === 1 ? matched[0] : undefined;
  if (!pick) return { choose: matched.map((m) => ({ ba: m.ba, name: m.name })) };
  const pdb = await getDb(pick.ba);
  const m = await maintenance(pdb);
  if (m.on && !(await bypassesMaintenance(pdb, pick.group))) {
    await recordSignIn(pdb, { username, outcome: 'maintenance', ...meta });
    return { error: `Under maintenance: ${maintenanceText(m)}`, maintenance: true };
  }
  await recordSignIn(pdb, { username, outcome: 'success', detail: matched.length > 1 ? `Chose this company out of ${matched.length}` : undefined, ...meta });
  return { session: { u: username, n: pick.fullName, g: pick.group, ba: pick.ba, cos: matched.map((m) => m.ba) } };
}

export async function recordSignOut(s: Session, meta: SignInMeta = {}) {
  await recordSignIn(await getDb(s.ba), { username: s.u, outcome: 'signed_out', ...meta });
}

/** What the browser needs after sign-in: who you are, your company header and your rights. */
export async function sessionInfo(s: Session) {
  const db = await getDb(s.ba);
  const ctx = { db, ba: s.ba, user: s.u, fullName: s.n, group: s.g };
  const { branding, company } = await companyProfile(ctx);
  const group = await db.one('sys_usergroup', { ug_code: s.g });
  const rights = await rightsOf(db, s.g);
  const others = [];
  for (const ba of s.cos.filter((x) => x !== s.ba && isActiveCompany(x))) {
    const odb = await getDb(ba);
    const { branding: b } = await companyProfile({ db: odb, ba, user: s.u, fullName: s.n, group: s.g });
    others.push({ ba, name: b.display_name });
  }
  const cred = await db.one('ng_user_credentials', { username: s.u });
  const m = await maintenance(db);
  return {
    user: { username: s.u, fullName: s.n, group: s.g, groupName: group?.ug_name ?? s.g },
    company: branding,
    legal: { bussname: String(company.bussname ?? branding.display_name), address: String(company.address ?? ''), tin: String(company.cotin1 ?? '') },
    otherCompanies: others,
    rights,
    openPeriod: await openPeriodDate(db),
    mode: db.mode,
    // memory | mysql-sample (MySQL holding the sample data this app loaded) | mysql
    source: db.mode === 'demo' ? 'memory' : mysqlHoldsSampleData() ? 'mysql-sample' : 'mysql',
    mustChangePassword: false,
    passwordUpgraded: Boolean(cred),
    favourites: await favourites(db, s.u, s.g),
    maintenance: { on: m.on, message: maintenanceText(m), bypass: m.on ? await bypassesMaintenance(db, s.g) : false },
  };
}

export async function switchCompany(s: Session, ba: string): Promise<Session> {
  if (!s.cos.includes(ba)) throw new AppError('You did not sign in to that company.', 403);
  if (!isActiveCompany(ba)) throw new AppError('That company is no longer active.', 403);
  const db = await getDb(ba);
  const u = await db.one('sys_userrecords', { username: s.u });
  if (!u || String(u.idstat) === 'Locked' || String(u.stat ?? 'Active').toLowerCase() === 'inactive') throw new AppError('Your account is not active in that company.', 403);
  return { ...s, ba, g: String(u.usergroup), n: String(u.userfullname) };
}

export { truthy };
