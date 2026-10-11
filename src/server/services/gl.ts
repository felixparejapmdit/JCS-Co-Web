import type { Db, Row } from '../db';
import { ACTION, FORM, TC } from '@/shared/codes';
import { monthEnd, monthName, monthStart, nowStamp, today, ym } from '@/shared/dates';
import { r2, sum } from '@/shared/money';
import { Ctx, assertOpenPeriod, audit, fail, need, nextDocNo, num, numberLines, str, yearPrefix } from './context';
import { ActionDef, DocService, Loaded, STD, countBy, filterList, registerDoc } from './docs';

/**
 * Control accounts used by automatic postings. The values match the demo chart of accounts;
 * in Phase 1 they are mapped to the client's acctcharttbl (most per-item accounts already come
 * from legacy tables: inventory/COS from plnttbl, sales from mmasttbl, AR from pctrtbl).
 */
export const GL = {
  CASH_ON_HAND: '1110100',
  PDC_ON_HAND: '1110200',
  AR_TRADE: '1130100',
  INPUT_VAT: '1150100',
  CWT_RECEIVABLE: '1150200',
  ADVANCES_EMPLOYEES: '1160100',
  INV_RAW: '1140100',
  INV_FG: '1140200',
  INV_PACKAGING: '1140300',
  WIP: '1140400',
  AP_TRADE: '2110100',
  GRNI: '2110200',
  EWT_PAYABLE: '2120100',
  OUTPUT_VAT: '2120200',
  CUSTOMER_DEPOSITS: '2140100',
  SSS_PAYABLE: '2130100',
  PHIC_PAYABLE: '2130200',
  HDMF_PAYABLE: '2130300',
  WTAX_COMP_PAYABLE: '2130400',
  SALARIES_PAYABLE: '2130500',
  RETAINED_EARNINGS: '3200100',
  SALES: '4100100',
  SALES_RETURNS: '4100200',
  COST_OF_SALES: '5100100',
  SALARIES: '6100100',
  OVERTIME: '6100200',
  EMPLOYER_CONTRIB: '6100300',
  INVENTORY_VARIANCE: '6200900',
  SCRAP_LOSS: '6200800',
} as const;

export type AccountClass = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Cost of Sales' | 'Expense' | 'Other Income' | 'Other Expense';

export function accountClass(acctno: string): AccountClass {
  switch (String(acctno)[0]) {
    case '1':
      return 'Asset';
    case '2':
      return 'Liability';
    case '3':
      return 'Equity';
    case '4':
      return 'Revenue';
    case '5':
      return 'Cost of Sales';
    case '7':
      return 'Other Income';
    case '8':
      return 'Other Expense';
    default:
      return 'Expense';
  }
}

/** Debit-normal classes increase with debits. */
export function isDebitNormal(acctno: string): boolean {
  return ['Asset', 'Cost of Sales', 'Expense', 'Other Expense'].includes(accountClass(acctno));
}

export interface GlEntry {
  acctno: string;
  ccno?: string;
  pc?: string;
  dramt?: number;
  cramt?: number;
}

let seq = 0;
function uid(): string {
  seq = (seq + 1) % 100000;
  return `${Date.now().toString(36)}${seq.toString(36)}`;
}

/** Validates and balances entries; merges zero lines away. */
function prepare(entries: GlEntry[]): GlEntry[] {
  const lines = entries
    .map((e) => ({ ...e, dramt: r2(e.dramt ?? 0), cramt: r2(e.cramt ?? 0) }))
    .filter((e) => e.dramt !== 0 || e.cramt !== 0)
    .map((e) => {
      // Negative amounts flip sides so every stored line is positive.
      if (e.dramt < 0 || e.cramt < 0) {
        const dr = e.dramt - e.cramt;
        return { ...e, dramt: dr > 0 ? r2(dr) : 0, cramt: dr < 0 ? r2(-dr) : 0 };
      }
      return e;
    });
  const dr = sum(lines, (l) => l.dramt!);
  const cr = sum(lines, (l) => l.cramt!);
  if (Math.abs(dr - cr) > 0.009) fail(`Accounting entry is out of balance (debits ${dr.toFixed(2)} vs credits ${cr.toFixed(2)}).`);
  return lines;
}

/**
 * Writes the subledger entries of a document to gltranstbl with glstatus OPEN — the legacy
 * "Update GL Entries" step. JV Posting (form 038) later posts them to the ledger.
 */
export async function writeGl(
  ctx: Ctx,
  doc: { tc: string; docno: string; transdate: string; source: string },
  entries: GlEntry[]
): Promise<void> {
  const lines = prepare(entries);
  const { transyear, transmon } = ym(doc.transdate);
  for (const l of lines) {
    await ctx.db.insert('gltranstbl', {
      id: uid(),
      acctno: l.acctno,
      ccno: l.ccno ?? '',
      pc: l.pc ?? '',
      dramt: l.dramt,
      cramt: l.cramt,
      drcr: (l.dramt ?? 0) > 0 ? 'D' : 'C',
      docno: doc.docno,
      tc: doc.tc,
      jvsource: doc.source,
      jvno: '',
      transdate: doc.transdate,
      transyear,
      transmon,
      glstatus: 'OPEN',
      user: ctx.user,
      web: 'Y',
      branch: 'MAIN',
    });
  }
}

/** Reverses a document's entries: unposted lines are voided, posted lines get reversing entries. */
export async function reverseGl(ctx: Ctx, tc: string, docno: string, date: string): Promise<void> {
  const rows = await ctx.db.all('gltranstbl', { where: { tc, docno } });
  const posted = rows.filter((r) => String(r.glstatus).toUpperCase() === 'POSTED');
  await ctx.db.update('gltranstbl', { tc, docno, glstatus: 'OPEN' }, { glstatus: 'VOID' });
  if (posted.length) {
    await writeGl(
      ctx,
      { tc, docno, transdate: date, source: 'VOID' },
      posted.map((p) => ({ acctno: p.acctno, ccno: p.ccno, pc: p.pc, dramt: num(p.cramt), cramt: num(p.dramt) }))
    );
  }
}

async function writeMain(db: Db, jvno: string, jvsource: string, jvtype: string, rows: Row[], user: string) {
  for (const r of rows) {
    await db.insert('glmaintranstbl', {
      pk: uid(),
      acctno: r.acctno,
      ccno: r.ccno ?? '',
      pc: r.pc ?? '',
      dramt: num(r.dramt),
      cramt: num(r.cramt),
      balamt: r2(num(r.dramt) - num(r.cramt)),
      jvno,
      jvsource,
      jvtype,
      transdate: r.transdate,
      transyear: r.transyear,
      transmon: r.transmon,
      glstatus: 'POSTED',
      monstat: 'OPEN',
      dateposted: today(),
      postedby: user,
      user,
      ba: '',
      branch: 'MAIN',
    });
  }
}

/** JV Posting (038): bundles all open subledger entries into one automatic JV per month and posts it. */
export async function postOpenEntries(ctx: Ctx, upTo: string): Promise<{ jvnos: string[]; lines: number }> {
  const open = await ctx.db.all('gltranstbl', { where: { glstatus: 'OPEN', transdate: { lte: upTo } } });
  const byMonth = new Map<string, Row[]>();
  for (const r of open) {
    const k = `${r.transyear}-${String(r.transmon).padStart(2, '0')}`;
    byMonth.set(k, [...(byMonth.get(k) ?? []), r]);
  }
  const jvnos: string[] = [];
  for (const [k, rows] of [...byMonth.entries()].sort()) {
    const [y, m] = k.split('-').map(Number);
    const date = monthEnd(y, m) < upTo ? monthEnd(y, m) : upTo;
    await assertOpenPeriod(ctx.db, date);
    const jvno = await nextDocNo(ctx.db, 'gljvhdrtbl', 'jvno', yearPrefix('AJV', date));
    const dr = sum(rows, (r) => num(r.dramt));
    const cr = sum(rows, (r) => num(r.cramt));
    await ctx.db.insert('gljvhdrtbl', {
      jvno,
      transdate: date,
      dramt: dr,
      cramt: cr,
      remarks: `Automatic JV: ${rows.length} subledger entries for ${monthName(m)} ${y}`,
      transyear: y,
      transmon: m,
      user: ctx.user,
      status: 'Posted',
      jvtype: 'Auto',
      entrytype: 'AUTO',
      sourcedoc: 'Subledgers',
      postdate: today(),
      postby: ctx.user,
      branch: 'MAIN',
    });
    // Summarise by account / cost center for the JV lines.
    const grouped = new Map<string, { acctno: string; ccno: string; dramt: number; cramt: number }>();
    for (const r of rows) {
      const key = `${r.acctno}|${r.ccno ?? ''}`;
      const g = grouped.get(key) ?? { acctno: r.acctno, ccno: r.ccno ?? '', dramt: 0, cramt: 0 };
      g.dramt += num(r.dramt);
      g.cramt += num(r.cramt);
      grouped.set(key, g);
    }
    let i = 0;
    for (const g of grouped.values()) {
      const net = r2(g.dramt - g.cramt);
      if (net === 0) continue;
      await ctx.db.insert('gljvdettbl', {
        jvno,
        itmno: ++i,
        acctno: g.acctno,
        ccno: g.ccno,
        dramt: net > 0 ? net : 0,
        cramt: net < 0 ? -net : 0,
        transyear: y,
        transmon: m,
        status: 'Posted',
        entrytype: 'AUTO',
        sourcedoc: 'Subledgers',
        user: ctx.user,
      });
    }
    for (const r of rows) await ctx.db.update('gltranstbl', { id: r.id }, { glstatus: 'POSTED', jvno, dateposted: today() });
    await writeMain(ctx.db, jvno, 'AUTO', 'Auto', rows, ctx.user);
    await audit(ctx, { form: FORM.JV_POSTING, tc: TC.JOURNAL_VOUCHER, docno: jvno, trans: `Post ${rows.length} open entries`, table: 'gljvhdrtbl' });
    jvnos.push(jvno);
  }
  return { jvnos, lines: open.length };
}

export async function openEntriesSummary(ctx: Ctx): Promise<{ count: number; debit: number; credit: number; byDoc: Row[] }> {
  const open = await ctx.db.all('gltranstbl', { where: { glstatus: 'OPEN' }, orderBy: [['transdate', 'asc']] });
  const docs = new Map<string, Row>();
  for (const r of open) {
    const k = `${r.tc}|${r.docno}`;
    const d = docs.get(k) ?? { tc: r.tc, docno: r.docno, source: r.jvsource, transdate: r.transdate, debit: 0, credit: 0, lines: 0 };
    d.debit = r2(d.debit + num(r.dramt));
    d.credit = r2(d.credit + num(r.cramt));
    d.lines += 1;
    docs.set(k, d);
  }
  return { count: open.length, debit: sum(open, (r) => num(r.dramt)), credit: sum(open, (r) => num(r.cramt)), byDoc: [...docs.values()] };
}

// ---------------------------------------------------------------------------
// Manual journal vouchers (JournalVoucher.aspx, form 052; posting form 038)
// ---------------------------------------------------------------------------
async function validateJvLines(ctx: Ctx, lines: Row[]): Promise<Row[]> {
  const clean = lines
    .map((l) => ({ acctno: str(l.acctno), ccno: str(l.ccno), pc: str(l.pc), dramt: r2(num(l.dramt)), cramt: r2(num(l.cramt)) }))
    .filter((l) => l.acctno || l.dramt || l.cramt);
  if (clean.length < 2) fail('A journal voucher needs at least two lines (one debit and one credit).');
  for (const [i, l] of clean.entries()) {
    if (!l.acctno) fail(`Line ${i + 1}: choose an account.`);
    const acct = await ctx.db.one('acctcharttbl', { acctno: l.acctno });
    if (!acct) fail(`Line ${i + 1}: account ${l.acctno} is not in the chart of accounts.`);
    if (l.dramt && l.cramt) fail(`Line ${i + 1}: enter either a debit or a credit, not both.`);
    if (!l.dramt && !l.cramt) fail(`Line ${i + 1}: enter an amount.`);
    if (l.ccno && !(await ctx.db.one('cctrnotbl', { ccno: l.ccno }))) fail(`Line ${i + 1}: cost center ${l.ccno} does not exist.`);
  }
  const dr = sum(clean, (l) => l.dramt);
  const cr = sum(clean, (l) => l.cramt);
  if (Math.abs(dr - cr) > 0.009) fail(`Debits (${dr.toFixed(2)}) and credits (${cr.toFixed(2)}) must be equal. Difference: ${(dr - cr).toFixed(2)}.`);
  return clean;
}

const jvService: DocService = {
  type: 'jv',
  title: 'Journal Voucher',
  form: FORM.JOURNAL_VOUCHER,
  tc: TC.JOURNAL_VOUCHER,
  table: 'gljvhdrtbl',
  noColumn: 'jvno',

  async list(ctx, params) {
    const rows = await ctx.db.all('gljvhdrtbl', { orderBy: [['transdate', 'desc'], ['jvno', 'desc']] });
    const shaped = rows.map((r) => ({ ...r, no: r.jvno, amount: num(r.dramt) }));
    return { rows: filterList(shaped, params, ['jvno', 'remarks', 'sourcedoc', 'jvtype']), counts: countBy(shaped) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('gljvhdrtbl', { jvno: no });
    if (!h) return null;
    const lines = await ctx.db.all('gljvdettbl', { where: { jvno: no }, orderBy: [['itmno', 'asc']] });
    return { h, lines };
  },

  async view(ctx, { h, lines }) {
    const accts = await ctx.db.all('acctcharttbl');
    const name = (a: string) => accts.find((x) => x.acctno === a)?.acctdesc ?? '';
    const dr = sum(lines, (l) => num(l.dramt));
    const cr = sum(lines, (l) => num(l.cramt));
    return {
      no: h.jvno,
      status: h.status,
      title: `Journal Voucher ${h.jvno}`,
      subtitle: h.remarks,
      header: h,
      lines: lines.map((l) => ({ ...l, acctdesc: name(l.acctno) })),
      totals: [
        { label: 'Total debit', value: dr },
        { label: 'Total credit', value: cr },
        { label: 'Difference', value: r2(dr - cr), strong: true },
      ],
      checks: [{ label: 'Debits equal credits', ok: Math.abs(dr - cr) < 0.01 }],
      info: [
        { label: 'Type', value: h.jvtype === 'Auto' ? 'Automatic (from subledgers)' : 'Manual' },
        { label: 'Period', value: `${monthName(num(h.transmon))} ${h.transyear}` },
      ],
      editable: h.status === 'Open' && h.jvtype !== 'Auto',
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.jvtype === 'Auto') return defs;
    if (h.status === 'Open') defs.push(STD.approve(undefined, 'Approve'), STD.void());
    if (h.status === 'Approved')
      defs.push({ ...STD.post(FORM.JV_POSTING, 'Post to ledger'), hint: 'Writes the lines to the general ledger.' }, STD.reopen(), STD.void());
    if (h.status === 'Posted') defs.push(STD.void('Reversing entries are created dated today.'));
    return defs;
  },

  async perform(ctx, { h, lines }, action) {
    switch (action) {
      case 'approve':
        await ctx.db.update('gljvhdrtbl', { jvno: h.jvno }, { status: 'Approved', apppostdate: today() });
        await ctx.db.update('gljvdettbl', { jvno: h.jvno }, { status: 'Approved' });
        return `JV ${h.jvno} approved and ready for posting.`;
      case 'reopen':
        await ctx.db.update('gljvhdrtbl', { jvno: h.jvno }, { status: 'Open' });
        await ctx.db.update('gljvdettbl', { jvno: h.jvno }, { status: 'Open' });
        return `JV ${h.jvno} returned to draft.`;
      case 'post': {
        await assertOpenPeriod(ctx.db, h.transdate, TC.JOURNAL_VOUCHER);
        const { transyear, transmon } = ym(h.transdate);
        const rows: Row[] = [];
        for (const l of lines) {
          const row = {
            id: uid(),
            acctno: l.acctno,
            ccno: l.ccno ?? '',
            pc: l.pc ?? '',
            dramt: num(l.dramt),
            cramt: num(l.cramt),
            drcr: num(l.dramt) > 0 ? 'D' : 'C',
            docno: h.jvno,
            tc: TC.JOURNAL_VOUCHER,
            jvsource: 'JV',
            jvno: h.jvno,
            transdate: h.transdate,
            transyear,
            transmon,
            glstatus: 'POSTED',
            dateposted: today(),
            user: ctx.user,
            web: 'Y',
            branch: 'MAIN',
          };
          await ctx.db.insert('gltranstbl', row);
          rows.push(row);
        }
        await writeMain(ctx.db, h.jvno, 'JV', 'Manual', rows, ctx.user);
        await ctx.db.update('gljvhdrtbl', { jvno: h.jvno }, { status: 'Posted', postdate: today(), postby: ctx.user });
        await ctx.db.update('gljvdettbl', { jvno: h.jvno }, { status: 'Posted' });
        return `JV ${h.jvno} posted to the general ledger.`;
      }
      case 'void': {
        if (h.status === 'Posted') {
          await assertOpenPeriod(ctx.db, today());
          const posted = await ctx.db.all('gltranstbl', { where: { tc: TC.JOURNAL_VOUCHER, docno: h.jvno, glstatus: 'POSTED' } });
          await writeGl(
            ctx,
            { tc: TC.JOURNAL_VOUCHER, docno: h.jvno, transdate: today(), source: 'VOID' },
            posted.map((p) => ({ acctno: p.acctno, ccno: p.ccno, dramt: num(p.cramt), cramt: num(p.dramt) }))
          );
        }
        await ctx.db.update('gljvhdrtbl', { jvno: h.jvno }, { status: 'Void' });
        await ctx.db.update('gljvdettbl', { jvno: h.jvno }, { status: 'Void' });
        return `JV ${h.jvno} voided.`;
      }
    }
    fail('Unknown action');
  },

  async defaults(ctx) {
    return { transdate: today(), remarks: '', lines: [{}, {}] };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the JV date.');
    await assertOpenPeriod(ctx.db, transdate, TC.JOURNAL_VOUCHER);
    const lines = await validateJvLines(ctx, input.lines ?? []);
    const remarks = need(str(input.remarks), 'Describe what this journal voucher is for.');
    const { transyear, transmon } = ym(transdate);
    const dr = sum(lines, (l) => l.dramt);
    let jvno = str(input.no);
    if (jvno) {
      const h = await ctx.db.one('gljvhdrtbl', { jvno });
      if (!h) fail(`JV ${jvno} was not found.`);
      if (h.status !== 'Open') fail(`JV ${jvno} is ${h.status} and can no longer be edited.`);
      await ctx.db.update('gljvhdrtbl', { jvno }, { transdate, remarks, dramt: dr, cramt: dr, transyear, transmon, sourcedoc: str(input.sourcedoc) });
      await ctx.db.remove('gljvdettbl', { jvno });
    } else {
      jvno = await nextDocNo(ctx.db, 'gljvhdrtbl', 'jvno', yearPrefix('JV', transdate));
      await ctx.db.insert('gljvhdrtbl', {
        jvno,
        transdate,
        remarks,
        dramt: dr,
        cramt: dr,
        transyear,
        transmon,
        user: ctx.user,
        status: 'Open',
        jvtype: 'Manual',
        entrytype: 'MANUAL',
        sourcedoc: str(input.sourcedoc),
        branch: 'MAIN',
      });
    }
    for (const l of numberLines(lines, 'itmno')) {
      await ctx.db.insert('gljvdettbl', { jvno, ...l, transyear, transmon, status: 'Open', entrytype: 'MANUAL', user: ctx.user });
    }
    return { no: jvno };
  },
};
registerDoc(jvService);

// ---------------------------------------------------------------------------
// Period closing (AccountingPeriod.aspx, form 006)
// ---------------------------------------------------------------------------
export async function periods(ctx: Ctx, year: number) {
  const rows = await ctx.db.all('gltransmonstatus', { where: { transyear: year }, orderBy: [['transmon', 'asc']] });
  const open = await ctx.db.all('gltranstbl', { where: { glstatus: 'OPEN', transyear: year } });
  const jvs = await ctx.db.all('gljvhdrtbl', { where: { transyear: year, status: { in: ['Open', 'Approved'] } } });
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const p = rows.find((r) => num(r.transmon) === m);
    const unposted = open.filter((r) => num(r.transmon) === m).length;
    const pendingJv = jvs.filter((r) => num(r.transmon) === m).length;
    return {
      transyear: year,
      transmon: m,
      label: `${monthName(m)} ${year}`,
      exists: Boolean(p),
      monstat: p ? String(p.monstat).toUpperCase() : 'NOT OPENED',
      reopened: p?.reopen === 'Y',
      dfrom: p?.dfrom ?? monthStart(year, m),
      dto: p?.dto ?? monthEnd(year, m),
      unposted,
      pendingJv,
      canClose: !!p && String(p.monstat).toUpperCase() === 'OPEN' && unposted === 0 && pendingJv === 0,
    };
  });
}

export async function closePeriod(ctx: Ctx, year: number, month: number): Promise<string> {
  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    const p = await db.one('gltransmonstatus', { transyear: year, transmon: month });
    if (!p) fail('That period has not been opened.');
    if (String(p.monstat).toUpperCase() !== 'OPEN') fail(`${monthName(month)} ${year} is already closed.`);
    const unposted = await db.count('gltranstbl', { glstatus: 'OPEN', transyear: year, transmon: month });
    if (unposted) fail(`${unposted} subledger entries for ${monthName(month)} are not posted yet. Run JV Posting first.`);
    const jvs = await db.count('gljvhdrtbl', { transyear: year, transmon: month, status: { in: ['Open', 'Approved'] } });
    if (jvs) fail(`${jvs} journal voucher(s) dated ${monthName(month)} are still open or awaiting posting.`);
    await db.update('gltransmonstatus', { transyear: year, transmon: month }, { monstat: 'CLOSE', dateaudit1: today(), audit1: ctx.user });
    await db.update('modtranstattbl', { transyear: year, transmon: month }, { monstat: 'CLOSE' });
    await db.update('glmaintranstbl', { transyear: year, transmon: month }, { monstat: 'CLOSE' });
    // Make sure the following month is open so work can continue without a gap.
    const ny = month === 12 ? year + 1 : year;
    const nm = month === 12 ? 1 : month + 1;
    await ensurePeriod(db, ny, nm, ctx.user);
    await audit(c, { form: FORM.PERIOD_CLOSING, docno: `${year}-${String(month).padStart(2, '0')}`, trans: `Close period ${monthName(month)} ${year}`, table: 'gltransmonstatus' });
    return `${monthName(month)} ${year} is closed. ${monthName(nm)} ${ny} is open for posting.`;
  });
}

export async function reopenPeriod(ctx: Ctx, year: number, month: number, reason: string): Promise<string> {
  if (!reason.trim()) fail('Give a reason for reopening the period; it is kept in the audit log.');
  return ctx.db.tx(async (db) => {
    const p = await db.one('gltransmonstatus', { transyear: year, transmon: month });
    if (!p) fail('That period has not been opened.');
    if (String(p.yearstat).toUpperCase() !== 'OPEN') fail(`Year ${year} is closed and cannot be reopened here.`);
    await db.update('gltransmonstatus', { transyear: year, transmon: month }, { monstat: 'OPEN', reopen: 'Y' });
    await db.update('modtranstattbl', { transyear: year, transmon: month }, { monstat: 'OPEN' });
    await audit({ ...ctx, db }, { form: FORM.PERIOD_CLOSING, docno: `${year}-${String(month).padStart(2, '0')}`, trans: `Reopen period ${monthName(month)} ${year}: ${reason}`, table: 'gltransmonstatus' });
    return `${monthName(month)} ${year} is open again.`;
  });
}

export async function ensurePeriod(db: Db, year: number, month: number, user: string) {
  const p = await db.one('gltransmonstatus', { transyear: year, transmon: month });
  if (p) return;
  await db.insert('gltransmonstatus', {
    transyear: year,
    transmon: month,
    dfrom: monthStart(year, month),
    dto: monthEnd(year, month),
    monstat: 'OPEN',
    yearstat: 'OPEN',
    reopen: 'N',
    ba: db.ba,
    branch: 'MAIN',
    user,
    datecreated: nowStamp(),
    yearendcltype: '',
  });
  for (const tc of Object.values(TC)) {
    await db.insert('modtranstattbl', { transyear: year, transmon: month, tc, monstat: 'OPEN', yearstat: 'OPEN', ba: db.ba, branch: 'MAIN', dfrom: monthStart(year, month), dto: monthEnd(year, month), user, datecreated: nowStamp() });
  }
}

// ---------------------------------------------------------------------------
// Reports (GLReports.aspx form 052, FS.aspx / FSChemag.aspx form 063)
// ---------------------------------------------------------------------------
export async function ledgerLines(db: Db, opts: { from?: string; to?: string; includeUnposted?: boolean; acctno?: string }) {
  const statuses = opts.includeUnposted ? ['POSTED', 'OPEN'] : ['POSTED'];
  const where: Row = { glstatus: { in: statuses } };
  if (opts.acctno) where.acctno = opts.acctno;
  if (opts.from || opts.to) where.transdate = { ...(opts.from ? { gte: opts.from } : {}), ...(opts.to ? { lte: opts.to } : {}) };
  return db.all('gltranstbl', { where, orderBy: [['transdate', 'asc'], ['docno', 'asc']] });
}

export async function trialBalance(ctx: Ctx, opts: { asOf: string; includeUnposted?: boolean }) {
  const accts = await ctx.db.all('acctcharttbl', { orderBy: [['acctno', 'asc']] });
  const lines = await ledgerLines(ctx.db, { to: opts.asOf, includeUnposted: opts.includeUnposted });
  const totals = new Map<string, { dr: number; cr: number }>();
  for (const l of lines) {
    const t = totals.get(l.acctno) ?? { dr: 0, cr: 0 };
    t.dr += num(l.dramt);
    t.cr += num(l.cramt);
    totals.set(l.acctno, t);
  }
  const rows = accts
    .filter((a) => totals.has(a.acctno))
    .map((a) => {
      const t = totals.get(a.acctno)!;
      const net = r2(t.dr - t.cr);
      return {
        acctno: a.acctno,
        acctdesc: a.acctdesc,
        class: accountClass(a.acctno),
        debit: net > 0 ? net : 0,
        credit: net < 0 ? -net : 0,
        movementDr: r2(t.dr),
        movementCr: r2(t.cr),
      };
    });
  return { rows, totalDebit: sum(rows, (r) => r.debit), totalCredit: sum(rows, (r) => r.credit), asOf: opts.asOf };
}

export async function accountLedger(ctx: Ctx, opts: { acctno: string; from: string; to: string; includeUnposted?: boolean }) {
  const acct = await ctx.db.one('acctcharttbl', { acctno: opts.acctno });
  if (!acct) fail('Choose an account.');
  const before = await ledgerLines(ctx.db, { to: prevDay(opts.from), acctno: opts.acctno, includeUnposted: opts.includeUnposted });
  const debitNormal = isDebitNormal(opts.acctno);
  const sign = (dr: number, cr: number) => (debitNormal ? dr - cr : cr - dr);
  let bal = r2(before.reduce((s, l) => s + sign(num(l.dramt), num(l.cramt)), 0));
  const opening = bal;
  const lines = await ledgerLines(ctx.db, { from: opts.from, to: opts.to, acctno: opts.acctno, includeUnposted: opts.includeUnposted });
  const rows = lines.map((l) => {
    bal = r2(bal + sign(num(l.dramt), num(l.cramt)));
    return { transdate: l.transdate, docno: l.docno, tc: l.tc, source: l.jvsource, jvno: l.jvno, ccno: l.ccno, dramt: num(l.dramt), cramt: num(l.cramt), balance: bal, glstatus: l.glstatus };
  });
  return { account: acct, opening, closing: bal, rows };
}

function prevDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function financialStatements(ctx: Ctx, opts: { year: number; month: number; includeUnposted?: boolean }) {
  const asOf = monthEnd(opts.year, opts.month);
  const yearStart = monthStart(opts.year, 1);
  const monthFrom = monthStart(opts.year, opts.month);
  const accts = await ctx.db.all('acctcharttbl', { orderBy: [['acctno', 'asc']] });
  const all = await ledgerLines(ctx.db, { to: asOf, includeUnposted: opts.includeUnposted });
  const bal = (filter: (l: Row) => boolean) => {
    const m = new Map<string, number>();
    for (const l of all.filter(filter)) m.set(l.acctno, r2((m.get(l.acctno) ?? 0) + num(l.dramt) - num(l.cramt)));
    return m;
  };
  const cumulative = bal(() => true);
  const ytd = bal((l) => String(l.transdate) >= yearStart);
  const mtd = bal((l) => String(l.transdate) >= monthFrom);
  const name = (a: string) => accts.find((x) => x.acctno === a)?.acctdesc ?? a;

  const section = (cls: AccountClass[], source: Map<string, number>, creditPositive: boolean) =>
    [...source.entries()]
      .filter(([a, v]) => cls.includes(accountClass(a)) && Math.abs(v) >= 0.005)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([a, v]) => ({ acctno: a, acctdesc: name(a), amount: r2(creditPositive ? -v : v) }));

  // Income statement: month and year to date.
  const isFor = (src: Map<string, number>) => {
    const revenue = section(['Revenue'], src, true);
    const cos = section(['Cost of Sales'], src, false);
    const expenses = section(['Expense'], src, false);
    const otherIncome = section(['Other Income'], src, true);
    const otherExpense = section(['Other Expense'], src, false);
    const totalRevenue = sum(revenue, (r) => r.amount);
    const totalCos = sum(cos, (r) => r.amount);
    const gross = r2(totalRevenue - totalCos);
    const totalExpenses = sum(expenses, (r) => r.amount);
    const operating = r2(gross - totalExpenses);
    const net = r2(operating + sum(otherIncome, (r) => r.amount) - sum(otherExpense, (r) => r.amount));
    return { revenue, cos, expenses, otherIncome, otherExpense, totalRevenue, totalCos, gross, totalExpenses, operating, net };
  };
  const incomeMonth = isFor(mtd);
  const incomeYtd = isFor(ytd);

  // Balance sheet: profit of prior years is closed into retained earnings; current-year profit shown separately.
  const priorProfit = r2(
    [...cumulative.entries()]
      .filter(([a]) => ['Revenue', 'Cost of Sales', 'Expense', 'Other Income', 'Other Expense'].includes(accountClass(a)))
      .reduce((s, [a, v]) => s + v, 0) * -1 - incomeYtd.net
  );
  const assets = section(['Asset'], cumulative, false);
  const liabilities = section(['Liability'], cumulative, true);
  const equity = section(['Equity'], cumulative, true);
  if (Math.abs(priorProfit) >= 0.005) equity.push({ acctno: '', acctdesc: 'Profit of prior years (not yet closed)', amount: priorProfit });
  equity.push({ acctno: '', acctdesc: 'Net income, year to date', amount: incomeYtd.net });
  const totalAssets = sum(assets, (r) => r.amount);
  const totalLiabilities = sum(liabilities, (r) => r.amount);
  const totalEquity = sum(equity, (r) => r.amount);
  return {
    asOf,
    period: `${monthName(opts.month)} ${opts.year}`,
    balanceSheet: { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, balanced: Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01 },
    incomeMonth,
    incomeYtd,
  };
}

export const glActions = { ACTION };
