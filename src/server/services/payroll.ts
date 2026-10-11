import type { Db, Row } from '../db';
import { ACTION, FORM, TC } from '@/shared/codes';
import { nowStamp, parseIso, today, toIso } from '@/shared/dates';
import { fmtPeso, r2, sum } from '@/shared/money';
import { Ctx, assertOpenPeriod, audit, fail, need, num, requireRight, str } from './context';
import { GL, GlEntry, reverseGl, writeGl } from './gl';

// Statutory rates are read from the legacy government tables (paygovtphtbl for SSS /
// PhilHealth / Pag-IBIG brackets, paygovtbirtbl for withholding tax), so a BIR or SSS
// change is a data update, not a code change.
const DAYS_PER_YEAR = 261; // 5-day work week; legacy rate factor confirmed in Phase 5
const HOURS_PER_DAY = 8;
const OT_PREMIUM = 1.25;
const ND_PREMIUM = 0.1;
const HOLIDAY_PREMIUM = 1.0;

export interface EmployeeRow {
  empno: string;
  lastname: string;
  firstname: string;
  empstat: string;
  ccno: string;
  paytype: string;
  basicpay: number;
  allowance: number;
  paymode: string;
}

export async function employees(ctx: Ctx): Promise<EmployeeRow[]> {
  await requireRight(ctx, FORM.EMPLOYEE_MASTER, ACTION.VIEW, 'view employees');
  const emps = await ctx.db.all('payemployeetbl', { orderBy: [['lastname', 'asc']] });
  const fins = await ctx.db.all('payfintbl');
  return emps.map((e) => {
    const f = fins.find((x) => x.empno === e.empno) ?? {};
    return { empno: e.empno, lastname: e.lastname, firstname: e.firstname, empstat: e.empstat, ccno: e.ccno, paytype: e.paytype, basicpay: num(f.basicpay), allowance: num(f.transallow), paymode: f.paymode ?? 'ATM' };
  });
}

export async function saveEmployee(ctx: Ctx, input: Row, isNew: boolean): Promise<string> {
  await requireRight(ctx, FORM.EMPLOYEE_MASTER, isNew ? ACTION.INSERT : ACTION.EDIT, `${isNew ? 'add' : 'change'} employees`);
  return ctx.db.tx(async (db) => {
    const lastname = need(str(input.lastname), 'Enter the last name.');
    const firstname = need(str(input.firstname), 'Enter the first name.');
    const ccno = need(str(input.ccno), 'Choose the cost center.');
    if (!(await db.one('cctrnotbl', { ccno }))) fail(`Cost center ${ccno} does not exist.`);
    const basicpay = r2(num(input.basicpay));
    if (basicpay <= 0) fail('Enter the monthly basic pay.');
    let empno = str(input.empno);
    if (isNew) {
      if (!empno) {
        const all = await db.all('payemployeetbl');
        const max = all.reduce((m, e) => Math.max(m, Number(String(e.empno).replace(/\D/g, '')) || 0), 0);
        empno = `E${String(max + 1).padStart(5, '0')}`;
      }
      if (await db.one('payemployeetbl', { empno })) fail(`Employee ${empno} already exists.`);
    } else if (!(await db.one('payemployeetbl', { empno }))) fail(`Employee ${empno} was not found.`);
    const emp = { empno, lastname, firstname, empstat: str(input.empstat) || 'Regular', ccno, paytype: str(input.paytype) || 'Monthly' };
    const fin = { empno, basicpay, ratetype: 'Monthly', rateperhr: r2((basicpay * 12) / DAYS_PER_YEAR / HOURS_PER_DAY), hrrate: r2((basicpay * 12) / DAYS_PER_YEAR / HOURS_PER_DAY), paymode: str(input.paymode) || 'ATM', transallow: r2(num(input.allowance)), ccno, paytype: emp.paytype, paystat: 'Active' };
    if (isNew) {
      await db.insert('payemployeetbl', emp);
      await db.insert('payfintbl', fin);
    } else {
      await db.update('payemployeetbl', { empno }, emp);
      if (await db.one('payfintbl', { empno })) await db.update('payfintbl', { empno }, fin);
      else await db.insert('payfintbl', fin);
    }
    await audit({ ...ctx, db }, { form: FORM.EMPLOYEE_MASTER, docno: empno, trans: `${isNew ? 'Add' : 'Edit'} employee ${lastname}, ${firstname}`, table: 'payemployeetbl' });
    return `Employee ${empno} ${isNew ? 'added' : 'updated'}.`;
  });
}

// ---------------------------------------------------------------------------
// Payroll periods (PayrollID.aspx)
// ---------------------------------------------------------------------------
export async function payrollPeriods(ctx: Ctx) {
  await requireRight(ctx, FORM.PAYROLL_MONTHLY, ACTION.VIEW, 'view payroll');
  const ids = await ctx.db.all('payidtbl', { orderBy: [['pdatefr', 'desc']] });
  const slips = await ctx.db.all('paysliptbl');
  return ids.map((p) => {
    const s = slips.filter((x) => x.payidno === p.payidno);
    return { ...p, employees: s.length, gross: sum(s, (x) => num(x.totalearn)), net: sum(s, (x) => num(x.netpay)) };
  });
}

export async function createPayrollPeriod(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.PAYROLL_MONTHLY, ACTION.INSERT, 'create payroll periods');
  const from = need(str(input.pdatefr), 'Enter the first day of the period.');
  const to = need(str(input.pdateto), 'Enter the last day of the period.');
  if (to < from) fail('The period end is before its start.');
  const paytype = str(input.paytype) || 'Monthly';
  return ctx.db.tx(async (db) => {
    const clash = await db.all('payidtbl', { where: { paytype, pdatefr: { lte: to }, pdateto: { gte: from } } });
    if (clash.length) fail(`This period overlaps payroll ${clash[0].payidno}.`);
    const d = parseIso(from);
    const payseq = d.getDate() <= 15 ? 1 : 2;
    const payidno = `P${from.slice(2, 4)}${from.slice(5, 7)}-${payseq}${paytype === 'Weekly' ? 'W' : ''}`;
    if (await db.one('payidtbl', { payidno })) fail(`Payroll ${payidno} already exists.`);
    await db.insert('payidtbl', {
      payidno,
      paytype,
      pdatefr: from,
      pdateto: to,
      transdate: to,
      year: d.getFullYear(),
      monyear: `${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`,
      payseq,
      paystat: 'Open',
      workdays: workdays(from, to),
      user: ctx.user,
      datecreate: nowStamp(),
      web: 'Y',
    });
    await db.insert('payidnostattbl', { payidno, att: 'N', earn: 'N', deduct: 'N', net: 'N', sysver: 'CloudAOS' });
    await audit({ ...ctx, db }, { form: FORM.PAYROLL_MONTHLY, tc: TC.PAYROLL, docno: payidno, trans: `Create payroll ${payidno}`, table: 'payidtbl' });
    return `Payroll ${payidno} created for ${from} to ${to}.`;
  });
}

function workdays(from: string, to: string): number {
  let n = 0;
  for (let d = parseIso(from); toIso(d) <= to; d.setDate(d.getDate() + 1)) if (d.getDay() !== 0 && d.getDay() !== 6) n++;
  return n;
}

async function period(db: Db, payidno: string): Promise<Row> {
  const p = await db.one('payidtbl', { payidno });
  if (!p) fail(`Payroll ${payidno} was not found.`);
  return p;
}

// ---------------------------------------------------------------------------
// Attendance (Attendance.aspx, form 301): exceptions only, everyone else is paid in full.
// ---------------------------------------------------------------------------
export async function attendance(ctx: Ctx, payidno: string) {
  await requireRight(ctx, FORM.ATTENDANCE, ACTION.VIEW, 'view attendance');
  const p = await period(ctx.db, payidno);
  const emps = (await ctx.db.all('payemployeetbl', { where: { paytype: p.paytype } })).filter((e) => String(e.empstat).toLowerCase() !== 'resigned');
  const earn = await ctx.db.all('payearntbl', { where: { payidno } });
  return {
    period: p,
    rows: emps
      .sort((a, b) => String(a.lastname).localeCompare(String(b.lastname)))
      .map((e) => {
        const r = earn.find((x) => x.empno === e.empno) ?? {};
        return { empno: e.empno, name: `${e.lastname}, ${e.firstname}`, ccno: e.ccno, absent_hrs: num(r.absent_hrs), late_dhrs: num(r.late_dhrs), otime_dhrs: num(r.otime_dhrs), nightdiffhrs: num(r.nightdiffhrs), holidayhrs: num(r.holidayhrs) };
      }),
  };
}

export async function saveAttendance(ctx: Ctx, payidno: string, rows: Row[]): Promise<string> {
  await requireRight(ctx, FORM.ATTENDANCE, ACTION.EDIT, 'enter attendance');
  return ctx.db.tx(async (db) => {
    const p = await period(db, payidno);
    if (p.paystat === 'Posted') fail(`Payroll ${payidno} is already posted.`);
    const maxHrs = num(p.workdays) * HOURS_PER_DAY;
    for (const r of rows) {
      const vals = { absent_hrs: num(r.absent_hrs), late_dhrs: num(r.late_dhrs), otime_dhrs: num(r.otime_dhrs), nightdiffhrs: num(r.nightdiffhrs), holidayhrs: num(r.holidayhrs) };
      if (Object.values(vals).some((v) => v < 0)) fail(`Hours cannot be negative (${r.empno}).`);
      if (vals.absent_hrs + vals.late_dhrs > maxHrs) fail(`${r.empno}: absences and lates exceed the ${maxHrs} working hours of the period.`);
      const existing = await db.one('payearntbl', { payidno, empno: r.empno });
      if (existing) await db.update('payearntbl', { payidno, empno: r.empno }, { ...vals, user: ctx.user });
      else await db.insert('payearntbl', { payidno, empno: r.empno, ...vals, regtime_dhrs: maxHrs, transdate: p.pdateto, year: p.year, user: ctx.user, web: 'Y' });
    }
    await db.update('payidnostattbl', { payidno }, { att: 'Y', attdate: nowStamp(), attuser: ctx.user });
    if (p.paystat === 'Computed') await db.update('payidtbl', { payidno }, { paystat: 'Open' });
    await audit({ ...ctx, db }, { form: FORM.ATTENDANCE, tc: TC.PAYROLL, docno: payidno, trans: `Save attendance (${rows.length} employees)`, table: 'payearntbl' });
    return `Attendance saved for ${rows.length} employee(s). Compute the payroll to update the payslips.`;
  });
}

// ---------------------------------------------------------------------------
// Payroll computation (PayrollAcctg.aspx, forms 204 / 205)
// ---------------------------------------------------------------------------
async function bracket(db: Db, ratetype: string, monthly: number): Promise<Row | null> {
  const rows = await db.all('paygovtphtbl', { where: { ratetype } });
  return rows.find((r) => monthly >= num(r.payfrom) && monthly <= num(r.payto)) ?? rows.sort((a, b) => num(b.payto) - num(a.payto))[0] ?? null;
}

export async function withholdingTax(db: Db, taxable: number, paytype = 'Semi-monthly'): Promise<number> {
  const rows = await db.all('paygovtbirtbl', { where: { paytype } });
  const r = rows.find((x) => taxable >= num(x.payfrom) && taxable <= num(x.payto));
  if (!r) return 0;
  return r2(num(r.basic) + ((taxable - num(r.payfrom)) * num(r.excesrate)) / 100);
}

export async function computePayroll(ctx: Ctx, payidno: string): Promise<string> {
  await requireRight(ctx, FORM.PAYROLL_MONTHLY, ACTION.EDIT, 'compute payroll');
  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    const p = await period(db, payidno);
    if (p.paystat === 'Posted') fail(`Payroll ${payidno} is already posted.`);
    const emps = (await db.all('payemployeetbl', { where: { paytype: p.paytype } })).filter((e) => String(e.empstat).toLowerCase() !== 'resigned');
    if (!emps.length) fail('There are no employees on this payroll.');
    const maxHrs = num(p.workdays) * HOURS_PER_DAY;
    await db.remove('paydeducttbl', { payidno });
    await db.remove('paysliptbl', { payidno });
    let gross = 0;
    let net = 0;
    for (const e of emps) {
      const fin = await db.one('payfintbl', { empno: e.empno });
      if (!fin) fail(`${e.lastname}, ${e.firstname} has no pay setup (payfintbl).`);
      const monthly = num(fin.basicpay);
      const rate = r2((monthly * 12) / DAYS_PER_YEAR / HOURS_PER_DAY);
      let earn = await db.one('payearntbl', { payidno, empno: e.empno });
      if (!earn) {
        earn = { payidno, empno: e.empno, absent_hrs: 0, late_dhrs: 0, otime_dhrs: 0, nightdiffhrs: 0, holidayhrs: 0 };
        await db.insert('payearntbl', { ...earn, regtime_dhrs: maxHrs, transdate: p.pdateto, year: p.year, user: ctx.user, web: 'Y' });
      }
      const basic = r2(monthly / 2);
      const absent = r2(num(earn.absent_hrs) * rate);
      const late = r2(num(earn.late_dhrs) * rate);
      const ot = r2(num(earn.otime_dhrs) * rate * OT_PREMIUM);
      const nd = r2(num(earn.nightdiffhrs) * rate * ND_PREMIUM);
      const hol = r2(num(earn.holidayhrs) * rate * HOLIDAY_PREMIUM);
      const allowance = r2(num(fin.transallow) / 2);
      const adj = await db.all('payadjttbl', { where: { payidno, empno: e.empno } });
      const taxableAdj = sum(adj.filter((a) => a.taxopt !== 'N'), (a) => num(a.adjtamt));
      const nonTaxAdj = sum(adj.filter((a) => a.taxopt === 'N'), (a) => num(a.adjtamt));
      const totalearn = r2(basic - absent - late + ot + nd + hol + allowance + taxableAdj + nonTaxAdj);

      const sss = await bracket(db, 'SSS', monthly);
      const phic = await bracket(db, 'PHIC', monthly);
      const hdmf = await bracket(db, 'HDMF', monthly);
      const sssEe = r2(num(sss?.sssprem) / 2);
      const sssEr = r2((num(sss?.emp) + num(sss?.empexp)) / 2);
      const phBase = Math.min(Math.max(monthly, num(phic?.payfrom) || 10000), num(phic?.payto) || 100000);
      const phEe = r2((phBase * num(phic?.sssprem)) / 100 / 2);
      const hdBase = Math.min(monthly, 10000);
      const hdEe = r2((hdBase * num(hdmf?.sssprem)) / 100 / 2);
      const hdEr = r2((hdBase * num(hdmf?.emp)) / 100 / 2);
      const taxable = r2(totalearn - nonTaxAdj - allowance - sssEe - phEe - hdEe);
      const tax = await withholdingTax(db, Math.max(0, taxable), p.paytype === 'Weekly' ? 'Weekly' : 'Semi-monthly');
      const loans = await db.all('payloanmasttbl', { where: { empno: e.empno, loanstat: 'Active' } });
      const loanDed = sum(loans, (l) => num(l.amortamt));
      const totaldeduct = r2(sssEe + phEe + hdEe + tax + loanDed);
      const netpay = r2(totalearn - totaldeduct);
      if (netpay < 0) fail(`${e.lastname}, ${e.firstname} would have a negative net pay. Check the attendance and deductions.`);

      await db.update('payearntbl', { payidno, empno: e.empno }, {
        rateperhr: rate,
        ratereg: monthly,
        regtime_amt: basic,
        absent_amt: absent,
        late_amt: late,
        otime_amt: ot,
        nightdiffamt: nd,
        holidayamt: hol,
        othearn_amt: r2(allowance + taxableAdj + nonTaxAdj),
        totalearn,
        taxablegross: taxable,
        ccno: e.ccno,
      });
      await db.insert('paydeducttbl', {
        payidno,
        empno: e.empno,
        ccno: e.ccno,
        grossearn: totalearn,
        earnforcontn: monthly,
        sssprem: sssEe,
        sssexp: sssEr,
        phprem: phEe,
        hdmfprem: hdEe,
        hdmfexp: hdEr,
        taxableamt: taxable,
        taxablegross: taxable,
        taxdue: tax,
        basictaxamt: tax,
        otherdeduct: loanDed,
        cashadvance: 0,
        totaldeduct,
        netpay,
        payseq: p.payseq,
        monyear: p.monyear,
        year: p.year,
        transdate: p.pdateto,
        user: ctx.user,
        web: 'Y',
        sysver: 'CloudAOS',
      });
      await db.insert('paysliptbl', {
        payidno,
        empno: e.empno,
        empname: `${e.lastname}, ${e.firstname}`,
        ccno: e.ccno,
        ratereg: monthly,
        ratetype: 'Monthly',
        regtime_dhrs: maxHrs,
        regtime_amt: basic,
        late_dhrs: num(earn.late_dhrs),
        late_amt: late,
        otime_dhrs: num(earn.otime_dhrs),
        otime_amt: ot,
        nightdiffhrs: num(earn.nightdiffhrs),
        nightdiffamt: nd,
        holidayhrs: num(earn.holidayhrs),
        holidayamt: hol,
        othearn_amt: r2(allowance + taxableAdj + nonTaxAdj),
        totalearn,
        netpay,
        transdate: p.pdateto,
        user: ctx.user,
        web: 'Y',
      });
      gross = r2(gross + totalearn);
      net = r2(net + netpay);
    }
    const stamp = nowStamp();
    await db.update('payidnostattbl', { payidno }, { earn: 'Y', earndate: stamp, earnuser: ctx.user, deduct: 'Y', deductdate: stamp, deductuser: ctx.user, net: 'Y', netdate: stamp, netuser: ctx.user });
    await db.update('payidtbl', { payidno }, { paystat: 'Computed', dateupdate: stamp, userupdate: ctx.user });
    await audit(c, { form: FORM.PAYROLL_MONTHLY, tc: TC.PAYROLL, docno: payidno, trans: `Compute payroll (${emps.length} employees)`, table: 'paydeducttbl' });
    return `Payroll ${payidno} computed for ${emps.length} employees: gross ${fmtPeso(gross)}, net ${fmtPeso(net)}.`;
  });
}

export async function payrollRegister(ctx: Ctx, payidno: string) {
  await requireRight(ctx, FORM.PAYROLL_MONTHLY, ACTION.VIEW, 'view payroll');
  const p = await period(ctx.db, payidno);
  const ded = await ctx.db.all('paydeducttbl', { where: { payidno } });
  const earn = await ctx.db.all('payearntbl', { where: { payidno } });
  const slips = await ctx.db.all('paysliptbl', { where: { payidno } });
  const rows = slips
    .map((s) => {
      const d = ded.find((x) => x.empno === s.empno) ?? {};
      const e = earn.find((x) => x.empno === s.empno) ?? {};
      return {
        empno: s.empno,
        name: s.empname,
        ccno: s.ccno,
        basic: num(s.regtime_amt),
        deductionsForTime: r2(num(e.absent_amt) + num(e.late_amt)),
        overtime: r2(num(s.otime_amt) + num(s.nightdiffamt) + num(s.holidayamt)),
        other: num(s.othearn_amt),
        gross: num(s.totalearn),
        sss: num(d.sssprem),
        phic: num(d.phprem),
        hdmf: num(d.hdmfprem),
        tax: num(d.taxdue),
        loans: num(d.otherdeduct),
        net: num(s.netpay),
      };
    })
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const totals: Row = {};
  for (const k of ['basic', 'deductionsForTime', 'overtime', 'other', 'gross', 'sss', 'phic', 'hdmf', 'tax', 'loans', 'net']) totals[k] = sum(rows, (r: Row) => num(r[k]));
  return { period: p, rows, totals };
}

export async function postPayroll(ctx: Ctx, payidno: string): Promise<string> {
  await requireRight(ctx, FORM.PAYROLL_MONTHLY, ACTION.RELEASE, 'post payroll');
  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    const p = await period(db, payidno);
    if (p.paystat !== 'Computed') fail(p.paystat === 'Posted' ? `Payroll ${payidno} is already posted.` : 'Compute the payroll before posting it.');
    await assertOpenPeriod(db, p.pdateto, TC.PAYROLL);
    const ded = await db.all('paydeducttbl', { where: { payidno } });
    const earn = await db.all('payearntbl', { where: { payidno } });
    const byCc = new Map<string, { wages: number; ot: number; er: number }>();
    for (const e of earn) {
      const d = ded.find((x) => x.empno === e.empno);
      const g = byCc.get(e.ccno) ?? { wages: 0, ot: 0, er: 0 };
      g.wages = r2(g.wages + num(e.totalearn) - num(e.otime_amt) - num(e.nightdiffamt) - num(e.holidayamt));
      g.ot = r2(g.ot + num(e.otime_amt) + num(e.nightdiffamt) + num(e.holidayamt));
      g.er = r2(g.er + num(d?.sssexp) + num(d?.hdmfexp) + num(d?.phprem));
      byCc.set(e.ccno, g);
    }
    const entries: GlEntry[] = [];
    for (const [ccno, g] of byCc) {
      entries.push({ acctno: GL.SALARIES, ccno, dramt: g.wages });
      if (g.ot) entries.push({ acctno: GL.OVERTIME, ccno, dramt: g.ot });
      if (g.er) entries.push({ acctno: GL.EMPLOYER_CONTRIB, ccno, dramt: g.er });
    }
    entries.push({ acctno: GL.SSS_PAYABLE, cramt: r2(sum(ded, (d) => num(d.sssprem) + num(d.sssexp))) });
    entries.push({ acctno: GL.PHIC_PAYABLE, cramt: r2(sum(ded, (d) => num(d.phprem)) * 2) });
    entries.push({ acctno: GL.HDMF_PAYABLE, cramt: r2(sum(ded, (d) => num(d.hdmfprem) + num(d.hdmfexp))) });
    entries.push({ acctno: GL.WTAX_COMP_PAYABLE, cramt: sum(ded, (d) => num(d.taxdue)) });
    // Government loans are owed to the agency; company loans reduce the employee's advance.
    const loanAcct: Record<string, number> = {};
    for (const d of ded.filter((x) => num(x.otherdeduct) > 0)) {
      for (const l of await db.all('payloanmasttbl', { where: { empno: d.empno, loanstat: 'Active' } })) {
        const code = String(l.paycodeno ?? '').toUpperCase();
        const acct = code.startsWith('SSS') ? GL.SSS_PAYABLE : code.startsWith('HDMF') || code.startsWith('PAGIBIG') ? GL.HDMF_PAYABLE : GL.ADVANCES_EMPLOYEES;
        loanAcct[acct] = r2((loanAcct[acct] ?? 0) + num(l.amortamt));
      }
    }
    for (const [acctno, amt] of Object.entries(loanAcct)) if (amt) entries.push({ acctno, cramt: amt });
    entries.push({ acctno: GL.SALARIES_PAYABLE, cramt: sum(ded, (d) => num(d.netpay)) });
    await writeGl(c, { tc: TC.PAYROLL, docno: payidno, transdate: p.pdateto, source: 'PAYROLL' }, entries);
    await db.update('payidtbl', { payidno }, { paystat: 'Posted', datechngstat: nowStamp(), userchngstat: ctx.user });
    await audit(c, { form: FORM.PAYROLL_MONTHLY, tc: TC.PAYROLL, docno: payidno, trans: 'Post payroll to GL', table: 'payidtbl' });
    return `Payroll ${payidno} posted to the general ledger.`;
  });
}

export async function unpostPayroll(ctx: Ctx, payidno: string): Promise<string> {
  await requireRight(ctx, FORM.PAYROLL_MONTHLY, ACTION.DELETE, 'reverse a posted payroll');
  return ctx.db.tx(async (db) => {
    const p = await period(db, payidno);
    if (p.paystat !== 'Posted') fail('Only a posted payroll can be reversed.');
    await reverseGl({ ...ctx, db }, TC.PAYROLL, payidno, today());
    await db.update('payidtbl', { payidno }, { paystat: 'Computed' });
    await audit({ ...ctx, db }, { form: FORM.PAYROLL_MONTHLY, tc: TC.PAYROLL, docno: payidno, trans: 'Reverse payroll posting', table: 'payidtbl' });
    return `Posting of payroll ${payidno} reversed. You can correct and post it again.`;
  });
}

export async function payslip(ctx: Ctx, payidno: string, empno: string) {
  await requireRight(ctx, FORM.PAYROLL_MONTHLY, ACTION.VIEW, 'view payslips');
  const p = await period(ctx.db, payidno);
  const s = await ctx.db.one('paysliptbl', { payidno, empno });
  if (!s) fail('No payslip yet. Compute the payroll first.');
  const d = (await ctx.db.one('paydeducttbl', { payidno, empno })) ?? {};
  const e = (await ctx.db.one('payearntbl', { payidno, empno })) ?? {};
  return { period: p, slip: s, deductions: d, earnings: e };
}

export async function addAdjustment(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.PAYROLL_ADJUSTMENT, ACTION.INSERT, 'add payroll adjustments');
  return ctx.db.tx(async (db) => {
    const payidno = need(str(input.payidno), 'Choose the payroll.');
    const p = await period(db, payidno);
    if (p.paystat === 'Posted') fail(`Payroll ${payidno} is already posted.`);
    const empno = need(str(input.empno), 'Choose the employee.');
    const emp = await db.one('payemployeetbl', { empno });
    if (!emp) fail(`Employee ${empno} was not found.`);
    const amt = r2(num(input.adjtamt));
    if (!amt) fail('Enter the adjustment amount (negative to deduct).');
    await db.insert('payadjttbl', { payidno, empno, ccno: emp.ccno, paycodeno: str(input.paycodeno) || 'ADJ', adjtamt: amt, taxopt: input.taxopt === 'N' ? 'N' : 'T', pdate: today(), user: ctx.user, branch: 'MAIN', web: 'Y' });
    if (p.paystat === 'Computed') await db.update('payidtbl', { payidno }, { paystat: 'Open' });
    await audit({ ...ctx, db }, { form: FORM.PAYROLL_ADJUSTMENT, tc: TC.PAYROLL, docno: payidno, trans: `Adjustment ${fmtPeso(amt)} for ${empno}`, table: 'payadjttbl' });
    return 'Adjustment added. Compute the payroll again to include it.';
  });
}

export async function adjustments(ctx: Ctx, payidno: string) {
  await requireRight(ctx, FORM.PAYROLL_ADJUSTMENT, ACTION.VIEW, 'view payroll adjustments');
  const rows = await ctx.db.all('payadjttbl', { where: { payidno } });
  const emps = await ctx.db.all('payemployeetbl');
  return rows.map((r) => {
    const e = emps.find((x) => x.empno === r.empno);
    return { ...r, name: e ? `${e.lastname}, ${e.firstname}` : r.empno };
  });
}
