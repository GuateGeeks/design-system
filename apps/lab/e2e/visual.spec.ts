import { expect, test } from '@playwright/test';
import { COMBOS, frameLinks, openFrame, shotName, VIEWPORTS } from './combos.ts';

for (const combo of COMBOS) {
  for (const [viewport, size] of Object.entries(VIEWPORTS)) {
    test(`frames · ${combo.theme} ${combo.scheme} · ${viewport}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize(size);
      const links = await frameLinks(page);
      expect(links.length).toBeGreaterThanOrEqual(30);
      for (const hash of links) {
        await openFrame(page, hash, combo);
        await expect.soft(page).toHaveScreenshot(shotName(hash, combo, viewport), { fullPage: true });
      }
    });
  }
}
