import type { Row } from '../db';
import { ACTION, FORM, INVOICE_TCS, TC } from '@/shared/codes';
import { addDays, today } from '@/shared/dates';
import { fmtPeso, fmtQty, r2, r4, sum } from '@/shared/money';
import { Ctx, assertOpenPeriod, fail, need, nextDocNo, num, requireRight, str, yearPrefix } from './context';
import { ActionDef, DocService, STD, countBy, filterList, registerDoc, docService } from './docs';
import { GL, reverseGl, writeGl } from './gl';
import { MOV, balanceOf } from './inventory';

const APPLIED_CONVERSION = '5200100';

/**
 * Production worksheet (ProdWorkSheet.aspx form 033; costing ProductionCosting.aspx form 040).
 * One worksheet consumes raw materials (an issuance with movement 261) and produces one
 * finished-goods lot (a production receipt, tc 30). Its cost per unit is calculated automatically.
 *   wipdettbl rows  : source INPUT / OUTPUT lines, keyed by wipno
 *   lotnotbl        : the finished-goods lot (id = wipno)
 *   cosdettbl/coshdrtbl : the resulting lot cost
 */
const prodService: DocService = {
  type: 'prod',
  title: 'Production Worksheet',
  form: FORM.PROD_WORKSHEET,
  tc: TC.PROD_RECEIPT,
  table: 'lotnotbl',
  noColumn: 'id',

  async list(ctx, params) {
    const lots = await ctx.db.all('lotnotbl', { where: { prodtype: 'Production' }, orderBy: [['transdate', 'desc'], ['id', 'desc']] });
    const mats = await ctx.db.all('mmasttbl');
    const outputs = await ctx.db.all('wipdettbl', { where: { source: 'OUTPUT' } });
    const rows = lots.map((l) => {
      const o = outputs.find((x) => x.wipno === l.id);
      return { ...l, no: l.id, party: mats.find((m) => m.codeno === l.codeno)?.mmdesc ?? l.codeno, amount: num(o?.qty), plntno: o?.plntno };
    });
    return { rows: filterList(rows, params, ['id', 'party', 'lotno', 'plntno']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('lotnotbl', { id: no, prodtype: 'Production' });
    if (!h) return null;
    const lines = await ctx.db.all('wipdettbl', { where: { wipno: no }, orderBy: [['itmno', 'asc']] });
    const out = lines.find((l) => l.source === 'OUTPUT') ?? {};
    return { h: { ...h, plntno: out.plntno, qty: num(out.qty), remarks: out.remarks, dono: out.dono }, lines: lines.filter((l) => l.source === 'INPUT') };
  },

  async view(ctx, { h, lines }) {
    const mats = await ctx.db.all('mmasttbl');
    const fg = mats.find((m) => m.codeno === h.codeno);
    const cost = await ctx.db.one('cosdettbl', { cosno: h.id });
    const checks: { label: string; ok: boolean; detail?: string }[] = [];
    if (h.status === 'Open') {
      for (const l of lines) {
        const b = await balanceOf(ctx.db, h.plntno, l.codeno);
        const m = mats.find((x) => x.codeno === l.codeno);
        checks.push({ label: `${m?.mmdesc ?? l.codeno}: need ${fmtQty(num(l.qty))} ${m?.um ?? ''}`, ok: b.available + 0.0001 >= num(l.qty), detail: `${fmtQty(b.available)} available` });
      }
    }
    return {
      no: h.id,
      status: h.status,
      title: `Production ${h.id}`,
      subtitle: `${fmtQty(num(h.qty))} ${fg?.um ?? ''} of ${fg?.mmdesc ?? h.codeno} · lot ${h.lotno}`,
      header: { ...h, mmdesc: fg?.mmdesc, um: fg?.um },
      lines: lines.map((l) => ({ ...l, mmdesc: mats.find((m) => m.codeno === l.codeno)?.mmdesc, um: mats.find((m) => m.codeno === l.codeno)?.um })),
      totals: cost
        ? [
            { label: 'Materials', value: num(cost.matlcost) },
            { label: 'Direct labor', value: num(cost.dlcost) },
            { label: 'Overhead', value: num(cost.ohcost) },
            { label: 'Total cost of the lot', value: num(cost.totcost), strong: true },
            { label: 'Cost per unit', value: num(cost.avecost), strong: true },
          ]
        : [{ label: 'Input quantity', value: sum(lines, (l) => num(l.qty)), kind: 'qty' }],
      checks,
      info: [
        { label: 'Plant', value: h.plntno },
        { label: 'Expiry of lot', value: h.expirydate || '—' },
        { label: 'Batches', value: String(num(h.noofbatch) || 1) },
      ],
      links: h.dono ? [{ label: `Material issuance ${h.dono}`, type: 'do', no: h.dono }] : [],
      editable: h.status === 'Open',
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open')
      defs.push({
        ...STD.post(undefined, 'Complete production'),
        hint: 'Issues the raw materials (earliest expiry first), receives the finished lot for QA and computes its cost per unit.',
        input: [
          { key: 'dlcost', label: 'Direct labor for this run (₱)', type: 'number', default: 0 },
          { key: 'ohcost', label: 'Overhead for this run (₱)', type: 'number', default: 0 },
        ],
      }, STD.void());
    if (h.status === 'Posted') defs.push(STD.void('Reverses the receipt and the material issuance. Not allowed once the lot was used or sold.'));
    return defs;
  },

  async perform(ctx, { h, lines }, action, payload) {
    if (action === 'post') {
      await assertOpenPeriod(ctx.db, h.transdate, TC.PROD_RECEIPT);
      const plant = await ctx.db.one('plnttbl', { plntno: h.plntno });
      if (!plant) fail(`Plant ${h.plntno} does not exist.`);
      // 1) Issue the inputs through the regular issuance logic (lot picking, stock checks, WIP entry).
      const doSvc = docService('do');
      const saved = await doSvc.save(ctx, {
        transdate: h.transdate,
        mov: MOV.PRODUCTION,
        plntno: h.plntno,
        remarks: `Materials for production ${h.id} (lot ${h.lotno})`,
        lines: lines.map((l) => ({ codeno: l.codeno, qty: num(l.qty) })),
      });
      const loaded = await doSvc.load(ctx, saved.no);
      await doSvc.perform(ctx, loaded!, 'post', {});
      await ctx.db.update('isshdrtbl', { dono: saved.no }, { refdoc: h.id, produce: h.codeno, lotno: h.lotno });
      const issued = await ctx.db.all('issdettbl', { where: { dono: saved.no } });
      const matl = sum(issued, (l) => num(l.cosamt));
      const dl = r2(num(payload.dlcost));
      const oh = r2(num(payload.ohcost));
      if (dl < 0 || oh < 0) fail('Labor and overhead cannot be negative.');
      const total = r2(matl + dl + oh);
      const qty = num(h.qty);
      const uc = qty ? r4(total / qty) : 0;
      // 2) Receive the finished lot.
      const rcpt = await nextDocNo(ctx.db, 'invhdrtbl', 'docno', yearPrefix('PR', h.transdate));
      await ctx.db.insert('invhdrtbl', {
        docno: rcpt,
        mmrrno: rcpt,
        tc: TC.PROD_RECEIPT,
        mov: '101',
        transdate: h.transdate,
        plntno: h.plntno,
        codeno: h.codeno,
        lotno: h.lotno,
        qty,
        uc,
        netamt: total,
        remarks: `Output of production ${h.id}`,
        status: 'Posted',
        labstat: 'Pending',
        mfgdate: h.transdate,
        batchno: h.id,
        user: ctx.user,
        branch: 'MAIN',
      });
      const fg = await ctx.db.one('mmasttbl', { codeno: h.codeno });
      await ctx.db.insert('invdettbl', { mmrrno: rcpt, itemno: 1, codeno: h.codeno, lotno: h.lotno, qty, wt: r4(qty * (num(fg?.wtfr) || 1)), uc, itmamt: total, expdate: h.expirydate || null, plntno: h.plntno, transdate: h.transdate, user: ctx.user, transid: `${rcpt}-1` });
      const entries = [
        { acctno: str(plant.fginv) || GL.INV_FG, ccno: plant.ccno, dramt: total },
        { acctno: GL.WIP, ccno: plant.ccno, cramt: matl },
        ...(dl + oh > 0 ? [{ acctno: APPLIED_CONVERSION, ccno: plant.ccno, cramt: r2(dl + oh) }] : []),
      ];
      await writeGl(ctx, { tc: TC.PROD_RECEIPT, docno: h.id, transdate: h.transdate, source: 'PROD' }, entries);
      // 3) Costing records and worksheet status.
      await ctx.db.insert('cosdettbl', { cosno: h.id, pwno: h.id, codeno: h.codeno, lotno: h.lotno, transdate: h.transdate, matlcost: matl, dlcost: dl, ohcost: oh, totcost: total, avecost: uc, uc, um: fg?.um ?? '', wt: qty, wiptotwt: sum(issued, (l) => num(l.qty)), wtvar: r4(sum(issued, (l) => num(l.qty)) - qty) });
      await ctx.db.insert('coshdrtbl', { cosno: h.id, transdate: h.transdate, plntno: h.plntno, glstat: 'Posted', jvno: '' });
      for (const l of issued) {
        await ctx.db.update('wipdettbl', { wipno: h.id, source: 'INPUT', codeno: l.codeno }, { status: 'Posted', dono: saved.no, datepost: today(), stdcosamt: sum(issued.filter((x) => x.codeno === l.codeno), (x) => num(x.cosamt)) });
      }
      await ctx.db.update('wipdettbl', { wipno: h.id, source: 'OUTPUT' }, { status: 'Posted', dono: saved.no, datepost: today(), stduc: uc, stdcosamt: total });
      await ctx.db.update('lotnotbl', { id: h.id }, { status: 'Posted' });
      return `Production ${h.id} completed: lot ${h.lotno} of ${fmtQty(qty)} ${fg?.um ?? ''} received at ${fmtPeso(uc)} per unit and sent to QA.`;
    }
    if (action === 'void') {
      if (h.status === 'Posted') {
        const b = await balanceOf(ctx.db, h.plntno, h.codeno);
        const lot = b.lots.find((x) => x.lotno === h.lotno);
        if (!lot || lot.qty + 0.0001 < num(h.qty)) fail(`Lot ${h.lotno} was already used or sold, so this production cannot be voided.`);
        await ctx.db.update('invhdrtbl', { batchno: h.id, tc: TC.PROD_RECEIPT }, { status: 'Void' });
        await reverseGl(ctx, TC.PROD_RECEIPT, h.id, today());
        if (h.dono) {
          const doSvc = docService('do');
          const d = await doSvc.load(ctx, h.dono);
          if (d && d.h.status === 'Posted') await doSvc.perform(ctx, d, 'void', {});
        }
        await ctx.db.update('coshdrtbl', { cosno: h.id }, { glstat: 'Void' });
      }
      await ctx.db.update('lotnotbl', { id: h.id }, { status: 'Void' });
      await ctx.db.update('wipdettbl', { wipno: h.id }, { status: 'Void' });
      return `Production ${h.id} voided.`;
    }
    fail('Unknown action');
  },

  async defaults(ctx) {
    const plants = await ctx.db.all('plnttbl', { where: { prodnplnt: 'Y', status: 'Active' }, limit: 1 });
    return { transdate: today(), plntno: plants[0]?.plntno ?? '', noofbatch: 1, lines: [{}] };
  },

  async sources(ctx, source) {
    if (source !== 'formula') return [];
    const lots = await ctx.db.all('lotnotbl', { where: { prodtype: 'Production', status: 'Posted' }, orderBy: [['transdate', 'desc']] });
    const mats = await ctx.db.all('mmasttbl');
    const seen = new Set<string>();
    const out: Row[] = [];
    for (const l of lots) {
      if (seen.has(l.codeno)) continue;
      seen.add(l.codeno);
      const o = await ctx.db.one('wipdettbl', { wipno: l.id, source: 'OUTPUT' });
      out.push({ no: l.id, date: l.transdate, party: mats.find((m) => m.codeno === l.codeno)?.mmdesc ?? l.codeno, amount: num(o?.qty), note: `Last run ${l.id} · ${fmtQty(num(o?.qty))} units` });
    }
    return out;
  },

  async prefill(ctx, source, wipno) {
    if (source !== 'formula') fail('Unknown source');
    const lot = await ctx.db.one('lotnotbl', { id: wipno });
    if (!lot) fail(`Production ${wipno} was not found.`);
    const lines = await ctx.db.all('wipdettbl', { where: { wipno } });
    const out = lines.find((l) => l.source === 'OUTPUT');
    return {
      transdate: today(),
      plntno: out?.plntno,
      codeno: lot.codeno,
      qty: num(out?.qty),
      noofbatch: num(lot.noofbatch) || 1,
      remarks: `Same formula as ${wipno}`,
      lines: lines.filter((l) => l.source === 'INPUT').map((l) => ({ codeno: l.codeno, qty: num(l.qty), ratio: num(out?.qty) ? num(l.qty) / num(out?.qty) : 0 })),
    };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the production date.');
    await assertOpenPeriod(ctx.db, transdate, TC.PROD_RECEIPT);
    const plntno = need(str(input.plntno), 'Choose the production plant.');
    const plant = await ctx.db.one('plnttbl', { plntno });
    if (!plant) fail(`Plant ${plntno} does not exist.`);
    if (String(plant.prodnplnt).toUpperCase() !== 'Y') fail(`${plant.plntname} is not set up as a production plant.`);
    const codeno = need(str(input.codeno), 'Choose the finished product to produce.');
    const fg = await ctx.db.one('mmasttbl', { codeno });
    if (!fg || fg.mmtype !== 'FG') fail('Choose a finished good as the output.');
    const qty = r4(num(input.qty));
    if (qty <= 0) fail('Enter the quantity produced.');
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.codeno) || num(l.qty));
    if (!raw.length) fail('Add the raw and packaging materials used.');
    const inputs: Row[] = [];
    for (const [i, l] of raw.entries()) {
      const m = await ctx.db.one('mmasttbl', { codeno: need(str(l.codeno), `Line ${i + 1}: choose a material.`) });
      if (!m) fail(`Line ${i + 1}: material ${l.codeno} does not exist.`);
      if (m.mmtype === 'FG') fail(`Line ${i + 1}: inputs must be raw or packaging materials.`);
      if (num(l.qty) <= 0) fail(`Line ${i + 1}: quantity must be more than zero.`);
      inputs.push({ codeno: m.codeno, qty: r4(num(l.qty)), um: m.um });
    }
    let wipno = str(input.no);
    if (wipno) {
      const h = await ctx.db.one('lotnotbl', { id: wipno });
      if (!h) fail(`Production ${wipno} was not found.`);
      if (h.status !== 'Open') fail(`Production ${wipno} is ${h.status} and can no longer be edited.`);
      await ctx.db.remove('wipdettbl', { wipno });
      await ctx.db.update('lotnotbl', { id: wipno }, { codeno, transdate, expirydate: str(input.expirydate) || addDays(transdate, 365), noofbatch: num(input.noofbatch) || 1 });
    } else {
      wipno = await nextDocNo(ctx.db, 'lotnotbl', 'id', yearPrefix('PW', transdate));
      const lotno = `FG${transdate.slice(2, 4)}${transdate.slice(5, 7)}${transdate.slice(8, 10)}-${wipno.slice(-3)}`;
      await ctx.db.insert('lotnotbl', { id: wipno, lotno, codeno, transdate, expirydate: str(input.expirydate) || addDays(transdate, 365), noofbatch: num(input.noofbatch) || 1, prodtype: 'Production', status: 'Open', user: ctx.user });
    }
    let i = 0;
    for (const l of inputs) await ctx.db.insert('wipdettbl', { wipno, itmno: ++i, source: 'INPUT', codeno: l.codeno, qty: l.qty, um: l.um, plntno, transdate, status: 'Open', tc: TC.PROD_RECEIPT, user: ctx.user });
    await ctx.db.insert('wipdettbl', { wipno, itmno: ++i, source: 'OUTPUT', codeno, qty, um: fg.um, plntno, transdate, status: 'Open', tc: TC.PROD_RECEIPT, remarks: str(input.remarks), fgtype: 'FG', user: ctx.user });
    return { no: wipno };
  },
};
registerDoc(prodService);

/** COS vs ASP analysis (COSvsASP.aspx, form 059): production cost against average selling price. */
export async function cosVsAsp(ctx: Ctx, f: { from: string; to: string }) {
  await requireRight(ctx, FORM.COS_VS_ASP, ACTION.VIEW, 'view COS vs ASP');
  const mats = (await ctx.db.all('mmasttbl', { where: { mmtype: 'FG' } })).sort((a, b) => String(a.codeno).localeCompare(String(b.codeno)));
  const invs = await ctx.db.all('saleshdrtbl', { where: { tc: { in: INVOICE_TCS }, status: 'Posted', transdate: { gte: f.from, lte: f.to } } });
  const sold = new Map<string, { qty: number; net: number }>();
  for (const h of invs) {
    for (const l of await ctx.db.all('salesdettbl', { where: { invno: h.invno } })) {
      const s = sold.get(l.codeno) ?? { qty: 0, net: 0 };
      s.qty = r4(s.qty + num(l.qty));
      s.net = r2(s.net + num(l.itmamt) - num(l.detvat));
      sold.set(l.codeno, s);
    }
  }
  const costs = await ctx.db.all('cosdettbl');
  const rows: Row[] = [];
  for (const m of mats) {
    const s = sold.get(m.codeno);
    const lots = costs.filter((c) => c.codeno === m.codeno);
    let unitCost = 0;
    if (lots.length) unitCost = r4(sum(lots, (c) => num(c.totcost)) / sum(lots, (c) => num(c.wt)));
    else {
      const plants = await ctx.db.all('plnttbl');
      const avgs: number[] = [];
      for (const p of plants) {
        const b = await balanceOf(ctx.db, p.plntno, m.codeno);
        if (b.avgCost) avgs.push(b.avgCost);
      }
      unitCost = avgs.length ? r4(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;
    }
    if (!s && !unitCost) continue;
    const asp = s && s.qty ? r4(s.net / s.qty) : 0;
    rows.push({ codeno: m.codeno, mmdesc: m.mmdesc, um: m.um, qtySold: s?.qty ?? 0, sales: s?.net ?? 0, asp, unitCost, margin: asp ? r4(asp - unitCost) : 0, marginPct: asp ? Math.round(((asp - unitCost) / asp) * 1000) / 10 : 0 });
  }
  return rows;
}
