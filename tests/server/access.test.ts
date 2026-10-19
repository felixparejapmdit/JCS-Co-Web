import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { groupsWithRights, saveAccessMatrix, saveGroupRights } from '@/server/services/admin';
import { FORM_CATALOG } from '@/shared/codes';
import { PERMISSIONS, matrixForms, permissionPairs } from '@/shared/permissions';
import { NAV } from '@/components/shell/nav';

async function ctxFor(ba: string, group = 'ADMIN'): Promise<Ctx> {
  return { db: await getDb(ba), ba, user: 'admin', fullName: 'System Administrator', group };
}

describe('access matrix catalog', () => {
  it('covers every form of the catalog and every page of the menu', () => {
    const forms = new Set(matrixForms());
    for (const f of FORM_CATALOG) expect(forms.has(f.code), f.code).toBe(true);
    for (const g of NAV) for (const i of g.items) expect(forms.has(i.form), `${i.label} ${i.form}`).toBe(true);
  });

  it('has unique keys and sections that match the menu', () => {
    const keys = PERMISSIONS.flatMap((s) => s.forms.map((f) => f.slug));
    expect(new Set(keys).size).toBe(keys.length);
    const pairs = permissionPairs().map((p) => `${p.form}:${p.action}`);
    expect(new Set(pairs).size).toBe(pairs.length);
    for (const s of PERMISSIONS) expect(NAV.some((n) => n.id === s.id), s.id).toBe(true);
  });
});

describe('saving the access matrix', () => {
  it('changes only the forms the matrix shows and keeps legacy-only rows', async () => {
    const ctx = await ctxFor('8100');
    await ctx.db.insert('sys_usergrouprights', { gr_groupcode: 'LAB', gr_formcode: '999', gr_viewrights: 1, gr_editrights: 1, gr_insertrights: 0, gr_deleterights: 0, gr_releaserights: 0, gr_autosave: 1, gr_remember: 0 });
    await ctx.db.update('sys_usergrouprights', { gr_groupcode: 'LAB', gr_formcode: '087' }, { gr_autosave: 1 });

    const before = (await groupsWithRights(ctx)).groups.find((g) => g.ug_code === 'LAB')!.rights as Record<string, number[]>;
    expect(before['087']).toEqual([1, 2]);

    // Untick lab results (087 edit), tick receiving reports view-only with a create button.
    await saveAccessMatrix(ctx, { LAB: { ...before, '087': [1], '050': [1, 3] } });
    const after = (await groupsWithRights(ctx)).groups.find((g) => g.ug_code === 'LAB')!.rights as Record<string, number[]>;
    expect(after['087']).toEqual([1]);
    expect(after['050']).toEqual([1, 3]);
    expect(after['999']).toEqual([1, 2]); // not in the matrix, untouched
    const row = await ctx.db.one('sys_usergrouprights', { gr_groupcode: 'LAB', gr_formcode: '087' });
    expect(Number(row?.gr_autosave)).toBe(1); // legacy flags survive

    // Clearing a form removes its row.
    await saveAccessMatrix(ctx, { LAB: { ...after, '050': [] } });
    expect(await ctx.db.one('sys_usergrouprights', { gr_groupcode: 'LAB', gr_formcode: '050' })).toBeNull();
  });

  it('keeps the administrator group complete', async () => {
    const ctx = await ctxFor('8100');
    await saveAccessMatrix(ctx, { ADMIN: {} });
    const admin = (await groupsWithRights(ctx)).groups.find((g) => g.ug_code === 'ADMIN')!.rights as Record<string, number[]>;
    for (const p of permissionPairs()) expect(admin[p.form] ?? [], `${p.form}:${p.action}`).toContain(p.action);
  });

  it("refuses to remove the editor's own access and unknown groups", async () => {
    const ctx = await ctxFor('8300', 'FINHEAD');
    const mine = (await groupsWithRights(ctx)).groups.find((g) => g.ug_code === 'FINHEAD')!.rights as Record<string, number[]>;
    if ((mine['002'] ?? []).includes(2)) await expect(saveAccessMatrix(ctx, { FINHEAD: { ...mine, '002': [1] } })).rejects.toThrow(/own group/);
    const admin = await ctxFor('8300');
    await expect(saveAccessMatrix(admin, { NOPE: {} })).rejects.toThrow(/does not exist/);
    await expect(saveAccessMatrix(admin, {})).rejects.toThrow(/no changes/);
  });

  it('creates a group with no access', async () => {
    const ctx = await ctxFor('8300');
    await saveGroupRights(ctx, 'TEMP', {}, { ug_name: 'Temporary staff' });
    const g = (await groupsWithRights(ctx)).groups.find((x) => x.ug_code === 'TEMP');
    expect(g?.ug_name).toBe('Temporary staff');
    expect(Object.keys(g?.rights as object)).toHaveLength(0);
  });
});
