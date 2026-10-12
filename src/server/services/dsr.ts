// Daily Sales Report for van / event sales (legacy DailySalesReport.aspx, form 095).
//
// One DSR per van salesman (smnmtbl smntype 'Event') per day, in dsrnotbl:
//   AM stock (amstocktbl)  + loads (isshdrtbl mov 603)  - sales (saleshdrtbl tc 84 cash / 85 charge)
//   - returns (wrrhdrtbl tc 88, mov 409)  = expected PM stock, checked against the PM count (pmstocktbl).
// Closing posts the invoices, the cost of what was sold and any shortage (shrinkreporttbl), then
// carries the PM count forward as the next day's AM stock, as the legacy closing does.
import type { Db, Row } from '../db';
import { ACTION, FORM, TC } from '@/shared/codes';
import { nowStamp, today } from '@/shared/dates';
import { fmtPeso, fmtQty, r2, r4, sum } from '@/shared/money';
import { Ctx, assertOpenPeriod, audit, fail, isAllowed, need, nextDocNo, num, requireRight, str, yearPrefix } from './context';
import { docService } from './docs';
import { GL, GlEntry, writeGl } from './gl';
import { MOV, balances, inventoryAccount, material, plant, vanUnitCosts } from './inventory';
import { invoiceLine } from './sales';

const OPEN = 'OPEN';
const DONE = 'COMPLETED';
const INV_TYPES: Record<string, { label: string; prefix: string }> = {
  [TC.EVENT_CASH_INVOICE]: { label: 'Cash sales invoice (ETCSI)', prefix: 'ETCSI' },
  [TC.EVENT_CHARGE_INVOICE]: { label: 'Charge invoice (ETCI)', prefix: 'ETCI' },
};

export async function vanSalesmen(db: Db): Promise<Row[]> {
  return (await db.all('smnmtbl', { orderBy: [['fullname', 'asc']] })).filter((s) => String(s.smntype ?? '').toLowerCase() === 'event' && String(s.status ?? 'Active').toLowerCase() === 'active');
}

async function dsrOf(db: Db, dsrno: string): Promise<Row> {
  const d = await db.one('dsrnotbl', { dsrno });
  if (!d) fail(`Daily sales report ${dsrno} was not found.`);
  return d;
}

function mustBeOpen(d: Row) {
  if (String(d.status).toUpperCase() !== OPEN) fail(`Daily sales report ${d.dsrno} is closed.`);
}

/** Average cost of a material on the salesman's van: the cost of everything ever loaded. */
async function vanCosts(db: Db, smnno: string): Promise<Map<string, number>> {
  const all = await vanUnitCosts(db);
  const out = new Map<string, number>();
  for (const [k, uc] of all) if (k.startsWith(`${smnno}|`)) out.set(k.slice(smnno.length + 1), uc);
  return out;
}

/** Everything about one DSR: stock movements per material and the documents behind them. */
export async function dsrState(db: Db, dsrno: string) {
  const d = await dsrOf(db, dsrno);
  const mats = await db.all('mmasttbl');
  const mat = (c: string) => mats.find((m) => m.codeno === c);
  // Opening (AM) stock: the snapshot taken when Cloud AOS opened the report, else the van's current AM stock.
  const snap = await db.all('ng_dsr_amstock', { where: { dsrno } });
  const am = snap.length || String(d.status).toUpperCase() !== OPEN ? snap : await db.all('amstocktbl', { where: { smnno: d.smnno } });
  const loads = await db.all('isshdrtbl', { where: { mov: MOV.VAN_LOAD, dsrno }, orderBy: [['dono', 'asc']] });
  const loadLines = await db.all('issdettbl', { where: { dono: { in: loads.map((l) => l.dono) } } });
  const invoices = await db.all('saleshdrtbl', { where: { dsrno, tc: { in: Object.keys(INV_TYPES) } }, orderBy: [['invno', 'asc']] });
  const invLines = await db.all('salesdettbl', { where: { invno: { in: invoices.map((i) => i.invno) } } });
  const returns = await db.all('wrrhdrtbl', { where: { dsrno, tc: TC.RETURN_IN }, orderBy: [['wrrno', 'asc']] });
  const retLines = await db.all('wrrdettbl', { where: { wrrno: { in: returns.map((r) => r.wrrno) } } });
  const count = await db.all('pmstocktbl', { where: { dsrno }, orderBy: [['itmno', 'asc']] });
  const costs = await vanCosts(db, d.smnno);

  const live = (h: Row) => String(h.status ?? '').toLowerCase() !== 'void';
  const liveInv = new Set(invoices.filter(live).map((i) => i.invno));
  const postedLoads = new Set(loads.filter((l) => l.status === 'Posted').map((l) => l.dono));
  const codes = new Set<string>([...am.map((r) => r.codeno), ...loadLines.map((r) => r.codeno), ...invLines.map((r) => r.codeno), ...retLines.map((r) => r.codeno), ...count.map((r) => r.codeno)]);
  const recon = [...codes].map((codeno) => {
    const amQty = r4(sum(am.filter((r) => r.codeno === codeno), (r) => num(r.qty)));
    const loaded = r4(sum(loadLines.filter((r) => r.codeno === codeno && postedLoads.has(r.dono)), (r) => num(r.qty)));
    const sold = r4(sum(invLines.filter((r) => r.codeno === codeno && liveInv.has(r.invno)), (r) => num(r.qty)));
    const returned = r4(sum(retLines.filter((r) => r.codeno === codeno), (r) => num(r.qty)));
    const expected = r4(amQty + loaded - sold - returned);
    const c = count.find((r) => r.codeno === codeno);
    const counted = c ? num(c.qty) : null;
    const variance = counted === null ? null : r4(counted - expected);
    const uc = costs.get(codeno) ?? 0;
    return { codeno, mmdesc: mat(codeno)?.mmdesc ?? codeno, um: mat(codeno)?.um ?? '', sp: num(mat(codeno)?.sp), am: amQty, loaded, sold, returned, expected, counted, variance, uc, varamt: variance === null ? 0 : r2(variance * uc) };
  });
  recon.sort((a, b) => a.mmdesc.localeCompare(b.mmdesc));
  return { d, recon, loads, loadLines, invoices, invLines, returns, retLines, count, costs };
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------
export async function dsrList(ctx: Ctx, f: { status?: string } = {}) {
  await requireRight(ctx, FORM.EVENT_SALES, ACTION.VIEW, 'view daily sales reports');
  const rows = await ctx.db.all('dsrnotbl', { orderBy: [['transdate', 'desc'], ['dsrno', 'desc']] });
  const smn = await ctx.db.all('smnmtbl');
  const sales = await ctx.db.all('saleshdrtbl', { where: { dsrno: { in: rows.map((r) => r.dsrno) }, status: { ne: 'Void' } } });
  const out = rows
    .filter((r) => !f.status || f.status === 'all' || String(r.status).toUpperCase() === f.status.toUpperCase())
    .map((r): Row => {
      const s = sales.filter((x) => x.dsrno === r.dsrno);
      return {
        ...r,
        salesman: smn.find((x) => x.smnno === r.smnno)?.fullname ?? r.smnno,
        cash: r2(sum(s.filter((x) => x.tc === TC.EVENT_CASH_INVOICE), (x) => num(x.netamt))),
        charge: r2(sum(s.filter((x) => x.tc === TC.EVENT_CHARGE_INVOICE), (x) => num(x.netamt))),
        total: r2(sum(s, (x) => num(x.netamt))),
        invoices: s.length,
      };
    });
  return {
    rows: out,
    salesmen: (await vanSalesmen(ctx.db)).map((s) => ({ smnno: s.smnno, fullname: s.fullname, open: rows.find((r) => r.smnno === s.smnno && String(r.status).toUpperCase() === OPEN)?.dsrno ?? '' })),
    canCreate: await isAllowed(ctx.db, ctx.group, FORM.EVENT_SALES, ACTION.INSERT),
  };
}

export async function openDsr(ctx: Ctx, input: { smnno?: unknown; transdate?: unknown }): Promise<string> {
  await requireRight(ctx, FORM.EVENT_SALES, ACTION.INSERT, 'open a daily sales report');
  const smnno = need(str(input.smnno), 'Choose the van salesman.');
  const transdate = need(str(input.transdate), 'Enter the date of the report.');
  await assertOpenPeriod(ctx.db, transdate, TC.EVENT_CASH_INVOICE);
  const s = (await vanSalesmen(ctx.db)).find((x) => x.smnno === smnno);
  if (!s) fail(`${smnno} is not an active van salesman.`);
  const mine = await ctx.db.all('dsrnotbl', { where: { smnno } });
  const open = mine.find((r) => String(r.status).toUpperCase() === OPEN);
  if (open) fail(`${s.fullname} still has an open report, ${open.dsrno}. Close it first.`);
  const last = mine.map((r) => String(r.transdate)).sort().pop();
  if (last && transdate <= last) fail(`${s.fullname}'s last report is dated ${last}; the new one must be later.`);
  return ctx.db.tx(async (db) => {
    const dsrno = await nextDocNo(db, 'dsrnotbl', 'dsrno', yearPrefix('DSR', transdate));
    await db.insert('dsrnotbl', { dsrno, smnno, transdate, status: OPEN, tc84amt: 0, tc85amt: 0, exceprep: '', custno: str(s.custno), branch: 'MAIN', user: ctx.user });
    // Keep the opening van stock with the report, so a closed report still shows its AM stock.
    for (const r of await db.all('amstocktbl', { where: { smnno } })) await db.insert('ng_dsr_amstock', { dsrno, smnno, codeno: r.codeno, qty: num(r.qty), wt: num(r.wt) });
    await audit({ ...ctx, db }, { form: FORM.EVENT_SALES, docno: dsrno, trans: `Open DSR for ${s.fullname}`, table: 'dsrnotbl' });
    return dsrno;
  });
}

export async function dsrDetail(ctx: Ctx, dsrno: string) {
  await requireRight(ctx, FORM.EVENT_SALES, ACTION.VIEW, 'view daily sales reports');
  const st = await dsrState(ctx.db, dsrno);
  const smn = await ctx.db.one('smnmtbl', { smnno: st.d.smnno });
  const custs = await ctx.db.all('custmasttbl');
  const cname = (c: unknown) => custs.find((x) => x.custno === c)?.bussname ?? String(c ?? '');
  const plants = await ctx.db.all('plnttbl', { orderBy: [['plntno', 'asc']] });
  const pname = (p: unknown) => plants.find((x) => x.plntno === p)?.plntname ?? String(p ?? '');
  const liveInv = st.invoices.filter((i) => i.status !== 'Void');
  const cashInv = liveInv.filter((i) => i.tc === TC.EVENT_CASH_INVOICE);
  const remitted = r2(sum(await ctx.db.all('coldettbl', { where: { invno: { in: cashInv.map((i) => i.invno) }, status: 'Posted' } }), (c) => num(c.oramt) + num(c.ewt)));
  const canRelease = await isAllowed(ctx.db, ctx.group, FORM.EVENT_SALES, ACTION.RELEASE);
  const canEdit = await isAllowed(ctx.db, ctx.group, FORM.EVENT_SALES, ACTION.INSERT);
  const open = String(st.d.status).toUpperCase() === OPEN;
  return {
    header: { ...st.d, salesman: smn?.fullname ?? st.d.smnno, walkin: smn?.custno ?? '', walkinName: cname(smn?.custno), areano: smn?.areano ?? '' } as Row,
    open,
    canEdit: open && canEdit,
    canClose: open && canRelease,
    recon: st.recon,
    loads: st.loads.map((l): Row => ({ ...l, plntname: pname(l.plntno), lines: st.loadLines.filter((x) => x.dono === l.dono).map((x) => ({ codeno: x.codeno, mmdesc: st.recon.find((r) => r.codeno === x.codeno)?.mmdesc ?? x.codeno, qty: num(x.qty), cost: num(x.cosamt) })) })),
    invoices: st.invoices.map((i): Row => ({ ...i, type: INV_TYPES[i.tc]?.label ?? i.tc, customer: cname(i.custno), netamt: num(i.netamt), lines: st.invLines.filter((x) => x.invno === i.invno).map((x) => ({ codeno: x.codeno, mmdesc: x.mmdesc, qty: num(x.qty), sp: num(x.sp), itmamt: num(x.itmamt) })) })),
    returns: st.returns.map((r): Row => ({ ...r, plntname: pname(r.plntno), lines: st.retLines.filter((x) => x.wrrno === r.wrrno).map((x) => ({ codeno: x.codeno, mmdesc: st.recon.find((q) => q.codeno === x.codeno)?.mmdesc ?? x.codeno, qty: num(x.qty) })) })),
    counted: st.count.length > 0,
    totals: {
      cash: r2(sum(cashInv, (i) => num(i.netamt))),
      charge: r2(sum(liveInv.filter((i) => i.tc === TC.EVENT_CHARGE_INVOICE), (i) => num(i.netamt))),
      remitted,
      toRemit: r2(sum(cashInv, (i) => num(i.netamt)) - remitted),
      loadedValue: r2(sum(st.loadLines.filter((l) => st.loads.some((h) => h.dono === l.dono && h.status === 'Posted')), (l) => num(l.cosamt))),
      shortage: r2(sum(st.recon.filter((r) => (r.variance ?? 0) < 0), (r) => -r.varamt)),
      overage: r2(sum(st.recon.filter((r) => (r.variance ?? 0) > 0), (r) => r.varamt)),
    },
    plants: plants.filter((p) => String(p.status ?? 'Active').toLowerCase() !== 'inactive').map((p) => ({ value: p.plntno, label: `${p.plntname} (${p.plntno})` })),
  };
}

// ---------------------------------------------------------------------------
// Movements of the day
// ---------------------------------------------------------------------------
function cleanLines(raw: unknown): { codeno: string; qty: number; sp: number }[] {
  const lines = ((raw as Row[]) ?? []).filter((l) => str(l.codeno) && num(l.qty)).map((l) => ({ codeno: str(l.codeno), qty: r4(num(l.qty)), sp: r4(num(l.sp)) }));
  if (!lines.length) fail('Add at least one product with a quantity.');
  if (lines.some((l) => l.qty <= 0)) fail('Quantities must be more than zero.');
  return lines;
}

/** Load the van from a plant: an issuance with movement 603 that is posted at once. */
export async function loadVan(ctx: Ctx, dsrno: string, input: { plntno?: unknown; lines?: unknown }): Promise<string> {
  await requireRight(ctx, FORM.EVENT_SALES, ACTION.INSERT, 'load the van');
  const d = await dsrOf(ctx.db, dsrno);
  mustBeOpen(d);
  const plntno = need(str(input.plntno), 'Choose the plant the stock comes from.');
  const lines = cleanLines(input.lines);
  const svc = docService('do');
  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    const { no } = await svc.save(c, { transdate: d.transdate, mov: MOV.VAN_LOAD, plntno, smnno: d.smnno, remarks: `Van load for ${dsrno}`, lines: lines.map((l) => ({ codeno: l.codeno, qty: l.qty })) });
    await db.update('isshdrtbl', { dono: no }, { dsrno });
    const loaded = (await svc.load(c, no))!;
    await svc.perform(c, loaded, 'post', {});
    return `Loaded ${lines.length} product(s) on the van (issuance ${no}).`;
  });
}

/** A cash (84) or charge (85) invoice issued from the van. */
export async function dsrInvoice(ctx: Ctx, dsrno: string, input: { tc?: unknown; custno?: unknown; refno?: unknown; lines?: unknown }): Promise<string> {
  await requireRight(ctx, FORM.EVENT_SALES, ACTION.INSERT, 'issue van invoices');
  const d = await dsrOf(ctx.db, dsrno);
  mustBeOpen(d);
  const tc = str(input.tc) || TC.EVENT_CASH_INVOICE;
  if (!INV_TYPES[tc]) fail('Choose a cash sales invoice or a charge invoice.');
  const smn = await ctx.db.one('smnmtbl', { smnno: d.smnno });
  const custno = tc === TC.EVENT_CASH_INVOICE ? str(input.custno) || str(smn?.custno) : need(str(input.custno), 'A charge invoice needs the customer.');
  if (!custno) fail('Choose the customer.');
  const cust = await ctx.db.one('custmasttbl', { custno });
  if (!cust) fail(`Customer ${custno} does not exist.`);
  if (tc === TC.EVENT_CHARGE_INVOICE && custno === smn?.custno) fail('Charge invoices are for a named customer, not the walk-in account.');
  const raw = cleanLines(input.lines);
  const st = await dsrState(ctx.db, dsrno);
  const lines: Row[] = [];
  for (const [i, l] of raw.entries()) {
    const m = await material(ctx.db, l.codeno);
    const onVan = st.recon.find((r) => r.codeno === l.codeno)?.expected ?? 0;
    const already = sum(lines.filter((x) => x.codeno === l.codeno), (x) => x.qty);
    if (already + l.qty > onVan + 0.0001) fail(`Line ${i + 1}: only ${fmtQty(onVan - already)} ${m.um} of ${m.mmdesc} is left on the van.`);
    const sp = l.sp || num(m.sp);
    if (sp <= 0) fail(`Line ${i + 1}: enter the selling price of ${m.mmdesc}.`);
    const vatable = String(m.vat ?? 'Y').toUpperCase() !== 'N' && cust.vat !== 'ZERO';
    lines.push({ codeno: m.codeno, mmdesc: m.mmdesc, mmgrp: m.mmgrp, wt: r4(l.qty * (num(m.wtfr) || 1)), ...invoiceLine({ qty: l.qty, sp }, vatable), pc: str(m.pc), status: 'Open', dsrno, transdate: d.transdate, user: ctx.user });
  }
  return ctx.db.tx(async (db) => {
    const invno = await nextDocNo(db, 'saleshdrtbl', 'invno', yearPrefix(INV_TYPES[tc].prefix, d.transdate));
    const pc = str(lines[0].pc);
    await db.insert('saleshdrtbl', {
      invno,
      docno: invno,
      tc,
      dsrno,
      transdate: d.transdate,
      custno,
      smnno: d.smnno,
      shipto: str(cust.address),
      pc,
      remarks: `${INV_TYPES[tc].label}, ${dsrno}${str(input.refno) ? ` · ${str(input.refno)}` : ''}`,
      grossamt: sum(lines, (l) => l.detgrossamt),
      discamt: sum(lines, (l) => l.detdiscamt),
      vat: sum(lines, (l) => l.detvat),
      netamt: sum(lines, (l) => l.itmamt),
      status: 'Open',
      glstat: 'Open',
      user: ctx.user,
      branch: 'MAIN',
      web: 'Y',
    });
    let itemno = 0;
    for (const l of lines) await db.insert('salesdettbl', { invno, itemno: ++itemno, ...l, transid: `${invno}-${itemno}` });
    return `${INV_TYPES[tc].label} ${invno} for ${fmtPeso(sum(lines, (l) => l.itmamt))}.`;
  });
}

export async function voidDsrInvoice(ctx: Ctx, dsrno: string, invno: string): Promise<string> {
  await requireRight(ctx, FORM.EVENT_SALES, ACTION.DELETE, 'void van invoices');
  const d = await dsrOf(ctx.db, dsrno);
  mustBeOpen(d);
  const h = await ctx.db.one('saleshdrtbl', { invno, dsrno });
  if (!h) fail(`Invoice ${invno} is not on ${dsrno}.`);
  if (h.status !== 'Open') fail(`Invoice ${invno} is ${h.status}.`);
  await ctx.db.update('saleshdrtbl', { invno, dsrno }, { status: 'Void' });
  await ctx.db.update('salesdettbl', { invno }, { status: 'Void' });
  return `Invoice ${invno} voided; its products are back on the van.`;
}

/** Unsold stock returned from the van to a plant (wrrhdrtbl tc 88, mov 409). */
export async function returnFromVan(ctx: Ctx, dsrno: string, input: { plntno?: unknown; lines?: unknown }): Promise<string> {
  await requireRight(ctx, FORM.EVENT_SALES, ACTION.INSERT, 'return van stock');
  const d = await dsrOf(ctx.db, dsrno);
  mustBeOpen(d);
  const p = await plant(ctx.db, need(str(input.plntno), 'Choose the plant receiving the stock.'));
  const raw = cleanLines(input.lines);
  const st = await dsrState(ctx.db, dsrno);
  for (const [i, l] of raw.entries()) {
    const onVan = st.recon.find((r) => r.codeno === l.codeno)?.expected ?? 0;
    const already = sum(raw.slice(0, i).filter((x) => x.codeno === l.codeno), (x) => x.qty);
    if (already + l.qty > onVan + 0.0001) fail(`Line ${i + 1}: only ${fmtQty(onVan - already)} is on the van.`);
  }
  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    const wrrno = await nextDocNo(db, 'wrrhdrtbl', 'wrrno', yearPrefix('WRR', d.transdate));
    const debits: GlEntry[] = [];
    let total = 0;
    let itemno = 0;
    for (const l of raw) {
      const m = await material(db, l.codeno);
      const uc = st.costs.get(l.codeno) ?? 0;
      const value = r2(l.qty * uc);
      total = r2(total + value);
      await db.insert('wrrdettbl', { wrrno, transid: `${wrrno}-${++itemno}`, codeno: l.codeno, qty: l.qty, wt: r4(l.qty * (num(m.wtfr) || 1)), lotno: `RET-${wrrno}`, transdate: d.transdate, dsrno, user: ctx.user });
      debits.push({ acctno: inventoryAccount(p, m), ccno: p.ccno, dramt: value });
    }
    await db.insert('wrrhdrtbl', { wrrno, tc: TC.RETURN_IN, mov: MOV.VAN_RETURN, dsrno, smnno: d.smnno, plntno: p.plntno, transdate: d.transdate, totqty: sum(raw, (l) => l.qty), totwt: 0, status: 'Posted' });
    if (total) await writeGl(c, { tc: TC.RETURN_IN, docno: wrrno, transdate: d.transdate, source: 'VANRET' }, [...debits, { acctno: GL.VAN_INVENTORY, cramt: total }]);
    return `Returned ${raw.length} product(s) to ${p.plntname} (${wrrno}).`;
  });
}

/** The evening (PM) count of what is still on the van. */
export async function saveCount(ctx: Ctx, dsrno: string, input: { lines?: unknown }): Promise<string> {
  await requireRight(ctx, FORM.EVENT_SALES, ACTION.INSERT, 'count the van stock');
  const d = await dsrOf(ctx.db, dsrno);
  mustBeOpen(d);
  const lines = ((input.lines as Row[]) ?? []).filter((l) => str(l.codeno)).map((l) => ({ codeno: str(l.codeno), qty: r4(num(l.qty)) }));
  if (lines.some((l) => l.qty < 0)) fail('Counted quantities cannot be negative.');
  return ctx.db.tx(async (db) => {
    await db.remove('pmstocktbl', { dsrno });
    let itmno = 0;
    for (const l of lines) {
      const m = await material(db, l.codeno);
      await db.insert('pmstocktbl', { dsrno, smnno: d.smnno, itmno: ++itmno, codeno: l.codeno, qty: l.qty, wt: r4(l.qty * (num(m.wtfr) || 1)), user: ctx.user, transdate: d.transdate });
    }
    return `PM count saved for ${lines.length} product(s).`;
  });
}

/** Closes the day: posts the invoices, cost of sales and shortages, and carries the count forward. */
export async function closeDsr(ctx: Ctx, dsrno: string, input: { note?: unknown } = {}): Promise<string> {
  await requireRight(ctx, FORM.EVENT_SALES, ACTION.RELEASE, 'close daily sales reports');
  const d = await dsrOf(ctx.db, dsrno);
  mustBeOpen(d);
  await assertOpenPeriod(ctx.db, d.transdate, TC.EVENT_CASH_INVOICE);
  const st = await dsrState(ctx.db, dsrno);
  if (!st.count.length && st.recon.some((r) => r.expected !== 0)) fail('Save the PM count of the van before closing.');
  const missing = st.recon.filter((r) => r.counted === null && r.expected !== 0);
  if (missing.length) fail(`Count these products too: ${missing.map((r) => r.mmdesc).join(', ')}.`);
  const big = st.recon.filter((r) => (r.variance ?? 0) !== 0);
  const note = str(input.note);
  if (big.length && !note) fail(`The count differs from the expected stock for ${big.length} product(s). Explain the difference before closing.`);

  return ctx.db.tx(async (db) => {
    const c = { ...ctx, db };
    // 1. Invoices: receivable, sales, output VAT.
    const open = st.invoices.filter((i) => i.status === 'Open');
    for (const h of open) {
      const lines = st.invLines.filter((l) => l.invno === h.invno);
      const pc = h.pc ? await db.one('pctrtbl', { pc: h.pc }) : null;
      const entries: GlEntry[] = [{ acctno: str(pc?.aracctno) || GL.AR_TRADE, pc: h.pc, dramt: num(h.netamt) }];
      for (const l of lines) {
        const m = await db.one('mmasttbl', { codeno: l.codeno });
        entries.push({ acctno: str(m?.glacct) || GL.SALES, pc: h.pc, cramt: r2(num(l.itmamt) - num(l.detvat)) });
      }
      if (num(h.vat)) entries.push({ acctno: GL.OUTPUT_VAT, cramt: num(h.vat) });
      await writeGl(c, { tc: h.tc, docno: h.invno, transdate: h.transdate, source: 'DSR' }, entries);
      await db.update('saleshdrtbl', { invno: h.invno, tc: h.tc }, { status: 'Posted', glstat: 'Posted', postdate: today(), arflag: 'Y', arflagdate: today(), arflaguser: ctx.user });
      await db.update('salesdettbl', { invno: h.invno }, { status: 'Posted' });
    }
    // 2. Cost of what was sold and the count difference, out of the van inventory.
    const cos = r2(sum(st.recon, (r) => r.sold * r.uc));
    const shrink = r2(sum(st.recon, (r) => -(r.variance ?? 0) * r.uc));
    const entries: GlEntry[] = [];
    if (cos) entries.push({ acctno: GL.COST_OF_SALES, ccno: 'SLS', dramt: cos });
    if (shrink > 0) entries.push({ acctno: GL.INVENTORY_VARIANCE, ccno: 'SLS', dramt: shrink });
    if (shrink < 0) entries.push({ acctno: GL.INVENTORY_VARIANCE, ccno: 'SLS', cramt: -shrink });
    const vanOut = r2(cos + shrink);
    if (vanOut > 0) entries.push({ acctno: GL.VAN_INVENTORY, cramt: vanOut });
    if (vanOut < 0) entries.push({ acctno: GL.VAN_INVENTORY, dramt: -vanOut });
    if (entries.length) await writeGl(c, { tc: TC.EVENT_CASH_INVOICE, docno: dsrno, transdate: d.transdate, source: 'DSR-COS' }, entries);
    // 3. Shrinkage report and the next day's AM stock.
    // Legacy shrinkage report row: AM stock, loads (DOs), sales, returns (WRR), available, PM count, variance.
    for (const r of big) await db.insert('shrinkreporttbl', { dsrno, smnno: d.smnno, transdate: d.transdate, codeno: r.codeno, description: r.mmdesc, amstock: r.am, doqty: r.loaded, sales: r.sold, wrr: r.returned, availablestck: r.expected, pmstock: r.counted, varqty: r.variance, shrinkage: -r.varamt, pcnt: r.expected ? r2((-(r.variance ?? 0) / r.expected) * 100) : 0, user: ctx.user });
    await db.remove('amstocktbl', { smnno: d.smnno });
    let itmno = 0;
    for (const r of st.recon) if ((r.counted ?? 0) > 0) await db.insert('amstocktbl', { smnno: d.smnno, itmno: ++itmno, codeno: r.codeno, qty: r.counted, wt: num(st.count.find((x) => x.codeno === r.codeno)?.wt), dsrno, transdate: d.transdate, user: ctx.user });
    const cash = r2(sum(st.invoices.filter((i) => i.status !== 'Void' && i.tc === TC.EVENT_CASH_INVOICE), (i) => num(i.netamt)));
    const charge = r2(sum(st.invoices.filter((i) => i.status !== 'Void' && i.tc === TC.EVENT_CHARGE_INVOICE), (i) => num(i.netamt)));
    await db.update('dsrnotbl', { dsrno }, { status: DONE, tc84amt: cash, tc85amt: charge, exceprep: note });
    await audit(c, { form: FORM.EVENT_SALES, docno: dsrno, trans: `Close DSR (${open.length} invoice(s), shortage ${fmtPeso(Math.max(0, shrink))})`, table: 'dsrnotbl' });
    return `${dsrno} closed: ${open.length} invoice(s) posted for ${fmtPeso(cash + charge)}${shrink > 0 ? `, shortage of ${fmtPeso(shrink)} booked` : ''}. The count is the van's stock for the next report.`;
  });
}

/** Stock the plants would show for a material, used to suggest what to load. */
export async function plantStock(ctx: Ctx, plntno: string) {
  await requireRight(ctx, FORM.EVENT_SALES, ACTION.VIEW, 'view daily sales reports');
  const b = await balances(ctx.db, { plntno });
  const mats = await ctx.db.all('mmasttbl', { where: { mmtype: 'FG' } });
  return mats.map((m) => ({ codeno: m.codeno, mmdesc: m.mmdesc, um: m.um, sp: num(m.sp), available: r4(b.get(`${plntno}|${m.codeno}`)?.available ?? 0) })).filter((m) => m.available > 0);
}
