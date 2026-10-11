import { Db, DbError, Query, Row, Where, assertIdentifier, matches, sortRows } from './types';

/**
 * In-memory copy of one company database, using the legacy table and column names.
 * Used for the hosted preview and for tests; it never touches the client's MySQL server.
 */
export class MemoryStore {
  readonly tables = new Map<string, Row[]>();
  private lock: Promise<void> = Promise.resolve();

  table(name: string): Row[] {
    assertIdentifier(name);
    let t = this.tables.get(name);
    if (!t) {
      t = [];
      this.tables.set(name, t);
    }
    return t;
  }

  /** Serialises transactions so concurrent requests cannot interleave half-finished writes. */
  async exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.lock;
    let release!: () => void;
    this.lock = new Promise<void>((r) => (release = r));
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export class MemoryDb implements Db {
  readonly mode = 'demo' as const;
  private inTx = false;

  constructor(readonly ba: string, private readonly store: MemoryStore) {}

  async all<T extends Row = Row>(table: string, query: Query = {}): Promise<T[]> {
    const rows = this.store.table(table).filter((r) => matches(r, query.where));
    const sorted = sortRows(rows, query.orderBy);
    const limited = query.limit ? sorted.slice(0, query.limit) : sorted;
    return limited.map((r) => ({ ...r })) as T[];
  }

  async one<T extends Row = Row>(table: string, where: Where): Promise<T | null> {
    const row = this.store.table(table).find((r) => matches(r, where));
    return row ? ({ ...row } as T) : null;
  }

  async count(table: string, where?: Where): Promise<number> {
    return this.store.table(table).filter((r) => matches(r, where)).length;
  }

  async insert(table: string, row: Row): Promise<void> {
    for (const k of Object.keys(row)) assertIdentifier(k);
    this.store.table(table).push({ ...row });
  }

  async insertMany(table: string, rows: Row[]): Promise<void> {
    for (const r of rows) await this.insert(table, r);
  }

  async update(table: string, where: Where, patch: Row): Promise<number> {
    for (const k of Object.keys(patch)) assertIdentifier(k);
    const t = this.store.table(table);
    let n = 0;
    for (let i = 0; i < t.length; i++) {
      if (matches(t[i], where)) {
        t[i] = { ...t[i], ...patch };
        n++;
      }
    }
    return n;
  }

  async remove(table: string, where: Where): Promise<number> {
    const t = this.store.table(table);
    const keep = t.filter((r) => !matches(r, where));
    const removed = t.length - keep.length;
    t.length = 0;
    t.push(...keep);
    return removed;
  }

  async tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
    if (this.inTx) return fn(this);
    return this.store.exclusive(async () => {
      const snapshot = new Map<string, Row[]>();
      for (const [name, rows] of this.store.tables) snapshot.set(name, [...rows]);
      this.inTx = true;
      try {
        return await fn(this);
      } catch (err) {
        this.store.tables.clear();
        for (const [name, rows] of snapshot) this.store.tables.set(name, rows);
        throw err instanceof DbError || err instanceof Error ? err : new DbError(String(err));
      } finally {
        this.inTx = false;
      }
    });
  }
}
