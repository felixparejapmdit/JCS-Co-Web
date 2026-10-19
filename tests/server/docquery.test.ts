import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { applyCorrection, correctionInfo, queryDocuments } from '@/server/services/docquery';
import { saveDoc } from '@/server/services/docs';
import { TC } from '@/shared/codes';
import { today } from '@/shared/dates';
import '@/server/rpc';

async function ctxFor(ba: string, user = 'admin', group = 'ADMIN'): Promise<Ctx> {
  return { db: await getDb(ba), ba, user, fullName: user, group };
}

describe('document query', () => {
  it('finds documents and explains what cannot be corrected', async () => {
    const ctx = await ctxFor('8100');
    const found = await queryDocuments(ctx, 'VP-');
    expect(found.length).toBeGreaterThan(0);
    // A posted JV is in the ledger already: its date is locked.
    const jv = (await ctx.db.all('gljvhdrtbl', { where: { status: 'Posted', jvtype: 'Manual' } }))[0];
    const info = await correctionInfo(ctx, 'jv', jv.jvno);
    const date = info.fields.find((f) => f.field === 'transdate')!;
    expect(date.allowed).toBe(false);
    expect(date.why).toMatch(/journal voucher/);
  });

  it('moves the date of a document and its open ledger lines, and logs it', async () => {
    const ctx = await ctxFor('8100');
    const vp = (await ctx.db.all('exphdrtbl', { where: { tc: TC.VOUCHER_PAYABLE, status: 'Open' } }))[0]
      ?? (await ctx.db.one('exphdrtbl', { docno: (await saveDoc(ctx, 'vp', { transdate: today(), venno: (await ctx.db.all('venmasttbl'))[0].venno, refdoc: 'INV-1', lines: [{ acctno: '6200700', ccno: 'ADM', amount: 1000 }] })).no }));
    const info = await correctionInfo(ctx, 'vp', vp!.docno);
    const date = info.fields.find((f) => f.field === 'transdate')!;
    expect(date.allowed).toBe(true);
    await expect(applyCorrection(ctx, { type: 'vp', no: vp!.docno, field: 'transdate', value: today() === date.value ? '2000-01-01' : today() })).rejects.toThrow(/reason/);
    const target = `${today().slice(0, 8)}01`;
    if (target !== date.value) {
      await applyCorrection(ctx, { type: 'vp', no: vp!.docno, field: 'transdate', value: target, reason: 'Encoded with the wrong date' });
      expect((await ctx.db.one('exphdrtbl', { docno: vp!.docno, tc: TC.VOUCHER_PAYABLE }))?.transdate).toBe(target);
      const lines = await ctx.db.all('expdettbl', { where: { docno: vp!.docno, tc: TC.VOUCHER_PAYABLE } });
      expect(lines.every((l) => l.transdate === target)).toBe(true);
      const after = await correctionInfo(ctx, 'vp', vp!.docno);
      expect(after.history[0].what).toMatch(/wrong date/);
    }
    await applyCorrection(ctx, { type: 'vp', no: vp!.docno, field: 'refdoc', value: 'SI-99881', reason: 'Typo in the supplier invoice number' });
    expect((await ctx.db.one('exphdrtbl', { docno: vp!.docno, tc: TC.VOUCHER_PAYABLE }))?.refdoc).toBe('SI-99881');
  });

  it('needs the edit right on the document and refuses closed periods', async () => {
    const lab = await ctxFor('8100', 'lab', 'LAB');
    await expect(queryDocuments(lab, 'VP-')).rejects.toThrow();
    const ctx = await ctxFor('8100');
    const si = (await ctx.db.all('saleshdrtbl', { where: { tc: TC.SALES_INVOICE, status: 'Posted' } }))[0];
    await expect(applyCorrection(ctx, { type: 'si', no: si.invno, field: 'transdate', value: '2000-01-01', reason: 'test' })).rejects.toThrow();
  });
});
