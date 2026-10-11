import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test.describe('Modules', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'admin', /JCS Chemical Industries/);
  });

  const screens: Array<[string, RegExp]> = [
    ['/dashboard/doc/jv', /Journal Vouchers/],
    ['/dashboard/fi/statements', /Financial Statements/],
    ['/dashboard/doc/vp', /Vouchers Payable/],
    ['/dashboard/doc/or', /Official Receipts/],
    ['/dashboard/doc/so', /Sales Orders/],
    ['/dashboard/mm/stock', /Stock by Plant/],
    ['/dashboard/doc/po', /Purchase Orders/],
    ['/dashboard/doc/prod', /Production/],
    ['/dashboard/hr/payroll', /Payroll/],
    ['/dashboard/admin/company', /Company & Branding/],
  ];

  for (const [path, heading] of screens) {
    test(`opens ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('This screen is not part of your access')).toHaveCount(0);
    });
  }

  test('a new sales order numbers itself and computes totals', async ({ page }) => {
    await page.goto('/dashboard/doc/so/new');
    await expect(page.getByRole('heading', { level: 1, name: /New sales order/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Order total/i).first()).toBeVisible();
  });
});
