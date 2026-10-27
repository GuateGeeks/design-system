import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) => page.locator('[data-gg="legacy-school-stage"]');

async function openSchool(page: Page, query = '?edition=none') {
  await page.goto(`./${query}#/experiences`);
  await stage(page).scrollIntoViewIfNeeded();
  await expect(stage(page)).toHaveAttribute('data-ready', 'true', { timeout: 20_000 });
}

test('legacy school renders and reports ready', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openSchool(page);
  const box = await stage(page).locator('canvas').boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});

test('tapping a workshop names its activity', async ({ page }) => {
  await openSchool(page);
  await page.waitForTimeout(3_000); // targets refresh every second, in client coordinates after the scroll
  const box = (await stage(page).boundingBox())!;
  const viewport = page.viewportSize()!;
  const targets = JSON.parse((await stage(page).getAttribute('data-targets')) ?? '[]') as Array<{ kind: string; id: string; x: number; y: number }>;
  const names: Record<string, string> = { tale: 'Tale-Bot', master: 'Robot Master', spike: 'SPIKE Prime', electronics: 'Electrónica', drones: 'Drones', immersive: 'Realidad virtual' };
  // Inside the visible stage, away from the controls (top right) and the panel (bottom left).
  const workshop = targets.find((t) => t.kind === 'program' && t.x > box.x + 20 && t.x < box.x + box.width - 220 && t.y > Math.max(box.y, 0) + 70 && t.y < Math.min(box.y + box.height - 160, viewport.height - 10));
  expect(workshop, JSON.stringify({ box, targets })).toBeTruthy();
  await page.mouse.click(workshop!.x, workshop!.y);
  await expect(page.locator('[data-gg="legacy-school-panel"]')).toContainText(names[workshop!.id]);
});

test('no WebGL shows the text alternative', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return /webgl/.test(type) ? null : (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto('./?edition=none#/experiences');
  const alt = page.locator('[data-gg="legacy-school-text"]');
  await expect(alt).toBeVisible({ timeout: 20_000 });
  for (const name of ['Tale-Bot', 'Robot Master', 'SPIKE Prime', 'Electrónica', 'Drones', 'Realidad virtual']) await expect(alt).toContainText(name);
});

test('legacy school ignores theme and disposes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // The lab keeps the chosen appearance in localStorage (gg-appearance); set it, then open the page.
  for (const appearance of [{ theme: 'halloween', scheme: 'dark' }, { theme: 'guategeeks', scheme: 'light' }]) {
    await page.goto('./?edition=none#/foundations');
    await page.evaluate((v) => localStorage.setItem('gg-appearance', v), JSON.stringify(appearance));
    await page.reload(); // a hash change alone keeps the running controller
    await openSchool(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', appearance.theme);
    const host = stage(page).locator('[data-gg="three-host"]');
    await expect(host).toHaveCSS('background-color', 'rgb(46, 24, 83)');
  }
  await page.goto('./?edition=none#/foundations');
  await expect(page.locator('[data-gg="legacy-school-stage"] canvas')).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
