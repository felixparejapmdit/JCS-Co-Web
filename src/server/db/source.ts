import fs from 'node:fs';
import path from 'node:path';

/**
 * Where the app reads its data: the in-memory sample data (MemoryStore) or the MySQL databases
 * configured in .env. An administrator chooses in Administration > Data Source; the choice is kept
 * in .cloudaos/settings.json on this server (gitignored), so it survives a restart.
 *
 * Without DATABASE_HOST there is no MySQL to choose and the app always uses the sample data.
 */
export type DataSource = 'memory' | 'mysql';

interface LocalSettings {
  dataSource?: DataSource;
  /** When the sample data was last loaded into each company database, by business area. */
  sampleLoadedAt?: Record<string, string>;
}

const g = globalThis as unknown as { __cloudAosSettings?: LocalSettings };

function settingsFile(): string {
  return path.join(process.cwd(), '.cloudaos', 'settings.json');
}

function readSettings(): LocalSettings {
  if (g.__cloudAosSettings) return g.__cloudAosSettings;
  let s: LocalSettings = {};
  try {
    s = JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) as LocalSettings;
  } catch {
    // No file yet (or a read-only host): fall back to the environment.
  }
  g.__cloudAosSettings = s;
  return s;
}

function writeSettings(patch: LocalSettings): void {
  const next = { ...readSettings(), ...patch };
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2) + '\n', 'utf8');
  g.__cloudAosSettings = next;
}

export function mysqlConfigured(): boolean {
  return Boolean(process.env.DATABASE_HOST);
}

export function dataSource(): DataSource {
  if (!mysqlConfigured()) return 'memory';
  const chosen = readSettings().dataSource ?? process.env.DATA_SOURCE;
  if (chosen === 'memory' || chosen === 'mysql') return chosen;
  return 'mysql'; // a configured database is used unless an administrator chose otherwise
}

export function setDataSource(source: DataSource): void {
  writeSettings({ dataSource: source });
}

/** Loading the sample data wipes the company databases, so it is only offered on a local server that opted in. */
export function sampleLoadAllowed(): { allowed: boolean; reason?: string } {
  if (!mysqlConfigured()) return { allowed: false, reason: 'No MySQL server is configured (DATABASE_HOST).' };
  const host = String(process.env.DATABASE_HOST).toLowerCase();
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    return { allowed: false, reason: 'Sample data can only be loaded into a MySQL server on this computer, never into a company server.' };
  }
  if (process.env.DATABASE_ALLOW_SAMPLE_LOAD !== 'true') return { allowed: false, reason: 'Set DATABASE_ALLOW_SAMPLE_LOAD=true in .env to allow it.' };
  if (process.env.DATABASE_ALLOW_WRITES !== 'true') return { allowed: false, reason: 'Set DATABASE_ALLOW_WRITES=true in .env to allow it.' };
  return { allowed: true };
}

export function sampleLoadedAt(): Record<string, string> {
  return readSettings().sampleLoadedAt ?? {};
}

export function markSampleLoaded(ba: string, at: string): void {
  writeSettings({ sampleLoadedAt: { ...sampleLoadedAt(), [ba]: at } });
}

/** True when MySQL is in use and holds the sample data this app loaded (so the sign-in page may show the sample accounts). */
export function mysqlHoldsSampleData(): boolean {
  return dataSource() === 'mysql' && Object.keys(sampleLoadedAt()).length > 0;
}
