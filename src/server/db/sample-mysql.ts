import fs from 'node:fs';
import path from 'node:path';
import { MemoryDb, MemoryStore } from './memory';
import type { Row } from './types';
import { assertIdentifier } from './types';
import { markSampleLoaded, sampleLoadAllowed } from './source';

/**
 * Loads the sample data into the local MySQL databases (jcs / apf / chemag).
 *
 * Each company's data is first built in memory by the same seed the preview uses, then copied
 * table by table, so MySQL ends up with exactly what the MemoryStore shows. Every table of the
 * company database is emptied first. The schema rebuilt from code (database/schema_from_code.sql)
 * infers column types from names, so where a column cannot hold the sample values it is widened,
 * and missing tables or columns are added; every such change is reported.
 *
 * Refused unless the server is local and DATABASE_ALLOW_SAMPLE_LOAD=true (see source.ts).
 */
export interface SampleLoadReport {
  ba: string;
  database: string;
  tables: number;
  rows: number;
  schemaChanges: string[];
}

type ColType = 'int' | 'decimal' | 'date' | 'datetime' | 'bool' | 'json' | 'text' | 'varchar';

const BATCH = 300;

function inferType(values: unknown[]): { type: ColType; maxLen: number } {
  let num = 0, int = 0, date = 0, dt = 0, bool = 0, obj = 0, str = 0, maxLen = 0;
  for (const v of values) {
    if (v === null || v === undefined || v === '') continue;
    if (typeof v === 'number') {
      num++;
      if (Number.isInteger(v)) int++;
    } else if (typeof v === 'boolean') bool++;
    else if (typeof v === 'object') obj++;
    else {
      const s = String(v);
      maxLen = Math.max(maxLen, s.length);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) date++;
      else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/.test(s)) dt++;
      else str++;
    }
  }
  if (obj) return { type: 'json', maxLen };
  if (str || ((date || dt) && (num || bool))) return { type: maxLen > 255 ? 'text' : 'varchar', maxLen };
  if (dt) return { type: 'datetime', maxLen };
  if (date) return { type: 'date', maxLen };
  if (bool && !num) return { type: 'bool', maxLen };
  if (num) return { type: int === num ? 'int' : 'decimal', maxLen };
  return { type: 'varchar', maxLen };
}

function ddl(t: ColType, maxLen: number): string {
  switch (t) {
    case 'int':
      return 'BIGINT NULL';
    case 'decimal':
      return 'DECIMAL(18,4) NULL';
    case 'date':
      return 'DATE NULL';
    case 'datetime':
      return 'DATETIME NULL';
    case 'bool':
      return 'TINYINT(1) NULL';
    case 'json':
      return 'LONGTEXT NULL';
    case 'text':
      return 'TEXT NULL';
    default:
      return `VARCHAR(${Math.max(100, maxLen > 100 ? 255 : 100)}) NULL`;
  }
}

interface ColInfo {
  name: string;
  dataType: string; // information_schema DATA_TYPE, lower case
  charLen: number | null;
  notNull?: boolean; // NOT NULL or part of the primary key: a changed definition must keep it
}

const NUMERIC = new Set(['tinyint', 'smallint', 'mediumint', 'int', 'bigint', 'decimal', 'float', 'double']);
const CHARS = new Set(['char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext', 'json']);

/** Returns a new column definition when the existing column cannot hold the sample values, otherwise null. */
function widenFor(col: ColInfo, need: { type: ColType; maxLen: number }): string | null {
  const dt = col.dataType;
  if (need.type === 'varchar' || need.type === 'text' || need.type === 'json') {
    if (!CHARS.has(dt)) return ddl(need.type === 'json' ? 'json' : need.maxLen > 255 ? 'text' : 'varchar', need.maxLen);
    if ((dt === 'char' || dt === 'varchar') && col.charLen !== null && need.maxLen > col.charLen) return need.maxLen > 255 ? 'TEXT NULL' : 'VARCHAR(255) NULL';
    return null;
  }
  if (need.type === 'int' || need.type === 'decimal') {
    if (NUMERIC.has(dt)) return need.type === 'decimal' && !['decimal', 'float', 'double'].includes(dt) ? 'DECIMAL(18,4) NULL' : null;
    // Numbers kept in a text column would read back as strings and break the arithmetic.
    return ddl(need.type, need.maxLen);
  }
  if (need.type === 'datetime') return dt === 'datetime' || dt === 'timestamp' || CHARS.has(dt) ? null : 'DATETIME NULL';
  if (need.type === 'date') return dt === 'date' || dt === 'datetime' || dt === 'timestamp' || CHARS.has(dt) ? null : 'DATE NULL';
  if (need.type === 'bool') return NUMERIC.has(dt) || CHARS.has(dt) ? null : 'TINYINT(1) NULL';
  return null;
}

function toSql(v: unknown, col: ColInfo | undefined): unknown {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') return JSON.stringify(v);
  // An empty value in a number or date column is "no value" (MemoryStore keeps '').
  if (v === '' && col && !CHARS.has(col.dataType)) return null;
  return v;
}

/** The ng_* tables Cloud AOS adds (PLAN.md 7.2), from database/mysql/*.sql when the scripts are present. */
function ngScripts(): string[] {
  const dir = path.join(process.cwd(), 'database', 'mysql');
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => /^\d+_.*\.sql$/.test(f))
      .sort()
      .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
  } catch {
    return [];
  }
}

async function loadCompany(ba: string, database: string): Promise<SampleLoadReport> {
  const mysql = await import('mysql2/promise');
  const { seedCompany } = await import('../seed');

  // 1. The sample data, exactly as the in-memory preview builds it.
  const store = new MemoryStore();
  await seedCompany(new MemoryDb(ba, store));

  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database,
    multipleStatements: true,
    dateStrings: true,
    ssl: process.env.DATABASE_SSL === 'true' ? {} : undefined,
  });
  const changes: string[] = [];
  let rows = 0;
  try {
    await conn.query('SET SESSION sql_mode = ?', [process.env.DATABASE_SQL_MODE || 'NO_ENGINE_SUBSTITUTION']);

    // 2. Cloud AOS's own tables.
    for (const script of ngScripts()) await conn.query(script);

    // 3. Empty every table of this company database.
    const [tables] = (await conn.query("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'", [database])) as any;
    for (const { t } of tables as { t: string }[]) {
      if (t === 'ng_schema_migrations') continue;
      await conn.query(`TRUNCATE TABLE \`${assertIdentifier(t)}\``);
    }

    // 4. Columns as they are now.
    const [colRows] = (await conn.query(
      "SELECT TABLE_NAME AS t, COLUMN_NAME AS c, LOWER(DATA_TYPE) AS dt, CHARACTER_MAXIMUM_LENGTH AS len, (IS_NULLABLE = 'NO' OR COLUMN_KEY = 'PRI') AS nn FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?",
      [database]
    )) as any;
    const schema = new Map<string, Map<string, ColInfo>>();
    for (const r of colRows as { t: string; c: string; dt: string; len: number | null; nn: number }[]) {
      const key = r.t.toLowerCase();
      if (!schema.has(key)) schema.set(key, new Map());
      schema.get(key)!.set(r.c.toLowerCase(), { name: r.c, dataType: r.dt, charLen: r.len === null ? null : Number(r.len), notNull: Boolean(Number(r.nn)) });
    }

    // 5. Copy every table.
    for (const [table, data] of store.tables) {
      if (!data.length) continue;
      assertIdentifier(table);
      const cols = [...new Set(data.flatMap((r) => Object.keys(r)))].map(assertIdentifier);
      let existing = schema.get(table.toLowerCase());
      if (!existing) {
        const defs = cols.map((c) => {
          const need = inferType(data.map((r) => r[c]));
          return `\`${c}\` ${ddl(need.type, need.maxLen)}`;
        });
        await conn.query(`CREATE TABLE \`${table}\` (${defs.join(', ')}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        changes.push(`Created table ${table}`);
        // Read back the types of the new table.
        const [fresh] = (await conn.query(
          'SELECT COLUMN_NAME AS c, LOWER(DATA_TYPE) AS dt, CHARACTER_MAXIMUM_LENGTH AS len FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
          [database, table]
        )) as any;
        existing = new Map((fresh as any[]).map((r) => [String(r.c).toLowerCase(), { name: r.c, dataType: r.dt, charLen: r.len === null ? null : Number(r.len) }]));
        schema.set(table.toLowerCase(), existing);
      } else {
        for (const c of cols) {
          const need = inferType(data.map((r) => r[c]));
          const col = existing.get(c.toLowerCase());
          if (!col) {
            const def = ddl(need.type, need.maxLen);
            await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${c}\` ${def}`);
            changes.push(`Added ${table}.${c} ${def.replace(' NULL', '')}`);
            existing.set(c.toLowerCase(), { name: c, dataType: def.split(/[ (]/)[0].toLowerCase(), charLen: def.startsWith('VARCHAR') ? Number(def.match(/\d+/)![0]) : null });
            continue;
          }
          let widened = widenFor(col, need);
          if (widened && col.notNull) widened = widened.replace(/ NULL$/, ' NOT NULL');
          if (widened) {
            await conn.query(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${col.name}\` ${widened}`);
            changes.push(`Changed ${table}.${col.name} from ${col.dataType}${col.charLen ? `(${col.charLen})` : ''} to ${widened.replace(/ (NOT )?NULL$/, '')}`);
            existing.set(c.toLowerCase(), { name: col.name, dataType: widened.split(/[ (]/)[0].toLowerCase(), charLen: widened.startsWith('VARCHAR') ? Number(widened.match(/\d+/)![0]) : null, notNull: col.notNull });
          }
        }
      }
      const info = existing;
      for (let i = 0; i < data.length; i += BATCH) {
        const chunk = data.slice(i, i + BATCH);
        const placeholders = chunk.map(() => `(${cols.map(() => '?').join(', ')})`).join(', ');
        const params = chunk.flatMap((r) => cols.map((c) => toSql((r as Row)[c], info.get(c.toLowerCase()))));
        await conn.query(`INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES ${placeholders}`, params);
      }
      rows += data.length;
    }

    // 6. Refresh the table statistics so row counts (information_schema) match what was loaded.
    const filled = [...store.tables].filter(([, d]) => d.length).map(([t]) => `\`${assertIdentifier(t)}\``);
    for (let i = 0; i < filled.length; i += 50) await conn.query(`ANALYZE TABLE ${filled.slice(i, i + 50).join(', ')}`);
  } finally {
    await conn.end();
  }
  markSampleLoaded(ba, new Date().toISOString());
  return { ba, database, tables: [...store.tables.values()].filter((t) => t.length).length, rows, schemaChanges: changes };
}

export async function loadSampleIntoMysql(targets: { ba: string; database: string }[]): Promise<SampleLoadReport[]> {
  const guard = sampleLoadAllowed();
  if (!guard.allowed) throw new Error(guard.reason);
  const out: SampleLoadReport[] = [];
  for (const t of targets) out.push(await loadCompany(t.ba, t.database));
  return out;
}
