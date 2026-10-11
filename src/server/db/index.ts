import { MemoryDb, MemoryStore } from './memory';
import { MysqlDb } from './mysql';
import type { Db } from './types';

export * from './types';

export interface CompanyInfo {
  ba: string;
  name: string;
  short: string;
  database: string;
}

/** The three business areas served by the legacy system (PLAN.md section 2.3). */
const COMPANY_DEFAULTS: CompanyInfo[] = [
  { ba: '8100', name: 'JCS Chemical Industries, Inc.', short: 'JCS Chemical', database: process.env.DB_JCS || 'jcs' },
  { ba: '8200', name: 'APF Corporation', short: 'APF Corp.', database: process.env.DB_APF || 'apf' },
  { ba: '8300', name: 'Chemag Trading Corporation', short: 'Chemag Trading', database: process.env.DB_CHEMAG || 'chemag' },
];

export function isMysqlMode(): boolean {
  return Boolean(process.env.DATABASE_HOST);
}

export function companies(): CompanyInfo[] {
  return COMPANY_DEFAULTS;
}

export function companyInfo(ba: string): CompanyInfo {
  const c = COMPANY_DEFAULTS.find((x) => x.ba === ba);
  if (!c) throw new Error(`Unknown business area ${ba}`);
  return c;
}

// ---------------------------------------------------------------------------
// Demo mode: one in-memory store per company, seeded on first use. Kept on
// globalThis so every route handler in the same server instance shares it.
// ---------------------------------------------------------------------------
type DemoState = { stores: Map<string, MemoryStore>; seeding: Map<string, Promise<MemoryStore>> };
const g = globalThis as unknown as { __cloudAosDemo?: DemoState; __cloudAosPools?: Map<string, any> };
const demo: DemoState = (g.__cloudAosDemo ??= { stores: new Map(), seeding: new Map() });

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
