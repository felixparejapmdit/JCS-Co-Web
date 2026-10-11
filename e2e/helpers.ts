import { expect, type Page } from '@playwright/test';

/** Password shared by every sample account in the demo data (shown on the login page in demo mode). */
export const DEMO_PASSWORD = 'Demo@2026';

/**
 * Signs in with a sample account. Users with one company land on Home directly;
 * users with several companies pick one on the chooser that appears after sign-in.
 */
export async function signIn(page: Page, username: string, company?: RegExp) {
  await page.goto('/');
  await page.fill('input[autocomplete=username]', username);
  await page.fill('input[autocomplete=current-password]', DEMO_PASSWORD);
  await page.click('button[type=submit]');
  const chooser = page.getByRole('heading', { name: 'Choose a company' });
  await expect(chooser.or(page.getByText('Waiting for you'))).toBeVisible({ timeout: 30_000 });
  if (await chooser.isVisible()) {
    const card = page.locator('div', { has: chooser }).last();
    await (company ? card.getByRole('button', { name: company }) : card.locator('.grid button').first()).click();
  }
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  await expect(page.getByText('Waiting for you')).toBeVisible({ timeout: 30_000 });
}
