import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import * as session from '@/server/services/session';
import { createGroup, deleteGroup, groupsWithRights, resetUser, saveAccessMatrix, saveUser, updateGroup } from '@/server/services/admin';
import { accessChanges, changeHistory, deviceOf, diff, signInLog } from '@/server/services/logs';
import { DEMO_PASSWORD } from '@/server/seed';
import { actOnDoc, saveDoc } from '@/server/services/docs';
import { today } from '@/shared/dates';
import '@/server/rpc';

async function ctxFor(ba: string, group = 'ADMIN', user = 'admin'): Promise<Ctx> {
  return { db: await getDb(ba), ba, user, fullName: user, group, ip: '10.1.2.3' };
}

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

describe('sign-in log', () => {
  it('records a successful sign-in with its address and browser, and a sign-out', async () => {
    const res = await session.signIn('cashier', DEMO_PASSWORD, '8300', { ip: '192.0.2.10', userAgent: CHROME });
    expect(res.session?.ba).toBe('8300');
    await session.recordSignOut(res.session!, { ip: '192.0.2.10', userAgent: CHROME });
    const log = await signInLog(await ctxFor('8300'), { user: 'cashier' });
    expect(log.ready).toBe(true);
    expect(log.rows[0]).toMatchObject({ outcome: 'signed_out', result: 'Signed out', ip: '192.0.2.10', device: 'Chrome 141 on Windows' });
    expect(log.rows[1]).toMatchObject({ outcome: 'success', result: 'Signed in', failed: false });
    // The other company the user belongs to logs nothing for a sign-in that went to 8300.
    expect((await signInLog(await ctxFor('8100'), { user: 'cashier' })).rows.some((r) => r.outcome === 'success')).toBe(false);
  });

  it('records wrong passwords, marks repeated failures and the lock-out, and lists the locked account', async () => {
    for (let i = 0; i < 4; i++) expect((await session.signIn('lab', 'wrong-password', undefined, { ip: '198.51.100.7' })).error).toBeTruthy();
    const locked = await session.signIn('lab', 'wrong-password', undefined, { ip: '198.51.100.7' });
    expect(locked.locked).toBe(true);
    const log = await signInLog(await ctxFor('8300'), { user: 'lab', outcome: 'failed' });
    expect(log.rows.map((r) => r.outcome)).toEqual(['locked_out', 'wrong_password', 'wrong_password', 'wrong_password', 'wrong_password']);
    expect(log.rows[0].flag).toMatch(/5 failures in 15 min/);
    expect(log.summary.failed).toBe(5);
    expect(log.locked.map((u) => u.username)).toContain('lab');
    // Once locked, even the right password is refused, and logged as such.
    await session.signIn('lab', DEMO_PASSWORD, undefined, { ip: '198.51.100.7' });
    expect((await signInLog(await ctxFor('8300'), { user: 'lab' })).rows[0].outcome).toBe('locked');
    await resetUser(await ctxFor('8300'), 'lab');
    await resetUser(await ctxFor('8100'), 'lab');
  });

  it('logs an unknown username in every company, and never the password', async () => {
    await session.signIn('nobody-here', 'Secret123!', undefined, { ip: '203.0.113.5' });
    for (const ba of ['8100', '8300']) {
      const rows = (await signInLog(await ctxFor(ba), { q: 'nobody-here' })).rows;
      expect(rows[0]).toMatchObject({ user: 'nobody-here', outcome: 'unknown_user', ip: '203.0.113.5' });
    }
    const raw = await (await getDb('8300')).all('ng_signin_log', { where: { username: 'nobody-here' } });
    expect(JSON.stringify(raw)).not.toContain('Secret123!');
  });

  it('needs the Users view right', async () => {
    await expect(signInLog(await ctxFor('8300', 'LAB', 'lab'), {})).rejects.toThrow(/not allowed/i);
  });

  it('names common browsers', () => {
    expect(deviceOf(CHROME)).toBe('Chrome 141 on Windows');
    expect(deviceOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')).toBe('Safari 18 on iPhone');
    expect(deviceOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0')).toBe('Edge 141 on Windows');
    expect(deviceOf('')).toBe('');
  });
});

describe('change history', () => {
  it('shows a user edit field by field, with the password hidden', async () => {
    const ctx = await ctxFor('8300');
    const u = await ctx.db.one('sys_userrecords', { username: 'auditor' });
    await saveUser(ctx, { ...u, userfullname: 'Roberto S. Tan', useremailaddress: 'roberto.tan@jcsgroup.example' }, false);
    const { rows } = await changeHistory(ctx, { q: 'auditor' });
    const edit = rows.find((r) => r.table === 'sys_userrecords' && r.docno === 'auditor')!;
    expect(edit).toMatchObject({ record: 'User', kind: 'Changed', user: 'admin', ip: '10.1.2.3', action: 'Edit user auditor' });
    expect(edit.changes).toEqual(
      expect.arrayContaining([
        { field: 'userfullname', before: 'Roberto Tan', after: 'Roberto S. Tan' },
        { field: 'useremailaddress', before: 'rtan@jcsgroup.example', after: 'roberto.tan@jcsgroup.example' },
      ])
    );
    expect(JSON.stringify(rows)).not.toMatch(/userpassword":"(?!\*\*\*)/);
  });

  it('shows what a document save and an approval changed', async () => {
    const ctx = await ctxFor('8300');
    const { no } = await saveDoc(ctx, 'jv', { transdate: today(), remarks: 'Log test entry', lines: [{ acctno: '1110300', dramt: 750, cramt: 0 }, { acctno: '1120100', dramt: 0, cramt: 750 }] });
    await saveDoc(ctx, 'jv', { ...(await ctx.db.one('gljvhdrtbl', { jvno: no })), no, remarks: 'Log test entry, corrected', lines: [{ acctno: '1110300', dramt: 750, cramt: 0 }, { acctno: '1120100', dramt: 0, cramt: 750 }] });
    await actOnDoc(ctx, 'jv', no, 'approve');
    const rows = (await changeHistory(ctx, { q: no })).rows.filter((r) => r.docno === no);
    expect(rows.map((r) => `${r.kind} ${r.action}`)).toEqual(['Changed Approve Journal Voucher', 'Changed Edit Journal Voucher', 'Created Create Journal Voucher']);
    expect(rows[0].record).toBe('Journal Voucher');
    expect(rows[0].changes).toEqual(expect.arrayContaining([{ field: 'status', before: 'Open', after: 'Approved' }]));
    expect(rows[1].changes).toEqual(expect.arrayContaining([{ field: 'remarks', before: 'Log test entry', after: 'Log test entry, corrected' }]));
  });

  it('compares values loosely: empty, null and missing are the same, and so are 5 and "5.00"', () => {
    expect(diff({ a: '', b: null, c: 5 }, { c: '5.00' })).toEqual([]);
    expect(diff({ a: 1 }, { a: 2, password_hash: 'x' })).toEqual([{ field: 'a', before: '1', after: '2' }, { field: 'password_hash', before: '', after: '***' }]);
  });
});

describe('access changes', () => {
  it('lists each right given and taken in the Access Matrix', async () => {
    const ctx = await ctxFor('8300');
    const lab = (await groupsWithRights(ctx)).groups.find((g) => g.ug_code === 'LAB')!.rights as Record<string, number[]>;
    const next: Record<string, number[]> = { ...lab, '052': [1, 3] }; // view and create journal vouchers
    const firstForm = Object.keys(lab)[0];
    delete next[firstForm];
    await saveAccessMatrix(ctx, { LAB: next });
    const { rows } = await accessChanges(ctx, { kind: 'rights' });
    const entry = rows.find((r) => r.subject === 'LAB')!;
    expect(entry.title).toBe('Update access matrix for LAB');
    expect(entry.added).toEqual(expect.arrayContaining([expect.stringMatching(/General Ledger: View journal vouchers/), expect.stringMatching(/General Ledger: Create journal vouchers/)]));
    expect(entry.removed.length).toBeGreaterThan(0);
    await saveAccessMatrix(ctx, { LAB: lab });
  });

  it('shows groups added, renamed and deleted, and users moved, deactivated or unlocked', async () => {
    const ctx = await ctxFor('8300');
    await createGroup(ctx, { code: 'LOGT', name: 'Log test' });
    await updateGroup(ctx, { code: 'LOGT', name: 'Log testers' });
    const u = await ctx.db.one('sys_userrecords', { username: 'warehouse' });
    await saveUser(ctx, { ...u, usergroup: 'LOGT', stat: 'Inactive' }, false);
    await saveUser(ctx, { ...u }, false);
    await resetUser(ctx, 'warehouse');
    await deleteGroup(ctx, 'LOGT');

    const notes = (await accessChanges(ctx, {})).rows.map((r) => `${r.kind}|${r.subject}|${r.note}`);
    expect(notes).toEqual(
      expect.arrayContaining([
        'group|LOGT|Added “Log test”',
        'group|LOGT|Name: “Log test” → “Log testers”',
        'group|LOGT|Deleted “Log testers”',
        'user|warehouse|Moved from group WHSE to LOGT · Deactivated: can no longer sign in',
        'user|warehouse|Moved from group LOGT to WHSE · Reactivated',
        'user|warehouse|Unlocked, with a new temporary password',
      ])
    );
    // A plain name or e-mail edit is not an access change.
    expect(notes.some((n) => n.startsWith('user|auditor'))).toBe(false);
    expect((await accessChanges(ctx, { kind: 'group' })).rows.every((r) => r.kind === 'group')).toBe(true);
  });
});
