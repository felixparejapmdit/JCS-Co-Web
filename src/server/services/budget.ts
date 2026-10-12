import type { Row } from '../db';
import { ACTION, FORM, TC, TC_DOC } from '@/shared/codes';
import { monthEnd, monthName, monthStart } from '@/shared/dates';
import { r2, sum } from '@/shared/money';
import { Ctx, audit, fail, num, requireRight, str } from './context';

// ===========================================================================
// Budget monitoring (BudgetMonitor.aspx, form 079; buddettbl)
//
// Budgets are kept per cost center and account for a period (datefr - dateto). Actual
// spending follows the legacy rule: GL entries of the expense documents, transaction
// codes 40 to 48 (fund vouchers, weekly expense reports, vouchers payable, cheques,
// payroll and liquidations), for the cost center within the period.
// ===========================================================================
const ACTUAL_TC = { gte: '40', lte: '48' };

export type BudgetState = 'Over budget' | 'Near limit' | 'Within budget' | 'No budget';

function state(budget: number, actual: number): BudgetState {
  if (budget <= 0) return actual > 0 ? 'No budget' : 'Within budget';
  const used = actual / budget;
  return used > 1.0001 ? 'Over budget' : used >= 0.9 ? 'Near limit' : 'Within budget';
}

function periodLabel(datefr: string, dateto: string): string {
  const y = Number(datefr.slice(0, 4));
  const m = Number(datefr.slice(5, 7));
  if (datefr === monthStart(y, m) && dateto === monthEnd(y, m)) return `${monthName(m)} ${y}`;
  return `${datefr} to ${dateto}`;
}

export async function budgetPeriods(ctx: Ctx) {
  await requireRight(ctx, FORM.BUDGET, ACTION.VIEW, 'view budgets');
  const rows = await ctx.db.all('buddettbl', { orderBy: [['datefr', 'desc']] });
  const seen = new Map<string, Row>();
  for (const r of rows) {
    const k = `${r.datefr}|${r.dateto}`;
    if (!seen.has(k)) seen.set(k, { datefr: String(r.datefr), dateto: String(r.dateto), year: num(r.year), label: periodLabel(String(r.datefr), String(r.dateto)) });
  }
  return [...seen.values()];
}

async function actuals(ctx: Ctx, datefr: string, dateto: string) {
  return ctx.db.all('gltranstbl', { where: { transdate: { gte: datefr, lte: dateto }, glstatus: { in: ['OPEN', 'POSTED'] }, tc: ACTUAL_TC } });
}

/** Budget against actual for every cost center (cards), with the account lines of each. */
export async function budgetMonitor(ctx: Ctx, datefr: string, dateto: string) {
  await requireRight(ctx, FORM.BUDGET, ACTION.VIEW, 'view budgets');
  if (!datefr || !dateto) fail('Choose the budget period.');
  const budgets = await ctx.db.all('buddettbl', { where: { datefr, dateto } });
  const gl = (await actuals(ctx, datefr, dateto)).filter((l) => str(l.ccno));
  const ccs = await ctx.db.all('cctrnotbl');
  const accts = await ctx.db.all('acctcharttbl');
  const acctName = (a: string) => accts.find((x) => x.acctno === a)?.acctdesc ?? a;
  const keys = new Set<string>([...budgets.map((b) => `${b.ccno}|${b.acctno}`), ...gl.map((l) => `${l.ccno}|${l.acctno}`)]);
  const lines = [...keys].map((k) => {
    const [ccno, acctno] = k.split('|');
    const budget = sum(budgets.filter((b) => b.ccno === ccno && b.acctno === acctno), (b) => num(b.budamt));
    const actual = r2(gl.filter((l) => l.ccno === ccno && l.acctno === acctno).reduce((s, l) => s + num(l.dramt) - num(l.cramt), 0));
    return { ccno, acctno, acctdesc: acctName(acctno), budget, actual, variance: r2(budget - actual), used: budget > 0 ? r2((actual / budget) * 100) : null, state: state(budget, actual) };
  });
  const centers = [...new Set(lines.map((l) => l.ccno))].sort().map((ccno) => {
    const own = lines.filter((l) => l.ccno === ccno).sort((a, b) => b.actual - a.actual);
    const budget = sum(own, (l) => l.budget);
    const actual = sum(own, (l) => l.actual);
    return {
      ccno,
      ccdesc: ccs.find((c) => c.ccno === ccno)?.ccdesc ?? ccno,
      budget,
      actual,
      variance: r2(budget - actual),
      used: budget > 0 ? r2((actual / budget) * 100) : null,
      state: state(budget, actual),
      over: own.filter((l) => l.state === 'Over budget' || l.state === 'No budget').length,
      lines: own,
    };
  });
  return {
    datefr,
    dateto,
    label: periodLabel(datefr, dateto),
    centers,
    totals: { budget: sum(centers, (c) => c.budget), actual: sum(centers, (c) => c.actual), over: centers.filter((c) => c.state === 'Over budget').length },
  };
}

/** The documents behind an actual amount (legacy "actual details"). */
export async function budgetDetail(ctx: Ctx, datefr: string, dateto: string, ccno: string, acctno: string) {
  await requireRight(ctx, FORM.BUDGET, ACTION.VIEW, 'view budgets');
  const gl = (await actuals(ctx, datefr, dateto)).filter((l) => l.ccno === ccno && l.acctno === acctno);
  const vens = await ctx.db.all('venmasttbl');
  const byDoc = new Map<string, Row>();
  for (const l of gl) {
    const k = `${l.tc}|${l.docno}`;
    const d = byDoc.get(k) ?? { tc: l.tc, docno: l.docno, transdate: l.transdate, amount: 0, type: TC_DOC[l.tc] ?? '', payee: '' };
    d.amount = r2(d.amount + num(l.dramt) - num(l.cramt));
    byDoc.set(k, d);
  }
  const docs = [...byDoc.values()];
  for (const d of docs) {
    if (d.tc === TC.PAYROLL) d.payee = 'Payroll';
    else {
      const h = await ctx.db.one('exphdrtbl', { docno: d.docno, tc: d.tc });
      d.payee = h ? vens.find((v) => v.venno === h.venno)?.venname ?? h.venno : '';
    }
  }
  return docs.sort((a, b) => String(a.transdate).localeCompare(String(b.transdate)));
}

/** Replaces the budget of one cost center for a period. */
export async function saveBudget(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.BUDGET, ACTION.EDIT, 'change budgets');
  const datefr = str(input.datefr);
  const dateto = str(input.dateto);
  const ccno = str(input.ccno);
  if (!datefr || !dateto || dateto < datefr) fail('Enter a valid budget period.');
  if (!ccno || !(await ctx.db.one('cctrnotbl', { ccno }))) fail('Choose the cost center.');
  const lines: Row[] = (input.lines ?? []).filter((l: Row) => str(l.acctno) && num(l.budamt) > 0);
  const seen = new Set<string>();
  for (const l of lines) {
    if (!(await ctx.db.one('acctcharttbl', { acctno: str(l.acctno) }))) fail(`Account ${l.acctno} does not exist.`);
    if (seen.has(str(l.acctno))) fail(`Account ${l.acctno} appears twice. Combine the amounts into one line.`);
    seen.add(str(l.acctno));
  }
  return ctx.db.tx(async (db) => {
    const before = await db.all('buddettbl', { where: { datefr, dateto, ccno } });
    await db.remove('buddettbl', { datefr, dateto, ccno });
    for (const l of lines) await db.insert('buddettbl', { year: Number(datefr.slice(0, 4)), datefr, dateto, ccno, acctno: str(l.acctno), budamt: r2(num(l.budamt)), currstat: 'Open' });
    await audit({ ...ctx, db }, { form: FORM.BUDGET, docno: `${ccno} ${datefr}`, trans: `Update budget of ${ccno} for ${periodLabel(datefr, dateto)}`, table: 'buddettbl', before: { lines: before }, after: { lines } });
    return `Budget of ${ccno} for ${periodLabel(datefr, dateto)} saved: ${lines.length} account(s), ₱${sum(lines, (l) => num(l.budamt)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}.`;
  });
}
