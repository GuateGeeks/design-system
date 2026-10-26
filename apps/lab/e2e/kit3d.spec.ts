import { expect, test } from '@playwright/test';

test('kit 3d shows a piece', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?edition=none#/kit3d');
  await expect(page.locator('[data-gg="three-host"] canvas')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('tab', { name: 'Personajes' }).click();
  await page.getByRole('tabpanel').getByRole('button').first().click();
  await expect(page.getByText(/triángulos/)).toBeVisible();
  expect(errors).toEqual([]);
});
