import type { Row } from '../db';
import { ACTION, ActionNo, statusTone, StatusTone } from '@/shared/codes';
import { Ctx, audit, fail, isAllowed } from './context';

export interface ActionDef {
  id: string;
  label: string;
  right: ActionNo;
  form?: string; // defaults to the document's own form code
  tone?: 'primary' | 'danger' | 'default';
  confirm?: string; // confirmation text shown before running
  hint?: string; // short explanation of what will happen
  input?: { key: string; label: string; type: 'text' | 'date' | 'number' | 'select'; required?: boolean; options?: { value: string; label: string }[]; default?: unknown }[];
}

export interface DocView {
  type: string;
  no: string;
  status: string;
  tone: StatusTone;
  title: string;
  subtitle?: string;
  header: Row;
  lines: Row[];
  totals: { label: string; value: number; strong?: boolean; kind?: 'money' | 'qty' }[];
  checks?: { label: string; ok: boolean; detail?: string }[];
  info?: { label: string; value: string }[];
  links?: { label: string; type: string; no: string }[];
  editable: boolean;
  actions: ActionDef[];
  log: { when: string; user: string; trans: string }[];
  print?: Row; // data for the printable form, when the document has one
}

export interface Loaded {
  h: Row;
  lines: Row[];
}

export interface ListParams {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface ListResult {
  rows: Row[];
  counts: Record<string, number>;
}

export interface DocService {
  type: string;
  title: string;
  form: string;
  tc?: string;
  table: string; // header table, used for document query and voids
  noColumn: string;
  list(ctx: Ctx, params: ListParams): Promise<ListResult>;
  load(ctx: Ctx, no: string): Promise<Loaded | null>;
  view(ctx: Ctx, doc: Loaded): Promise<Omit<DocView, 'actions' | 'log' | 'type' | 'tone'>>;
  actionDefs(ctx: Ctx, doc: Loaded): ActionDef[];
  perform(ctx: Ctx, doc: Loaded, action: string, payload: Row): Promise<string>;
  save(ctx: Ctx, input: Row): Promise<{ no: string; message?: string }>;
  defaults?(ctx: Ctx): Promise<Row>;
  sources?(ctx: Ctx, source: string): Promise<Row[]>;
  prefill?(ctx: Ctx, source: string, sourceNo: string): Promise<Row>;
}

const registry = new Map<string, DocService>();

export function registerDoc(svc: DocService) {
  registry.set(svc.type, svc);
}

export function docService(type: string): DocService {
  const svc = registry.get(type);
  if (!svc) fail(`Unknown document type: ${type}`, 404);
  return svc;
}

export function allDocServices(): DocService[] {
  return [...registry.values()];
}

async function permitted(ctx: Ctx, svc: DocService, defs: ActionDef[]): Promise<ActionDef[]> {
  const out: ActionDef[] = [];
  for (const d of defs) if (await isAllowed(ctx.db, ctx.group, d.form ?? svc.form, d.right)) out.push(d);
  return out;
}

export async function getDoc(ctx: Ctx, type: string, no: string): Promise<DocView> {
  const svc = docService(type);
  const doc = await svc.load(ctx, no);
  if (!doc) fail(`${svc.title}: document ${no} was not found.`, 404);
  const v = await svc.view(ctx, doc);
  const actions = await permitted(ctx, svc, svc.actionDefs(ctx, doc));
  const canEdit = v.editable && (await isAllowed(ctx.db, ctx.group, svc.form, ACTION.EDIT));
  const log = await ctx.db.all('translog', { where: { docno: no, form: svc.form }, orderBy: [['datetimelog', 'desc']], limit: 30 });
  return {
    ...v,
    type,
    tone: statusTone(v.status),
    editable: canEdit,
    actions,
    log: log.map((l) => ({ when: String(l.datetimelog), user: String(l.user), trans: String(l.trans) })),
  };
}

export async function actOnDoc(ctx: Ctx, type: string, no: string, action: string, payload: Row = {}): Promise<{ no: string; message: string }> {
  const svc = docService(type);
  return ctx.db.tx(async (db) => {
    const tctx = { ...ctx, db };
    const doc = await svc.load(tctx, no);
    if (!doc) fail(`${svc.title}: document ${no} was not found.`, 404);
    const def = svc.actionDefs(tctx, doc).find((d) => d.id === action);
    if (!def) fail(`"${action}" is not available for ${svc.title} ${no} in its current status.`);
    if (!(await isAllowed(db, ctx.group, def.form ?? svc.form, def.right))) {
      fail(`Your user group (${ctx.group}) is not allowed to ${def.label.toLowerCase()} ${svc.title.toLowerCase()}.`, 403);
    }
    for (const field of def.input ?? []) {
      if (field.required && (payload[field.key] === undefined || payload[field.key] === '')) fail(`${field.label} is required.`);
    }
    const message = await svc.perform(tctx, doc, action, payload);
    // The header before and after, for Logs > Change History (e.g. status Open → Approved).
    const after = (await svc.load(tctx, no))?.h ?? null;
    await audit(tctx, { form: def.form ?? svc.form, tc: svc.tc, docno: no, trans: `${def.label} ${svc.title}`, table: svc.table, before: doc.h, after });
    return { no, message };
  });
}

export async function saveDoc(ctx: Ctx, type: string, input: Row): Promise<{ no: string; message: string }> {
  const svc = docService(type);
  const isNew = !input.no;
  if (!(await isAllowed(ctx.db, ctx.group, svc.form, isNew ? ACTION.INSERT : ACTION.EDIT))) {
    fail(`Your user group (${ctx.group}) is not allowed to ${isNew ? 'create' : 'edit'} ${svc.title.toLowerCase()}.`, 403);
  }
  return ctx.db.tx(async (db) => {
    const tctx = { ...ctx, db };
    const before = isNew ? null : ((await svc.load(tctx, String(input.no)))?.h ?? null);
    const res = await svc.save(tctx, input);
    const after = (await svc.load(tctx, res.no))?.h ?? null;
    await audit(tctx, { form: svc.form, tc: svc.tc, docno: res.no, trans: `${isNew ? 'Create' : 'Edit'} ${svc.title}`, table: svc.table, before, after });
    return { no: res.no, message: res.message ?? `${svc.title} ${res.no} saved.` };
  });
}

/** Counts per status for the list tabs. */
export function countBy(rows: Row[], col = 'status'): Record<string, number> {
  const out: Record<string, number> = { all: rows.length };
  for (const r of rows) {
    const k = String(r[col] ?? '');
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/** Applies the standard list filters (status tab, free-text search, date range). */
export function filterList(rows: Row[], params: ListParams, searchCols: string[], dateCol = 'transdate'): Row[] {
  let out = rows;
  if (params.status && params.status !== 'all') out = out.filter((r) => String(r.status ?? '').toLowerCase() === params.status!.toLowerCase());
  if (params.q) {
    const q = params.q.toLowerCase();
    out = out.filter((r) => searchCols.some((c) => String(r[c] ?? '').toLowerCase().includes(q)));
  }
  if (params.from) out = out.filter((r) => String(r[dateCol] ?? '') >= params.from!);
  if (params.to) out = out.filter((r) => String(r[dateCol] ?? '') <= params.to!);
  return out;
}

export const STD = {
  approve: (form?: string, label = 'Approve'): ActionDef => ({ id: 'approve', label, right: ACTION.RELEASE, form, tone: 'primary' }),
  post: (form?: string, label = 'Post'): ActionDef => ({ id: 'post', label, right: ACTION.RELEASE, form, tone: 'primary' }),
  void: (hint = 'The document is cancelled and any stock or accounting entries are reversed.'): ActionDef => ({
    id: 'void',
    label: 'Void',
    right: ACTION.DELETE,
    tone: 'danger',
    confirm: 'Void this document? This cannot be undone.',
    hint,
  }),
  reopen: (): ActionDef => ({ id: 'reopen', label: 'Return to draft', right: ACTION.EDIT }),
};
