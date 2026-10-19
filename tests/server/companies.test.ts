import { afterEach, describe, expect, it } from 'vitest';
import { allCompanies, companies, companyInfo, companySettingsSource, getDb, isActiveCompany } from '@/server/db';
import { saveDisabledCompanies } from '@/server/db/source';
import { session } from '@/server/rpc';
import { companyList, setCompanyActive } from '@/server/services/companies';
import { DEMO_PASSWORD, demoAccounts } from '@/server/seed';
import type { Session } from '@/server/auth';

const admin: Session = { u: 'admin', n: 'System Administrator', g: 'ADMIN', ba: '8300', cos: ['8100', '8300'] };

// The test setup keeps JCS and Chemag on (COMPANIES_DISABLED=8200); restore that after every test.
afterEach(() => saveDisabledCompanies({ '8200': { reason: 'Dissolved' } }));

describe('inactive companies', () => {
  it('keeps APF (dissolved) off: never listed, opened or offered at sign-in', async () => {
    expect(companies().map((c) => c.ba)).toEqual(['8100', '8300']);
    expect(isActiveCompany('8200')).toBe(false);
    expect(allCompanies().find((c) => c.ba === '8200')).toMatchObject({ name: 'APF Corporation', active: false }); // nothing deleted
    expect(() => companyInfo('8200')).toThrow(/no longer active/);
    await expect(getDb('8200')).rejects.toThrow(/no longer active/);
    const apf = await session.signIn('admin', DEMO_PASSWORD, '8200');
    expect(apf.session).toBeUndefined();
    expect(apf.choose?.map((c) => c.ba)).toEqual(['8100', '8300']);
    await expect(session.switchCompany({ ...admin, cos: ['8100', '8200', '8300'] }, '8200')).rejects.toThrow(/no longer active/);
  });

  it('gives Chemag Trading every sample role JCS Chemical has', () => {
    for (const a of demoAccounts()) expect(a.companies, a.username).toBe(2);
  });

  it('switches JCS Chemical off from Administration > Companies, and back on', async () => {
    const msg = await setCompanyActive(admin, { ba: '8100', active: false, reason: 'On hold for now' });
    expect(msg).toMatch(/switched off/);
    expect(companySettingsSource()).toBe('administration');
    expect(companies().map((c) => c.ba)).toEqual(['8300']);
    const list = await companyList(admin);
    expect(list.companies.find((c) => c.ba === '8100')).toMatchObject({ active: false, reason: 'On hold for now', by: 'admin' });

    // Every account now opens Chemag directly; nobody is offered JCS.
    const finance = await session.signIn('finance', DEMO_PASSWORD);
    expect(finance.session).toMatchObject({ ba: '8300', cos: ['8300'] });
    expect(demoAccounts().every((a) => a.companies === 1)).toBe(true);
    await expect(getDb('8100')).rejects.toThrow(/no longer active/);

    // The change is in the audit trail of the company the administrator works in.
    const log = await (await getDb('8300')).all('translog', { where: { docno: '8100', form: '001' } });
    expect(log.some((r) => /Switch off company 8100/.test(String(r.trans)))).toBe(true);

    await setCompanyActive(admin, { ba: '8100', active: true });
    expect(companies().map((c) => c.ba)).toEqual(['8100', '8300']);
  });

  it('refuses to switch off your own company or the last active one, and non-administrators', async () => {
    await expect(setCompanyActive(admin, { ba: '8300', active: false })).rejects.toThrow(/signed in to Chemag/);
    await setCompanyActive(admin, { ba: '8100', active: false });
    await expect(setCompanyActive({ ...admin, ba: '8100' }, { ba: '8300', active: false })).rejects.toThrow(/At least one company/);
    await expect(setCompanyActive({ ...admin, g: 'FINHEAD' }, { ba: '8100', active: true })).rejects.toThrow(/ADMIN/);
    await expect(companyList({ ...admin, g: 'ACCTG' })).rejects.toThrow(/ADMIN/);
  });

  it('switches off JCS and APF by default, before anyone uses the page', () => {
    const env = process.env.COMPANIES_DISABLED;
    const file = process.env.CLOUDAOS_SETTINGS_FILE;
    const g = globalThis as unknown as { __cloudAosSettings?: unknown };
    const cached = g.__cloudAosSettings;
    try {
      delete process.env.COMPANIES_DISABLED;
      g.__cloudAosSettings = {}; // no administrator choice yet
      expect(companySettingsSource()).toBe('default');
      expect(companies().map((c) => c.ba)).toEqual(['8300']);
      expect(allCompanies().filter((c) => !c.active).map((c) => c.ba)).toEqual(['8100', '8200']);
    } finally {
      process.env.COMPANIES_DISABLED = env;
      process.env.CLOUDAOS_SETTINGS_FILE = file;
      g.__cloudAosSettings = cached;
    }
  });
});
