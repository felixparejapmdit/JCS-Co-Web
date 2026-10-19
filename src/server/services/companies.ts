import { allCompanies, companies, companySettingsSource, disabledCompanyMap, getDb, isActiveCompany } from '../db';
import { saveDisabledCompanies, settingsSaved } from '../db/source';
import type { Session } from '../auth';
import { FORM } from '@/shared/codes';
import { nowStamp } from '@/shared/dates';
import { AppError, audit } from './context';

/**
 * Administration > Companies: which companies are active. A switched-off company is hidden
 * everywhere (sign-in, chooser, switcher, Data Source) and cannot be opened; nothing is deleted.
 * Administrators only. These operations run before a company database is opened.
 */

function requireAdmin(s: Session) {
  if (s.g !== 'ADMIN') throw new AppError('Only the ADMIN group can switch companies on or off.', 403);
}

export async function companyList(s: Session) {
  requireAdmin(s);
  const off = disabledCompanyMap();
  return {
    companies: allCompanies().map((c) => ({
      ba: c.ba,
      name: c.name,
      short: c.short,
      database: c.database,
      active: c.active,
      reason: off[c.ba]?.reason ?? '',
      by: off[c.ba]?.by ?? '',
      at: off[c.ba]?.at ?? '',
      current: c.ba === s.ba,
    })),
    source: companySettingsSource(),
    saved: settingsSaved(),
  };
}

export async function setCompanyActive(s: Session, input: { ba?: unknown; active?: unknown; reason?: unknown }) {
  requireAdmin(s);
  const ba = String(input.ba ?? '');
  const active = Boolean(input.active);
  const reason = String(input.reason ?? '').trim().slice(0, 120);
  const company = allCompanies().find((c) => c.ba === ba);
  if (!company) throw new AppError(`Unknown company ${ba}.`, 404);
  if (company.active === active) return `${company.name} is already ${active ? 'active' : 'switched off'}.`;

  if (!active) {
    if (ba === s.ba) throw new AppError(`You are signed in to ${company.name}. Switch to another company before switching it off.`, 400);
    if (companies().length <= 1) throw new AppError('At least one company must stay active.', 400);
  }

  const next = { ...disabledCompanyMap() };
  if (active) delete next[ba];
  else next[ba] = { reason: reason || 'Switched off', by: s.u, at: nowStamp() };
  saveDisabledCompanies(next);

  // Record it in the audit trail of the company the administrator is working in.
  if (isActiveCompany(s.ba)) {
    const db = await getDb(s.ba);
    await audit(
      { db, ba: s.ba, user: s.u, fullName: s.n, group: s.g },
      { form: FORM.APP_CONTROL, docno: ba, trans: active ? `Switch on company ${ba} ${company.name}` : `Switch off company ${ba} ${company.name}${reason ? `: ${reason}` : ''}`, table: 'batbl' }
    );
  }
  const saved = settingsSaved() ? '' : ' This server cannot save settings, so the change lasts only until it restarts.';
  return active
    ? `${company.name} is active again. Its users can sign in to it.${saved}`
    : `${company.name} is switched off. Nobody can sign in to it, and its data is kept.${saved}`;
}
