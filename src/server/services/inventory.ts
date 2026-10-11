import type { Db, Row, Where } from '../db';
import { ACTION, FORM, TC } from '@/shared/codes';
import { addDays, today } from '@/shared/dates';
import { fmtQty, r2, r4, sum } from '@/shared/money';
import { Ctx, assertOpenPeriod, audit, fail, need, nextDocNo, num, numberLines, requireRight, str, yearPrefix } from './context';
import { ActionDef, DocService, Loaded, STD, countBy, filterList, registerDoc } from './docs';
import { GL, GlEntry, reverseGl, writeGl } from './gl';

// ===========================================================================
// Stock engine. Stock is never stored as a running total: it is derived from the
// posted legacy documents, so the figures always agree with what legacy screens show.
//   IN  : invhdrtbl / invdettbl (receiving, transfer receipts, production receipts)
//   OUT : isshdrtbl / issdettbl (deliveries, transfers, production issues, scrapping)
//   ADJ : invadjhdrtbl / invadjdettbl (physical count variances)
// ===========================================================================
export interface Movement {
  date: string;
  order: number;
  plntno: string;
  codeno: string;
  lotno: string;
  qty: number; // + in, - out
  uc: number; // unit cost for receipts; cost per unit for issues once valued
  kind: 'IN' | 'OUT' | 'ADJ';
  tc: string;
  mov: string;
  docno: string;
  party: string;
  expdate?: string;
  labstat?: string;
}

const LAB_OK = ['passed', 'n/a', ''];

async function movements(db: Db, f: { plntno?: string; codeno?: string; asOf?: string } = {}): Promise<Movement[]> {
  const out: Movement[] = [];
  const plantWhere: Where = f.plntno ? { plntno: f.plntno } : {};
  const codeWhere: Where = f.codeno ? { codeno: f.codeno } : {};

  const inH = await db.all('invhdrtbl', { where: { status: 'Posted', ...plantWhere } });
  const inMap = new Map(inH.map((h) => [String(h.docno), h]));
  if (inH.length) {
    const inD = await db.all('invdettbl', { where: { ...plantWhere, ...codeWhere } });
    for (const d of inD) {
      const h = inMap.get(String(d.mmrrno));
      if (!h) continue;
      out.push({
        date: str(h.transdate),
        order: 0,
        plntno: str(h.plntno),
        codeno: str(d.codeno),
        lotno: str(d.lotno),
        qty: num(d.qty),
        uc: num(d.uc),
        kind: 'IN',
        tc: str(h.tc),
        mov: str(h.mov),
        docno: str(h.docno),
        party: str(h.venno || h.custno || h.bafrom),
        expdate: str(d.expdate),
        labstat: str(h.labstat),
      });
    }
  }

  const adjH = await db.all('invadjhdrtbl', { where: plantWhere });
  const adjMap = new Map(adjH.map((h) => [String(h.dono), h]));
  if (adjH.length) {
    const adjD = await db.all('invadjdettbl', { where: codeWhere });
    for (const d of adjD) {
      const h = adjMap.get(String(d.dono));
      if (!h) continue;
      const variance = r4(num(d.qty) - num(d.stdqty));
      if (variance === 0) continue;
      out.push({ date: str(h.transdate), order: 1, plntno: str(h.plntno), codeno: str(d.codeno), lotno: str(d.lotno), qty: variance, uc: 0, kind: 'ADJ', tc: str(h.tc), mov: variance > 0 ? '701' : '702', docno: str(h.dono), party: 'Physical count' });
    }
  }

  const outH = await db.all('isshdrtbl', { where: { status: 'Posted', ...plantWhere } });
  const outMap = new Map(outH.map((h) => [String(h.dono), h]));
  if (outH.length) {
    const outD = await db.all('issdettbl', { where: codeWhere });
    for (const d of outD) {
      const h = outMap.get(String(d.dono));
      if (!h) continue;
      out.push({ date: str(h.transdate), order: 2, plntno: str(h.plntno), codeno: str(d.codeno), lotno: str(d.lotno), qty: -num(d.qty), uc: 0, kind: 'OUT', tc: str(h.tc), mov: str(h.mov), docno: str(h.dono), party: str(h.custno || h.plntdest) });
    }
  }

  const filtered = f.asOf ? out.filter((m) => m.date <= f.asOf!) : out;
  return filtered.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order || a.docno.localeCompare(b.docno));
}

export interface LotBalance {
  lotno: string;
  qty: number;
  labstat: string;
  expdate: string;
  received: string;
}

export interface StockBalance {
  plntno: string;
  codeno: string;
  onhand: number;
  labHold: number;
  rejected: number;
  available: number;
  avgCost: number;
  value: number;
  lots: LotBalance[];
}

/** Replays movements to get on-hand, lot balances and moving-average cost per plant + material. */
export async function balances(db: Db, f: { plntno?: string; codeno?: string; asOf?: string } = {}): Promise<Map<string, StockBalance>> {
  const mvs = await movements(db, f);
  const map = new Map<string, StockBalance & { lotMap: Map<string, LotBalance> }>();
  for (const m of mvs) {
    const key = `${m.plntno}|${m.codeno}`;
    let b = map.get(key);
    if (!b) {
      b = { plntno: m.plntno, codeno: m.codeno, onhand: 0, labHold: 0, rejected: 0, available: 0, avgCost: 0, value: 0, lots: [], lotMap: new Map() };
      map.set(key, b);
    }
    if (m.kind === 'IN' && m.qty > 0) {
      const newQty = b.onhand + m.qty;
      b.avgCost = newQty > 0 ? r4((b.onhand * b.avgCost + m.qty * m.uc) / newQty) : m.uc;
    }
    b.onhand = r4(b.onhand + m.qty);
    let lot = b.lotMap.get(m.lotno);
    if (!lot) {
      lot = { lotno: m.lotno, qty: 0, labstat: m.labstat ?? '', expdate: m.expdate ?? '', received: m.date };
      b.lotMap.set(m.lotno, lot);
    }
    if (m.kind === 'IN' && (m.tc === TC.RECEIVING || m.tc === TC.PROD_RECEIPT)) lot.labstat = m.labstat ?? lot.labstat;
    lot.qty = r4(lot.qty + m.qty);
  }
  const result = new Map<string, StockBalance>();
  for (const [k, b] of map) {
    const lots = [...b.lotMap.values()].filter((l) => Math.abs(l.qty) > 0.0001);
    const hold = lots.filter((l) => l.labstat.toLowerCase() === 'pending').reduce((s, l) => s + l.qty, 0);
    const rej = lots.filter((l) => l.labstat.toLowerCase() === 'rejected').reduce((s, l) => s + l.qty, 0);
    result.set(k, {
      plntno: b.plntno,
      codeno: b.codeno,
      onhand: r4(b.onhand),
      labHold: r4(hold),
      rejected: r4(rej),
      available: r4(b.onhand - hold - rej),
      avgCost: b.avgCost,
      value: r2(b.onhand * b.avgCost),
      lots: lots.sort((a, b2) => (a.expdate || '9999').localeCompare(b2.expdate || '9999') || a.received.localeCompare(b2.received)),
    });
  }
  return result;
}

export async function balanceOf(db: Db, plntno: string, codeno: string): Promise<StockBalance> {
  const b = (await balances(db, { plntno, codeno })).get(`${plntno}|${codeno}`);
  return b ?? { plntno, codeno, onhand: 0, labHold: 0, rejected: 0, available: 0, avgCost: 0, value: 0, lots: [] };
}

/** First-expiry-first-out lot picking over lots that passed (or need no) lab inspection. */
export function pickLots(b: StockBalance, qty: number, lotno?: string): { allocations: { lotno: string; qty: number }[]; short: number } {
  const usable = b.lots.filter((l) => l.qty > 0 && LAB_OK.includes(l.labstat.toLowerCase()) && (!lotno || l.lotno === lotno));
  const allocations: { lotno: string; qty: number }[] = [];
  let left = r4(qty);
  for (const l of usable) {
    if (left <= 0) break;
    const take = Math.min(l.qty, left);
    allocations.push({ lotno: l.lotno, qty: r4(take) });
    left = r4(left - take);
  }
  return { allocations, short: left > 0 ? left : 0 };
}

async function material(db: Db, codeno: string): Promise<Row> {
  const m = await db.one('mmasttbl', { codeno });
  if (!m) fail(`Material ${codeno} is not in the material master.`);
  return m;
}

async function plant(db: Db, plntno: string): Promise<Row> {
  const p = await db.one('plnttbl', { plntno });
  if (!p) fail(`Plant ${plntno} does not exist.`);
  if (String(p.status ?? 'Active').toLowerCase() === 'inactive') fail(`Plant ${plntno} is inactive.`);
  return p;
}

function inventoryAccount(p: Row, m: Row): string {
  if (m.mmtype === 'FG') return str(p.fginv) || GL.INV_FG;
  if (m.mmtype === 'PM') return GL.INV_PACKAGING;
  return str(p.rminv) || GL.INV_RAW;
}

async function nextLot(db: Db, date: string): Promise<string> {
  const base = `L${date.slice(2, 4)}${date.slice(5, 7)}${date.slice(8, 10)}`;
  const used = await db.all('invdettbl', { where: { lotno: { like: base } } });
  let n = 0;
  for (const u of used) n = Math.max(n, Number(String(u.lotno).slice(base.length)) || 0);
  return `${base}${String(n + 1).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Purchase order balances, shared with purchasing.ts
// ---------------------------------------------------------------------------
export async function receivedQtyByPo(db: Db, pono: string): Promise<Map<string, number>> {
  const heads = await db.all('invhdrtbl', { where: { pono, status: 'Posted', tc: TC.RECEIVING } });
  const out = new Map<string, number>();
  for (const h of heads) {
    const lines = await db.all('invdettbl', { where: { mmrrno: h.docno } });
    for (const l of lines) out.set(str(l.codeno), r4((out.get(str(l.codeno)) ?? 0) + num(l.qty)));
  }
  return out;
}

export async function refreshPoServed(db: Db, pono: string): Promise<void> {
  if (!pono) return;
  const lines = await db.all('podettbl', { where: { pono } });
  if (!lines.length) return;
  const got = await receivedQtyByPo(db, pono);
  const ordered = new Map<string, number>();
  for (const l of lines) ordered.set(str(l.codeno), (ordered.get(str(l.codeno)) ?? 0) + num(l.qty));
  let anyReceived = false;
  let all = true;
  for (const [code, q] of ordered) {
    const r = got.get(code) ?? 0;
    if (r > 0) anyReceived = true;
    if (r + 0.0001 < q) all = false;
  }
  await db.update('pohdrtbl', { pono }, { servstat: all ? 'Served' : anyReceived ? 'Partial' : 'Unserved', dateupdate: today() });
}

// ===========================================================================
// Receiving (MMRR.aspx, form 050, tc 10)
// ===========================================================================
const receivingService: DocService = {
  type: 'mmrr',
  title: 'Receiving Report',
  form: FORM.RECEIVING,
  tc: TC.RECEIVING,
  table: 'invhdrtbl',
  noColumn: 'docno',

  async list(ctx, params) {
    const heads = await ctx.db.all('invhdrtbl', { where: { tc: TC.RECEIVING }, orderBy: [['transdate', 'desc'], ['docno', 'desc']] });
    const vens = await ctx.db.all('venmasttbl');
    const rows = heads.map((h) => ({ ...h, no: h.docno, party: vens.find((v) => v.venno === h.venno)?.venname ?? h.venno, amount: num(h.netamt) }));
    return { rows: filterList(rows, params, ['docno', 'party', 'pono', 'formno', 'remarks', 'plntno']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('invhdrtbl', { docno: no, tc: TC.RECEIVING });
    if (!h) return null;
    return { h, lines: await ctx.db.all('invdettbl', { where: { mmrrno: no }, orderBy: [['itemno', 'asc']] }) };
  },

  async view(ctx, { h, lines }) {
    const mats = await ctx.db.all('mmasttbl');
    const ven = await ctx.db.one('venmasttbl', { venno: h.venno });
    const pl = await ctx.db.one('plnttbl', { plntno: h.plntno });
    const vp = await ctx.db.one('exphdrtbl', { mmrrno: h.docno, status: { ne: 'Void' } });
    const links = [] as { label: string; type: string; no: string }[];
    if (h.pono) links.push({ label: `Purchase order ${h.pono}`, type: 'po', no: h.pono });
    if (vp) links.push({ label: `Voucher payable ${vp.docno}`, type: 'vp', no: vp.docno });
    return {
      no: h.docno,
      status: h.status,
      title: `Receiving Report ${h.docno}`,
      subtitle: `${ven?.venname ?? h.venno} → ${pl?.plntname ?? h.plntno}`,
      header: { ...h, venname: ven?.venname, plntname: pl?.plntname },
      lines: lines.map((l) => {
        const m = mats.find((x) => x.codeno === l.codeno);
        return { ...l, mmdesc: m?.mmdesc, um: m?.um };
      }),
      totals: [
        { label: 'Total quantity', value: sum(lines, (l) => num(l.qty)), kind: 'qty' },
        { label: 'Total cost', value: sum(lines, (l) => num(l.itmamt)), strong: true },
      ],
      info: [
        { label: 'Lab status', value: h.labstat || 'Not inspected yet' },
        { label: 'Vendor delivery receipt', value: h.formno || '—' },
      ],
      links,
      editable: h.status === 'Open',
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open')
      defs.push({ ...STD.post(undefined, 'Post receipt'), hint: 'Adds the stock to the plant, sends raw materials to lab inspection and books inventory against goods received not invoiced.' }, STD.void());
    if (h.status === 'Posted') defs.push(STD.void('Removes the stock and reverses the accounting entry. Not allowed once the stock was used or vouchered.'));
    return defs;
  },

  async perform(ctx, { h, lines }, action) {
    if (action === 'post') {
      await assertOpenPeriod(ctx.db, h.transdate, TC.RECEIVING);
      const p = await plant(ctx.db, h.plntno);
      const entries: GlEntry[] = [];
      let needsLab = false;
      for (const l of lines) {
        const m = await material(ctx.db, l.codeno);
        if (m.mmtype === 'RM') needsLab = true;
        entries.push({ acctno: inventoryAccount(p, m), ccno: p.ccno, dramt: num(l.itmamt) });
      }
      entries.push({ acctno: GL.GRNI, cramt: sum(lines, (l) => num(l.itmamt)) });
      await ctx.db.update('invhdrtbl', { docno: h.docno, tc: TC.RECEIVING }, { status: 'Posted', labstat: needsLab ? 'Pending' : 'N/A', updateby: ctx.user });
      await writeGl(ctx, { tc: TC.RECEIVING, docno: h.docno, transdate: h.transdate, source: 'MMRR' }, entries);
      await refreshPoServed(ctx.db, h.pono);
      return needsLab
        ? `Receipt ${h.docno} posted. Raw materials are on lab hold until Lab Monitoring passes them.`
        : `Receipt ${h.docno} posted and the stock is available.`;
    }
    if (action === 'void') {
      if (h.status === 'Posted') {
        const vp = await ctx.db.one('exphdrtbl', { mmrrno: h.docno, status: { ne: 'Void' } });
        if (vp) fail(`Receipt ${h.docno} is already on voucher ${vp.docno}. Void the voucher first.`);
        for (const l of lines) {
          const b = await balanceOf(ctx.db, h.plntno, l.codeno);
          const lot = b.lots.find((x) => x.lotno === l.lotno);
          if (!lot || lot.qty + 0.0001 < num(l.qty)) fail(`Lot ${l.lotno} of ${l.codeno} has already been used, so this receipt cannot be voided.`);
        }
        await reverseGl(ctx, TC.RECEIVING, h.docno, today());
      }
      await ctx.db.update('invhdrtbl', { docno: h.docno, tc: TC.RECEIVING }, { status: 'Void', updateby: ctx.user });
      await refreshPoServed(ctx.db, h.pono);
      return `Receipt ${h.docno} voided.`;
    }
    fail('Unknown action');
  },

  async defaults(ctx) {
    const plants = await ctx.db.all('plnttbl', { where: { status: 'Active' }, limit: 1 });
    return { transdate: today(), plntno: plants[0]?.plntno ?? '', lines: [{}] };
  },

  async sources(ctx, source) {
    if (source !== 'po') return [];
    const pos = await ctx.db.all('pohdrtbl', { where: { status: 'Approved', servstat: { in: ['Unserved', 'Partial'] } }, orderBy: [['transdate', 'asc']] });
    const vens = await ctx.db.all('venmasttbl');
    return pos.map((p) => ({ no: p.pono, date: p.transdate, party: vens.find((v) => v.venno === p.venno)?.venname ?? p.venno, amount: num(p.totamt), note: `${p.servstat} · ${p.plntno}` }));
  },

  async prefill(ctx, source, pono) {
    if (source !== 'po') fail('Unknown source');
    const po = await ctx.db.one('pohdrtbl', { pono });
    if (!po || po.status !== 'Approved') fail(`PO ${pono} is not approved.`);
    const lines = await ctx.db.all('podettbl', { where: { pono }, orderBy: [['itemno', 'asc']] });
    const got = await receivedQtyByPo(ctx.db, pono);
    const out: Row[] = [];
    for (const l of lines) {
      const remaining = r4(num(l.qty) - (got.get(str(l.codeno)) ?? 0));
      got.set(str(l.codeno), Math.max(0, (got.get(str(l.codeno)) ?? 0) - num(l.qty)));
      if (remaining > 0) out.push({ codeno: l.codeno, qty: remaining, uc: num(l.uc), lotno: '', expdate: addDays(today(), 365) });
    }
    if (!out.length) fail(`Everything on PO ${pono} has been received.`);
    return { transdate: today(), plntno: po.plntno, venno: po.venno, pono, remarks: `Received against PO ${pono}`, lines: out };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the receiving date.');
    await assertOpenPeriod(ctx.db, transdate, TC.RECEIVING);
    const plntno = need(str(input.plntno), 'Choose the receiving plant / warehouse.');
    await plant(ctx.db, plntno);
    const venno = need(str(input.venno), 'Choose the vendor.');
    const ven = await ctx.db.one('venmasttbl', { venno });
    if (!ven) fail(`Vendor ${venno} does not exist.`);
    const pono = str(input.pono);
    let poLines: Row[] = [];
    let received = new Map<string, number>();
    if (pono) {
      const po = await ctx.db.one('pohdrtbl', { pono });
      if (!po || po.status !== 'Approved') fail(`PO ${pono} is not an approved purchase order.`);
      if (po.venno !== venno) fail(`PO ${pono} belongs to another vendor.`);
      poLines = await ctx.db.all('podettbl', { where: { pono } });
      received = await receivedQtyByPo(ctx.db, pono);
    } else if (String(ven.poreq).toUpperCase() === 'Y') {
      fail(`${ven.venname} requires a purchase order. Use "Create from PO".`);
    }
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.codeno) || num(l.qty));
    if (!raw.length) fail('Add at least one material.');
    const lines: Row[] = [];
    for (const [i, l] of raw.entries()) {
      const codeno = need(str(l.codeno), `Line ${i + 1}: choose a material.`);
      const m = await material(ctx.db, codeno);
      const qty = r4(num(l.qty));
      if (qty <= 0) fail(`Line ${i + 1}: quantity must be more than zero.`);
      const uc = r4(num(l.uc));
      if (uc < 0) fail(`Line ${i + 1}: unit cost cannot be negative.`);
      if (pono) {
        const ordered = poLines.filter((p) => p.codeno === codeno).reduce((s, p) => s + num(p.qty), 0);
        if (!ordered) fail(`Line ${i + 1}: ${m.mmdesc} is not on PO ${pono}.`);
        const already = received.get(codeno) ?? 0;
        const thisDoc = lines.filter((x) => x.codeno === codeno).reduce((s, x) => s + x.qty, 0);
        if (already + thisDoc + qty > ordered + 0.0001) {
          fail(`Line ${i + 1}: only ${fmtQty(ordered - already - thisDoc)} ${m.um} of ${m.mmdesc} is still open on PO ${pono}.`);
        }
      }
      lines.push({ codeno, qty, uc, wt: r4(qty * (num(m.wtfr) || 1)), itmamt: r2(qty * uc), lotno: str(l.lotno), expdate: str(l.expdate) || null });
    }
    let docno = str(input.no);
    if (docno) {
      const h = await ctx.db.one('invhdrtbl', { docno, tc: TC.RECEIVING });
      if (!h) fail(`Receipt ${docno} was not found.`);
      if (h.status !== 'Open') fail(`Receipt ${docno} is ${h.status} and can no longer be edited.`);
      await ctx.db.remove('invdettbl', { mmrrno: docno });
    } else {
      docno = await nextDocNo(ctx.db, 'invhdrtbl', 'docno', yearPrefix('RR', transdate));
    }
    for (const l of lines) if (!l.lotno) l.lotno = await nextLot(ctx.db, transdate);
    const header = {
      docno,
      mmrrno: docno,
      tc: TC.RECEIVING,
      mov: '101',
      transdate,
      plntno,
      venno,
      pono,
      formno: str(input.formno),
      remarks: str(input.remarks),
      status: 'Open',
      labstat: '',
      netamt: sum(lines, (l) => l.itmamt),
      qty: sum(lines, (l) => l.qty),
      twt: sum(lines, (l) => l.wt),
      user: ctx.user,
      updateby: ctx.user,
      branch: 'MAIN',
    };
    if (str(input.no)) await ctx.db.update('invhdrtbl', { docno, tc: TC.RECEIVING }, header);
    else await ctx.db.insert('invhdrtbl', header);
    for (const l of numberLines(lines)) {
      await ctx.db.insert('invdettbl', { mmrrno: docno, ...l, plntno, pono, transdate, user: ctx.user, transid: `${docno}-${l.itemno}` });
    }
    return { no: docno };
  },
};
registerDoc(receivingService);

// ===========================================================================
// Issuance / delivery orders (DeliveryOrder.aspx, form 007, tc 53)
// ===========================================================================
export const MOV = { SALES: '201', PRODUCTION: '261', TRANSFER: '311', SCRAP: '551' } as const;

export async function soRemaining(db: Db, sono: string): Promise<Map<string, number>> {
  const lines = await db.all('sodettbl', { where: { sono } });
  const out = new Map<string, number>();
  for (const l of lines) out.set(str(l.codeno), r4((out.get(str(l.codeno)) ?? 0) + num(l.qty) - num(l.issqty)));
  return out;
}

async function applyToSo(db: Db, sono: string, codeno: string, qty: number) {
  let left = qty;
  const lines = await db.all('sodettbl', { where: { sono, codeno }, orderBy: [['itmno', 'asc']] });
  for (const l of lines) {
    if (Math.abs(left) < 0.0001) break;
    const open = num(l.qty) - num(l.issqty);
    const take = left > 0 ? Math.min(open, left) : Math.max(-num(l.issqty), left);
    const issqty = r4(num(l.issqty) + take);
    await db.update('sodettbl', { sono, itmno: l.itmno }, { issqty, qtbal: r4(num(l.qty) - issqty), issdate: today() });
    left = r4(left - take);
  }
  const all = await db.all('sodettbl', { where: { sono } });
  const totalOpen = all.reduce((s, l) => s + (num(l.qty) - num(l.issqty)), 0);
  const anyIssued = all.some((l) => num(l.issqty) > 0);
  await db.update('sohdrtbl', { sono }, { delstat: totalOpen <= 0.0001 ? 'Delivered' : anyIssued ? 'Partial' : 'Undelivered' });
}

const issuanceService: DocService = {
  type: 'do',
  title: 'Delivery Order / Issuance',
  form: FORM.DELIVERY_ORDER,
  tc: TC.DELIVERY,
  table: 'isshdrtbl',
  noColumn: 'dono',

  async list(ctx, params) {
    const heads = await ctx.db.all('isshdrtbl', { orderBy: [['transdate', 'desc'], ['dono', 'desc']] });
    const custs = await ctx.db.all('custmasttbl');
    const movs = await ctx.db.all('movtbl');
    const rows = heads.map((h) => ({
      ...h,
      no: h.dono,
      party: h.custno ? custs.find((c) => c.custno === h.custno)?.bussname ?? h.custno : h.plntdest ? `Transfer to ${h.plntdest}` : '',
      movdesc: movs.find((m) => m.mov === h.mov)?.movdesc ?? h.mov,
      amount: num(h.totqty),
    }));
    return { rows: filterList(rows, params, ['dono', 'party', 'sono', 'invno', 'remarks', 'plntno', 'movdesc']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('isshdrtbl', { dono: no });
    if (!h) return null;
    return { h, lines: await ctx.db.all('issdettbl', { where: { dono: no }, orderBy: [['itmno', 'asc']] }) };
  },

  async view(ctx, { h, lines }) {
    const mats = await ctx.db.all('mmasttbl');
    const cust = h.custno ? await ctx.db.one('custmasttbl', { custno: h.custno }) : null;
    const mov = await ctx.db.one('movtbl', { mov: h.mov });
    const pl = await ctx.db.one('plnttbl', { plntno: h.plntno });
    const checks: { label: string; ok: boolean; detail?: string }[] = [];
    if (h.status === 'Open') {
      const p = await ctx.db.one('plnttbl', { plntno: h.plntno });
      if (String(p?.invset ?? 'Y').toUpperCase() === 'Y') {
        const required = new Map<string, number>();
        for (const l of lines) required.set(l.codeno, (required.get(l.codeno) ?? 0) + num(l.qty));
        for (const [code, q] of required) {
          const b = await balanceOf(ctx.db, h.plntno, code);
          const m = mats.find((x) => x.codeno === code);
          checks.push({
            label: `${m?.mmdesc ?? code}: need ${fmtQty(q)} ${m?.um ?? ''}`,
            ok: b.available + 0.0001 >= q,
            detail: `${fmtQty(b.available)} available${b.labHold ? `, ${fmtQty(b.labHold)} on lab hold` : ''}`,
          });
        }
      }
    }
    const links: { label: string; type: string; no: string }[] = [];
    if (h.sono) links.push({ label: `Sales order ${h.sono}`, type: 'so', no: h.sono });
    if (h.invno) links.push({ label: `Sales invoice ${h.invno}`, type: 'si', no: h.invno });
    if (h.refdoc) links.push({ label: `Transfer receipt ${h.refdoc}`, type: 'stock', no: h.refdoc });
    return {
      no: h.dono,
      status: h.status,
      title: `${mov?.movdesc ?? 'Issuance'} ${h.dono}`,
      subtitle: cust ? `${cust.bussname} · from ${pl?.plntname ?? h.plntno}` : `${pl?.plntname ?? h.plntno}${h.plntdest ? ' → ' + h.plntdest : ''}`,
      header: { ...h, bussname: cust?.bussname, movdesc: mov?.movdesc, plntname: pl?.plntname },
      lines: lines.map((l) => {
        const m = mats.find((x) => x.codeno === l.codeno);
        return { ...l, mmdesc: m?.mmdesc, um: m?.um };
      }),
      totals: [
        { label: 'Total quantity', value: sum(lines, (l) => num(l.qty)), kind: 'qty' },
        ...(h.mov === MOV.SALES ? [{ label: 'Value at selling price', value: sum(lines, (l) => num(l.itmamt)) }] : []),
        ...(h.status === 'Posted' ? [{ label: 'Cost of goods issued', value: sum(lines, (l) => num(l.cosamt)), strong: true }] : []),
      ],
      checks,
      info: [
        { label: 'Movement', value: `${h.mov} · ${mov?.movdesc ?? ''}` },
        ...(h.driver ? [{ label: 'Driver / plate', value: `${h.driver} ${h.plateno ?? ''}` }] : []),
      ],
      links,
      editable: h.status === 'Open',
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open')
      defs.push({ ...STD.post(undefined, 'Post issuance'), hint: 'Picks lots automatically (earliest expiry first), deducts the stock and books the cost.' }, STD.void());
    if (h.status === 'Posted' && !h.invno) defs.push(STD.void('Returns the stock to the plant and reverses the cost entry.'));
    return defs;
  },

  async perform(ctx, { h, lines }, action) {
    const p = await plant(ctx.db, h.plntno);
    if (action === 'post') {
      await assertOpenPeriod(ctx.db, h.transdate, TC.DELIVERY);
      const tracked = String(p.invset ?? 'Y').toUpperCase() === 'Y';
      const allocated: Row[] = [];
      const shortages: string[] = [];
      const needByCode = new Map<string, number>();
      for (const l of lines) needByCode.set(l.codeno, (needByCode.get(l.codeno) ?? 0) + num(l.qty));
      const bal = new Map<string, StockBalance>();
      for (const code of needByCode.keys()) bal.set(code, await balanceOf(ctx.db, h.plntno, code));
      for (const l of lines) {
        const m = await material(ctx.db, l.codeno);
        const b = bal.get(l.codeno)!;
        if (!tracked) {
          allocated.push({ ...l, cosamt: r2(num(l.qty) * b.avgCost) });
          continue;
        }
        const { allocations, short } = pickLots(b, num(l.qty), str(l.lotno) || undefined);
        if (short > 0) {
          shortages.push(`${m.mmdesc}: short by ${fmtQty(short)} ${m.um} (available ${fmtQty(b.available)}${b.labHold ? `, on lab hold ${fmtQty(b.labHold)}` : ''})`);
          continue;
        }
        for (const a of allocations) {
          const lot = b.lots.find((x) => x.lotno === a.lotno)!;
          lot.qty = r4(lot.qty - a.qty); // keep later lines from re-using the same lot
          allocated.push({ ...l, lotno: a.lotno, qty: a.qty, wt: r4(a.qty * (num(m.wtfr) || 1)), itmamt: r2(a.qty * num(l.sp)), cosamt: r2(a.qty * b.avgCost) });
        }
      }
      if (shortages.length) fail(`Not enough stock at ${p.plntname}:\n• ${shortages.join('\n• ')}`);
      await ctx.db.remove('issdettbl', { dono: h.dono });
      for (const l of numberLines(allocated, 'itmno')) {
        const { mmdesc: _d, um: _u, ...clean } = l;
        await ctx.db.insert('issdettbl', { ...clean, dono: h.dono, stat: 'Posted', issby: ctx.user, issdate: h.transdate, issqty: l.qty, isswt: l.wt });
      }
      const cost = sum(allocated, (l) => num(l.cosamt));
      // Accounting by movement type.
      const credits: GlEntry[] = [];
      for (const l of allocated) {
        const m = await material(ctx.db, l.codeno);
        credits.push({ acctno: inventoryAccount(p, m), cramt: num(l.cosamt) });
      }
      if (h.mov === MOV.SALES) {
        await writeGl(ctx, { tc: TC.DELIVERY, docno: h.dono, transdate: h.transdate, source: 'DO' }, [{ acctno: str(p.rmcos) || GL.COST_OF_SALES, ccno: p.ccno, dramt: cost }, ...credits]);
        for (const [code, q] of needByCode) if (h.sono) await applyToSo(ctx.db, h.sono, code, q);
      } else if (h.mov === MOV.PRODUCTION) {
        await writeGl(ctx, { tc: TC.DELIVERY, docno: h.dono, transdate: h.transdate, source: 'PROD' }, [{ acctno: GL.WIP, ccno: p.ccno, dramt: cost }, ...credits]);
      } else if (h.mov === MOV.SCRAP) {
        await writeGl(ctx, { tc: TC.DELIVERY, docno: h.dono, transdate: h.transdate, source: 'SCRAP' }, [{ acctno: GL.SCRAP_LOSS, ccno: p.ccno, dramt: cost }, ...credits]);
      } else if (h.mov === MOV.TRANSFER) {
        const dest = await plant(ctx.db, h.plntdest);
        const trno = await nextDocNo(ctx.db, 'invhdrtbl', 'docno', yearPrefix('TR', h.transdate));
        await ctx.db.insert('invhdrtbl', {
          docno: trno,
          mmrrno: trno,
          tc: TC.TRANSFER_IN,
          mov: MOV.TRANSFER,
          transdate: h.transdate,
          plntno: h.plntdest,
          bafrom: h.plntno,
          remarks: `Transfer from ${p.plntname} (${h.dono})`,
          status: 'Posted',
          labstat: 'Passed',
          netamt: cost,
          qty: sum(allocated, (l) => num(l.qty)),
          user: ctx.user,
          branch: 'MAIN',
        });
        const debits: GlEntry[] = [];
        for (const l of numberLines(allocated)) {
          const m = await material(ctx.db, l.codeno);
          const srcLot = bal.get(l.codeno)?.lots.find((x) => x.lotno === l.lotno);
          await ctx.db.insert('invdettbl', {
            mmrrno: trno,
            itemno: l.itemno,
            codeno: l.codeno,
            lotno: l.lotno,
            qty: l.qty,
            wt: l.wt,
            uc: num(l.qty) ? r4(num(l.cosamt) / num(l.qty)) : 0,
            itmamt: l.cosamt,
            expdate: srcLot?.expdate || null,
            plntno: h.plntdest,
            transdate: h.transdate,
            user: ctx.user,
            transid: `${trno}-${l.itemno}`,
          });
          debits.push({ acctno: inventoryAccount(dest, m), ccno: dest.ccno, dramt: num(l.cosamt) });
        }
        await ctx.db.update('isshdrtbl', { dono: h.dono }, { refdoc: trno });
        await writeGl(ctx, { tc: TC.DELIVERY, docno: h.dono, transdate: h.transdate, source: 'TRANSFER' }, [...debits, ...credits]);
      } else {
        await writeGl(ctx, { tc: TC.DELIVERY, docno: h.dono, transdate: h.transdate, source: 'ISSUE' }, [{ acctno: GL.INVENTORY_VARIANCE, ccno: p.ccno, dramt: cost }, ...credits]);
      }
      await ctx.db.update('isshdrtbl', { dono: h.dono }, {
        status: 'Posted',
        totqty: sum(allocated, (l) => num(l.qty)),
        totwt: sum(allocated, (l) => num(l.wt)),
        checkedby: ctx.user,
        pdate: today(),
      });
      return `Issuance ${h.dono} posted. ${allocated.length} lot line(s) picked automatically.`;
    }
    if (action === 'void') {
      if (h.status === 'Posted') {
        if (h.invno) fail(`Delivery ${h.dono} is billed on invoice ${h.invno}. Void the invoice first.`);
        if (h.mov === MOV.TRANSFER && h.refdoc) {
          for (const l of lines) {
            const b = await balanceOf(ctx.db, h.plntdest, l.codeno);
            const lot = b.lots.find((x) => x.lotno === l.lotno);
            if (!lot || lot.qty + 0.0001 < num(l.qty)) fail(`Lot ${l.lotno} was already used at ${h.plntdest}; the transfer cannot be voided.`);
          }
          await ctx.db.update('invhdrtbl', { docno: h.refdoc }, { status: 'Void' });
        }
        await reverseGl(ctx, TC.DELIVERY, h.dono, today());
        if (h.sono && h.mov === MOV.SALES) {
          const byCode = new Map<string, number>();
          for (const l of lines) byCode.set(l.codeno, (byCode.get(l.codeno) ?? 0) + num(l.qty));
          for (const [code, q] of byCode) await applyToSo(ctx.db, h.sono, code, -q);
        }
      }
      await ctx.db.update('isshdrtbl', { dono: h.dono }, { status: 'Void' });
      await ctx.db.update('issdettbl', { dono: h.dono }, { stat: 'Void' });
      return `Issuance ${h.dono} voided.`;
    }
    fail('Unknown action');
  },

  async defaults(ctx) {
    const plants = await ctx.db.all('plnttbl', { where: { status: 'Active' }, limit: 1 });
    return { transdate: today(), mov: MOV.SALES, plntno: plants[0]?.plntno ?? '', lines: [{}] };
  },

  async sources(ctx, source) {
    if (source !== 'so') return [];
    const sos = await ctx.db.all('sohdrtbl', { where: { status: 'Approved', delstat: { in: ['Undelivered', 'Partial'] } }, orderBy: [['deldate', 'asc']] });
    const custs = await ctx.db.all('custmasttbl');
    return sos.map((s) => ({ no: s.sono, date: s.deldate || s.transdate, party: custs.find((c) => c.custno === s.custno)?.bussname ?? s.custno, amount: num(s.soamt), note: `${s.delstat} · deliver from ${s.plntno}` }));
  },

  async prefill(ctx, source, sono) {
    if (source !== 'so') fail('Unknown source');
    const so = await ctx.db.one('sohdrtbl', { sono });
    if (!so || so.status !== 'Approved') fail(`Sales order ${sono} is not approved.`);
    const lines = await ctx.db.all('sodettbl', { where: { sono }, orderBy: [['itmno', 'asc']] });
    const out = lines.filter((l) => num(l.qty) - num(l.issqty) > 0).map((l) => ({ codeno: l.codeno, qty: r4(num(l.qty) - num(l.issqty)), sp: num(l.sp), lotno: '' }));
    if (!out.length) fail(`Sales order ${sono} is fully delivered.`);
    return { transdate: today(), mov: MOV.SALES, plntno: so.plntno, custno: so.custno, shipto: so.shipto, smnno: so.smnno, sono, remarks: `Delivery for SO ${sono}`, lines: out };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the issuance date.');
    await assertOpenPeriod(ctx.db, transdate, TC.DELIVERY);
    const mov = need(str(input.mov), 'Choose the movement type.');
    const mv = await ctx.db.one('movtbl', { mov });
    if (!mv) fail(`Movement type ${mov} does not exist.`);
    const plntno = need(str(input.plntno), 'Choose the issuing plant / warehouse.');
    await plant(ctx.db, plntno);
    const allowedPlants = await ctx.db.all('movplnttbl', { where: { mov } });
    if (allowedPlants.length && !allowedPlants.some((x) => x.plntno === plntno)) fail(`Movement ${mov} is not allowed at plant ${plntno}.`);
    const custno = str(input.custno);
    const sono = str(input.sono);
    const plntdest = str(input.plntdest);
    if (mov === MOV.SALES) {
      need(custno, 'Choose the customer for a sales delivery.');
      if (String(mv.soporeq).toUpperCase() === 'Y' && !sono) fail('A sales delivery needs a sales order. Use "Create from sales order".');
    }
    if (mov === MOV.TRANSFER) {
      need(plntdest, 'Choose the destination plant.');
      if (plntdest === plntno) fail('The destination must be a different plant.');
      await plant(ctx.db, plntdest);
    }
    let soOpen = new Map<string, number>();
    if (sono) {
      const so = await ctx.db.one('sohdrtbl', { sono });
      if (!so || so.status !== 'Approved') fail(`Sales order ${sono} is not approved.`);
      if (so.custno !== custno) fail(`Sales order ${sono} is for another customer.`);
      soOpen = await soRemaining(ctx.db, sono);
    }
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.codeno) || num(l.qty));
    if (!raw.length) fail('Add at least one material.');
    const lines: Row[] = [];
    for (const [i, l] of raw.entries()) {
      const codeno = need(str(l.codeno), `Line ${i + 1}: choose a material.`);
      const m = await material(ctx.db, codeno);
      const qty = r4(num(l.qty));
      if (qty <= 0) fail(`Line ${i + 1}: quantity must be more than zero.`);
      if (sono) {
        const open = soOpen.get(codeno) ?? 0;
        const already = lines.filter((x) => x.codeno === codeno).reduce((s, x) => s + x.qty, 0);
        if (!open && !already) fail(`Line ${i + 1}: ${m.mmdesc} is not open on sales order ${sono}.`);
        if (already + qty > open + 0.0001) fail(`Line ${i + 1}: only ${fmtQty(open - already)} ${m.um} of ${m.mmdesc} is left to deliver on ${sono}.`);
      }
      const sp = r4(num(l.sp));
      lines.push({ codeno, qty, sp, wt: r4(qty * (num(m.wtfr) || 1)), itmamt: r2(qty * sp), lotno: str(l.lotno), sono, mov, transdate, user: ctx.user });
    }
    let dono = str(input.no);
    if (dono) {
      const h = await ctx.db.one('isshdrtbl', { dono });
      if (!h) fail(`Issuance ${dono} was not found.`);
      if (h.status !== 'Open') fail(`Issuance ${dono} is ${h.status} and can no longer be edited.`);
      await ctx.db.remove('issdettbl', { dono });
    } else {
      dono = await nextDocNo(ctx.db, 'isshdrtbl', 'dono', yearPrefix('DO', transdate));
    }
    const header = {
      dono,
      tc: TC.DELIVERY,
      mov,
      ttype: mv.ttype,
      transdate,
      plntno,
      plntdest,
      custno,
      shipto: str(input.shipto),
      sono,
      smnno: str(input.smnno),
      driver: str(input.driver),
      plateno: str(input.plateno),
      remarks: str(input.remarks),
      status: 'Open',
      totqty: sum(lines, (l) => l.qty),
      totwt: sum(lines, (l) => l.wt),
      user: ctx.user,
      ba: ctx.ba,
      branch: 'MAIN',
    };
    if (str(input.no)) await ctx.db.update('isshdrtbl', { dono }, header);
    else await ctx.db.insert('isshdrtbl', header);
    for (const l of numberLines(lines, 'itmno')) await ctx.db.insert('issdettbl', { dono, ...l, stat: 'Open' });
    return { no: dono };
  },
};
registerDoc(issuanceService);

// ===========================================================================
// Physical count / inventory adjustment (form 034, tc 72). Saving posts it.
// ===========================================================================
const adjustmentService: DocService = {
  type: 'adj',
  title: 'Inventory Adjustment',
  form: FORM.INVENTORY_REPORTS,
  tc: TC.ADJUSTMENT,
  table: 'invadjhdrtbl',
  noColumn: 'dono',

  async list(ctx, params) {
    const heads = await ctx.db.all('invadjhdrtbl', { orderBy: [['transdate', 'desc'], ['dono', 'desc']] });
    const det = await ctx.db.all('invadjdettbl');
    const rows = heads.map((h) => {
      const lines = det.filter((d) => d.dono === h.dono);
      return { ...h, no: h.dono, status: 'Posted', party: h.plntno, amount: lines.length, lines: lines.length };
    });
    return { rows: filterList(rows, params, ['dono', 'plntno']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('invadjhdrtbl', { dono: no });
    if (!h) return null;
    return { h: { ...h, status: 'Posted' }, lines: await ctx.db.all('invadjdettbl', { where: { dono: no } }) };
  },

  async view(ctx, { h, lines }) {
    const mats = await ctx.db.all('mmasttbl');
    const gl = await ctx.db.all('gltranstbl', { where: { tc: TC.ADJUSTMENT, docno: h.dono } });
    return {
      no: h.dono,
      status: 'Posted',
      title: `Inventory Adjustment ${h.dono}`,
      subtitle: `Physical count at ${h.plntno}`,
      header: h,
      lines: lines.map((l) => {
        const m = mats.find((x) => x.codeno === l.codeno);
        return { ...l, mmdesc: m?.mmdesc, um: m?.um, variance: r4(num(l.qty) - num(l.stdqty)) };
      }),
      totals: [
        { label: 'Lines counted', value: lines.length, kind: 'qty' },
        { label: 'Value of variance', value: r2(sum(gl, (g) => (g.acctno === GL.INVENTORY_VARIANCE ? num(g.cramt) - num(g.dramt) : 0))), strong: true },
      ],
      editable: false,
    };
  },

  actionDefs() {
    return [];
  },

  async perform() {
    fail('Adjustments are posted when saved.');
  },

  async defaults() {
    return { transdate: today(), lines: [{}] };
  },

  async save(ctx, input) {
    if (str(input.no)) fail('A posted count cannot be edited. Record a new count instead.');
    const transdate = need(str(input.transdate), 'Enter the count date.');
    await assertOpenPeriod(ctx.db, transdate, TC.ADJUSTMENT);
    const plntno = need(str(input.plntno), 'Choose the plant that was counted.');
    const p = await plant(ctx.db, plntno);
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.codeno));
    if (!raw.length) fail('Add at least one counted material.');
    const dono = await nextDocNo(ctx.db, 'invadjhdrtbl', 'dono', yearPrefix('ADJ', transdate));
    const entries: GlEntry[] = [];
    let changed = 0;
    for (const [i, l] of raw.entries()) {
      const m = await material(ctx.db, str(l.codeno));
      const counted = r4(num(l.counted ?? l.qty));
      if (counted < 0) fail(`Line ${i + 1}: the counted quantity cannot be negative.`);
      const b = await balanceOf(ctx.db, plntno, m.codeno);
      const lotno = str(l.lotno) || b.lots[0]?.lotno || (await nextLot(ctx.db, transdate));
      const system = b.lots.find((x) => x.lotno === lotno)?.qty ?? 0;
      const variance = r4(counted - system);
      await ctx.db.insert('invadjdettbl', { dono, codeno: m.codeno, lotno, qty: counted, stdqty: system, wt: r4(counted * (num(m.wtfr) || 1)), stdwt: r4(system * (num(m.wtfr) || 1)), tc: TC.ADJUSTMENT });
      if (variance !== 0) {
        changed++;
        const value = r2(Math.abs(variance) * b.avgCost);
        const acct = inventoryAccount(p, m);
        if (variance > 0) entries.push({ acctno: acct, dramt: value }, { acctno: GL.INVENTORY_VARIANCE, ccno: p.ccno, cramt: value });
        else entries.push({ acctno: GL.INVENTORY_VARIANCE, ccno: p.ccno, dramt: value }, { acctno: acct, cramt: value });
      }
    }
    await ctx.db.insert('invadjhdrtbl', { dono, plntno, transdate, tc: TC.ADJUSTMENT });
    if (entries.length) await writeGl(ctx, { tc: TC.ADJUSTMENT, docno: dono, transdate, source: 'ADJ' }, entries);
    return { no: dono, message: changed ? `Count ${dono} posted: ${changed} variance(s) adjusted.` : `Count ${dono} posted: stock matches the system.` };
  },
};
registerDoc(adjustmentService);

// ===========================================================================
// Lab monitoring (LabMonitoring.aspx, form 087)
// ===========================================================================
export async function labQueue(ctx: Ctx, status = 'Pending') {
  await requireRight(ctx, FORM.LAB_MONITORING, ACTION.VIEW, 'view lab monitoring');
  const heads = await ctx.db.all('invhdrtbl', {
    where: { tc: { in: [TC.RECEIVING, TC.PROD_RECEIPT] }, status: 'Posted', labstat: status === 'all' ? { in: ['Pending', 'Passed', 'Rejected'] } : status },
    orderBy: [['transdate', 'asc']],
  });
  const mats = await ctx.db.all('mmasttbl');
  const vens = await ctx.db.all('venmasttbl');
  const out: Row[] = [];
  for (const h of heads) {
    const lines = await ctx.db.all('invdettbl', { where: { mmrrno: h.docno } });
    for (const l of lines) {
      const m = mats.find((x) => x.codeno === l.codeno);
      out.push({ docno: h.docno, transdate: h.transdate, plntno: h.plntno, source: h.tc === TC.PROD_RECEIPT ? 'Production' : 'Receiving', venname: h.tc === TC.PROD_RECEIPT ? `Production ${h.batchno}` : vens.find((v) => v.venno === h.venno)?.venname ?? h.venno, codeno: l.codeno, mmdesc: m?.mmdesc, lotno: l.lotno, qty: num(l.qty), um: m?.um, labstat: h.labstat, days: Math.max(0, Math.round((Date.parse(today()) - Date.parse(h.transdate)) / 86400000)) });
    }
  }
  return out;
}

export async function setLabStatus(ctx: Ctx, docno: string, result: 'Passed' | 'Rejected', remarks: string): Promise<string> {
  await requireRight(ctx, FORM.LAB_MONITORING, ACTION.EDIT, 'record lab results');
  return ctx.db.tx(async (db) => {
    const h = await db.one('invhdrtbl', { docno, tc: { in: [TC.RECEIVING, TC.PROD_RECEIPT] } });
    if (!h) fail(`Receipt ${docno} was not found.`);
    if (h.labstat !== 'Pending') fail(`Receipt ${docno} is already ${h.labstat}.`);
    await db.update('invhdrtbl', { docno, tc: h.tc }, { labstat: result, disposby: ctx.user, disposdate: today(), remarks: remarks ? `${h.remarks ?? ''} [Lab: ${remarks}]`.trim() : h.remarks });
    await audit({ ...ctx, db }, { form: FORM.LAB_MONITORING, tc: TC.RECEIVING, docno, trans: `Lab ${result}${remarks ? ': ' + remarks : ''}`, table: 'invhdrtbl' });
    return result === 'Passed' ? `Lots on ${docno} passed and are now available.` : `Lots on ${docno} were rejected and stay blocked from use.`;
  });
}

// ===========================================================================
// Inventory reports (InventoryReports.aspx / MMReports.aspx, form 034)
// ===========================================================================
export async function stockReport(ctx: Ctx, f: { plntno?: string; q?: string; alertsOnly?: boolean; mmtype?: string }) {
  await requireRight(ctx, FORM.INVENTORY_REPORTS, ACTION.VIEW, 'view inventory');
  const [plants, mats] = await Promise.all([ctx.db.all('plnttbl', { orderBy: [['plntno', 'asc']] }), ctx.db.all('mmasttbl')]);
  const bal = await balances(ctx.db, { plntno: f.plntno || undefined });
  let rows = [...bal.values()].map((b) => {
    const m = mats.find((x) => x.codeno === b.codeno);
    const p = plants.find((x) => x.plntno === b.plntno);
    const reorder = num(m?.invlevel);
    return {
      ...b,
      mmdesc: m?.mmdesc ?? b.codeno,
      mmtype: m?.mmtype ?? '',
      um: m?.um ?? '',
      plntname: p?.plntname ?? b.plntno,
      reorder,
      alert: reorder > 0 && b.available < reorder && !(m?.mmtype === 'FG' && p?.prodnplnt === 'Y') ? 'Below reorder level' : b.labHold > 0 ? 'Lab hold' : '',
      nearExpiry: b.lots.filter((l) => l.expdate && l.qty > 0 && l.expdate <= addDays(today(), 60)).length,
    };
  });
  if (f.mmtype) rows = rows.filter((r) => r.mmtype === f.mmtype);
  if (f.q) {
    const q = f.q.toLowerCase();
    rows = rows.filter((r) => `${r.codeno} ${r.mmdesc} ${r.plntname}`.toLowerCase().includes(q));
  }
  if (f.alertsOnly) rows = rows.filter((r) => r.alert || r.nearExpiry);
  rows.sort((a, b) => a.plntno.localeCompare(b.plntno) || a.codeno.localeCompare(b.codeno));
  const byPlant = plants.map((p) => {
    const pr = rows.filter((r) => r.plntno === p.plntno);
    return { plntno: p.plntno, plntname: p.plntname, invset: p.invset, items: pr.filter((r) => r.onhand > 0).length, value: sum(pr, (r) => r.value), alerts: pr.filter((r) => r.alert).length };
  });
  return { rows, byPlant, totalValue: sum(rows, (r) => r.value) };
}

export async function stockCard(ctx: Ctx, f: { plntno: string; codeno: string; from?: string; to?: string }) {
  await requireRight(ctx, FORM.INVENTORY_REPORTS, ACTION.VIEW, 'view stock cards');
  need(f.plntno, 'Choose a plant.');
  need(f.codeno, 'Choose a material.');
  const m = await material(ctx.db, f.codeno);
  const mvs = await movements(ctx.db, { plntno: f.plntno, codeno: f.codeno, asOf: f.to });
  let bal = 0;
  let opening = 0;
  const rows: Row[] = [];
  for (const mv of mvs) {
    if (f.from && mv.date < f.from) {
      opening = r4(opening + mv.qty);
      bal = opening;
      continue;
    }
    bal = r4(bal + mv.qty);
    rows.push({ date: mv.date, docno: mv.docno, kind: mv.kind, mov: mv.mov, tc: mv.tc, lotno: mv.lotno, party: mv.party, qtyIn: mv.qty > 0 ? mv.qty : 0, qtyOut: mv.qty < 0 ? -mv.qty : 0, balance: bal });
  }
  const b = await balanceOf(ctx.db, f.plntno, f.codeno);
  return { material: { codeno: m.codeno, mmdesc: m.mmdesc, um: m.um }, opening, closing: bal, rows, lots: b.lots, avgCost: b.avgCost };
}

export async function mmRegister(ctx: Ctx, f: { from: string; to: string; kind: 'receipts' | 'issues' }) {
  await requireRight(ctx, FORM.INVENTORY_REPORTS, ACTION.VIEW, 'view registers');
  const mats = await ctx.db.all('mmasttbl');
  if (f.kind === 'receipts') {
    const heads = await ctx.db.all('invhdrtbl', { where: { status: 'Posted', transdate: { gte: f.from, lte: f.to } }, orderBy: [['transdate', 'asc']] });
    const rows: Row[] = [];
    for (const h of heads) {
      for (const l of await ctx.db.all('invdettbl', { where: { mmrrno: h.docno } })) {
        rows.push({ transdate: h.transdate, docno: h.docno, tc: h.tc, plntno: h.plntno, party: h.venno || h.bafrom, codeno: l.codeno, mmdesc: mats.find((m) => m.codeno === l.codeno)?.mmdesc, lotno: l.lotno, qty: num(l.qty), amount: num(l.itmamt) });
      }
    }
    return { rows, total: sum(rows, (r) => r.amount) };
  }
  const heads = await ctx.db.all('isshdrtbl', { where: { status: 'Posted', transdate: { gte: f.from, lte: f.to } }, orderBy: [['transdate', 'asc']] });
  const rows: Row[] = [];
  for (const h of heads) {
    for (const l of await ctx.db.all('issdettbl', { where: { dono: h.dono } })) {
      rows.push({ transdate: h.transdate, docno: h.dono, mov: h.mov, plntno: h.plntno, party: h.custno || h.plntdest, codeno: l.codeno, mmdesc: mats.find((m) => m.codeno === l.codeno)?.mmdesc, lotno: l.lotno, qty: num(l.qty), amount: num(l.cosamt) });
    }
  }
  return { rows, total: sum(rows, (r) => r.amount) };
}

export async function availability(ctx: Ctx, plntno: string, codeno: string) {
  const b = await balanceOf(ctx.db, plntno, codeno);
  return { onhand: b.onhand, available: b.available, labHold: b.labHold, avgCost: b.avgCost, lots: b.lots.filter((l) => l.qty > 0) };
}

export { movements };
