import { test, expect, type Locator, type Page } from '@playwright/test';
import { signIn } from '../helpers';

/**
 * Whole flows through the screens, on the deep sweep's own server (sample data in memory), so
 * what they create is gone when it stops: npm run test:e2e:deep -- -g "flow"
 */
/** A clickable row (list view) or card (cards view) of a DataTable that contains the text. */
const entry = (page: Page, text: string) => page.locator('main tr.cursor-pointer, main div.tile-interactive[role=button]').filter({ hasText: text }).first();

/** The input of one cell of a document line (components/doc/DocEditor.tsx line tiles). */
const cell = (page: Page, line: number, label: string) =>
  page
    .locator('main div.tile', { hasText: `Line ${line}` })
    .locator('div.min-w-0', { has: page.locator('span', { hasText: new RegExp(`^${label}$`) }) })
    .locator('input')
    .first();

/** Picks the first choice of a search box (Combobox) that matches the text. */
async function choose(page: Page, input: Locator, text: string) {
  await input.click();
  await input.fill(text);
  await page.locator('div.glass-strong button', { hasText: text }).first().click();
}

/** Presses a document action, and its confirm button when it asks first. */
async function act(page: Page, label: string) {
  await page.locator('main').getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible().catch(() => false)) await dialog.getByRole('button', { name: label, exact: true }).click();
}

test.describe('flow', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'admin');
  });

  test('user groups: add with copied access, rename, open its access, delete', async ({ page }) => {
    await page.goto('/dashboard/admin/user-groups');
    await expect(page.getByRole('heading', { level: 1, name: 'User Groups' })).toBeVisible();
    await expect(entry(page, 'ADMIN')).toBeVisible();

    // Add: the code is upper-cased and cleaned as it is typed.
    await page.getByRole('button', { name: 'Add group' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Group code/).fill('qa_e2e!');
    await expect(dialog.getByLabel(/Group code/)).toHaveValue('QA_E2E');
    await dialog.getByLabel(/^Name/).fill('QA end-to-end');
    await dialog.getByLabel(/Description/).fill('Made by the e2e flow');
    await dialog.getByLabel(/Start with the access of/).selectOption('FINHEAD');
    await dialog.getByRole('button', { name: 'Add group' }).click();
    await expect(page.getByText(/Group QA_E2E added with the access of FINHEAD/)).toBeVisible();
    const row = entry(page, 'QA_E2E');
    await expect(row).toContainText('QA end-to-end');

    // A second group with the same code is refused, with the reason in the dialog.
    await page.getByRole('button', { name: 'Add group' }).click();
    await dialog.getByLabel(/Group code/).fill('QA_E2E');
    await dialog.getByLabel(/^Name/).fill('Duplicate');
    await dialog.getByRole('button', { name: 'Add group' }).click();
    await expect(dialog.getByText('Group QA_E2E already exists.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();

    // Rename; the code cannot change.
    await row.click();
    await expect(dialog.getByLabel(/Group code/)).toBeDisabled();
    await dialog.getByLabel(/^Name/).fill('QA team');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Group QA_E2E saved.')).toBeVisible();
    await expect(row).toContainText('QA team');

    // Edit access opens the Access Matrix on this group.
    await row.click();
    await dialog.getByRole('link', { name: 'Edit access' }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/groups\?group=QA_E2E/);
    await expect(page.getByRole('heading', { level: 1, name: 'Access Matrix' })).toBeVisible();
    await expect(page.locator('#col-QA_E2E')).toContainText('QA team');
    await expect(page.locator('#col-QA_E2E button[aria-pressed="true"]')).toBeVisible();
    await page.getByRole('link', { name: 'Manage groups' }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/user-groups$/);

    // Delete, after confirming.
    await row.click();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').last().getByRole('button', { name: 'Delete group' }).click();
    await expect(page.getByText('Group QA_E2E deleted.')).toBeVisible();
    await expect(row).toHaveCount(0);
  });

  test('user groups: a group in use cannot be deleted', async ({ page }) => {
    await page.goto('/dashboard/admin/user-groups');
    // The administrators: no Delete at all. A group with users: Delete is off, with the reason.
    await entry(page, 'Always all access').click();
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Delete' })).toHaveCount(0);
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
    await entry(page, 'FINHEAD').click();
    const del = page.getByRole('dialog').getByRole('button', { name: 'Delete' });
    await expect(del).toBeDisabled();
    await expect(del).toHaveAttribute('title', /Move its \d+ users? to another group/);
    await expect(page.getByRole('dialog')).toContainText(/To delete this group: Move its \d+ users? to another group/);
  });

  test('journal voucher: balanced lines, save, approve, post', async ({ page }) => {
    await page.goto('/dashboard/doc/jv/new');
    await page.getByLabel(/^Description/).fill('E2E flow: top up the petty cash fund');
    await choose(page, cell(page, 1, 'Account'), 'Petty Cash Fund');
    await cell(page, 1, 'Debit').fill('2500');
    await cell(page, 1, 'Debit').press('Tab');
    await choose(page, cell(page, 2, 'Account'), 'Cash in Bank - BDO');
    await cell(page, 2, 'Credit').fill('2,500');
    await cell(page, 2, 'Credit').press('Tab');
    await expect(page.locator('main').getByText('Difference').locator('..')).toContainText('0.00');

    await page.locator('main').getByRole('button', { name: /^Save/ }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/doc\/jv\/JV-\d\d-\d+$/);
    const jvno = page.url().split('/').pop()!;
    await expect(page.getByRole('heading', { level: 1 })).toContainText(jvno);
    await expect(page.locator('main')).toContainText('Open');

    await act(page, 'Approve');
    await expect(page.getByText(`JV ${jvno} approved and ready for posting.`)).toBeVisible();
    await act(page, 'Post');
    await expect(page.getByText(`JV ${jvno} posted to the general ledger.`)).toBeVisible();
    await expect(page.locator('main')).toContainText('Posted');

    // It is listed under Posted.
    await page.goto('/dashboard/doc/jv');
    await page.getByRole('tab', { name: /^Posted/ }).click();
    await expect(page.locator('main').getByText(jvno)).toBeVisible();
  });

  test('journal voucher: an unbalanced entry is refused with the reason', async ({ page }) => {
    await page.goto('/dashboard/doc/jv/new');
    await page.getByLabel(/^Description/).fill('E2E flow: unbalanced');
    await choose(page, cell(page, 1, 'Account'), 'Petty Cash Fund');
    await cell(page, 1, 'Debit').fill('100');
    await choose(page, cell(page, 2, 'Account'), 'Cash in Bank - BDO');
    await cell(page, 2, 'Credit').fill('90');
    await cell(page, 2, 'Credit').press('Tab');
    await page.locator('main').getByRole('button', { name: /^Save/ }).first().click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/new$/);
  });
});
