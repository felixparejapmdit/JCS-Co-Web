import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { signIn } from '../helpers';
import { Sweeper } from './sweep';

/**
 * Deep sweep: every menu page, and the pages it links to (a document, its edit page, a report, a
 * master record), with every button pressed. Runs against the sample data in memory on its own
 * server (playwright.config.ts, E2E_DEEP=1), so whatever the buttons save is gone on restart.
 *
 *   npm run build && npm run test:e2e:deep
 *
 * The findings are written to test-results/sweep/*.json; a test fails on a crash, an uncaught
 * error, a console error or a server error (500+).
 */
const nav = fs.readFileSync(path.join(process.cwd(), 'src/components/shell/nav.ts'), 'utf8');
const PAGES = ['/dashboard', ...new Set([...nav.matchAll(/href: '(\/dashboard[^']*)'/g)].map((m) => m[1])), '/dashboard/account', '/dashboard/help'];

/** Child pages swept per kind of address (a document number or record key counts as one kind). */
const PER_KIND = 2;
const kind = (href: string) =>
  href
    .split('?')[0]
    .split('/')
    .map((s, i) => (i > 3 && /\d/.test(s) ? '*' : s))
    .join('/');

test.describe.configure({ mode: 'parallel' });
test.setTimeout(15 * 60_000);

for (const href of PAGES) {
  test(`every button works on ${href}`, async ({ page }) => {
    await page.addInitScript(() => {
      // Printing opens a system dialog that would stop the browser; count it instead.
      (window as any).print = () => ((window as any).__printed = ((window as any).__printed ?? 0) + 1);
      try {
        localStorage.setItem('cloudaos_intro_hidden', '1');
      } catch {}
    });
    await signIn(page, 'admin');
    const s = new Sweeper(page);
    await s.sweep(href);

    // Pages this one links to, a few of each kind, that are not menu pages themselves; then each
    // document the sweep created (its approve / post / void buttons).
    const kinds = new Map<string, number>();
    const mine = (h: string) => !PAGES.includes(h.split('?')[0]) && h.startsWith(href === '/dashboard' ? '/dashboard/__none' : href);
    for (let pass = 0; pass < 3; pass++) {
      const next = [...s.discovered].filter((h) => mine(h) && !s.visited.has(h));
      for (const child of next) {
        const k = kind(child);
        const n = kinds.get(k) ?? 0;
        if (n >= PER_KIND || s.visited.has(child)) continue;
        kinds.set(k, n + 1);
        await s.sweep(child);
      }
    }
    for (const doc of [...s.created].filter((h) => !s.visited.has(h)).slice(0, 2)) await s.sweep(doc);

    s.save(href);
    const report = s.problems.map((p) => `${p.kind} on ${p.page} after "${p.action}": ${p.detail}`);
    expect(report, report.join('\n')).toEqual([]);
  });
}
