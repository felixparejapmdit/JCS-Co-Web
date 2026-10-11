// Data-access contract shared by the demo (in-memory) driver and the MySQL driver.
// Services only talk to legacy tables through this interface, so the same business
// logic runs against the client's existing MySQL databases or the hosted demo data.

export type Scalar = string | number | boolean | null;
export type Row = Record<string, any>;

export type Condition =
  | Scalar
  | {
      in?: Scalar[];
      notIn?: Scalar[];
      ne?: Scalar;
      gt?: Scalar;
      gte?: Scalar;
      lt?: Scalar;
      lte?: Scalar;
      like?: string; // case-insensitive "contains" match
      isNull?: boolean;
    };

export type Where = Record<string, Condition>;

export interface Query {
  where?: Where;
  orderBy?: Array<[string, 'asc' | 'desc']>;
  limit?: number;
}

export interface Db {
  /** Business area (company) this handle is bound to, e.g. "8100". */
  readonly ba: string;
  /** "demo" = in-memory legacy-format data, "mysql" = the client's databases. */
  readonly mode: 'demo' | 'mysql';
  all<T extends Row = Row>(table: string, query?: Query): Promise<T[]>;
  one<T extends Row = Row>(table: string, where: Where): Promise<T | null>;
  count(table: string, where?: Where): Promise<number>;
  insert(table: string, row: Row): Promise<void>;
  insertMany(table: string, rows: Row[]): Promise<void>;
  update(table: string, where: Where, patch: Row): Promise<number>;
  remove(table: string, where: Where): Promise<number>;
  /** Runs fn atomically: every write inside commits together or not at all. */
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
}

export class DbError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

const IDENT = /^[a-z_][a-z0-9_]*$/i;

export function assertIdentifier(name: string): string {
  if (!IDENT.test(name)) throw new DbError(`Invalid identifier: ${name}`, 500);
  return name;
}

/** Row matcher used by the in-memory driver; mirrors the SQL the MySQL driver emits. */
export function matches(row: Row, where?: Where): boolean {
  if (!where) return true;
  for (const [col, cond] of Object.entries(where)) {
    const v = row[col];
    if (cond === null || typeof cond !== 'object') {
      if (!eq(v, cond)) return false;
      continue;
    }
    if (cond.isNull === true && !(v === null || v === undefined || v === '')) return false;
    if (cond.isNull === false && (v === null || v === undefined || v === '')) return false;
    if (cond.in && !cond.in.some((x) => eq(v, x))) return false;
    if (cond.notIn && cond.notIn.some((x) => eq(v, x))) return false;
    if ('ne' in cond && eq(v, cond.ne as Scalar)) return false;
    if (cond.gt !== undefined && !(cmp(v, cond.gt) > 0)) return false;
    if (cond.gte !== undefined && !(cmp(v, cond.gte) >= 0)) return false;
    if (cond.lt !== undefined && !(cmp(v, cond.lt) < 0)) return false;
    if (cond.lte !== undefined && !(cmp(v, cond.lte) <= 0)) return false;
    if (cond.like !== undefined && !String(v ?? '').toLowerCase().includes(cond.like.toLowerCase())) return false;
  }
  return true;
}

function eq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b);
  // MySQL's default collation is case-insensitive; keep the demo consistent with it.
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function cmp(a: unknown, b: unknown): number {
  if (typeof a === 'number' || typeof b === 'number') return Number(a) - Number(b);
  const sa = String(a ?? '');
  const sb = String(b ?? '');
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

export function sortRows<T extends Row>(rows: T[], orderBy?: Array<[string, 'asc' | 'desc']>): T[] {
  if (!orderBy || orderBy.length === 0) return rows;
  const lastFirst = orderBy[0][1] === 'desc';
  return rows
    .map((r, i) => ({ r, i }))
    .sort((x, y) => {
      for (const [col, dir] of orderBy) {
        const c = cmp(x.r[col], y.r[col]);
        if (c !== 0) return dir === 'desc' ? -c : c;
      }
      // Ties keep insertion order, newest first for descending sorts.
      return lastFirst ? y.i - x.i : x.i - y.i;
    })
    .map((x) => x.r);
}
