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

  // By default only Chemag Trading is active (JCS Chemical on hold, APF dissolved): see Administration > Companies.
  test('a user goes straight to Home with their own company header', async ({ page }) => {
    await signIn(page, 'cashier');
    const sidebar = page.locator('aside').first();
    await expect(sidebar.locator('select')).toHaveCount(0);
    await expect(sidebar).toContainText('Chemag Trading');
    await expect(sidebar).not.toContainText('APF');
    await expect(sidebar).not.toContainText('JCS Chemical');
  });

  test('a user of several companies is never offered a switched-off one', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[autocomplete=username]', 'finance');
    await page.fill('input[autocomplete=current-password]', DEMO_PASSWORD);
    await page.click('button[type=submit]');
    // With one active company there is nothing to choose: Home opens directly.
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toContainText('Chemag Trading');
    await expect(sidebar).not.toContainText('JCS Chemical');
    await expect(sidebar).not.toContainText('APF');
  });

  test('every sample role can open Chemag Trading', async ({ page }) => {
    for (const user of ['accountant', 'lab', 'auditor', 'purchasing']) {
      await page.context().clearCookies();
      await signIn(page, user);
      await expect(page.locator('aside').first()).toContainText('Chemag Trading');
    }
  });
});
