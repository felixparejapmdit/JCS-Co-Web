/**
 * Operations of the internal API (POST /api/aos) that only read data. One list for both sides:
 * - the browser keeps their answers in its screen cache (lib/api.ts);
 * - the server may answer them from the read cache, and never asks an idempotency key for them
 *   (server/platform). Every other operation counts as a write: it clears both caches.
 */
export const READ_OPS: ReadonlySet<string> = new Set([
  'app.info', 'auth.session', 'search', 'lookup', 'home.dashboard', 'home.tasks',
  'doc.list', 'doc.get', 'doc.defaults', 'doc.sources', 'doc.prefill', 'doc.summary', 'master.meta', 'master.list',
  'gl.periods', 'gl.openEntries', 'jvedit.list', 'jvedit.load', 'budget.periods', 'budget.monitor', 'budget.detail',
  'report.trialBalance', 'report.ledger', 'report.fs', 'report.fsSchedules', 'report.catalog', 'report.run',
  'inv.stock', 'inv.card', 'inv.register', 'inv.availability', 'lab.queue', 'prod.cosVsAsp', 'po.monitor', 'sales.register',
  'ar.openInvoices', 'ar.aging', 'ar.soa', 'cdcr.candidates', 'cdcr.list', 'deposit.list', 'cwt.list',
  'ap.openVouchers', 'ap.preview', 'ap.aging', 'fund.openVouchers', 'fund.custodians', 'cheque.getLayout',
  'hr.employees', 'pay.periods', 'pay.attendance', 'pay.register', 'pay.payslip', 'pay.adjustments', 'pay.ids',
  'dtr.preview', 'dtr.summary', 'admin.company', 'admin.users', 'admin.groups', 'admin.limits', 'admin.voids', 'admin.audit',
  'system.maintenance', 'system.docSetup', 'dsr.list', 'dsr.get', 'dsr.plantStock', 'salesman.workspace', 'salesman.queue',
  'cust.tools', 'cust.previewBulk', 'clinic.dashboard', 'clinic.report', 'dq.search', 'dq.info', 'source.status', 'companies.list', 'jobs.get', 'apikeys.list', 'groups.list',
]);

export function isReadOp(op: string): boolean {
  return READ_OPS.has(op);
}
