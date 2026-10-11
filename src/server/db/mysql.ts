import type { Pool, PoolConnection } from 'mysql2/promise';
import { Condition, Db, DbError, Query, Row, Where, assertIdentifier } from './types';

/**
 * Driver for the client's existing MySQL databases (jcs / apf / chemag / bfi / bfi_admin).
 * Every statement is parameterised; table and column names are validated identifiers.
 * Writes are refused unless DATABASE_ALLOW_WRITES=true, so pointing the app at a live
 * server is read-only until a module has passed its parity tests (PLAN.md section 8.3).
 */
type Executor = Pool | PoolConnection;

export class MysqlDb implements Db {
  readonly mode = 'mysql' as const;

  constructor(
    readonly ba: string,
    private readonly exec: Executor,
    private readonly allowWrites: boolean,
    private readonly isTx = false
  ) {}

  private async run(sql: string, params: unknown[]): Promise<any> {
    const [result] = await this.exec.query(sql, params);
    return result;
  }

  /** Reads; Cloud AOS's own ng_* tables read as empty until their migration has run (PLAN.md 7.2). */
  private async read(table: string, sql: string, params: unknown[]): Promise<any[]> {
    try {
      return await this.run(sql, params);
    } catch (err: any) {
      if (err?.code === 'ER_NO_SUCH_TABLE' && table.startsWith('ng_')) return [];
      throw err;
    }
  }

  private guardWrite() {
    if (!this.allowWrites) {
      throw new DbError(
        'This environment is connected to the company database in read-only mode. Saving is disabled until the module is approved for live use.',
        403
      );
    }
  }

  async all<T extends Row = Row>(table: string, query: Query = {}): Promise<T[]> {
    const params: unknown[] = [];
    let sql = `SELECT * FROM \`${assertIdentifier(table)}\``;
    const where = buildWhere(query.where, params);
    if (where) sql += ` WHERE ${where}`;
    if (query.orderBy?.length) {
      sql += ' ORDER BY ' + query.orderBy.map(([c, d]) => `\`${assertIdentifier(c)}\` ${d === 'desc' ? 'DESC' : 'ASC'}`).join(', ');
    }
    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(Math.max(1, Math.floor(query.limit)));
    }
    return (await this.read(table, sql, params)) as T[];
  }

  async one<T extends Row = Row>(table: string, where: Where): Promise<T | null> {
    const rows = await this.all<T>(table, { where, limit: 1 });
    return rows[0] ?? null;
  }

  async count(table: string, where?: Where): Promise<number> {
    const params: unknown[] = [];
    let sql = `SELECT COUNT(*) AS n FROM \`${assertIdentifier(table)}\``;
    const w = buildWhere(where, params);
    if (w) sql += ` WHERE ${w}`;
    const rows = await this.read(table, sql, params);
    return Number(rows[0]?.n ?? 0);
  }

  async insert(table: string, row: Row): Promise<void> {
    this.guardWrite();
    const cols = Object.keys(row).map(assertIdentifier);
    const sql = `INSERT INTO \`${assertIdentifier(table)}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
    await this.run(sql, cols.map((c) => row[c]));
  }

  async insertMany(table: string, rows: Row[]): Promise<void> {
    for (const r of rows) await this.insert(table, r);
  }

  async update(table: string, where: Where, patch: Row): Promise<number> {
    this.guardWrite();
    const params: unknown[] = [];
    const cols = Object.keys(patch).map(assertIdentifier);
    if (cols.length === 0) return 0;
    const set = cols.map((c) => {
      params.push(patch[c]);
      return `\`${c}\` = ?`;
    });
    const w = buildWhere(where, params);
    if (!w) throw new DbError('Refusing to update without a WHERE clause.', 500);
    const result = await this.run(`UPDATE \`${assertIdentifier(table)}\` SET ${set.join(', ')} WHERE ${w}`, params);
    return Number(result.affectedRows ?? 0);
  }

  async remove(table: string, where: Where): Promise<number> {
    this.guardWrite();
    const params: unknown[] = [];
    const w = buildWhere(where, params);
    if (!w) throw new DbError('Refusing to delete without a WHERE clause.', 500);
    const result = await this.run(`DELETE FROM \`${assertIdentifier(table)}\` WHERE ${w}`, params);
    return Number(result.affectedRows ?? 0);
  }

  async tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
    if (this.isTx) return fn(this);
    const pool = this.exec as Pool;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(new MysqlDb(this.ba, conn, this.allowWrites, true));
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

function buildWhere(where: Where | undefined, params: unknown[]): string {
  if (!where) return '';
  const parts: string[] = [];
  for (const [col, cond] of Object.entries(where)) {
    const c = `\`${assertIdentifier(col)}\``;
    parts.push(...conditionSql(c, cond, params));
  }
  return parts.join(' AND ');
}

function conditionSql(c: string, cond: Condition, params: unknown[]): string[] {
  if (cond === null) return [`${c} IS NULL`];
  if (typeof cond !== 'object') {
    params.push(cond);
    return [`${c} = ?`];
  }
  const out: string[] = [];
  if (cond.isNull === true) out.push(`(${c} IS NULL OR ${c} = '')`);
  if (cond.isNull === false) out.push(`(${c} IS NOT NULL AND ${c} <> '')`);
  if (cond.in) {
    if (cond.in.length === 0) out.push('1 = 0');
    else {
      out.push(`${c} IN (${cond.in.map(() => '?').join(', ')})`);
      params.push(...cond.in);
    }
  }
  if (cond.notIn && cond.notIn.length) {
    out.push(`${c} NOT IN (${cond.notIn.map(() => '?').join(', ')})`);
    params.push(...cond.notIn);
  }
  if ('ne' in cond) {
    if (cond.ne === null) out.push(`${c} IS NOT NULL`);
    else {
      out.push(`(${c} <> ? OR ${c} IS NULL)`);
      params.push(cond.ne);
    }
  }
  for (const [op, sym] of [['gt', '>'], ['gte', '>='], ['lt', '<'], ['lte', '<=']] as const) {
    if (cond[op] !== undefined) {
      out.push(`${c} ${sym} ?`);
      params.push(cond[op]);
    }
  }
  if (cond.like !== undefined) {
    out.push(`${c} LIKE ?`);
    params.push(`%${cond.like}%`);
  }
  return out;
}
