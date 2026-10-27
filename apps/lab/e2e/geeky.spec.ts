import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

const require = createRequire(import.meta.url);
// The version installed for @guategeeks/mascot (hoisted to the root node_modules).
const geekyVersion: string = JSON.parse(readFileSync(require.resolve('@guategeeks/geeky/package.json'), 'utf8')).version;

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('geeky page shows Geeky and the snippet follows the choice', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?edition=none#/geeky');
  const stage = page.locator('[data-gg="geeky-stage"]');
  await expect(stage.locator('[data-gg="geeky"] svg')).toBeVisible();
  // People click the visible chip; the radio inside it is visually hidden.
  await page.locator('label', { hasText: /^Celebrar$/ }).click();
  await expect(page.getByRole('radio', { name: 'Celebrar' })).toBeChecked();
  const code = page.locator('[data-gg="geeky-snippet"]');
  await expect(code).toContainText('<Geeky intent="celebrate"');
  await page.getByRole('button', { name: 'Copiar código' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('<Geeky intent="celebrate"');
  expect(errors).toEqual([]);
});

test('3d loads lazily', async ({ page }) => {
  await page.goto('./?edition=none#/geeky');
  const geeky = page.locator('[data-gg="geeky-stage"] [data-gg="geeky"]');
  await expect(geeky.locator('svg')).toBeVisible();
  await expect(geeky.locator('canvas')).toHaveCount(0);
  await page.getByRole('radio', { name: '3D' }).click();
  await expect(geeky.locator('canvas')).toHaveCount(1, { timeout: 15_000 });
  await expect(page.locator('[data-gg="geeky-snippet"]')).toContainText('render="3d"');
});

test('catalogue plays an action in the stage', async ({ page }) => {
  await page.goto('./?edition=none#/geeky');
  await page.getByRole('tab', { name: 'Todas las acciones' }).click();
  await page.getByRole('button', { name: 'Bicicleta' }).click();
  await expect(page.locator('[data-gg="geeky-snippet"]')).toContainText('<Geeky action="bicycle"');
  await expect(page.getByRole('combobox', { name: 'Acción exacta' })).toContainText('Bicicleta');
});

test('looping intents offer a pause control', async ({ page }) => {
  await page.goto('./?edition=none#/geeky');
  await page.locator('label', { hasText: /^Esperar$/ }).click();
  await page.getByRole('button', { name: 'Pausar a Geeky' }).click();
  await expect(page.getByRole('button', { name: 'Reanudar a Geeky' })).toBeVisible();
});

test('version tab shows the pinned version', async ({ page }) => {
  await page.goto('./?edition=none#/geeky');
  await page.getByRole('tab', { name: 'Versión' }).click();
  await expect(page.getByText(`v${geekyVersion}`, { exact: false }).first()).toBeVisible();
});

test('the action select follows intent changes and can pick the same action again', async ({ page }) => {
  await page.goto('./?edition=none#/geeky');
  const select = page.getByRole('combobox', { name: 'Acción exacta' });
  const code = page.locator('[data-gg="geeky-snippet"]');
  await select.click();
  await page.getByRole('option', { name: /· Hola$/ }).click();
  await expect(code).toContainText('action="waving"');
  await page.locator('label', { hasText: /^Celebrar$/ }).click();
  await expect(code).toContainText('intent="celebrate"');
  await expect(select).toContainText('Según la intención');
  await select.click();
  await page.getByRole('option', { name: /· Hola$/ }).click();
  await expect(code).toContainText('action="waving"');
});
