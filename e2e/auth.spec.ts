import { test, expect } from '@playwright/test';
import { DEMO_PASSWORD, signIn } from './helpers';

test.describe('Sign-in and company privacy', () => {
  test('login page lists no companies and has no company dropdown', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Cloud AOS/i);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.locator('select')).toHaveCount(0);
    const body = await page.textContent('body');
    for (const name of ['JCS Chemical', 'APF Corporation', 'Chemag']) expect(body).not.toContain(name);
  });

  test('wrong password shows a plain message', async ({ page }) => {
    await page.goto('/');
    // An account that does not exist, so the test never adds lockout strikes to a real one.
    await page.fill('input[autocomplete=username]', 'e2e-nobody');
    await page.fill('input[autocomplete=current-password]', 'not-the-password');
    await page.click('button[type=submit]');
    await expect(page.getByText('The username or password is not correct.')).toBeVisible({ timeout: 15_000 });
  });

  test('single-company user goes straight to Home with their own header', async ({ page }) => {
    await signIn(page, 'cashier');
    const sidebar = page.locator('aside').first();
    await expect(sidebar.locator('select')).toHaveCount(0);
    await expect(sidebar).toContainText('JCS Chemical Industries');
    await expect(sidebar).not.toContainText('APF');
    await expect(sidebar).not.toContainText('Chemag');
  });

  test('multi-company user picks a company after signing in, and APF is never offered', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[autocomplete=username]', 'finance');
    await page.fill('input[autocomplete=current-password]', DEMO_PASSWORD);
    await page.click('button[type=submit]');
    const chooser = page.getByRole('heading', { name: 'Choose a company' });
    await expect(chooser).toBeVisible({ timeout: 30_000 });
    const card = page.locator('div', { has: chooser }).last();
    await expect(card).not.toContainText('APF');
    await card.getByRole('button', { name: /Chemag/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    await expect(page.locator('aside').first()).toContainText('Chemag');
  });

  test('a user of JCS and the dissolved APF goes straight to JCS', async ({ page }) => {
    await signIn(page, 'accountant');
    await expect(page.locator('aside').first()).toContainText('JCS Chemical Industries');
    await expect(page.locator('aside').first()).not.toContainText('APF');
  });
});
