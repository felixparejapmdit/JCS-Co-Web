// Speed and smoothness check for every menu page (docs/ARCHITECTURE.md, section 7).
// Opens each page from the side menu and by a full load, as the sample admin, and reports the time
// until the page is ready (no request in flight, no spinner, held 120 ms) and its layout shift (CLS).
//
//   npm run start            # in another terminal: the app on http://localhost:8180
//   node scripts/perf-sweep.cjs . perf.json
//
// Targets: every page ready in well under 300 ms, layout shift 0.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(process.argv[2] || '.');
const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
const BASE = process.env.PERF_BASE || 'http://localhost:8180';

const nav = fs.readFileSync(path.join(ROOT, 'src/components/shell/nav.ts'), 'utf8');
const HREFS = [...new Set([...nav.matchAll(/href: '(\/dashboard[^']*)'/g)].map((m) => m[1]))];
const GROUPS = [...nav.matchAll(/id: '([a-z]+)',\n\s+label:/g)].map((m) => m[1]);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((groups) => {
    try {
      localStorage.setItem('cloudaos_intro_hidden', '1');
      localStorage.setItem('cloudaos_nav', JSON.stringify(Object.fromEntries(groups.map((g) => [g, true]))));
    } catch {}
    // Layout shifts since the last mark.
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  }, GROUPS);
  const page = await ctx.newPage();
  let inflight = 0;
  page.on('request', (r) => r.url().includes('/api/aos') && inflight++);
  page.on('requestfinished', (r) => r.url().includes('/api/aos') && inflight--);
  page.on('requestfailed', (r) => r.url().includes('/api/aos') && inflight--);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(BASE + '/');
  await page.fill('input[autocomplete=username]', 'admin');
  await page.fill('input[autocomplete=current-password]', 'Demo@2026');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/dashboard$/, { timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // Ready = no data request in flight and no spinner, held for 120 ms.
  async function untilReady(t0, timeout = 15000) {
    let calmSince = 0;
    while (Date.now() - t0 < timeout) {
      const spinning = await page.evaluate(() => Boolean(document.querySelector('main .animate-spin')));
      if (inflight === 0 && !spinning) {
        if (!calmSince) calmSince = Date.now();
        if (Date.now() - calmSince >= 120) return calmSince - t0;
      } else calmSince = 0;
      await page.waitForTimeout(15);
    }
    return -1;
  }

  const rows = [];
  for (const href of HREFS) {
    // 1. In-app: click the link in the side menu.
    const link = page.locator(`aside a[href="${href}"]`).first();
    let navMs = null, navCls = null;
    if (await link.count()) {
      await page.evaluate(() => (window.__cls = 0));
      const t0 = Date.now();
      await link.click();
      await page.waitForURL((u) => u.pathname === href, { timeout: 15000 });
      navMs = await untilReady(t0);
      navCls = await page.evaluate(() => window.__cls);
    }
    // 2. Full load of the address (a reload or an opened link).
    const t1 = Date.now();
    await page.goto(BASE + href, { waitUntil: 'domcontentloaded' });
    const loadMs = await untilReady(t1, 20000);
    const loadCls = await page.evaluate(() => window.__cls);
    // 3. Back to it again from the menu: should come from the screen cache, instantly.
    rows.push({ href, navMs, navCls: navCls === null ? null : +navCls.toFixed(3), loadMs, loadCls: +loadCls.toFixed(3) });
    process.stdout.write('.');
  }
  console.log();
  fs.writeFileSync(process.argv[3], JSON.stringify({ rows, errors }, null, 2));
  const slowNav = rows.filter((r) => r.navMs !== null && (r.navMs > 400 || r.navMs < 0));
  const shifts = rows.filter((r) => (r.navCls ?? 0) > 0.02 || r.loadCls > 0.02);
  const nav = rows.filter((r) => r.navMs !== null && r.navMs >= 0).map((r) => r.navMs).sort((a, b) => a - b);
  const load = rows.filter((r) => r.loadMs >= 0).map((r) => r.loadMs).sort((a, b) => a - b);
  const pct = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
  console.log(`pages: ${rows.length} | menu click ready: median ${pct(nav, 0.5)} ms, p90 ${pct(nav, 0.9)} ms, max ${nav[nav.length - 1]} ms | full load: median ${pct(load, 0.5)} ms, max ${load[load.length - 1]} ms`);
  console.log('slow menu clicks (>400 ms):', slowNav.map((r) => `${r.href} ${r.navMs}ms`).join(', ') || 'none');
  console.log('layout shift > 0.02:', shifts.map((r) => `${r.href} nav ${r.navCls} load ${r.loadCls}`).join(', ') || 'none');
  console.log('page errors:', errors.length ? errors.slice(0, 5) : 'none');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
