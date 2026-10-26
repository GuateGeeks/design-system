import { beforeAll, describe, expect, it } from 'vitest';
import { reducedMotionCss } from '@guategeeks/tokens/build';
import { buildTheme, buildThemesCss, checkEditions, loadEditions, loadManifests, type ThemeBuild } from '@guategeeks/themes/build';
import type { ThemeManifest } from '@guategeeks/themes';

let manifests: ThemeManifest[];
let brand: ThemeBuild;
let halloween: ThemeBuild;
beforeAll(async () => {
  manifests = loadManifests();
  brand = await buildTheme(manifests.find((m) => m.id === 'guategeeks')!, manifests);
  halloween = await buildTheme(manifests.find((m) => m.id === 'halloween')!, manifests);
});

/** Specificity as attribute selectors + pseudo-classes; `:where()` contributes nothing. */
const specificity = (selector: string) => {
  const s = selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '');
  return (s.match(/\[[^\]]+\]/g) ?? []).length + (s.match(/:root/g) ?? []).length;
};

describe('buildTheme', () => {
  it('brand resolves both schemes', () => {
    expect(brand.errors).toEqual([]);
    expect(brand.resolved.defaultScheme).toBe('light');
    expect(brand.resolved.values.dark?.['--gg-color-bg']).toBe('#121722');
    expect(brand.resolved.values.light?.['--gg-color-action']).toBe('#ef8556');
  });

  it('extends merges', () => {
    expect(halloween.errors).toEqual([]);
    expect(halloween.resolved.values.dark?.['--gg-color-action']).toBe('#ff7a1a');
    expect(halloween.resolved.values.dark?.['--gg-radius-control']).toBe('12px');
    expect(halloween.resolved.values.light).toBeUndefined();
  });

  it('display font', () => {
    const font = halloween.resolved.values.dark?.['--gg-font-display'] ?? '';
    expect(font.startsWith("Creepster, 'Inter Variable'")).toBe(true);
    expect(halloween.resolved.displayFont).toEqual({ family: 'Creepster' });
    expect(halloween.css.startsWith('@import "@fontsource/creepster/400.css";')).toBe(true);
  });

  it('intensity scales durations', async () => {
    expect(halloween.resolved.values.dark?.['--gg-duration-base']).toBe('0.204s');
    expect(brand.resolved.values.light?.['--gg-duration-base']).toBe('0.24s');
    const calm = await buildTheme({ id: 'calm', name: 'Calm', extends: 'guategeeks', schemes: ['light'], motion: { intensity: 'calm' } }, manifests);
    expect(calm.resolved.values.light?.['--gg-duration-base']).toBe('0.3s');
  });

  it('scoped selectors', () => {
    expect(brand.css).toContain('[data-theme="guategeeks"] {');
    expect(brand.css).toContain('[data-theme="guategeeks"][data-scheme="dark"] {');
    expect(halloween.css.match(/\[data-theme="halloween"\][^{]*\{/g)).toEqual(['[data-theme="halloween"] {']);
    expect(halloween.css).toContain('--gg-color-bg: #0f0b14;');
    expect(halloween.css).toContain('color-scheme: dark;');
  });

  it('reduced motion outranks theme durations', () => {
    const themeSelector = specificity('[data-theme="x"]');
    const selectors = [...reducedMotionCss().matchAll(/^([^@{}\s][^{\n]*)\{/gm)].flatMap((m) => m[1].split(',').map((s) => s.trim()));
    expect(selectors.length).toBeGreaterThanOrEqual(4);
    for (const s of selectors) expect(specificity(s)).toBeGreaterThan(themeSelector);
  });

  it('build fails on contrast', async () => {
    const bad = await buildTheme(
      { id: 'bad', name: 'Bad', extends: 'guategeeks', schemes: ['light'], tokens: { light: { color: { ink: { $value: '#777777' } } } } },
      manifests,
    );
    expect(bad.errors.join('\n')).toMatch(/ink\/bg/);
  });

  it('reports extends cycles', async () => {
    const a: ThemeManifest = { id: 'a', name: 'A', extends: 'b', schemes: ['light'] };
    const b: ThemeManifest = { id: 'b', name: 'B', extends: 'a', schemes: ['light'] };
    expect((await buildTheme(a, [a, b])).errors.join('\n')).toMatch(/cycle/);
  });
});

describe('themes.css and editions', () => {
  it('themes.css hoists imports', () => {
    const css = buildThemesCss([brand, halloween]);
    const lines = css.split('\n');
    const firstRule = lines.findIndex((l) => l.includes('{'));
    const lastImport = lines.map((l) => l.startsWith('@import')).lastIndexOf(true);
    expect(lastImport).toBeGreaterThanOrEqual(0);
    expect(lastImport).toBeLessThan(firstRule);
  });

  it('editions reference existing themes', () => {
    expect(checkEditions(loadEditions(), manifests)).toEqual([]);
    expect(checkEditions([{ id: 'x', name: 'X', theme: 'nope', variants: {} }], manifests).join(' ')).toMatch(/nope/);
  });
});
