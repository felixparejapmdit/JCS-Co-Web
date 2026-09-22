import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import EmbeddedPostgres from 'embedded-postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const dbDir = path.join(projectRoot, 'database', 'data_local');
const initSqlPath = path.join(projectRoot, 'database', 'init', '01_init_schemas.sql');

async function runLocalPostgres() {
  console.log('[PostgreSQL 16 Engine] Initializing local database cluster...');
  console.log(`[PostgreSQL 16 Engine] Storage directory: ${dbDir}`);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: 'aos_admin',
    password: 'Aos100SecurePass!',
    port: 5432,
    persistent: true,
  });

  const isFresh = !fs.existsSync(path.join(dbDir, 'PG_VERSION'));

  if (isFresh) {
    console.log('[PostgreSQL 16 Engine] Creating fresh cluster configurations...');
    await pg.initialise();
  }

  console.log('[PostgreSQL 16 Engine] Starting PostgreSQL daemon on port 5432...');
  await pg.start();

  console.log('================================================================');
  console.log('  AOS100 NextGen Local PostgreSQL Server Active');
  console.log('  - Host:      localhost (127.0.0.1)');
  console.log('  - Port:      5432');
  console.log('  - Database:  aos100_core');
  console.log('  - Username:  aos_admin');
  console.log('  - Password:  Aos100SecurePass!');
  console.log('  - URI:       postgresql://aos_admin:Aos100SecurePass!@localhost:5432/aos100_core?sslmode=disable');
  console.log('================================================================');

  // Check or create aos100_core database
  const defaultClient = pg.getPgClient();
  await defaultClient.connect();

  const dbCheck = await defaultClient.query(
    "SELECT 1 FROM pg_database WHERE datname = 'aos100_core'"
  );

  if (dbCheck.rows.length === 0) {
    console.log('[PostgreSQL 16 Engine] Creating database "aos100_core"...');
    await defaultClient.query('CREATE DATABASE aos100_core');
  }
  await defaultClient.end();

  // Run init schema SQL
  if (fs.existsSync(initSqlPath)) {
    console.log('[PostgreSQL 16 Engine] Applying schema migrations from 01_init_schemas.sql...');
    const { Client } = await import('pg');
    const appClient = new Client({
      host: 'localhost',
      port: 5432,
      database: 'aos100_core',
      user: 'aos_admin',
      password: 'Aos100SecurePass!',
    });

    try {
      await appClient.connect();
      const sql = fs.readFileSync(initSqlPath, 'utf8');
      await appClient.query(sql);
      console.log('[PostgreSQL 16 Engine] Schemas and tables successfully initialized:');
      console.log('  ✓ shared_system (tenants, users, audit_logs)');
      console.log('  ✓ tenant_8100 (JCS Chemical Industries)');
      console.log('  ✓ tenant_8200 (APF Corporation)');
      console.log('  ✓ tenant_8300 (Chemag Trading)');
      await appClient.end();
    } catch (err) {
      console.warn('[PostgreSQL 16 Engine] Schema initialization note:', err.message);
    }
  }

  console.log('[PostgreSQL 16 Engine] Server is ready and listening for connections.');

  // Handle graceful termination
  process.on('SIGINT', async () => {
    console.log('\n[PostgreSQL 16 Engine] Stopping server...');
    await pg.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n[PostgreSQL 16 Engine] Stopping server...');
    await pg.stop();
    process.exit(0);
  });
}

runLocalPostgres().catch((err) => {
  console.error('[PostgreSQL 16 Engine] Fatal error starting server:', err);
  process.exit(1);
});
