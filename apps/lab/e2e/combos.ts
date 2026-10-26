import type { Page } from '@playwright/test';

export const COMBOS = [
  { theme: 'guategeeks', scheme: 'light' },
  { theme: 'guategeeks', scheme: 'dark' },
  { theme: 'halloween', scheme: 'dark' },
] as const;

export const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
} as const;

/** Frame hashes ("#/frame/<entry>/<state>") listed by the lab's #/frames page. */
export async function frameLinks(page: Page): Promise<string[]> {
  await page.goto('./#/frames');
  const links = page.locator('a[data-frame]');
  await links.first().waitFor();
  return links.evaluateAll((els) => els.map((el) => el.getAttribute('href')!));
}

/** Opens a frame with fixed appearance and waits until it is stable for a screenshot. */
export async function openFrame(page: Page, hash: string, combo: { theme: string; scheme: string }, motion = 'reduced') {
  await page.goto(`./${hash}?theme=${combo.theme}&scheme=${combo.scheme}&motion=${motion}`);
  await page.locator('[data-frame]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

export const shotName = (hash: string, combo: { theme: string; scheme: string }, viewport: string) =>
  `${hash.replace('#/frame/', '').replace('/', '-')}-${combo.theme}-${combo.scheme}-${viewport}.png`;
