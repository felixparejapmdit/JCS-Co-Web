import { describe, expect, it } from 'vitest';
import { allCompanies, companies, companyInfo, getDb, isActiveCompany } from '@/server/db';
import { session } from '@/server/rpc';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/server/seed';

describe('inactive companies (APF Corporation, dissolved)', () => {
  it('lists only JCS Chemical and Chemag Trading as active', () => {
    expect(companies().map((c) => c.ba)).toEqual(['8100', '8300']);
    expect(isActiveCompany('8200')).toBe(false);
    // Still known, so it can be switched back on later; nothing is deleted.
    expect(allCompanies().find((c) => c.ba === '8200')).toMatchObject({ name: 'APF Corporation', active: false });
  });

  it('refuses to open APF', async () => {
    expect(() => companyInfo('8200')).toThrow(/no longer active/);
    await expect(getDb('8200')).rejects.toThrow(/no longer active/);
  });

  it('never offers APF at sign-in', async () => {
    // accountant belongs to JCS and APF: with APF off, JCS opens directly.
    const one = await session.signIn('accountant', DEMO_PASSWORD);
    expect(one.session).toMatchObject({ ba: '8100', cos: ['8100'] });
    // admin belongs to all three: the chooser lists only the active two.
    const admin = await session.signIn('admin', DEMO_PASSWORD);
    expect(admin.choose?.map((c) => c.ba)).toEqual(['8100', '8300']);
    // Asking for APF directly does not sign in to it.
    const apf = await session.signIn('admin', DEMO_PASSWORD, '8200');
    expect(apf.session).toBeUndefined();
    expect(apf.choose?.map((c) => c.ba)).not.toContain('8200');
  });

  it('refuses to switch to APF and counts only active companies on the sample accounts', async () => {
    await expect(session.switchCompany({ u: 'admin', n: 'System Administrator', g: 'ADMIN', ba: '8100', cos: ['8100', '8200', '8300'] }, '8200')).rejects.toThrow(/no longer active/);
    expect(DEMO_ACCOUNTS.find((a) => a.username === 'accountant')?.companies).toBe(1);
    expect(DEMO_ACCOUNTS.find((a) => a.username === 'admin')?.companies).toBe(2);
  });
});
