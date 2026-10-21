import { allCompanies, companies, dataSource, demoCompaniesInMemory, isMysqlMode, mysqlConfigured } from '../db';
import { loadSampleIntoMysql } from '../db/sample-mysql';
import { DataSource, sampleLoadAllowed, sampleLoadedAt, setDataSource } from '../db/source';
import type { Session } from '../auth';
import { AppError } from './context';
import { markRunning, runningJob, startJob } from '../platform/jobs';
import { invalidateCompany } from '../platform/read-cache';

/**
 * Administration > Data Source: choose between the in-memory sample data and the MySQL
 * databases, and load the sample data into a local MySQL server. Administrators only. These
 * operations run before a company database is opened, so they still work when MySQL is down.
 */

interface CompanyStatus {
  ba: string;
  name: string;
  database: string;
  reachable: boolean;
  error?: string;
  tables: number;
  approxRows: number;
  users: number;
  sampleLoadedAt: string | null;
  inMemory: boolean;
}

function requireAdmin(s: Session) {
  if (s.g !== 'ADMIN') throw new AppError('Only the ADMIN group can change where the data comes from.', 403);
}

async function inspect(database: string): Promise<Omit<CompanyStatus, 'ba' | 'name' | 'database' | 'sampleLoadedAt' | 'inMemory'>> {
  const mysql = await import('mysql2/promise');
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT || 3306),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database,
      connectTimeout: 4000,
      ssl: process.env.DATABASE_SSL === 'true' ? {} : undefined,
    });
    const [[t]] = (await conn.query(
      "SELECT COUNT(*) AS n, COALESCE(SUM(TABLE_ROWS), 0) AS r FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
      [database]
    )) as any;
    let users = 0;
    try {
      const [[u]] = (await conn.query('SELECT COUNT(*) AS n FROM sys_userrecords')) as any;
      users = Number(u.n);
    } catch {
      users = 0;
    }
    return { reachable: true, tables: Number(t.n), approxRows: Number(t.r), users };
  } catch (err: any) {
    return { reachable: false, error: String(err?.code ?? err?.message ?? err), tables: 0, approxRows: 0, users: 0 };
  } finally {
    await conn?.end().catch(() => undefined);
  }
}

export async function dataSourceStatus(s: Session) {
  requireAdmin(s);
  const loaded = sampleLoadedAt();
  const inMemory = new Set(demoCompaniesInMemory());
  const list: CompanyStatus[] = [];
  for (const c of companies()) {
    const base = { ba: c.ba, name: c.short, database: c.database, sampleLoadedAt: loaded[c.ba] ?? null, inMemory: inMemory.has(c.ba) };
    list.push(mysqlConfigured() ? { ...base, ...(await inspect(c.database)) } : { ...base, reachable: false, error: 'Not configured', tables: 0, approxRows: 0, users: 0 });
  }
  return {
    current: dataSource(),
    mysqlConfigured: mysqlConfigured(),
    mysql: mysqlConfigured()
      ? {
          host: String(process.env.DATABASE_HOST),
          port: Number(process.env.DATABASE_PORT || 3306),
          user: String(process.env.DATABASE_USER ?? ''),
          writesAllowed: process.env.DATABASE_ALLOW_WRITES === 'true',
        }
      : null,
    sampleLoad: sampleLoadAllowed(),
    companies: list,
    // Switched-off companies (e.g. APF, dissolved): not listed, not loaded, their database left as it is.
    inactive: allCompanies().filter((c) => !c.active).map((c) => ({ ba: c.ba, name: c.name, database: c.database })),
    activeBa: s.ba,
  };
}

export async function chooseDataSource(s: Session, source: string) {
  requireAdmin(s);
  if (source !== 'memory' && source !== 'mysql') throw new AppError('Choose memory or mysql.', 400);
  const next = source as DataSource;
  if (next === 'mysql') {
    if (!mysqlConfigured()) throw new AppError('No MySQL server is configured. Set DATABASE_HOST in .env.', 400);
    const c = companies().find((x) => x.ba === s.ba)!;
    const st = await inspect(c.database);
    if (!st.reachable) throw new AppError(`MySQL could not be reached (${st.error}). Check the server and the settings in .env.`, 400);
    if (!st.users) throw new AppError(`The ${c.database} database has no users yet. Load the sample data into MySQL first.`, 400);
    // Make sure the person switching can still work after the switch.
    const mysql = await import('mysql2/promise');
    const conn = await mysql.createConnection({
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT || 3306),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: c.database,
    });
    try {
      const [rows] = (await conn.query('SELECT COUNT(*) AS n FROM sys_userrecords WHERE username = ?', [s.u])) as any;
      if (!Number(rows[0]?.n)) throw new AppError(`Your account (${s.u}) does not exist in the ${c.database} database, so you would be locked out. Load the sample data first.`, 400);
    } finally {
      await conn.end();
    }
  }
  setDataSource(next);
  return { current: next, mysql: isMysqlMode() };
}

/**
 * Starts loading the sample data as a background job (~20 s) and answers at once with the job;
 * the page asks for it with jobs.get until it is done (platform/jobs.ts). One load at a time.
 */
export async function loadSample(s: Session) {
  requireAdmin(s);
  const guard = sampleLoadAllowed();
  if (!guard.allowed) throw new AppError(guard.reason ?? 'Loading the sample data is not allowed here.', 403);
  const running = await runningJob(JOB_KIND, s.u);
  if (running) return { job: running };
  const targets = companies().map((c) => ({ ba: c.ba, database: c.database }));
  const job = await startJob(JOB_KIND, s.u, async (progress) => {
    const reports = await loadSampleIntoMysql(targets, progress);
    // Every company's cached answers came from the data that was just replaced.
    for (const c of companies()) await invalidateCompany(c.ba);
    return { reports };
  });
  await markRunning(JOB_KIND, s.u, job.id);
  return { job };
}

const JOB_KIND = 'sample-load';
