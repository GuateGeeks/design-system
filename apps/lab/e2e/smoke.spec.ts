import { expect, test } from '@playwright/test';

test('active edition applies by date', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-31T18:00:00Z'));
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'halloween');
});

test('home renders the lab', async ({ page }) => {
  await page.goto('./?edition=none');
  await expect(page.getByRole('heading', { level: 1, name: 'Laboratorio de diseño GuateGeeks' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'guategeeks');
});

test('switching to Halloween locks the scheme and persists', async ({ page }) => {
  await page.goto('./?edition=none');
  await page.getByRole('combobox', { name: 'Tema' }).click();
  await page.getByRole('option', { name: 'Halloween' }).click();
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'halloween');
  await expect(html).toHaveAttribute('data-scheme', 'dark');
  for (const radio of await page.getByRole('radiogroup', { name: 'Esquema' }).getByRole('radio').all()) {
    await expect(radio).toBeDisabled();
  }
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'halloween');
});

test('frames apply their own query', async ({ page }) => {
  await page.goto('./#/frames');
  await expect(page.getByRole('heading', { name: 'Marcos' })).toBeVisible();
  await page.goto('./#/frame/none/none?theme=halloween&scheme=dark&motion=reduced');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'halloween');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
});
