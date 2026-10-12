// Financial statement schedules of the legacy FS.aspx / FSChemag.aspx (form 063):
//  - profit and loss in the legacy layout, where the expenses of the overhead and direct-labour
//    cost centres (cctrnotbl.cosexp) are part of cost of sales,
//  - the cost of sales schedule (materials, work in process and finished goods roll-forward),
//  - expense schedules per cost-centre group (Admin, Selling, Technical, Logistic, Overhead),
//  - prior years' adjustments (manual JVs flagged prioryradjt).
// Everything is computed from the general ledger, month and year to date.
import type { Row } from '../db';
import { ACTION, FORM, TC } from '@/shared/codes';
import { monthEnd, monthName, monthStart } from '@/shared/dates';
import { r2, sum } from '@/shared/money';
import { Ctx, num, requireRight, str } from './context';
import { AccountClass, GL, accountClass, ledgerLines } from './gl';

export const GROUPS = ['Admin', 'Selling', 'Technical', 'Logistic', 'Overhead & Direct Labor'] as const;
type Group = (typeof GROUPS)[number] | 'Unassigned';

/** Which schedule a cost centre belongs to: batbl's ccadmin / ccsales / ... when the company keeps them, else the cost-centre group. */
function grouper(ccs: Row[], company: Row | null): (ccno: string) => Group {
  const legacy: [string, Group][] = [
    [str(company?.ccadmin), 'Admin'],
    [str(company?.ccsales), 'Selling'],
    [str(company?.cctech), 'Technical'],
    [str(company?.cclogis), 'Logistic'],
    [str(company?.ccprod), 'Overhead & Direct Labor'],
  ];
  const useLegacy = legacy.some(([c]) => c);
  return (ccno: string) => {
    if (!ccno) return 'Unassigned';
    const cc = ccs.find((c) => c.ccno === ccno);
    if (!cc) return 'Unassigned';
    if (['c', 'yes', 'y'].includes(str(cc.cosexp).toLowerCase())) return 'Overhead & Direct Labor';
    const parent = str(cc.ccno2) || ccno;
    if (useLegacy) {
      const hit = legacy.find(([c]) => c && (c === parent || c === ccno));
      if (hit) return hit[1];
    }
    const g = `${str(cc.ccnogrp)} ${str(cc.ccdesc)} ${ccno}`.toLowerCase();
    if (/tech/.test(g)) return 'Technical';
    if (/logist|warehouse|\blog\b/.test(g)) return 'Logistic';
    if (/sell|sales|market/.test(g)) return 'Selling';
    if (/g&a|admin|account|financ|purchas|general/.test(g)) return 'Admin';
    return 'Unassigned';
  };
}

const INCOME: AccountClass[] = ['Revenue', 'Cost of Sales', 'Expense', 'Other Income', 'Other Expense'];

export async function fsSchedules(ctx: Ctx, opts: { year: number; month: number; includeUnposted?: boolean }) {
  await requireRight(ctx, FORM.FINANCIAL_REPORTS, ACTION.VIEW, 'view financial statements');
  const asOf = monthEnd(opts.year, opts.month);
  const monthFrom = monthStart(opts.year, opts.month);
  const yearFrom = monthStart(opts.year, 1);
  const [accts, ccs, company, plants] = await Promise.all([ctx.db.all('acctcharttbl'), ctx.db.all('cctrnotbl'), ctx.db.one('batbl', { ba: ctx.ba }), ctx.db.all('plnttbl')]);
  const name = (a: string) => accts.find((x) => x.acctno === a)?.acctdesc ?? a;
  const groupOf = grouper(ccs, company);
  const lines = await ledgerLines(ctx.db, { to: asOf, includeUnposted: opts.includeUnposted });
  const inMonth = (l: Row) => String(l.transdate) >= monthFrom;
  const inYear = (l: Row) => String(l.transdate) >= yearFrom;
  const net = (rows: Row[]) => r2(sum(rows, (l) => num(l.dramt) - num(l.cramt)));

  // ---- Expense schedules per group
  const expense = lines.filter((l) => accountClass(l.acctno) === 'Expense' && inYear(l));
  const schedules = [...GROUPS, 'Unassigned' as const]
    .map((g) => {
      const mine = expense.filter((l) => groupOf(str(l.ccno)) === g);
      const byAcct = new Map<string, Row[]>();
      for (const l of mine) byAcct.set(l.acctno, [...(byAcct.get(l.acctno) ?? []), l]);
      const rows = [...byAcct.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([acctno, ls]) => ({ acctno, acctdesc: name(acctno), month: net(ls.filter(inMonth)), ytd: net(ls) }));
      return { group: g, rows, month: r2(sum(rows, (r) => r.month)), ytd: r2(sum(rows, (r) => r.ytd)), costCenters: [...new Set(mine.map((l) => str(l.ccno)).filter(Boolean))] };
    })
    .filter((s) => s.rows.length);
  const sched = (g: Group) => schedules.find((s) => s.group === g) ?? { month: 0, ytd: 0 };

  // ---- Profit and loss in the legacy layout
  const cls = (c: AccountClass, sign: 1 | -1) => ({ month: r2(sign * net(lines.filter((l) => accountClass(l.acctno) === c && inMonth(l)))), ytd: r2(sign * net(lines.filter((l) => accountClass(l.acctno) === c && inYear(l)))) });
  const sales = cls('Revenue', -1);
  const cosGl = cls('Cost of Sales', 1);
  const overhead = sched('Overhead & Direct Labor');
  const cos = { month: r2(cosGl.month + overhead.month), ytd: r2(cosGl.ytd + overhead.ytd) };
  const gross = { month: r2(sales.month - cos.month), ytd: r2(sales.ytd - cos.ytd) };
  const opex = (['Admin', 'Selling', 'Technical', 'Logistic', 'Unassigned'] as Group[]).map((g) => ({ label: g === 'Unassigned' ? 'Other expenses (no cost centre group)' : `${g} expenses`, ...sched(g) })).filter((x) => x.month || x.ytd);
  const totalOpex = { month: r2(sum(opex, (x) => x.month)), ytd: r2(sum(opex, (x) => x.ytd)) };
  const otherIncome = cls('Other Income', -1);
  const otherExpense = cls('Other Expense', 1);
  const netIncome = { month: r2(gross.month - totalOpex.month + otherIncome.month - otherExpense.month), ytd: r2(gross.ytd - totalOpex.ytd + otherIncome.ytd - otherExpense.ytd) };

  // ---- Cost of sales schedule: inventory roll-forward
  const rmAccts = new Set([GL.INV_RAW, GL.INV_PACKAGING, ...plants.map((p) => str(p.rminv)).filter(Boolean)]);
  const fgAccts = new Set([GL.INV_FG, GL.VAN_INVENTORY, ...plants.map((p) => str(p.fginv)).filter(Boolean)]);
  const wipAccts = new Set([GL.WIP]);
  const roll = (set: Set<string>, from: string) => {
    const mine = lines.filter((l) => set.has(l.acctno));
    const before = mine.filter((l) => String(l.transdate) < from);
    const during = mine.filter((l) => String(l.transdate) >= from);
    const beginning = net(before);
    const purchases = r2(sum(during.filter((l) => String(l.tc) === TC.RECEIVING), (l) => num(l.dramt)));
    const otherIn = r2(sum(during.filter((l) => String(l.tc) !== TC.RECEIVING), (l) => num(l.dramt)));
    const out = r2(sum(during, (l) => num(l.cramt)));
    return { beginning, purchases, otherIn, out, ending: r2(beginning + purchases + otherIn - out) };
  };
  const cosFor = (from: string, cosAmt: number, oh: number) => {
    const rm = roll(rmAccts, from);
    const wip = roll(wipAccts, from);
    const fg = roll(fgAccts, from);
    return {
      materials: { ...rm, used: r2(rm.beginning + rm.purchases + rm.otherIn - rm.ending) },
      wip,
      finishedGoods: fg,
      costOfSalesGl: cosAmt,
      overhead: oh,
      total: r2(cosAmt + oh),
    };
  };

  // ---- Prior years' adjustments
  const flagged = await ctx.db.all('gljvdettbl', { where: { prioryradjt: 'Y' } });
  const pya = (await ctx.db.all('gljvhdrtbl', { where: { jvno: { in: [...new Set(flagged.map((l) => l.jvno))] }, transdate: { gte: yearFrom, lte: asOf } } })).filter((h) => h.status !== 'Void');
  const pyaLines = flagged.filter((l) => pya.some((h) => h.jvno === l.jvno));
  const adjustments = pyaLines.map((l) => {
    const h = pya.find((x) => x.jvno === l.jvno)!;
    return { jvno: l.jvno, transdate: h.transdate, status: h.status, remarks: h.remarks, acctno: l.acctno, acctdesc: name(l.acctno), dramt: num(l.dramt), cramt: num(l.cramt) };
  });

  return {
    asOf,
    period: `${monthName(opts.month)} ${opts.year}`,
    groups: GROUPS,
    pnl: { sales, cosGl, overhead: { month: overhead.month, ytd: overhead.ytd }, cos, gross, opex, totalOpex, otherIncome, otherExpense, netIncome },
    cosSchedule: { month: cosFor(monthFrom, cosGl.month, overhead.month), ytd: cosFor(yearFrom, cosGl.ytd, overhead.ytd) },
    schedules,
    adjustments,
    adjustmentsNet: r2(sum(adjustments.filter((a) => INCOME.includes(accountClass(a.acctno)) || a.acctno === GL.RETAINED_EARNINGS), (a) => a.cramt - a.dramt)),
    legacyGroups: Boolean(str(company?.ccadmin) || str(company?.ccsales)),
  };
}
