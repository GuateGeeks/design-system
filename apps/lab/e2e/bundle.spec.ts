import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// Text only three.js itself contains (its renderer's log prefix and shader source). geeky-animation's renderer
// code mentions `WebGLRenderer` on the injected namespace, so that bare word is not a marker of the library.
const THREE_MARKERS = ['THREE.WebGLRenderer', 'precision highp'];

test('the entry chunk does not include three.js', () => {
  const dist = join(import.meta.dirname, '../dist');
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const entry = /<script[^>]+src="\.\/(assets\/[^"]+\.js)"/.exec(html)?.[1];
  expect(entry).toBeTruthy();
  const code = readFileSync(join(dist, entry!), 'utf8');
  for (const marker of THREE_MARKERS) expect(code.includes(marker), marker).toBe(false);
  // The markers still identify three.js: some lazy chunk carries them.
  const chunks = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dist, 'assets', f), 'utf8'));
  for (const marker of THREE_MARKERS) expect(chunks.some((c) => c.includes(marker)), marker).toBe(true);
});
