import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * The deep button sweep (e2e/deep): every page, every button. It runs on a server of its own
 * (port 8190) with the sample data in memory and a settings file of its own, so nothing the sweep
 * saves reaches the MySQL databases or the settings of the app on port 8180. Its build goes to
 * .next-e2e, so it can run while `npm run dev` uses .next.
 *
 *   npm run test:e2e:deep            (builds .next-e2e first)
 */
const SETTINGS = path.join(process.cwd(), 'test-results', 'e2e-deep-settings.json');
if (!process.env.TEST_WORKER_INDEX) fs.rmSync(SETTINGS, { force: true });

export default defineConfig({
  testDir: './e2e/deep',
  fullyParallel: true,
  retries: 0,
  // Two browsers: enough to finish in reasonable time without starving the computer it runs on.
  workers: 2,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-deep' }]],
  use: {
    baseURL: 'http://localhost:8190',
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'npx next start -p 8190',
    url: 'http://localhost:8190/api/healthz',
    reuseExistingServer: true,
    timeout: 60 * 1000,
    env: { NEXT_DIST_DIR: '.next-e2e', DATA_SOURCE: 'memory', CLOUDAOS_SETTINGS_FILE: SETTINGS, COMPANIES_DISABLED: '8100,8200' },
  },
});
