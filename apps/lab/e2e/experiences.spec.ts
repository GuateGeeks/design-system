import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) => page.locator('[data-gg="campus-stage"]');

async function openCampus(page: Page, query = '?edition=none') {
  await page.goto(`./${query}#/experiences`);
  await expect(stage(page)).toHaveAttribute('data-ready', 'true', { timeout: 20_000 });
}

test('campus renders and reports ready', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openCampus(page);
  const box = await stage(page).locator('canvas').boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect(box?.height).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});

test('maximum configuration stays within budget', async ({ page }) => {
  await openCampus(page);
  await page.getByRole('button', { name: 'Campus completo' }).click();
  await expect.poll(async () => Number(await stage(page).getAttribute('data-triangles')), { timeout: 15_000 }).toBeGreaterThan(20_000);
  await page.waitForTimeout(4_000); // assembly finishes; diagnostics refresh every second
  expect(Number(await stage(page).getAttribute('data-triangles'))).toBeLessThanOrEqual(40_000);
  expect(Number(await stage(page).getAttribute('data-draw-calls'))).toBeLessThanOrEqual(150);
  expect(Number(await stage(page).getAttribute('data-materials'))).toBeLessThanOrEqual(10);
});

test('clicking a workshop focuses its program', async ({ page }) => {
  await openCampus(page);
  await page.getByRole('button', { name: 'Campus completo' }).click();
  await stage(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(4_000); // assembly settles and diagnostics (client coordinates) refresh after the scroll
  const box = (await stage(page).boundingBox())!;
  const viewport = page.viewportSize()!;
  const targets = JSON.parse((await stage(page).getAttribute('data-targets')) ?? '[]') as Array<{ kind: string; id: string; x: number; y: number }>;
  // Inside the viewport, left of the HUD and above the feedback card.
  const workshop = targets.find((t) => t.kind === 'program' && t.x > box.x + 10 && t.x < box.x + box.width - 360 && t.y > Math.max(box.y, 0) + 10 && t.y < Math.min(box.y + box.height - 140, viewport.height - 10));
  expect(workshop, JSON.stringify({ box, targets })).toBeTruthy();
  await page.mouse.click(workshop!.x, workshop!.y);
  await expect(page.locator(`[data-config="program:${workshop!.id}"]`)).toHaveAttribute('data-active', 'true');
});

test('reduced motion settles', async ({ page }) => {
  await openCampus(page);
  await page.getByRole('radiogroup', { name: 'Movimiento' }).getByRole('radio', { name: 'Reducido' }).click();
  await page.getByRole('button', { name: 'Campus completo' }).click();
  await expect(stage(page)).toHaveAttribute('data-frame-pending', 'false', { timeout: 3_000 });
});

test('no WebGL shows the summary', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return /webgl/.test(type) ? null : (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('./?edition=none#/experiences');
  await expect(stage(page)).toHaveAttribute('data-lost', 'true', { timeout: 10_000 });
  await expect(page.getByRole('region', { name: 'Resumen del campus' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Drones' })).toBeVisible();
  expect(errors).toEqual([]);
});
