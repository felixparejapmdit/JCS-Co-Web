/**
 * The internal API (POST /api/aos): a backend-for-frontend (BFF). Its operations are shaped like the
 * screens that call them (home.dashboard, doc.list, ...), so each screen needs one round trip.
 * Outside systems use the public, versioned API instead (server/api/v1, docs/API.md).
 *
 * Every operation runs through runOp: maintenance guard, read cache for reads, and after a write
 * the company's cached answers are cleared. HTTP concerns (sessions, rate limits, idempotency,
 * errors) are in app/api/aos/route.ts and server/platform.
 */
import type { Row } from './db';
import { companies, getDb, isMysqlMode, resetDemoCompany } from './db';
import { isReadOp } from '@/shared/ops';
import { cachedRead, invalidateCompany, readCacheEnabled } from './platform/read-cache';
import { getJob } from './platform/jobs';
import * as apikeys from './services/apikeys';
import type { Session } from './auth';
import { ACTION, FORM } from '@/shared/codes';
import { Ctx, fail, requireRight } from './services/context';
import { actOnDoc, docService, getDoc, saveDoc } from './services/docs';
// Importing the services registers their document types.
import * as dsr from './services/dsr';
import * as salesman from './services/salesman';
import * as customers from './services/customers';
import * as clinic from './services/clinic';
import * as fs from './services/fs';
import * as docquery from './services/docquery';
import * as reports from './services/reports';
import './services/depapp';
import * as system from './services/system';
import * as gl from './services/gl';
import * as masters from './services/masters';
import * as inventory from './services/inventory';
import * as purchasing from './services/purchasing';
import * as sales from './services/sales';
import * as ar from './services/receivables';
import * as ap from './services/payables';
import * as payroll from './services/payroll';
import * as funds from './services/funds';
import * as budget from './services/budget';
import * as production from './services/production';
import * as admin from './services/admin';
import * as logs from './services/logs';
import * as session from './services/session';
import * as datasource from './services/datasource';
import * as companyAdmin from './services/companies';

type Handler = (ctx: Ctx, args: Row, s: Session) => Promise<unknown>;

const ops: Record<string, Handler> = {
  // --- session ---------------------------------------------------------------
  'auth.session': async (_c, _a, s) => session.sessionInfo(s),
  'dsr.list': (c, a) => dsr.dsrList(c, { status: a.status ? String(a.status) : undefined }),
  'dsr.open': (c, a) => dsr.openDsr(c, a),
  'dsr.get': (c, a) => dsr.dsrDetail(c, String(a.dsrno ?? '')),
  'dsr.load': (c, a) => dsr.loadVan(c, String(a.dsrno ?? ''), a),
  'dsr.invoice': (c, a) => dsr.dsrInvoice(c, String(a.dsrno ?? ''), a),
  'dsr.voidInvoice': (c, a) => dsr.voidDsrInvoice(c, String(a.dsrno ?? ''), String(a.invno ?? '')),
  'dsr.return': (c, a) => dsr.returnFromVan(c, String(a.dsrno ?? ''), a),
  'dsr.count': (c, a) => dsr.saveCount(c, String(a.dsrno ?? ''), a),
  'dsr.close': (c, a) => dsr.closeDsr(c, String(a.dsrno ?? ''), a),
  'dsr.plantStock': (c, a) => dsr.plantStock(c, String(a.plntno ?? '')),
  'salesman.workspace': (c, a) => salesman.salesmanWorkspace(c, String(a.smnno ?? '')),
  'salesman.request': (c, a) => salesman.submitOrderRequest(c, a),
  'salesman.cancel': (c, a) => salesman.cancelOrderRequest(c, String(a.reqno ?? '')),
  'salesman.queue': (c) => salesman.managerQueue(c),
  'salesman.decide': (c, a) => salesman.decideOrderRequest(c, a),
  'cust.tools': (c) => customers.customerTools(c),
  'cust.previewBulk': (c, a) => customers.previewBulkUpdate(c, (a.rows ?? []) as customers.BulkRow[], (a.defaults ?? {}) as customers.BulkRow),
  'cust.applyBulk': (c, a) => customers.applyBulkUpdate(c, (a.rows ?? []) as customers.BulkRow[], (a.defaults ?? {}) as customers.BulkRow),
  'cust.transfer': (c, a) => customers.transferCustomers(c, a),
  'cust.request': (c, a) => customers.requestCustomer(c, a),
  'cust.decideRequest': (c, a) => customers.decideCustomerRequest(c, a),
  'pay.ids': (c) => payroll.payrollIds(c),
  'pay.updateId': (c, a) => payroll.updatePayrollId(c, String(a.payidno ?? ''), a),
  'pay.setIdStatus': (c, a) => payroll.setPayrollIdStatus(c, String(a.payidno ?? ''), String(a.status ?? '')),
  'pay.deleteId': (c, a) => payroll.deletePayrollId(c, String(a.payidno ?? '')),
  'dtr.preview': (c, a) => payroll.dtrPreview(c, String(a.payidno ?? ''), (a.rows ?? []) as Row[]),
  'dtr.upload': (c, a) => payroll.uploadDtr(c, String(a.payidno ?? ''), (a.rows ?? []) as Row[]),
  'dtr.summary': (c, a) => payroll.dtrSummary(c, String(a.payidno ?? '')),
  'dtr.apply': (c, a) => payroll.applyDtr(c, String(a.payidno ?? '')),
  'clinic.dashboard': (c) => clinic.clinicDashboard(c),
  'clinic.saveVisit': (c, a) => clinic.saveVisit(c, a),
  'clinic.voidVisit': (c, a) => clinic.voidVisit(c, String(a.visitno ?? ''), String(a.reason ?? '')),
  'clinic.saveSupply': (c, a) => clinic.saveSupply(c, a),
  'clinic.receive': (c, a) => clinic.receiveSupply(c, a),
  'clinic.report': (c, a) => clinic.clinicReport(c, String(a.from ?? ''), String(a.to ?? '')),
  'report.fsSchedules': (c, a) => fs.fsSchedules(c, { year: Number(a.year), month: Number(a.month), includeUnposted: Boolean(a.includeUnposted) }),
  'dq.search': (c, a) => docquery.queryDocuments(c, String(a.q ?? '')),
  'dq.info': (c, a) => docquery.correctionInfo(c, String(a.type ?? ''), String(a.no ?? '')),
  'dq.correct': (c, a) => docquery.applyCorrection(c, a),
  'report.catalog': (c) => reports.reportCatalog(c),
  'report.run': (c, a) => reports.runReport(c, String(a.id ?? ''), (a.params ?? {}) as Record<string, unknown>),
  'system.favToggle': (c, a) => system.toggleFavourite(c, String(a.href ?? '')),
  'system.maintenance': (c) => system.maintenancePage(c),
  'system.setMaintenance': (c, a) => system.setMaintenance(c, a),
  'system.docSetup': (c) => system.docSetup(c),
  'system.setDownload': (c, a) => system.setDownloadHold(c, Boolean(a.hold)),
  'auth.changePassword': (c, a) => admin.changePassword(c, String(a.current ?? ''), String(a.next ?? '')),

  // --- documents (generic) -----------------------------------------------------
  'doc.list': async (c, a) => {
    const svc = docService(String(a.type));
    await requireRight(c, svc.form, ACTION.VIEW, `view ${svc.title.toLowerCase()}s`);
    return svc.list(c, a);
  },
  'doc.get': async (c, a) => {
    const svc = docService(String(a.type));
    await requireRight(c, svc.form, ACTION.VIEW, `view ${svc.title.toLowerCase()}s`);
    return getDoc(c, svc.type, String(a.no));
  },
  'doc.defaults': async (c, a) => {
    const svc = docService(String(a.type));
    return svc.defaults ? svc.defaults(c) : {};
  },
  'doc.sources': async (c, a) => {
    const svc = docService(String(a.type));
    await requireRight(c, svc.form, ACTION.INSERT, `create ${svc.title.toLowerCase()}s`);
    return svc.sources ? svc.sources(c, String(a.source)) : [];
  },
  'doc.prefill': async (c, a) => {
    const svc = docService(String(a.type));
    await requireRight(c, svc.form, ACTION.INSERT, `create ${svc.title.toLowerCase()}s`);
    if (!svc.prefill) fail('This document cannot be created from another one.');
    return svc.prefill(c, String(a.source), String(a.no));
  },
  'doc.save': (c, a) => saveDoc(c, String(a.type), (a.input ?? {}) as Row),
  'doc.summary': (c, a) => funds.fundSummary(c, String(a.type)),
  'doc.act': (c, a) => actOnDoc(c, String(a.type), String(a.no), String(a.action), (a.payload ?? {}) as Row),

  // --- master data -------------------------------------------------------------
  'master.meta': async (_c, a) => masters.masterMeta(String(a.id)),
  'master.list': (c, a) => masters.listMaster(c, String(a.id)),
  'master.save': (c, a) => masters.saveMaster(c, String(a.id), (a.row ?? {}) as Row, Boolean(a.isNew)),
  lookup: (c, a) => masters.lookup(c, String(a.name)),

  // --- general ledger ------------------------------------------------------------
  'gl.periods': async (c, a) => {
    await requireRight(c, FORM.PERIOD_CLOSING, ACTION.VIEW, 'view accounting periods');
    return gl.periods(c, Number(a.year));
  },
  'gl.close': async (c, a) => {
    await requireRight(c, FORM.PERIOD_CLOSING, ACTION.RELEASE, 'close accounting periods');
    return gl.closePeriod(c, Number(a.year), Number(a.month));
  },
  'gl.reopen': async (c, a) => {
    await requireRight(c, FORM.PERIOD_CLOSING, ACTION.RELEASE, 'reopen accounting periods');
    return gl.reopenPeriod(c, Number(a.year), Number(a.month), String(a.reason ?? ''));
  },
  'gl.openEntries': async (c) => {
    await requireRight(c, FORM.JV_POSTING, ACTION.VIEW, 'view JV posting');
    return gl.openEntriesSummary(c);
  },
  'gl.postOpen': async (c, a) => {
    await requireRight(c, FORM.JV_POSTING, ACTION.RELEASE, 'post journal entries');
    return c.db.tx((db) => gl.postOpenEntries({ ...c, db }, String(a.upTo)));
  },
  'jvedit.list': async (c, a) => {
    await requireRight(c, FORM.JOURNAL_VOUCHER, ACTION.VIEW, 'view automatic JV entries');
    return gl.jvEditList(c, { from: a.from ? String(a.from) : undefined, to: a.to ? String(a.to) : undefined, source: a.source ? String(a.source) : undefined });
  },
  'jvedit.load': async (c, a) => {
    await requireRight(c, FORM.JOURNAL_VOUCHER, ACTION.VIEW, 'view automatic JV entries');
    return gl.jvEditLoad(c, String(a.tc), String(a.docno));
  },
  'jvedit.save': (c, a) => gl.jvEditSave(c, a),
  'budget.periods': (c) => budget.budgetPeriods(c),
  'budget.monitor': (c, a) => budget.budgetMonitor(c, String(a.datefr ?? ''), String(a.dateto ?? '')),
  'budget.detail': (c, a) => budget.budgetDetail(c, String(a.datefr), String(a.dateto), String(a.ccno), String(a.acctno)),
  'budget.save': (c, a) => budget.saveBudget(c, a),
  'report.trialBalance': async (c, a) => {
    await requireRight(c, FORM.GL_REPORTS, ACTION.VIEW, 'view GL reports');
    return gl.trialBalance(c, { asOf: String(a.asOf), includeUnposted: Boolean(a.includeUnposted) });
  },
  'report.ledger': async (c, a) => {
    await requireRight(c, FORM.GL_REPORTS, ACTION.VIEW, 'view GL reports');
    return gl.accountLedger(c, { acctno: String(a.acctno), from: String(a.from), to: String(a.to), includeUnposted: Boolean(a.includeUnposted) });
  },
  'report.fs': async (c, a) => {
    await requireRight(c, FORM.FINANCIAL_REPORTS, ACTION.VIEW, 'view financial statements');
    return gl.financialStatements(c, { year: Number(a.year), month: Number(a.month), includeUnposted: Boolean(a.includeUnposted) });
  },

  // --- inventory, plants, purchasing, production ---------------------------------
  'inv.stock': (c, a) => inventory.stockReport(c, a),
  'inv.card': (c, a) => inventory.stockCard(c, a as never),
  'inv.register': (c, a) => inventory.mmRegister(c, a as never),
  'inv.availability': (c, a) => inventory.availability(c, String(a.plntno), String(a.codeno)),
  'lab.queue': (c, a) => inventory.labQueue(c, String(a.status ?? 'Pending')),
  'lab.set': (c, a) => inventory.setLabStatus(c, String(a.docno), a.result === 'Rejected' ? 'Rejected' : 'Passed', String(a.remarks ?? '')),
  'prod.cosVsAsp': (c, a) => production.cosVsAsp(c, { from: String(a.from), to: String(a.to) }),
  'po.monitor': async (c) => {
    await requireRight(c, FORM.PO_REPORTS, ACTION.VIEW, 'view PO reports');
    return purchasing.poMonitor(c);
  },

  // --- sales and receivables -----------------------------------------------------
  'sales.register': async (c, a) => {
    await requireRight(c, FORM.SALES_ORDER, ACTION.VIEW, 'view sales reports');
    return sales.salesRegister(c, a as never);
  },
  'ar.openInvoices': async (c, a) => {
    await requireRight(c, FORM.COLLECTION, ACTION.VIEW, 'view open invoices');
    return ar.openInvoicesFor(c, String(a.custno));
  },
  'ar.aging': (c, a) => ar.arAging(c, a.asOf ? String(a.asOf) : undefined),
  'ar.soa': (c, a) => ar.statementOfAccount(c, String(a.custno)),
  'cdcr.candidates': async (c, a) => {
    await requireRight(c, FORM.CDCR, ACTION.VIEW, 'view daily collections');
    return ar.cdcrCandidates(c, String(a.asOf));
  },
  'cdcr.generate': (c, a) => ar.generateCdcr(c, String(a.asOf)),
  'cdcr.list': (c) => ar.listCdcr(c),
  'deposit.create': (c, a) => ar.createDeposit(c, a as never),
  'deposit.list': (c) => ar.listDeposits(c),
  'cwt.list': (c, a) => ar.cwtList(c, { year: Number(a.year), quarter: a.quarter ? Number(a.quarter) : undefined, status: (a.status as never) ?? 'all' }),
  'cwt.mark': (c, a) => ar.markCwtReceived(c, String(a.orno), String(a.invno), Boolean(a.received)),

  // --- payables --------------------------------------------------------------------
  'ap.openVouchers': async (c, a) => {
    await requireRight(c, FORM.CHECK_VOUCHER, ACTION.VIEW, 'view vouchers');
    return ap.openVouchers(c.db, String(a.venno));
  },
  'ap.preview': async (c, a) => ap.computeVoucher(c.db, (a.lines ?? []) as Row[]),
  'fund.openVouchers': async (c, a) => {
    await requireRight(c, FORM.FUND_REPLENISHMENT, ACTION.VIEW, 'view fund replenishments');
    return funds.openFundVouchers(c, String(a.tc), String(a.user ?? c.user), String(a.replno ?? ''));
  },
  'fund.custodians': async (c, a) => {
    await requireRight(c, FORM.FUND_REPLENISHMENT, ACTION.VIEW, 'view fund replenishments');
    return funds.fundCustodians(c, String(a.tc));
  },
  'ap.aging': (c, a) => ap.apAging(c, a.asOf ? String(a.asOf) : undefined),
  'cv.printed': async (c, a) => {
    await requireRight(c, FORM.CHECK_VOUCHER, ACTION.VIEW, 'print cheques');
    return ap.recordPrint(c, String(a.docno), '43');
  },
  'cheque.layout': (c, a) => ap.saveChequeLayout(c, String(a.acctno), (a.layout ?? {}) as Row),
  'cheque.getLayout': async (c, a) => {
    await requireRight(c, FORM.CHECK_VOUCHER, ACTION.VIEW, 'view cheque layouts');
    return c.db.one('ng_cheque_layouts', { acctno: String(a.acctno) });
  },

  // --- HR & payroll ----------------------------------------------------------------
  'hr.employees': (c) => payroll.employees(c),
  'hr.saveEmployee': (c, a) => payroll.saveEmployee(c, (a.row ?? {}) as Row, Boolean(a.isNew)),
  'pay.periods': (c) => payroll.payrollPeriods(c),
  'pay.create': (c, a) => payroll.createPayrollPeriod(c, a),
  'pay.attendance': (c, a) => payroll.attendance(c, String(a.payidno)),
  'pay.saveAttendance': (c, a) => payroll.saveAttendance(c, String(a.payidno), (a.rows ?? []) as Row[]),
  'pay.compute': (c, a) => payroll.computePayroll(c, String(a.payidno)),
  'pay.register': (c, a) => payroll.payrollRegister(c, String(a.payidno)),
  'pay.post': (c, a) => payroll.postPayroll(c, String(a.payidno)),
  'pay.unpost': (c, a) => payroll.unpostPayroll(c, String(a.payidno)),
  'pay.payslip': (c, a) => payroll.payslip(c, String(a.payidno), String(a.empno)),
  'pay.adjustments': (c, a) => payroll.adjustments(c, String(a.payidno)),
  'pay.addAdjustment': (c, a) => payroll.addAdjustment(c, a),

  // --- administration --------------------------------------------------------------
  'admin.company': async (c) => {
    await requireRight(c, FORM.APP_CONTROL, ACTION.VIEW, 'view company settings');
    return admin.companyProfile(c);
  },
  'admin.saveCompany': (c, a) => admin.saveCompanyProfile(c, a),
  'admin.users': (c) => admin.listUsers(c),
  'admin.saveUser': (c, a) => admin.saveUser(c, (a.row ?? {}) as Row, Boolean(a.isNew)),
  'admin.resetUser': (c, a) => admin.resetUser(c, String(a.username)),
  'admin.groups': (c) => admin.groupsWithRights(c),
  'admin.saveGroup': (c, a) => admin.saveGroupRights(c, String(a.group), (a.rights ?? {}) as Record<string, number[]>, a.info as never),
  'groups.list': (c) => admin.listGroups(c),
  'logs.changes': (c, a) => logs.changeHistory(c, a),
  'logs.signins': (c, a) => logs.signInLog(c, a),
  'logs.access': (c, a) => logs.accessChanges(c, a),
  'groups.create': (c, a) => admin.createGroup(c, a),
  'groups.update': (c, a) => admin.updateGroup(c, a),
  'groups.delete': (c, a) => admin.deleteGroup(c, a.code),
  'admin.saveMatrix': (c, a) => admin.saveAccessMatrix(c, (a.changes ?? {}) as Record<string, Record<string, number[]>>),
  'admin.limits': (c) => admin.approvalLimits(c),
  'admin.saveLimit': (c, a) => admin.saveApprovalLimit(c, a),
  'admin.voids': (c) => admin.listVoidRequests(c),
  'admin.requestVoid': (c, a) => admin.requestVoid(c, a),
  'admin.decideVoid': (c, a) => admin.decideVoid(c, String(a.docno), String(a.tc), Boolean(a.approve), String(a.note ?? '')),
  'admin.audit': (c, a) => admin.auditTrail(c, a),
  'apikeys.list': (c) => apikeys.listKeys(c),
  'apikeys.create': (c, a) => apikeys.createKey(c, { name: String(a.name ?? ''), group: String(a.group ?? '') }),
  'apikeys.revoke': (c, a) => apikeys.revokeKey(c, String(a.id ?? '')),
  search: (c, a) => admin.findDocuments(c, String(a.q ?? '')),
  'home.dashboard': (c) => admin.dashboard(c),
  'home.tasks': (c) => admin.myTasks(c),
  'demo.reset': async (c) => {
    if (isMysqlMode()) fail('Resetting is only available on the demo data.', 403);
    await requireRight(c, FORM.APP_CONTROL, ACTION.RELEASE, 'reset the demo data');
    resetDemoCompany(c.ba);
    return 'The demo data was reset to its starting state.';
  },
};

/**
 * Administration > Data Source and Companies. These run before a company database is opened, so an
 * administrator can always switch back to the sample data (even when MySQL is down) or manage companies.
 */
const SOURCE_OPS: Record<string, (args: Row, s: Session) => Promise<unknown>> = {
  'source.status': (_a, s) => datasource.dataSourceStatus(s),
  'source.set': (a, s) => datasource.chooseDataSource(s, String(a.source ?? '')),
  'source.loadSample': (_a, s) => datasource.loadSample(s),
  'companies.list': (_a, s) => companyAdmin.companyList(s),
  'companies.setActive': (a, s) => companyAdmin.setCompanyActive(s, a),
  'jobs.get': (a, s) => getJob(String(a.id ?? ''), s.u),
};

/** Operations that change which data is served at all: every company's cached answers go. */
const CLEARS_ALL = new Set(['source.set', 'source.loadSample', 'companies.setActive']);

async function invalidateAll() {
  for (const c of companies()) await invalidateCompany(c.ba);
}

/** Reads never answered from the read cache: their data is written outside runOp (sign-ins). */
const NOT_CACHED = new Set(['logs.signins']);

/** Operations that still work while the company is in maintenance (the shell shows the notice). */
const OPEN_IN_MAINTENANCE = new Set(['auth.session']);

export async function runOp(op: string, args: Row, s: Session, ip?: string): Promise<unknown> {
  args = args ?? {};
  const sourceOp = SOURCE_OPS[op];
  if (sourceOp) {
    const out = await sourceOp(args, s);
    if (CLEARS_ALL.has(op)) await invalidateAll();
    return out;
  }
  const handler = ops[op];
  if (!handler) fail(`Unknown operation: ${op}`, 404);
  const db = await getDb(s.ba);
  const ctx: Ctx = { db, ba: s.ba, user: s.u, fullName: s.n, group: s.g, ip };
  if (!OPEN_IN_MAINTENANCE.has(op)) await system.guardMaintenance(db, s.g);
  if (isReadOp(op)) {
    if (!readCacheEnabled(db.mode === 'mysql') || NOT_CACHED.has(op)) return handler(ctx, args, s);
    return cachedRead({ ba: s.ba, user: s.u, op, args }, () => handler(ctx, args, s));
  }
  const out = await handler(ctx, args, s);
  await invalidateCompany(s.ba); // a save: earlier cached answers of this company are stale
  return out;
}

export { session };
