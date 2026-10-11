import { test, expect } from '@playwright/test';

test.describe('Installable app (PWA)', () => {
  test('serves the Cloud AOS manifest', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toBe('Cloud AOS');
    expect(manifest.short_name).toBe('Cloud AOS');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/dashboard');
    expect(manifest.icons.some((i: any) => i.sizes === '192x192')).toBe(true);
    expect(manifest.icons.some((i: any) => i.sizes === '512x512')).toBe(true);
  });

  test('serves the service worker', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('Cloud AOS Service Worker');
    expect(text).toContain('/offline');
  });

  test('renders the offline page', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Try again/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Go to Home/i })).toBeVisible();
  });

  test('serves the app icons', async ({ request }) => {
    expect((await request.get('/icons/icon-192x192.png')).status()).toBe(200);
    expect((await request.get('/icons/icon-512x512.png')).status()).toBe(200);
  });
});
