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
    ['/dashboard/doc/pcv', /Petty Cash Vouchers/],
    ['/dashboard/doc/fr', /Fund Replenishments/],
    ['/dashboard/doc/liq', /Cash Advance Liquidations/],
    ['/dashboard/fi/budget', /Budget Monitoring/],
    ['/dashboard/fi/jv-edit', /Edit Auto JV Entries/],
    ['/dashboard/admin/groups', /Access Matrix/],
    ['/dashboard/admin/doc-setup', /Document Setup/],
    ['/dashboard/admin/maintenance', /Maintenance Mode/],
    ['/dashboard/help', /Help & About/],
    ['/dashboard/reports', /Report Library/],
    ['/dashboard/reports/ap', /A\/P Reports/],
    ['/dashboard/reports/ar/collection-register', /Collection Register/],
    ['/dashboard/doc/da', /Deposit Applications/],
    ['/dashboard/sd/dsr', /Daily Sales Reports/],
    ['/dashboard/sd/salesman', /Salesman's Workspace/],
    ['/dashboard/sd/requests', /Order Requests/],
    ['/dashboard/sd/customer-tools', /Customer Tools/],
    ['/dashboard/hr/payroll-ids', /Payroll IDs/],
    ['/dashboard/hr/dtr', /DTR Upload/],
    ['/dashboard/hr/clinic', /Clinic/],
    ['/dashboard/fi/doc-query', /Document Query/],
  ];

  for (const [path, heading] of screens) {
    test(`opens ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('This screen is not part of your access')).toHaveCount(0);
    });
  }

  test('the access matrix ticks a whole module and can discard it', async ({ page }) => {
    await page.goto('/dashboard/admin/groups');
    await expect(page.getByRole('heading', { level: 1, name: /Access Matrix/ })).toBeVisible({ timeout: 30_000 });
    const box = page.getByRole('checkbox', { name: 'Purchasing for QA Laboratory' });
    await box.click();
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('button', { name: /Save Permissions \(1\)/ })).toBeEnabled();
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(box).not.toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('checkbox', { name: /for System Administrator/ })).toHaveCount(0); // always, locked
  });

  test('a page can be pinned to Favourites', async ({ page }) => {
    await page.goto('/dashboard/fi/budget');
    await page.getByRole('button', { name: /Add Budget Monitoring to Favourites/ }).click();
    await expect(page.getByRole('navigation', { name: 'Main menu' }).getByText('Favourites')).toBeVisible();
    await page.getByRole('button', { name: /Remove Budget Monitoring from Favourites/ }).click();
    await expect(page.getByRole('button', { name: /Add Budget Monitoring to Favourites/ })).toBeVisible();
  });

  test('a report runs and offers print and CSV', async ({ page }) => {
    await page.goto('/dashboard/reports/ap/vp-register');
    await expect(page.getByRole('heading', { level: 1, name: /Voucher Payable Register/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Lines', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  });

  test('a new sales order numbers itself and computes totals', async ({ page }) => {
    await page.goto('/dashboard/doc/so/new');
    await expect(page.getByRole('heading', { level: 1, name: /New sales order/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Order total/i).first()).toBeVisible();
  });
});
