import type { Page } from '@playwright/test';

/**
 * Fills the empty fields of a form the way a person would: the first choice in each search box
 * (Combobox) and select, an amount in each number box, a date, a short text. Used by the sweep to
 * get a new document or a dialog past "required", so its Save really saves.
 *
 * `scope` is a CSS selector: 'main' for a page, '[role=dialog]' for the open dialog (the last one).
 */
export async function fillForm(page: Page, scope: string, opts: { amount?: string } = {}) {
  const root = scope === '[role=dialog]' ? page.locator('[role=dialog]').last() : page.locator(scope).first();
  const amount = opts.amount ?? '100';

  // Search boxes: an input followed by the chevron icon (components/ui/kit.tsx Combobox).
  const combos = root.locator('input:has(+ svg.lucide-chevron-down)');
  for (let i = 0; i < (await combos.count()); i++) {
    const c = combos.nth(i);
    if (!(await c.isVisible()) || (await c.isDisabled()) || (await c.inputValue())) continue;
    await c.click();
    const first = root.locator('div.glass-strong button').first();
    try {
      await first.waitFor({ state: 'visible', timeout: 2500 });
      await first.click();
    } catch {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(120);
  }

  for (const sel of await root.locator('select').all()) {
    if (!(await sel.isVisible()) || (await sel.isDisabled()) || (await sel.inputValue())) continue;
    const values = await sel.locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
    if (values.length) await sel.selectOption(values[0]);
  }

  const fields = root.locator('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search]), textarea');
  for (let i = 0; i < (await fields.count()); i++) {
    const f = fields.nth(i);
    if (!(await f.isVisible()) || (await f.isDisabled()) || !(await f.isEditable()) || (await f.inputValue())) continue;
    const info = await f.evaluate((el) => ({
      type: (el as HTMLInputElement).type,
      mode: el.getAttribute('inputmode'),
      combo: Boolean(el.nextElementSibling?.matches('svg.lucide-chevron-down')),
      search: Boolean(el.previousElementSibling?.matches('svg.lucide-search')) || /search|find/i.test(el.getAttribute('placeholder') ?? ''),
      name: `${el.getAttribute('placeholder') ?? ''} ${el.closest('label')?.textContent ?? ''}`.toLowerCase(),
    }));
    if (info.combo || info.search) continue;
    let v = 'E2E test';
    if (info.mode === 'decimal' || info.type === 'number') v = /qty|quantity|count|days|hours|no\.? of|pieces|units/.test(info.name) ? '1' : amount;
    else if (info.type === 'date') v = '2026-10-15';
    else if (info.type === 'month') v = '2026-10';
    else if (info.type === 'time') v = '09:00';
    else if (info.type === 'email') v = 'e2e@example.com';
    else if (info.type === 'password') v = 'E2eTest2026x';
    else if (info.type === 'tel') v = '09170000000';
    else if (/tin\b/.test(info.name)) v = '123-456-789-000';
    await f.fill(v);
    await f.press('Tab').catch(() => undefined);
  }
}
