import { describe, expect, it } from 'vitest';
import { checkContrast, CONTRAST_PAIRS, validateManifest } from '@guategeeks/themes/validate';

describe('validateManifest', () => {
  it('accepts a minimal manifest', () => {
    expect(validateManifest({ id: 'x', name: 'X', schemes: ['light'] })).toEqual([]);
  });

  it('rejects bad ids and schemes', () => {
    expect(validateManifest({ id: 'Bad Id', name: 'X', schemes: ['light'] }).join(' ')).toMatch(/id/);
    expect(validateManifest({ id: 'x', name: 'X', schemes: [] }).join(' ')).toMatch(/schemes/);
    expect(validateManifest({ id: 'x', name: 'X', schemes: ['light'], motion: { intensity: 'wild' } }).join(' ')).toMatch(/intensity/);
  });

  it('rejects non-objects', () => {
    expect(validateManifest(null).length).toBeGreaterThan(0);
    expect(validateManifest('theme').length).toBeGreaterThan(0);
  });
});

describe('contrast', () => {
  it('contrast pairs', () => {
    const key = (p: { fg: string; bg: string; min: number }) => `${p.fg}/${p.bg}@${p.min}`;
    const expected = [
      'ink/bg', 'ink/surface', 'ink/surface-2', 'ink-muted/surface', 'ink-muted/surface-2', 'ink-subtle/surface',
      'ink-subtle/surface-2', 'on-action/action', 'on-action/action-hover', 'link/bg', 'link/surface', 'link/surface-2',
      'on-hero/hero', 'ok/surface', 'bad/surface', 'hint/surface', 'ink/wash', 'ok/ok-soft', 'bad/bad-soft', 'hint/hint-soft',
    ].map((p) => `${p}@4.5`).concat(['focus/bg@3', 'focus/surface@3']);
    expect(CONTRAST_PAIRS.map(key).sort()).toEqual(expected.sort());
  });

  it('flags failing pairs', () => {
    const result = checkContrast({ '--gg-color-ink': '#777777', '--gg-color-bg': '#ffffff' }).find((r) => r.fg === 'ink' && r.bg === 'bg');
    expect(result?.pass).toBe(false);
    expect(result?.ratio).toBeCloseTo(4.48, 2);
  });

  it('invalid colors fail safely', () => {
    const result = checkContrast({ '--gg-color-ink': 'nope', '--gg-color-bg': '#ffffff' }).find((r) => r.fg === 'ink' && r.bg === 'bg');
    expect(result).toMatchObject({ pass: false, ratio: 0 });
  });
});
