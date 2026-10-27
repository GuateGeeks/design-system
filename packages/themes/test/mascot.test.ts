import { beforeAll, describe, expect, it } from 'vitest';
import { buildTheme, loadManifests } from '@guategeeks/themes/build';
import { contrastRatio, validateManifest } from '@guategeeks/themes/validate';
import { geekyPalette, getTheme, type ThemeManifest } from '@guategeeks/themes';

const HEX = /^#[0-9a-f]{6}$/i;
const base = { id: 'x', name: 'X', schemes: ['dark'] } as const;

describe('Geeky palette per theme', () => {
  it('validates palette keys and values', () => {
    expect(validateManifest({ ...base, mascot: { palette: { dark: { frame: 'red' } } } })).toContain('mascot.palette.dark.frame must be a hex color');
    expect(validateManifest({ ...base, mascot: { palette: { sepia: {} } } })).toContain('mascot.palette keys must be light | dark');
    expect(validateManifest({ ...base, mascot: { palette: { dark: { costume: '#ffffff' } } } })).toContain('mascot.palette.dark.costume is not a palette key (frame, back, lid, heart, blush)');
    expect(validateManifest({ ...base, mascot: { costume: 'pumpkin', palette: { dark: { frame: '#ffaa00' } } } })).toEqual([]);
  });

  for (const [theme, scheme] of [['halloween', 'dark'], ['guategeeks', 'dark']] as const) {
    it(`${theme} ${scheme} has a frame with 3:1 contrast`, () => {
      const resolved = getTheme(theme)!;
      const frame = geekyPalette(resolved, scheme).frame!;
      expect(frame).toMatch(HEX);
      expect(contrastRatio(frame, resolved.values[scheme]!['--gg-color-bg'])).toBeGreaterThanOrEqual(3);
    });
  }

  it('brand light keeps Geeky defaults', () => {
    expect(geekyPalette(getTheme('guategeeks'), 'light')).toEqual({});
    expect(contrastRatio('#34314f', getTheme('guategeeks')!.values.light!['--gg-color-bg'])).toBeGreaterThanOrEqual(3);
  });

  it('a missing theme or scheme gives an empty palette', () => {
    expect(geekyPalette(undefined, 'dark')).toEqual({});
    expect(geekyPalette(getTheme('halloween'), 'light')).toEqual({});
  });

  describe('build', () => {
    let manifests: ThemeManifest[];
    beforeAll(() => { manifests = loadManifests(); });

    it('a child palette overrides its parent per scheme and key', async () => {
      const child: ThemeManifest = { id: 'child', name: 'Child', extends: 'guategeeks', schemes: ['dark'], mascot: { palette: { dark: { heart: '#ff3366' } } } };
      const build = await buildTheme(child, [...manifests, child]);
      const parent = geekyPalette(getTheme('guategeeks'), 'dark');
      expect(build.resolved.mascot.palette.dark).toEqual({ ...parent, heart: '#ff3366' });
    });

    it('reports a frame that disappears into the background', async () => {
      const dim: ThemeManifest = { id: 'dim', name: 'Dim', extends: 'halloween', schemes: ['dark'], mascot: { palette: { dark: { frame: '#1a1222' } } } };
      const build = await buildTheme(dim, [...manifests, dim]);
      expect(build.errors.join('\n')).toMatch(/dim \(dark\): Geeky frame #1a1222 contrast \d\.\d\d < 3/);
    });
  });
});
