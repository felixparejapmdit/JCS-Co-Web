// Clinic monitoring (legacy ClinicMonitoring.aspx, form 088). The legacy page only had its tabs
// (Consultation, Reports, Inventory / Supply, Masterdata: Patient, Supplies) and no tables, so
// Cloud AOS keeps the clinic in its own ng_clinic_* tables. Patients are the employees of
// payemployeetbl, or visitors typed in. Medical details stay out of the audit trail.
import type { Db, Row } from '../db';
import { ACTION, FORM } from '@/shared/codes';
import { addDays, nowStamp, today } from '@/shared/dates';
import { r2, sum } from '@/shared/money';
import { Ctx, audit, fail, isAllowed, need, nextDocNo, num, requireRight, str, yearPrefix } from './context';

export const DISPOSITIONS = ['Back to work', 'Rest in clinic', 'Sent home', 'Referred to hospital'];
export const PATIENT_TYPES = ['Employee', 'Dependent', 'Visitor / contractor'];

async function onHand(db: Db): Promise<Map<string, number>> {
  const moves = await db.all('ng_clinic_stock');
  const m = new Map<string, number>();
  for (const x of moves) m.set(x.code, r2((m.get(x.code) ?? 0) + num(x.qty)));
  return m;
}

export async function clinicDashboard(ctx: Ctx) {
  await requireRight(ctx, FORM.CLINIC, ACTION.VIEW, 'open the clinic');
  const [visits, supplies, stock, emps, cc] = await Promise.all([
    ctx.db.all('ng_clinic_visit', { orderBy: [['transdate', 'desc'], ['visitno', 'desc']], limit: 300 }),
    ctx.db.all('ng_clinic_supply', { orderBy: [['name', 'asc']] }),
    onHand(ctx.db),
    ctx.db.all('payemployeetbl'),
    ctx.db.all('cctrnotbl'),
  ]);
  const dispensed = await ctx.db.all('ng_clinic_stock', { where: { visitno: { in: visits.map((v) => v.visitno) } } });
  const month = today().slice(0, 7);
  const thisMonth = visits.filter((v) => String(v.transdate).startsWith(month) && v.status !== 'Void');
  const supplyRows = supplies.map((s): Row => ({ ...s, onhand: stock.get(s.code) ?? 0, reorder: num(s.reorder), low: (stock.get(s.code) ?? 0) <= num(s.reorder) }));
  const complaints = new Map<string, number>();
  for (const v of thisMonth) {
    const k = str(v.complaint).toLowerCase().split(/[,;]/)[0].trim();
    if (k) complaints.set(k, (complaints.get(k) ?? 0) + 1);
  }
  return {
    visits: visits.map((v): Row => ({ ...v, restdays: num(v.restdays), supplies: dispensed.filter((d) => d.visitno === v.visitno).map((d) => ({ code: d.code, name: supplies.find((s) => s.code === d.code)?.name ?? d.code, qty: -num(d.qty) })) })),
    supplies: supplyRows,
    patients: emps.filter((e) => String(e.empstat).toLowerCase() !== 'resigned').map((e) => ({ value: e.empno, label: `${e.lastname}, ${e.firstname}`, sub: e.ccno, data: { ccno: e.ccno, name: `${e.firstname} ${e.lastname}` } })),
    costCenters: cc.map((c) => ({ value: c.ccno, label: c.ccdesc ?? c.ccno })),
    stats: {
      visits: thisMonth.length,
      sentHome: thisMonth.filter((v) => v.disposition === 'Sent home').length,
      referred: thisMonth.filter((v) => v.disposition === 'Referred to hospital').length,
      restDays: sum(thisMonth, (v) => num(v.restdays)),
      lowStock: supplyRows.filter((s) => s.low).length,
      topComplaints: [...complaints.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
    },
    dispositions: DISPOSITIONS,
    patientTypes: PATIENT_TYPES,
    can: {
      add: await isAllowed(ctx.db, ctx.group, FORM.CLINIC, ACTION.INSERT),
      supplies: await isAllowed(ctx.db, ctx.group, FORM.CLINIC, ACTION.EDIT),
      void: await isAllowed(ctx.db, ctx.group, FORM.CLINIC, ACTION.DELETE),
    },
  };
}

export async function saveVisit(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.CLINIC, ACTION.INSERT, 'record consultations');
  const transdate = need(str(input.transdate), 'Enter the date of the visit.');
  if (transdate > today()) fail('The visit cannot be in the future.');
  const ptype = str(input.ptype) || PATIENT_TYPES[0];
  if (!PATIENT_TYPES.includes(ptype)) fail('Choose the type of patient.');
  let empno = str(input.empno);
  let patient = str(input.patient);
  let ccno = str(input.ccno);
  if (ptype === 'Employee') {
    const e = await ctx.db.one('payemployeetbl', { empno: need(empno, 'Choose the employee.') });
    if (!e) fail(`Employee ${empno} does not exist.`);
    patient = `${e.firstname} ${e.lastname}`;
    ccno = str(e.ccno);
  } else {
    need(patient, 'Enter the name of the patient.');
    if (ptype === 'Visitor / contractor') empno = '';
  }
  const complaint = need(str(input.complaint), 'Enter the chief complaint.');
  const disposition = str(input.disposition) || DISPOSITIONS[0];
  if (!DISPOSITIONS.includes(disposition)) fail('Choose what happened after the consultation.');
  const restdays = num(input.restdays);
  if (restdays < 0 || restdays > 60) fail('Rest days must be between 0 and 60.');
  const temp = str(input.temp);
  if (temp && (num(temp) < 30 || num(temp) > 45)) fail('Enter the temperature in °C.');
  const lines = ((input.supplies as Row[]) ?? []).filter((l) => str(l.code) && num(l.qty) > 0);
  const stock = await onHand(ctx.db);
  for (const l of lines) {
    const s = await ctx.db.one('ng_clinic_supply', { code: str(l.code) });
    if (!s) fail(`Supply ${l.code} does not exist.`);
    const have = stock.get(s.code) ?? 0;
    if (num(l.qty) > have) fail(`Only ${have} ${s.unit} of ${s.name} left.`);
  }
  return ctx.db.tx(async (db) => {
    const visitno = await nextDocNo(db, 'ng_clinic_visit', 'visitno', yearPrefix('CLN', transdate));
    await db.insert('ng_clinic_visit', {
      visitno,
      ba: ctx.ba,
      transdate,
      timein: str(input.timein) || nowStamp().slice(11, 16),
      ptype,
      empno,
      patient,
      ccno,
      complaint,
      bp: str(input.bp),
      temp: temp ? num(temp) : null,
      pulse: str(input.pulse) ? num(input.pulse) : null,
      diagnosis: str(input.diagnosis),
      treatment: str(input.treatment),
      disposition,
      restdays,
      returndate: restdays ? addDays(transdate, Math.ceil(restdays)) : null,
      attendedby: str(input.attendedby) || ctx.fullName,
      status: 'Closed',
      user: ctx.user,
      created_at: nowStamp(),
    });
    for (const l of lines) await db.insert('ng_clinic_stock', { code: str(l.code), transdate, qty: -num(l.qty), visitno, remarks: `Given to ${patient}`, user: ctx.user, created_at: nowStamp() });
    await audit({ ...ctx, db }, { form: FORM.CLINIC, docno: visitno, trans: 'Record clinic consultation', table: 'ng_clinic_visit' });
    return `Consultation ${visitno} recorded for ${patient}.`;
  });
}

export async function voidVisit(ctx: Ctx, visitno: string, reason: string): Promise<string> {
  await requireRight(ctx, FORM.CLINIC, ACTION.DELETE, 'void clinic records');
  const v = await ctx.db.one('ng_clinic_visit', { visitno });
  if (!v) fail(`Consultation ${visitno} was not found.`);
  if (v.status === 'Void') fail(`Consultation ${visitno} is already void.`);
  need(str(reason), 'Give the reason for voiding the record.');
  return ctx.db.tx(async (db) => {
    await db.update('ng_clinic_visit', { visitno }, { status: 'Void', voidreason: str(reason), voidby: ctx.user });
    await db.remove('ng_clinic_stock', { visitno });
    await audit({ ...ctx, db }, { form: FORM.CLINIC, docno: visitno, trans: 'Void clinic consultation', table: 'ng_clinic_visit' });
    return `Consultation ${visitno} voided; the supplies given are back in stock.`;
  });
}

export async function saveSupply(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.CLINIC, ACTION.EDIT, 'manage clinic supplies');
  const name = need(str(input.name), 'Enter the name of the supply.');
  const unit = str(input.unit) || 'pc';
  const reorder = num(input.reorder);
  if (reorder < 0) fail('The reorder level cannot be negative.');
  let code = str(input.code);
  if (code) {
    if (!(await ctx.db.one('ng_clinic_supply', { code }))) fail(`Supply ${code} was not found.`);
    await ctx.db.update('ng_clinic_supply', { code }, { name, unit, reorder, kind: str(input.kind) || 'Medicine', status: str(input.status) || 'Active' });
    return `${name} updated.`;
  }
  code = await nextDocNo(ctx.db, 'ng_clinic_supply', 'code', 'MED', {}, 4);
  await ctx.db.insert('ng_clinic_supply', { code, name, unit, reorder, kind: str(input.kind) || 'Medicine', status: 'Active' });
  return `${name} added as ${code}.`;
}

export async function receiveSupply(ctx: Ctx, input: Row): Promise<string> {
  await requireRight(ctx, FORM.CLINIC, ACTION.EDIT, 'receive clinic supplies');
  const s = await ctx.db.one('ng_clinic_supply', { code: need(str(input.code), 'Choose the supply.') });
  if (!s) fail(`Supply ${input.code} does not exist.`);
  const qty = num(input.qty);
  if (qty === 0) fail('Enter the quantity received (negative to write off expired stock).');
  if (qty < 0 && -qty > ((await onHand(ctx.db)).get(s.code) ?? 0)) fail('You cannot write off more than is on hand.');
  await ctx.db.insert('ng_clinic_stock', { code: s.code, transdate: str(input.transdate) || today(), qty, visitno: '', remarks: str(input.remarks) || (qty > 0 ? 'Received' : 'Written off'), expiry: str(input.expiry) || null, user: ctx.user, created_at: nowStamp() });
  return qty > 0 ? `${qty} ${s.unit} of ${s.name} received.` : `${-qty} ${s.unit} of ${s.name} written off.`;
}

/** Visits per month, complaint and cost center, and supplies used, for the given period. */
export async function clinicReport(ctx: Ctx, from: string, to: string) {
  await requireRight(ctx, FORM.CLINIC, ACTION.VIEW, 'view clinic reports');
  const visits = (await ctx.db.all('ng_clinic_visit', { where: { transdate: { gte: from, lte: to } } })).filter((v) => v.status !== 'Void');
  const used = (await ctx.db.all('ng_clinic_stock', { where: { transdate: { gte: from, lte: to } } })).filter((m) => m.visitno && num(m.qty) < 0);
  const supplies = await ctx.db.all('ng_clinic_supply');
  const cc = await ctx.db.all('cctrnotbl');
  const count = (key: (v: Row) => string) => {
    const m = new Map<string, Row>();
    for (const v of visits) {
      const k = key(v) || '—';
      const g = m.get(k) ?? { name: k, visits: 0, restdays: 0, sentHome: 0 };
      g.visits += 1;
      g.restdays += num(v.restdays);
      if (v.disposition === 'Sent home' || v.disposition === 'Referred to hospital') g.sentHome += 1;
      m.set(k, g);
    }
    return [...m.values()].sort((a, b) => b.visits - a.visits);
  };
  const byCode = new Map<string, number>();
  for (const u of used) byCode.set(u.code, (byCode.get(u.code) ?? 0) - num(u.qty));
  return {
    visits: visits.length,
    byComplaint: count((v) => str(v.complaint).toLowerCase().split(/[,;]/)[0].trim()),
    byCostCenter: count((v) => (v.ccno ? cc.find((c) => c.ccno === v.ccno)?.ccdesc ?? v.ccno : 'Visitors')),
    byDisposition: count((v) => str(v.disposition)),
    suppliesUsed: [...byCode.entries()].map(([code, qty]) => ({ code, name: supplies.find((s) => s.code === code)?.name ?? code, unit: supplies.find((s) => s.code === code)?.unit ?? '', qty })).sort((a, b) => b.qty - a.qty),
  };
}
