/**
 * The button sweep behind e2e/deep: opens a page, presses every button, tab and switch on it (and
 * in each dialog that opens), and records anything that goes wrong:
 *
 *   - an uncaught error in the page, or a console error;
 *   - a server answer of 500 or more, or a request that never got an answer;
 *   - the Next.js crash page ("Application error") or an empty <main>.
 *
 * Every /api/aos call is also logged with its operation and answer, so refusals (4xx, e.g. a
 * required field left empty) can be read in the report: those are expected, crashes are not.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Page, Locator, Request } from '@playwright/test';
import { fillForm } from './fill';

export const SWEEP_DIR = path.join(process.cwd(), 'test-results', 'sweep');

export interface Problem {
  page: string;
  action: string;
  kind: 'pageerror' | 'console' | 'server' | 'network' | 'crash' | 'stuck';
  detail: string;
}

export interface Call {
  page: string;
  action: string;
  op: string;
  status: number;
  error?: string;
}

/** Buttons the sweep never presses: they change the whole test server, not one record. */
const NEVER: Array<[RegExp, RegExp]> = [
  [/./, /^(sign out|log out)$/i],
  [/\/admin\/maintenance/, /switch on maintenance/i],
  [/\/admin\/companies/, /^switch off$/i],
  [/\/admin\/data-source/, /mysql|load the sample/i],
  [/\/fi\/periods/, /^close /i],
  [/\/account/, /save|change password/i],
  [/\/admin\/users/, /reset/i],
];

/** Pages whose forms are not filled in (the forms there could lock the test administrator out). */
const NO_FILL = [/\/admin\/users/, /\/account/, /\/admin\/companies/, /\/admin\/maintenance/];

/** The same label is pressed at most this many times per page (one per table row adds nothing). */
const PER_NAME = 2;

export class Sweeper {
  problems: Problem[] = [];
  calls: Call[] = [];
  actions: string[] = [];
  visited = new Set<string>();
  discovered = new Set<string>();
  private action = 'open';
  private here = '';
  /** API requests sent and not finished yet. */
  private pending = new Set<Request>();
  private origin = new WeakMap<Request, { page: string; action: string }>();
  /** Documents the sweep created by saving a filled-in form. */
  created = new Set<string>();

  constructor(private readonly page: Page) {
    page.on('pageerror', (e) => this.problem('pageerror', e.message));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // A refused request is reported by the server listener below with its message.
      if (/Failed to load resource: the server responded with a status of 4\d\d/.test(t)) return;
      this.problem('console', t);
    });
    page.on('dialog', (d) => d.accept().catch(() => undefined));
    page.on('request', (r) => {
      if (!r.url().includes('/api/')) return;
      this.pending.add(r);
      this.origin.set(r, { page: this.here, action: this.action });
    });
    page.on('requestfinished', (r) => this.pending.delete(r));
    page.on('requestfailed', (r) => {
      if (!r.url().includes('/api/')) return;
      this.pending.delete(r);
      const why = r.failure()?.errorText ?? '';
      // A request cut short by leaving the page is not an error.
      if (!/ERR_ABORTED|NS_BINDING_ABORTED|cancelled/i.test(why)) this.problem('network', `${r.method()} ${r.url()} ${why}`);
    });
    page.on('response', async (res) => {
      const url = res.url();
      if (!url.includes('/api/')) return;
      let op = new URL(url).pathname;
      let error: string | undefined;
      try {
        const body = res.request().postDataJSON();
        if (body?.op) op = body.op;
      } catch {}
      try {
        if (res.status() >= 400) error = (await res.json())?.error;
      } catch {}
      const from = this.origin.get(res.request()) ?? { page: this.here, action: this.action };
      this.calls.push({ ...from, op, status: res.status(), error });
      if (res.status() >= 500) this.problems.push({ ...from, kind: 'server', detail: `${op} → ${res.status()} ${error ?? ''}` });
    });
  }

  private problem(kind: Problem['kind'], detail: string) {
    this.problems.push({ page: this.here, action: this.action, kind, detail: detail.slice(0, 600) });
  }

  /** Waits until no API request is in flight and nothing is spinning, held for 150 ms. */
  async settle(timeout = 12_000) {
    const t0 = Date.now();
    let calm = 0;
    while (Date.now() - t0 < timeout) {
      const spinning = await this.page
        .evaluate(() => Boolean(document.querySelector('main .animate-spin, [role=dialog] .animate-spin, main [role=status][aria-live]')))
        .catch(() => false);
      if (!this.pending.size && !spinning) {
        if (!calm) calm = Date.now();
        if (Date.now() - calm >= 150) return true;
      } else calm = 0;
      await this.page.waitForTimeout(25);
    }
    this.pending.clear();
    this.problem('stuck', `still loading after ${timeout} ms`);
    return false;
  }

  private async checkScreen() {
    const crash = await this.page.getByText(/Application error|client-side exception|Internal Server Error|This page could not be found/i).count();
    if (crash) this.problem('crash', (await this.page.locator('body').innerText()).slice(0, 300));
  }

  async open(url: string) {
    this.here = url;
    this.action = 'open';
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.settle(20_000);
    await this.checkScreen();
  }

  /** Visible, enabled controls in a scope, each with a stable key: role|name|occurrence. */
  private async controls(scope: 'main' | 'dialog'): Promise<{ key: string; name: string }[]> {
    return this.page.evaluate((scope) => {
      const roots: Element[] =
        scope === 'dialog'
          ? [...document.querySelectorAll('[role=dialog]')].slice(-1)
          : [...document.querySelectorAll('main')];
      const out: { key: string; name: string }[] = [];
      const seen = new Map<string, number>();
      for (const root of roots) {
        const els = root.querySelectorAll('button, [role=tab], [role=radio], [role=switch], [role=checkbox], [role=menuitem]');
        for (const el of els) {
          const h = el as HTMLElement;
          if ((h as HTMLButtonElement).disabled || h.getAttribute('aria-disabled') === 'true') continue;
          const r = h.getBoundingClientRect();
          if (!r.width || !r.height || getComputedStyle(h).visibility === 'hidden') continue;
          if (scope === 'main' && h.closest('[role=dialog]')) continue;
          const name = (h.getAttribute('aria-label') || h.innerText || h.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
          if (scope === 'dialog' && /^close$/i.test(name)) continue;
          const role = h.getAttribute('role') || 'button';
          const base = `${role}|${name}`;
          const n = seen.get(base) ?? 0;
          seen.set(base, n + 1);
          out.push({ key: `${base}|${n}`, name });
        }
      }
      return out;
    }, scope);
  }

  /** Marks the control with this key and returns it, or null when it is gone. */
  private async find(scope: 'main' | 'dialog', key: string): Promise<Locator | null> {
    const ok = await this.page.evaluate(
      ({ scope, key }) => {
        document.querySelectorAll('[data-sweep]').forEach((e) => e.removeAttribute('data-sweep'));
        const roots: Element[] = scope === 'dialog' ? [...document.querySelectorAll('[role=dialog]')].slice(-1) : [...document.querySelectorAll('main')];
        const seen = new Map<string, number>();
        for (const root of roots) {
          for (const el of root.querySelectorAll('button, [role=tab], [role=radio], [role=switch], [role=checkbox], [role=menuitem]')) {
            const h = el as HTMLElement;
            if ((h as HTMLButtonElement).disabled || h.getAttribute('aria-disabled') === 'true') continue;
            const r = h.getBoundingClientRect();
            if (!r.width || !r.height || getComputedStyle(h).visibility === 'hidden') continue;
            if (scope === 'main' && h.closest('[role=dialog]')) continue;
            const name = (h.getAttribute('aria-label') || h.innerText || h.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
            if (scope === 'dialog' && /^close$/i.test(name)) continue;
            const base = `${h.getAttribute('role') || 'button'}|${name}`;
            const n = seen.get(base) ?? 0;
            seen.set(base, n + 1);
            if (`${base}|${n}` === key) {
              h.setAttribute('data-sweep', '1');
              return true;
            }
          }
        }
        return false;
      },
      { scope, key }
    );
    return ok ? this.page.locator('[data-sweep="1"]') : null;
  }

  private async fill(scope: 'main' | '[role=dialog]') {
    if (NO_FILL.some((r) => r.test(this.here))) return;
    this.action = `fill ${scope === 'main' ? 'form' : 'dialog'}`;
    await fillForm(this.page, scope).catch(() => undefined);
    await this.settle();
  }

  private async press(target: Locator, label: string) {
    this.action = label;
    this.actions.push(`${this.here} :: ${label}`);
    try {
      await target.scrollIntoViewIfNeeded({ timeout: 2000 });
      await target.click({ timeout: 4000 });
    } catch (e) {
      // Covered by an overlay that just opened, or removed: not a defect of the button itself.
      return false;
    }
    await this.settle();
    await this.checkScreen();
    return true;
  }

  private async backTo(url: string) {
    const dialogs = await this.page.locator('[role=dialog]').count();
    if (dialogs) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(80);
    }
    const now = new URL(this.page.url());
    if (now.pathname + now.search !== url || (await this.page.locator('[role=dialog]').count())) {
      if (now.pathname.startsWith('/dashboard') && now.pathname + now.search !== url) this.discovered.add(now.pathname + now.search);
      this.action = 'open';
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      await this.settle(20_000);
    }
  }

  private skip(name: string) {
    return NEVER.some(([p, b]) => p.test(this.here) && b.test(name));
  }

  /** Presses every control on the page, and every control of each dialog it opens. */
  async sweep(url: string) {
    this.visited.add(url);
    await this.open(url);
    if (/\/(new|edit)(\?|$)/.test(url)) await this.fillAndSave(url);
    for (const href of await this.page.$$eval('main a[href^="/dashboard"]', (as) => as.map((a) => a.getAttribute('href')!))) this.discovered.add(href);
    const list = await this.controls('main');
    const perName = new Map<string, number>();
    for (const c of list) {
      const n = perName.get(c.name) ?? 0;
      if (n >= PER_NAME || this.skip(c.name)) continue;
      perName.set(c.name, n + 1);
      let target = await this.find('main', c.key);
      if (!target) {
        // Hidden by an earlier tab or filter: start from a fresh page.
        await this.open(url);
        target = await this.find('main', c.key);
      }
      if (!target) continue;
      if (!(await this.press(target, c.name || c.key))) continue;
      if (await this.page.locator('[role=dialog]').count()) await this.sweepDialog(url, c.key, c.name);
      await this.backTo(url);
    }
    // Rows and cards that open something (a document, a record) when clicked.
    await this.open(url);
    for (const i of [0, 1]) {
      const row = this.page.locator('main tr.cursor-pointer, main [role=row].cursor-pointer, main div.cursor-pointer, main div.tile-interactive[role=button]').nth(i);
      if (!(await row.count())) break;
      if (!(await this.press(row, `row ${i + 1}`))) continue;
      if (await this.page.locator('[role=dialog]').count()) {
        const inDialog = await this.controls('dialog');
        for (const c of inDialog.slice(0, 6)) {
          if (this.skip(c.name) || /^cancel$/i.test(c.name)) continue;
          const t = await this.find('dialog', c.key);
          if (t) await this.press(t, `row ${i + 1} › ${c.name}`);
          if (!(await this.page.locator('[role=dialog]').count())) break;
        }
      }
      await this.backTo(url);
    }
  }

  /** Fills in a new (or edit) document and presses its main save button; a saved document is swept later. */
  private async fillAndSave(url: string) {
    await this.fill('main');
    const save = this.page.locator('main button').filter({ hasText: /^(save|post|submit|create|send)/i }).first();
    if (!(await save.count()) || (await save.isDisabled())) return;
    const before = this.calls.length;
    await this.press(save, `fill and ${(await save.innerText()).trim()}`);
    await this.page.waitForTimeout(300);
    await this.settle();
    const now = new URL(this.page.url());
    const saved = this.calls.slice(before).some((c) => c.op === 'doc.save' && c.status < 400);
    if (saved && now.pathname !== url.split('?')[0] && now.pathname.startsWith('/dashboard')) this.created.add(now.pathname);
    await this.open(url);
  }

  private async sweepDialog(url: string, openerKey: string, opener: string) {
    const list = await this.controls('dialog');
    const perName = new Map<string, number>();
    for (const [i, c] of list.entries()) {
      const n = perName.get(c.name) ?? 0;
      if (n >= PER_NAME || this.skip(c.name) || /^cancel$/i.test(c.name)) continue;
      perName.set(c.name, n + 1);
      if (i > 0 || !(await this.page.locator('[role=dialog]').count())) {
        // Start each dialog button from a freshly opened dialog.
        await this.backTo(url);
        const again = await this.find('main', openerKey);
        if (!again || !(await this.press(again, opener))) return;
        if (!(await this.page.locator('[role=dialog]').count())) return;
      }
      await this.fill('[role=dialog]');
      const target = await this.find('dialog', c.key);
      if (target) await this.press(target, `${opener} › ${c.name}`);
    }
    // Cancel last, so the dialog is seen to close.
    const cancel = this.page.locator('[role=dialog]').last().getByRole('button', { name: /^cancel$/i });
    if (await cancel.count()) await this.press(cancel.first(), `${opener} › Cancel`);
  }

  save(name: string) {
    fs.mkdirSync(SWEEP_DIR, { recursive: true });
    const refused = this.calls.filter((c) => c.status >= 400 && c.status < 500);
    fs.writeFileSync(
      path.join(SWEEP_DIR, `${name.replace(/[^a-z0-9]+/gi, '_')}.json`),
      JSON.stringify({ visited: [...this.visited], created: [...this.created], problems: this.problems, refused, calls: this.calls.length, actions: this.actions }, null, 2)
    );
  }
}
