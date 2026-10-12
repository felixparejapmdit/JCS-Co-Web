import { describe, expect, it } from 'vitest';
import { getDb } from '@/server/db';
import type { Ctx } from '@/server/services/context';
import { applyDtr, createPayrollPeriod, deletePayrollId, dtrHours, dtrPreview, dtrSummary, payrollIdNo, payrollIds, setPayrollIdStatus, uploadDtr } from '@/server/services/payroll';
import { clinicDashboard, clinicReport, receiveSupply, saveVisit, voidVisit } from '@/server/services/clinic';
import '@/server/rpc';

async function ctxFor(ba: string, user = 'admin', group = 'ADMIN'): Promise<Ctx> {
  return { db: await getDb(ba), ba, user, fullName: user, group };
}

describe('payroll IDs', () => {
  it('numbers IDs as the legacy PayrollID page does', () => {
    expect(payrollIdNo('Monthly', '2026-10-01', '2026-10-15')).toBe('M1001101526');
    expect(payrollIdNo('Weekly', '2026-10-05', '2026-10-11')).toBe('W1005101126');
    expect(payrollIdNo('Confi', '2026-10-16', '2026-10-31')).toBe('C1016103126');
    expect(payrollIdNo('Others', '2026-12-01', '2026-12-15')).toBe('PR1201121526');
  });

  it('keeps one open ID per pay type, closes on posting and deletes only unused IDs', async () => {
    const ctx = await ctxFor('8100');
    const { rows } = await payrollIds(ctx);
    const posted = rows.filter((r) => r.paystat === 'Posted');
    expect(posted.length).toBeGreaterThan(0);
    expect(posted.every((r) => r.idstat === 'CLOSE')).toBe(true);
    const open = rows.find((r) => r.paytype === 'Monthly' && r.idstat === 'OPEN')!;
    expect(open).toBeTruthy();
    await expect(createPayrollPeriod(ctx, { pdatefr: '2027-03-01', pdateto: '2027-03-15', paytype: 'Monthly' })).rejects.toThrow(/still open/);
    // Another pay type is independent.
    const msg = await createPayrollPeriod(ctx, { pdatefr: '2027-03-01', pdateto: '2027-03-15', paytype: 'Confi' });
    expect(msg).toMatch(/C0301031527/);
    await expect(setPayrollIdStatus(ctx, open.payidno, 'OPEN')).rejects.toThrow(/already open/);
    await expect(deletePayrollId(ctx, open.payidno)).rejects.toThrow(/only unused/i);
    await deletePayrollId(ctx, 'C0301031527');
    expect(await ctx.db.one('payidtbl', { payidno: 'C0301031527' })).toBeNull();
  });
});

describe('DTR upload', () => {
  it('works out lates and undertime against the 8:00 to 17:00 shift', () => {
    expect(dtrHours('08:30', '17:00')).toMatchObject({ late: 0.5, undertime: 0, absent: false });
    expect(dtrHours('07:50', '16:00')).toMatchObject({ late: 0, undertime: 1 });
    expect(dtrHours('', '')).toMatchObject({ absent: true });
  });

  it('checks, saves and applies time records to the attendance', async () => {
    const ctx = await ctxFor('8200');
    const open = (await payrollIds(ctx)).rows.find((r) => r.paytype === 'Monthly' && r.idstat === 'OPEN')!;
    const s0 = await dtrSummary(ctx, open.payidno);
    expect(s0.lines).toBeGreaterThan(0); // seeded biometric records
    const emp = s0.rows[0];
    const pre = await dtrPreview(ctx, open.payidno, [
      { empno: emp.empno, transdate: open.pdatefr, timein: '8:45 am', timeout: '5:00 pm' },
      { empno: 'NOBODY', transdate: open.pdatefr, timein: '08:00', timeout: '17:00' },
      { empno: emp.empno, transdate: '1999-01-01', timein: '08:00', timeout: '17:00' },
    ]);
    expect(pre[0]).toMatchObject({ ok: true, timein: '08:45', timeout: '17:00', late: 0.75 });
    expect(pre[1].ok).toBe(false);
    expect(pre[2].problem).toMatch(/outside/);
    await uploadDtr(ctx, open.payidno, [{ empno: emp.empno, transdate: open.pdatefr, timein: '08:45', timeout: '17:00' }]);
    const s1 = await dtrSummary(ctx, open.payidno);
    expect(s1.rows.find((r) => r.empno === emp.empno)!.lateHrs).toBeGreaterThanOrEqual(0.75);
    await applyDtr(ctx, open.payidno);
    const earn = await ctx.db.one('payearntbl', { payidno: open.payidno, empno: emp.empno });
    expect(Number(earn?.late_dhrs)).toBeCloseTo(s1.rows.find((r) => r.empno === emp.empno)!.lateHrs, 2);
  });
});

describe('clinic', () => {
  it('records a consultation, gives supplies from stock and voids it', async () => {
    const ctx = await ctxFor('8300');
    const d0 = await clinicDashboard(ctx);
    expect(d0.visits.length).toBeGreaterThan(0);
    const para = d0.supplies[0];
    await expect(saveVisit(ctx, { ptype: 'Employee', empno: d0.patients[0].value, transdate: '2026-01-02', complaint: 'Headache', supplies: [{ code: para.code, qty: para.onhand + 1 }] })).rejects.toThrow(/left/);
    const msg = await saveVisit(ctx, { ptype: 'Employee', empno: d0.patients[0].value, transdate: '2026-01-02', complaint: 'Headache', temp: 37.2, disposition: 'Back to work', supplies: [{ code: para.code, qty: 2 }] });
    const visitno = msg.match(/CLN-\S+/)![0];
    let d1 = await clinicDashboard(ctx);
    expect(d1.supplies.find((s) => s.code === para.code)!.onhand).toBe(para.onhand - 2);
    await expect(voidVisit(ctx, visitno, '')).rejects.toThrow(/reason/);
    await voidVisit(ctx, visitno, 'Entered twice');
    d1 = await clinicDashboard(ctx);
    expect(d1.supplies.find((s) => s.code === para.code)!.onhand).toBe(para.onhand);
    await receiveSupply(ctx, { code: para.code, qty: -1, remarks: 'Expired' });
    expect((await clinicDashboard(ctx)).supplies.find((s) => s.code === para.code)!.onhand).toBe(para.onhand - 1);
    const rep = await clinicReport(ctx, '2000-01-01', '2100-12-31');
    expect(rep.visits).toBeGreaterThan(0);
    expect(rep.suppliesUsed.length).toBeGreaterThan(0);
  });

  it('keeps clinic records away from groups without the clinic right', async () => {
    await expect(clinicDashboard(await ctxFor('8100', 'accountant', 'ACCTG'))).rejects.toThrow();
  });
});
