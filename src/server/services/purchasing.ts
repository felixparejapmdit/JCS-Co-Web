import type { Db, Row } from '../db';
import { FORM, TC } from '@/shared/codes';
import { addDays, today } from '@/shared/dates';
import { fmtPeso, fmtQty, r2, r4, sum } from '@/shared/money';
import { Ctx, fail, need, nextDocNo, num, numberLines, str, yearPrefix } from './context';
import { ActionDef, DocService, STD, countBy, filterList, registerDoc } from './docs';
import { balanceOf, balances, receivedQtyByPo } from './inventory';

/** Approval limit from authtbl (legacy form names such as 'PurcApp', 'SOapp', 'APapp'). */
export async function approvalLimit(db: Db, user: string, form: string): Promise<number | null> {
  const rows = await db.all('authtbl', { where: { userid: user, form } });
  if (!rows.length) return null;
  const limits = rows.map((r) => num(r.maxamt)).filter((n) => n > 0);
  return limits.length ? Math.max(...limits) : null;
}

export async function assertWithinLimit(ctx: Ctx, form: string, amount: number, what: string) {
  const limit = await approvalLimit(ctx.db, ctx.user, form);
  if (limit !== null && amount > limit + 0.005) {
    fail(`This ${what} (${fmtPeso(amount)}) is above your approval limit of ${fmtPeso(limit)}. It needs an approver with a higher limit.`);
  }
}

async function lastCost(db: Db, codeno: string): Promise<number> {
  const b = await balances(db, { codeno });
  const costs = [...b.values()].map((x) => x.avgCost).filter((c) => c > 0);
  if (costs.length) return r4(costs.reduce((s, c) => s + c, 0) / costs.length);
  const po = await db.all('podettbl', { where: { codeno }, orderBy: [['transdate', 'desc']], limit: 1 });
  return po[0] ? num(po[0].uc) : 0;
}

// ===========================================================================
// Requisitions (RIV.aspx form 054, approval PurcApp.aspx form 058)
// ===========================================================================
async function refreshRivServed(db: Db, rivno: string) {
  if (!rivno) return;
  const lines = await db.all('rivdettbl', { where: { rivno } });
  const pos = await db.all('pohdrtbl', { where: { rivno, status: { ne: 'Void' } } });
  const ordered = new Map<string, number>();
  for (const p of pos) for (const l of await db.all('podettbl', { where: { pono: p.pono } })) ordered.set(l.codeno, (ordered.get(l.codeno) ?? 0) + num(l.qty));
  let any = false;
  let all = true;
  for (const l of lines) {
    const got = Math.min(ordered.get(l.codeno) ?? 0, num(l.appqty || l.qty));
    ordered.set(l.codeno, Math.max(0, (ordered.get(l.codeno) ?? 0) - got));
    const bal = r4(num(l.appqty || l.qty) - got);
    if (got > 0) any = true;
    if (bal > 0.0001) all = false;
    await db.update('rivdettbl', { rivno, itemno: l.itemno }, { qtydel: got, qtybal: bal, pono: got > 0 ? pos.map((p) => p.pono).join(',') : '' });
  }
  await db.update('rivhdrtbl', { rivno }, { servstat: all && lines.length ? 'Served' : any ? 'Partial' : 'Unserved', dateupdate: today() });
}

const rivService: DocService = {
  type: 'riv',
  title: 'Requisition (RIV)',
  form: FORM.RIV,
  tc: TC.REQUISITION,
  table: 'rivhdrtbl',
  noColumn: 'rivno',

  async list(ctx, params) {
    const heads = await ctx.db.all('rivhdrtbl', { orderBy: [['transdate', 'desc'], ['rivno', 'desc']] });
    const depts = await ctx.db.all('depttbl');
    const rows = heads.map((h) => ({ ...h, no: h.rivno, party: depts.find((d) => d.dept === h.dept)?.deptname ?? h.dept, amount: num(h.totamt) }));
    return { rows: filterList(rows, params, ['rivno', 'party', 'remarks', 'plntno']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('rivhdrtbl', { rivno: no });
    if (!h) return null;
    return { h, lines: await ctx.db.all('rivdettbl', { where: { rivno: no }, orderBy: [['itemno', 'asc']] }) };
  },

  async view(ctx, { h, lines }) {
    const dept = await ctx.db.one('depttbl', { dept: h.dept });
    const pos = await ctx.db.all('pohdrtbl', { where: { rivno: h.rivno, status: { ne: 'Void' } } });
    return {
      no: h.rivno,
      status: h.status,
      title: `Requisition ${h.rivno}`,
      subtitle: `${dept?.deptname ?? h.dept} · needed by ${h.datereq || '—'}`,
      header: { ...h, deptname: dept?.deptname },
      lines,
      totals: [
        { label: 'Estimated total', value: sum(lines, (l) => num(l.amt)), strong: true },
        { label: 'Still to order', value: sum(lines, (l) => num(l.qtybal)), kind: 'qty' },
      ],
      info: [
        { label: 'Ordering status', value: h.servstat || 'Unserved' },
        ...(h.appby ? [{ label: 'Approved by', value: `${h.appby} on ${h.dateapp}` }] : []),
      ],
      links: pos.map((p) => ({ label: `Purchase order ${p.pono}`, type: 'po', no: p.pono })),
      editable: h.status === 'Open',
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open') defs.push(STD.approve(FORM.RIV_APPROVAL, 'Approve requisition'), STD.void());
    if (h.status === 'Approved' && (h.servstat || 'Unserved') === 'Unserved') defs.push(STD.void());
    return defs;
  },

  async perform(ctx, { h, lines }, action) {
    if (action === 'approve') {
      for (const l of lines) await ctx.db.update('rivdettbl', { rivno: h.rivno, itemno: l.itemno }, { appqty: num(l.qty), appamt: num(l.amt), qtybal: num(l.qty), detstat: 'Approved' });
      await ctx.db.update('rivhdrtbl', { rivno: h.rivno }, { status: 'Approved', appby: ctx.user, dateapp: today(), servstat: 'Unserved' });
      return `Requisition ${h.rivno} approved. Purchasing can now raise a PO from it.`;
    }
    if (action === 'void') {
      await ctx.db.update('rivhdrtbl', { rivno: h.rivno }, { status: 'Void', updateby: ctx.user });
      return `Requisition ${h.rivno} voided.`;
    }
    fail('Unknown action');
  },

  async defaults(ctx) {
    const plants = await ctx.db.all('plnttbl', { where: { status: 'Active' }, limit: 1 });
    return { transdate: today(), datereq: addDays(today(), 7), plntno: plants[0]?.plntno ?? '', lines: [{}] };
  },

  async sources(ctx, source) {
    if (source !== 'reorder') return [];
    const plants = await ctx.db.all('plnttbl', { where: { status: 'Active', invset: 'Y' } });
    const mats = await ctx.db.all('mmasttbl', { where: { invlevel: { gt: 0 } } });
    const out: Row[] = [];
    for (const p of plants) {
      let n = 0;
      for (const m of mats.filter((x) => x.mmtype !== 'FG')) {
        const b = await balanceOf(ctx.db, p.plntno, m.codeno);
        if (b.available < num(m.invlevel)) n++;
      }
      if (n) out.push({ no: p.plntno, date: today(), party: p.plntname, amount: n, note: `${n} material(s) below reorder level` });
    }
    return out;
  },

  async prefill(ctx, source, plntno) {
    if (source !== 'reorder') fail('Unknown source');
    const mats = await ctx.db.all('mmasttbl', { where: { invlevel: { gt: 0 } } });
    const lines: Row[] = [];
    for (const m of mats.filter((x) => x.mmtype !== 'FG')) {
      const b = await balanceOf(ctx.db, plntno, m.codeno);
      if (b.available < num(m.invlevel)) {
        const qty = Math.ceil(num(m.invlevel) * 2 - b.available);
        lines.push({ codeno: m.codeno, qty, uc: await lastCost(ctx.db, m.codeno) });
      }
    }
    if (!lines.length) fail(`Nothing at ${plntno} is below its reorder level.`);
    return { transdate: today(), datereq: addDays(today(), 7), plntno, remarks: 'Replenishment of materials below reorder level', lines };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the requisition date.');
    const dept = need(str(input.dept), 'Choose the requesting department.');
    if (!(await ctx.db.one('depttbl', { dept }))) fail(`Department ${dept} does not exist.`);
    const plntno = need(str(input.plntno), 'Choose the plant that needs the materials.');
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.codeno) || num(l.qty));
    if (!raw.length) fail('Add at least one material.');
    const lines: Row[] = [];
    for (const [i, l] of raw.entries()) {
      const m = await ctx.db.one('mmasttbl', { codeno: need(str(l.codeno), `Line ${i + 1}: choose a material.`) });
      if (!m) fail(`Line ${i + 1}: material ${l.codeno} does not exist.`);
      const qty = r4(num(l.qty));
      if (qty <= 0) fail(`Line ${i + 1}: quantity must be more than zero.`);
      const uc = l.uc === '' || l.uc === undefined ? await lastCost(ctx.db, m.codeno) : r4(num(l.uc));
      const b = await balanceOf(ctx.db, plntno, m.codeno);
      lines.push({ codeno: m.codeno, mmdesc: m.mmdesc, um: m.um, qty, uc, amt: r2(qty * uc), currinv: b.available, appqty: 0, qtydel: 0, qtybal: qty, plntno, status: 'Open', detstat: 'Open', doctype: m.mmtype });
    }
    let rivno = str(input.no);
    const header = {
      transdate,
      dept,
      plntno,
      mmtype: lines[0]?.doctype ?? 'RM',
      datereq: str(input.datereq) || addDays(transdate, 7),
      remarks: str(input.remarks),
      totamt: sum(lines, (l) => l.amt),
      status: 'Open',
      servstat: 'Unserved',
      tc: TC.REQUISITION,
      user: ctx.user,
      updateby: ctx.user,
      dateupdate: today(),
      pdate: today(),
      ba: ctx.ba,
      web: 'Y',
    };
    if (rivno) {
      const h = await ctx.db.one('rivhdrtbl', { rivno });
      if (!h) fail(`Requisition ${rivno} was not found.`);
      if (h.status !== 'Open') fail(`Requisition ${rivno} is ${h.status} and can no longer be edited.`);
      await ctx.db.update('rivhdrtbl', { rivno }, header);
      await ctx.db.remove('rivdettbl', { rivno });
    } else {
      rivno = await nextDocNo(ctx.db, 'rivhdrtbl', 'rivno', yearPrefix('RIV', transdate));
      await ctx.db.insert('rivhdrtbl', { rivno, ...header });
    }
    for (const l of numberLines(lines)) await ctx.db.insert('rivdettbl', { rivno, ...l, transid: `${rivno}-${l.itemno}` });
    return { no: rivno };
  },
};
registerDoc(rivService);

// ===========================================================================
// Purchase orders (PO.aspx form 035, approval PurcApp.aspx form 036)
// ===========================================================================
const poService: DocService = {
  type: 'po',
  title: 'Purchase Order',
  form: FORM.PO,
  tc: TC.PURCHASE_ORDER,
  table: 'pohdrtbl',
  noColumn: 'pono',

  async list(ctx, params) {
    const heads = await ctx.db.all('pohdrtbl', { orderBy: [['transdate', 'desc'], ['pono', 'desc']] });
    const vens = await ctx.db.all('venmasttbl');
    const rows = heads.map((h) => ({ ...h, no: h.pono, party: vens.find((v) => v.venno === h.venno)?.venname ?? h.venno, amount: num(h.totamt) }));
    return { rows: filterList(rows, params, ['pono', 'party', 'rivno', 'remarks', 'plntno', 'servstat']), counts: countBy(rows) };
  },

  async load(ctx, no) {
    const h = await ctx.db.one('pohdrtbl', { pono: no });
    if (!h) return null;
    return { h, lines: await ctx.db.all('podettbl', { where: { pono: no }, orderBy: [['itemno', 'asc']] }) };
  },

  async view(ctx, { h, lines }) {
    const ven = await ctx.db.one('venmasttbl', { venno: h.venno });
    const got = await receivedQtyByPo(ctx.db, h.pono);
    const left = new Map(got);
    const shaped = lines.map((l) => {
      const r = Math.min(left.get(l.codeno) ?? 0, num(l.qty));
      left.set(l.codeno, Math.max(0, (left.get(l.codeno) ?? 0) - r));
      return { ...l, received: r, open: r4(num(l.qty) - r) };
    });
    const mmrrs = await ctx.db.all('invhdrtbl', { where: { pono: h.pono, tc: TC.RECEIVING, status: { ne: 'Void' } } });
    const limit = await approvalLimit(ctx.db, ctx.user, 'PurcApp');
    return {
      no: h.pono,
      status: h.status,
      title: `Purchase Order ${h.pono}`,
      subtitle: `${ven?.venname ?? h.venno} · deliver to ${h.plntno}`,
      header: { ...h, venname: ven?.venname, venaddress: ven?.address, ventin: ven?.tin },
      lines: shaped,
      totals: [
        { label: 'PO amount', value: sum(lines, (l) => num(l.amt)), strong: true },
        { label: 'Still to receive', value: sum(shaped, (l) => l.open), kind: 'qty' },
      ],
      checks:
        h.status === 'Open' && limit !== null
          ? [{ label: 'Within your approval limit', ok: num(h.totamt) <= limit, detail: `Your limit: ${fmtPeso(limit)}` }]
          : undefined,
      info: [
        { label: 'Terms', value: `${num(h.terms)} days` },
        { label: 'Receiving status', value: h.servstat || 'Unserved' },
        ...(h.appby ? [{ label: 'Approved by', value: `${h.appby} on ${h.dateapp}` }] : []),
      ],
      links: [
        ...(h.rivno ? [{ label: `Requisition ${h.rivno}`, type: 'riv', no: h.rivno }] : []),
        ...mmrrs.map((m) => ({ label: `Receiving report ${m.docno}`, type: 'mmrr', no: m.docno })),
      ],
      editable: h.status === 'Open',
      print: { kind: 'po' },
    };
  },

  actionDefs(_ctx, { h }) {
    const defs: ActionDef[] = [];
    if (h.status === 'Open')
      defs.push({ ...STD.approve(FORM.PO_APPROVAL, 'Approve PO'), hint: 'Checks your approval limit, then releases the PO to the vendor and the warehouse.' }, STD.void());
    if (h.status === 'Approved' && (h.servstat || 'Unserved') === 'Unserved') defs.push(STD.void());
    return defs;
  },

  async perform(ctx, { h }, action) {
    if (action === 'approve') {
      await assertWithinLimit(ctx, 'PurcApp', num(h.totamt), 'purchase order');
      await ctx.db.update('pohdrtbl', { pono: h.pono }, { status: 'Approved', appby: ctx.user, dateapp: today(), servstat: 'Unserved' });
      return `PO ${h.pono} approved. The warehouse can receive against it.`;
    }
    if (action === 'void') {
      const got = await receivedQtyByPo(ctx.db, h.pono);
      if ([...got.values()].some((q) => q > 0)) fail(`Goods were already received on PO ${h.pono}; it cannot be voided.`);
      await ctx.db.update('pohdrtbl', { pono: h.pono }, { status: 'Void', updateby: ctx.user, dateupdate: today() });
      await refreshRivServed(ctx.db, h.rivno);
      return `PO ${h.pono} voided.`;
    }
    fail('Unknown action');
  },

  async defaults(ctx) {
    const plants = await ctx.db.all('plnttbl', { where: { status: 'Active' }, limit: 1 });
    return { transdate: today(), datereq: addDays(today(), 7), currency: 'PHP', plntno: plants[0]?.plntno ?? '', lines: [{}] };
  },

  async sources(ctx, source) {
    if (source !== 'riv') return [];
    const rivs = await ctx.db.all('rivhdrtbl', { where: { status: 'Approved', servstat: { in: ['Unserved', 'Partial'] } }, orderBy: [['datereq', 'asc']] });
    const depts = await ctx.db.all('depttbl');
    return rivs.map((r) => ({ no: r.rivno, date: r.datereq || r.transdate, party: depts.find((d) => d.dept === r.dept)?.deptname ?? r.dept, amount: num(r.totamt), note: `${r.servstat} · ${r.plntno}` }));
  },

  async prefill(ctx, source, rivno) {
    if (source !== 'riv') fail('Unknown source');
    const riv = await ctx.db.one('rivhdrtbl', { rivno });
    if (!riv || riv.status !== 'Approved') fail(`Requisition ${rivno} is not approved.`);
    const lines = (await ctx.db.all('rivdettbl', { where: { rivno }, orderBy: [['itemno', 'asc']] })).filter((l) => num(l.qtybal) > 0);
    if (!lines.length) fail(`Requisition ${rivno} is fully ordered.`);
    return {
      transdate: today(),
      datereq: riv.datereq,
      plntno: riv.plntno,
      rivno,
      dept: riv.dept,
      currency: 'PHP',
      remarks: `Per requisition ${rivno}`,
      lines: lines.map((l) => ({ codeno: l.codeno, qty: num(l.qtybal), uc: num(l.uc) })),
    };
  },

  async save(ctx, input) {
    const transdate = need(str(input.transdate), 'Enter the PO date.');
    const venno = need(str(input.venno), 'Choose the vendor.');
    const ven = await ctx.db.one('venmasttbl', { venno });
    if (!ven) fail(`Vendor ${venno} does not exist.`);
    if (String(ven.status ?? 'Active').toLowerCase() !== 'active') fail(`${ven.venname} is inactive.`);
    const plntno = need(str(input.plntno), 'Choose the delivery plant / warehouse.');
    if (!(await ctx.db.one('plnttbl', { plntno }))) fail(`Plant ${plntno} does not exist.`);
    const rivno = str(input.rivno);
    let rivOpen = new Map<string, number>();
    if (rivno) {
      const riv = await ctx.db.one('rivhdrtbl', { rivno });
      if (!riv || riv.status !== 'Approved') fail(`Requisition ${rivno} is not approved.`);
      for (const l of await ctx.db.all('rivdettbl', { where: { rivno } })) rivOpen.set(l.codeno, (rivOpen.get(l.codeno) ?? 0) + num(l.qtybal));
      if (str(input.no)) {
        // Lines already on this PO count as open again while it is being edited.
        for (const l of await ctx.db.all('podettbl', { where: { pono: str(input.no) } })) rivOpen.set(l.codeno, (rivOpen.get(l.codeno) ?? 0) + num(l.qty));
      }
    }
    const raw: Row[] = (input.lines ?? []).filter((l: Row) => str(l.codeno) || num(l.qty));
    if (!raw.length) fail('Add at least one material.');
    const lines: Row[] = [];
    for (const [i, l] of raw.entries()) {
      const m = await ctx.db.one('mmasttbl', { codeno: need(str(l.codeno), `Line ${i + 1}: choose a material.`) });
      if (!m) fail(`Line ${i + 1}: material ${l.codeno} does not exist.`);
      const qty = r4(num(l.qty));
      if (qty <= 0) fail(`Line ${i + 1}: quantity must be more than zero.`);
      const uc = r4(num(l.uc));
      if (uc <= 0) fail(`Line ${i + 1}: enter the unit price for ${m.mmdesc}.`);
      if (rivno) {
        const open = rivOpen.get(m.codeno) ?? 0;
        const already = lines.filter((x) => x.codeno === m.codeno).reduce((s, x) => s + x.qty, 0);
        if (already + qty > open + 0.0001) fail(`Line ${i + 1}: requisition ${rivno} only has ${fmtQty(open - already)} ${m.um} of ${m.mmdesc} left to order.`);
      }
      lines.push({ codeno: m.codeno, mmdesc: m.mmdesc, um: m.um, qty, appqty: qty, uc, amt: r2(qty * uc), rivno, transdate });
    }
    const total = sum(lines, (l) => l.amt);
    let pono = str(input.no);
    const header = {
      transdate,
      venno,
      plntno,
      rivno,
      dept: str(input.dept),
      ccno: str(input.ccno),
      currency: str(input.currency) || 'PHP',
      terms: input.terms === undefined || input.terms === '' ? num(ven.terms) : num(input.terms),
      datereq: str(input.datereq) || addDays(transdate, 7),
      remarks: str(input.remarks),
      poremarks: str(input.poremarks),
      mmtype: '',
      totamt: total,
      pototamt: total,
      status: 'Open',
      servstat: 'Unserved',
      user: ctx.user,
      updateby: ctx.user,
      dateupdate: today(),
      pdate: today(),
      ba: ctx.ba,
      branch: 'MAIN',
    };
    if (pono) {
      const h = await ctx.db.one('pohdrtbl', { pono });
      if (!h) fail(`PO ${pono} was not found.`);
      if (h.status !== 'Open') fail(`PO ${pono} is ${h.status} and can no longer be edited.`);
      await ctx.db.update('pohdrtbl', { pono }, header);
      await ctx.db.remove('podettbl', { pono });
    } else {
      pono = await nextDocNo(ctx.db, 'pohdrtbl', 'pono', yearPrefix('PO', transdate));
      await ctx.db.insert('pohdrtbl', { pono, docno: pono, ...header });
    }
    for (const l of numberLines(lines)) await ctx.db.insert('podettbl', { pono, ...l, transid: `${pono}-${l.itemno}` });
    await refreshRivServed(ctx.db, rivno);
    return { no: pono };
  },
};
registerDoc(poService);

export async function poMonitor(ctx: Ctx) {
  const heads = await ctx.db.all('pohdrtbl', { where: { status: 'Approved' }, orderBy: [['datereq', 'asc']] });
  const vens = await ctx.db.all('venmasttbl');
  const out: Row[] = [];
  for (const h of heads) {
    const lines = await ctx.db.all('podettbl', { where: { pono: h.pono } });
    const got = await receivedQtyByPo(ctx.db, h.pono);
    const ordered = sum(lines, (l) => num(l.qty));
    const received = Math.min(ordered, [...got.values()].reduce((s, v) => s + v, 0));
    out.push({
      pono: h.pono,
      transdate: h.transdate,
      datereq: h.datereq,
      venname: vens.find((v) => v.venno === h.venno)?.venname ?? h.venno,
      plntno: h.plntno,
      amount: num(h.totamt),
      ordered,
      received: r4(received),
      pct: ordered ? Math.round((received / ordered) * 100) : 0,
      servstat: h.servstat,
      overdue: h.servstat !== 'Served' && String(h.datereq) < today(),
    });
  }
  return out;
}
