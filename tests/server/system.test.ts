import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { runOp, session } from '@/server/rpc';
import { docSetup, favourites, maintenance, setDownloadHold, setMaintenance, toggleFavourite } from '@/server/services/system';
import { DEMO_PASSWORD } from '@/server/seed';

async function ctxFor(ba: string, user = 'admin', group = 'ADMIN'): Promise<Ctx> {
  return { db: await getDb(ba), ba, user, fullName: user, group };
}

describe('favourites (sys_mymenu)', () => {
  it('adds and removes a page, and reads rows written by the legacy pages', async () => {
    const ctx = await ctxFor('8100');
    let r = await toggleFavourite(ctx, '/dashboard/fi/budget');
    expect(r.favourite).toBe(true);
    expect(r.list.map((f) => f.href)).toContain('/dashboard/fi/budget');
    const row = await ctx.db.one('sys_mymenu', { user: 'admin', web: '/dashboard/fi/budget' });
    expect(row?.code).toBe('079');

    // A legacy row has only the form code, description and user.
    await ctx.db.insert('sys_mymenu', { code: '006', description: 'Accounting Period Closing', user: 'admin' });
    const list = await favourites(ctx.db, 'admin', 'ADMIN');
    expect(list.find((f) => f.form === '006')?.href).toBe('/dashboard/fi/periods');

    r = await toggleFavourite(ctx, '/dashboard/fi/budget');
    expect(r.favourite).toBe(false);
    r = await toggleFavourite(ctx, '/dashboard/fi/periods');
    expect(r.favourite).toBe(false);
    expect(await ctx.db.count('sys_mymenu', { user: 'admin' })).toBe(0);
  });

  it('refuses pages outside the menu or outside the user group', async () => {
    const lab = await ctxFor('8100', 'lab', 'LAB');
    await expect(toggleFavourite(lab, '/not-a-page')).rejects.toThrow(/menu/);
    await expect(toggleFavourite(lab, '/dashboard/fi/budget')).rejects.toThrow();
  });
});

describe('maintenance mode', () => {
  it('pauses other groups, keeps administrators working and blocks sign-in', async () => {
    const admin = await ctxFor('8100');
    await setMaintenance(admin, { on: true, message: 'Year-end closing.', until: '6:00 AM' });
    expect((await maintenance(admin.db)).on).toBe(true);

    const acct = { u: 'accountant', n: 'Accountant', g: 'ACCTG', ba: '8100', cos: ['8100'] };
    await expect(runOp('home.tasks', {}, acct)).rejects.toThrow(/Year-end closing/);
    const info = await runOp('auth.session', {}, acct);
    expect((info as any).maintenance).toMatchObject({ on: true, bypass: false });
    await expect(runOp('home.tasks', {}, { ...acct, u: 'admin', g: 'ADMIN' })).resolves.toBeTruthy();

    const signIn = await session.signIn('accountant', DEMO_PASSWORD, '8100');
    expect(signIn.maintenance).toBe(true);
    expect(signIn.error).toMatch(/6:00 AM/);

    await setMaintenance(admin, { on: false, message: '' });
    await expect(runOp('home.tasks', {}, acct)).resolves.toBeTruthy();
  });

  it('needs the approve right on form 001 to switch', async () => {
    const acct = await ctxFor('8300', 'accountant', 'ACCTG');
    await expect(setMaintenance(acct, { on: true })).rejects.toThrow();
  });
});

describe('document setup', () => {
  it('lists every document type with its numbering and holds the app download', async () => {
    const ctx = await ctxFor('8300');
    const d = await docSetup(ctx);
    expect(d.docs.length).toBeGreaterThanOrEqual(15);
    const vp = d.docs.find((x) => x.type === 'vp')!;
    expect(vp.table).toBe('exphdrtbl');
    expect(vp.count).toBeGreaterThan(0);
    expect(vp.latest).not.toBe('');
    expect(d.download).toBe('released');

    await setDownloadHold(ctx, true);
    expect((await ctx.db.one('batbl', { ba: '8300' }))?.dloadstat).toBe('Close');
    expect((await docSetup(ctx)).download).toBe('held');
    await setDownloadHold(ctx, false);
    expect((await ctx.db.one('batbl', { ba: '8300' }))?.dloadstat).toBe('Open');
  });
});
