import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

test('the entry chunk does not include three.js', () => {
  const dist = join(import.meta.dirname, '../dist');
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const entry = /<script[^>]+src="\.\/(assets\/[^"]+\.js)"/.exec(html)?.[1];
  expect(entry).toBeTruthy();
  expect(readFileSync(join(dist, entry!), 'utf8')).not.toContain('WebGLRenderer');
});
