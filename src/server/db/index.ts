import { MemoryDb, MemoryStore } from './memory';
import { MysqlDb } from './mysql';
import type { Db } from './types';
import { DbError } from './types';
import { CompanyOff, companySettings, dataSource, mysqlConfigured } from './source';

export * from './types';
export { dataSource, mysqlConfigured } from './source';

export interface CompanyInfo {
  ba: string;
  name: string;
  short: string;
  database: string;
  /** False for a company that is switched off: it cannot be signed in to or opened, and its database is left alone. */
  active: boolean;
}

/** The three business areas served by the legacy system (PLAN.md section 2.3). */
const COMPANY_DEFAULTS: Omit<CompanyInfo, 'active'>[] = [
  { ba: '8100', name: 'JCS Chemical Industries, Inc.', short: 'JCS Chemical', database: process.env.DB_JCS || 'jcs' },
  { ba: '8200', name: 'APF Corporation', short: 'APF Corp.', database: process.env.DB_APF || 'apf' },
  { ba: '8300', name: 'Chemag Trading Corporation', short: 'Chemag Trading', database: process.env.DB_CHEMAG || 'chemag' },
];

/**
 * Companies switched off until an administrator decides otherwise in Administration > Companies.
 * APF Corporation (8200) was dissolved and JCS Chemical (8100) is on hold (client, October 2026),
 * so only Chemag Trading is active by default. Nothing is deleted.
 */
const DEFAULT_OFF: Record<string, CompanyOff> = {
  '8100': { reason: 'On hold for now' },
  '8200': { reason: 'Dissolved' },
};

/** Where the on/off choice comes from: the Companies page, COMPANIES_DISABLED in .env, or the built-in default. */
export function companySettingsSource(): 'administration' | 'environment' | 'default' {
  if (companySettings()) return 'administration';
  return process.env.COMPANIES_DISABLED !== undefined ? 'environment' : 'default';
}

/** The switched-off companies with their reasons, by business area. */
export function disabledCompanyMap(): Record<string, CompanyOff> {
  const chosen = companySettings();
  if (chosen) return chosen;
  const env = process.env.COMPANIES_DISABLED;
  if (env === undefined) return DEFAULT_OFF;
  const map: Record<string, CompanyOff> = {};
  for (const ba of env.split(',').map((x) => x.trim()).filter(Boolean)) map[ba] = DEFAULT_OFF[ba] ?? {};
  return map;
}

function disabledCompanies(): Set<string> {
  return new Set(Object.keys(disabledCompanyMap()));
}

/** True when the app reads the MySQL databases; false for the in-memory sample data (Administration > Data Source). */
export function isMysqlMode(): boolean {
  return mysqlConfigured() && dataSource() === 'mysql';
}

/** Every company the system knows, active or not (for administration screens). */
export function allCompanies(): CompanyInfo[] {
  const off = disabledCompanies();
  return COMPANY_DEFAULTS.map((c) => ({ ...c, active: !off.has(c.ba) }));
}

/** The active companies: the only ones that can be signed in to, listed or opened. */
export function companies(): CompanyInfo[] {
  return allCompanies().filter((c) => c.active);
}

export function isActiveCompany(ba: string): boolean {
  return companies().some((c) => c.ba === ba);
}

export function companyInfo(ba: string): CompanyInfo {
  const c = allCompanies().find((x) => x.ba === ba);
  if (!c) throw new Error(`Unknown business area ${ba}`);
  if (!c.active) throw new DbError(`${c.name} is no longer active in Cloud AOS.`, 403);
  return c;
}

// ---------------------------------------------------------------------------
// Demo mode: one in-memory store per company, seeded on first use. Kept on
// globalThis so every route handler in the same server instance shares it.
// ---------------------------------------------------------------------------
type DemoState = { stores: Map<string, MemoryStore>; seeding: Map<string, Promise<MemoryStore>> };
const g = globalThis as unknown as { __cloudAosDemo?: DemoState; __cloudAosPools?: Map<string, any> };
const demo: DemoState = (g.__cloudAosDemo ??= { stores: new Map(), seeding: new Map() });

/** Companies whose sample data is currently held in memory. */
export function demoCompaniesInMemory(): string[] {
  return [...demo.stores.keys()];
}

async function demoStore(ba: string): Promise<MemoryStore> {
  const ready = demo.stores.get(ba);
  if (ready) return ready;
  let pending = demo.seeding.get(ba);
  if (!pending) {
    pending = (async () => {
      const store = new MemoryStore();
      const { seedCompany } = await import('../seed');
      await seedCompany(new MemoryDb(ba, store));
      demo.stores.set(ba, store);
      return store;
    })();
    demo.seeding.set(ba, pending);
    pending.catch(() => demo.seeding.delete(ba));
  }
  return pending;
}

/** Drops the demo data for one company so it is re-seeded on the next request. */
export function resetDemoCompany(ba: string) {
  demo.stores.delete(ba);
  demo.seeding.delete(ba);
}

// ---------------------------------------------------------------------------
// MySQL mode: one pool per legacy database, opened lazily.
// ---------------------------------------------------------------------------
async function pool(database: string) {
  const pools = (g.__cloudAosPools ??= new Map());
  let p = pools.get(database);
  if (!p) {
    const mysql = await import('mysql2/promise');
    p = mysql.createPool({
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT || 3306),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database,
      connectionLimit: Number(process.env.DATABASE_POOL_SIZE || 5),
      dateStrings: true,
      decimalNumbers: true,
      ssl: process.env.DATABASE_SSL === 'true' ? {} : undefined,
    });
    // Optional session SQL mode, e.g. the lenient mode the legacy server runs with (local rebuilt schema).
    const sqlMode = process.env.DATABASE_SQL_MODE;
    if (sqlMode) p.on('connection', (conn: any) => conn.query('SET SESSION sql_mode = ?', [sqlMode]));
    pools.set(database, p);
  }
  return p;
}

/** Returns a data handle for one company. A fresh handle per request keeps transactions isolated. */
export async function getDb(ba: string): Promise<Db> {
  const info = companyInfo(ba);
  if (isMysqlMode()) {
    return new MysqlDb(ba, await pool(info.database), process.env.DATABASE_ALLOW_WRITES === 'true');
  }
  return new MemoryDb(ba, await demoStore(ba));
}
