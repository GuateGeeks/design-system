import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { COMBOS, frameLinks, openFrame } from './combos.ts';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

async function seriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

for (const combo of COMBOS) {
  test(`frames are accessible · ${combo.theme} ${combo.scheme}`, async ({ page }) => {
    test.setTimeout(180_000);
    const problems: string[] = [];
    for (const hash of await frameLinks(page)) {
      await openFrame(page, hash, combo);
      for (const v of await seriousViolations(page)) problems.push(`${hash} → ${v}`);
    }
    expect(problems).toEqual([]);
  });
}

for (const section of ['foundations', 'components', 'studio']) {
  test(`${section} page is accessible`, async ({ page }) => {
    await page.goto(`./?edition=none#/${section}`);
    await page.getByRole('heading', { level: 1 }).waitFor();
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test('keyboard reaches the toolbar', async ({ page }) => {
  await page.goto('./?edition=none#/foundations');
  const theme = page.getByRole('combobox', { name: 'Tema' });
  for (let i = 0; i < 12 && !(await theme.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(theme).toBeFocused();
});
