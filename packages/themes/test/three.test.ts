import { beforeAll, describe, expect, it } from 'vitest';
import { buildTheme, loadManifests, type ThemeBuild } from '@guategeeks/themes/build';
import { resolveThreeProfile, THREE_PROFILES, type ThemeManifest } from '@guategeeks/themes';
import { validateManifest } from '@guategeeks/themes/validate';

let manifests: ThemeManifest[];
let brand: ThemeBuild;
let halloween: ThemeBuild;
beforeAll(async () => {
  manifests = loadManifests();
  brand = await buildTheme(manifests.find((m) => m.id === 'guategeeks')!, manifests);
  halloween = await buildTheme(manifests.find((m) => m.id === 'halloween')!, manifests);
});

describe('3d profiles', () => {
  it('papercraft carries the cotizador values', () => {
    expect(THREE_PROFILES.papercraft).toMatchObject({
      background: '#F4F1F6', sky: '#ffffff', skyGround: '#d9cfe6', skyIntensity: 1.55, sun: '#fff3e4', sunIntensity: 2.1,
      fill: '#e6dcff', fillIntensity: 0.45, ground: '#3a2470', groundOpacity: 0.16, exposure: 1, marker: '#ffc857', preview: '#25c2c6',
      fibre: 0.045, mottle: 0.025, palette: {},
    });
    expect(THREE_PROFILES.lowpoly).toMatchObject({ id: 'lowpoly', fibre: 0, mottle: 0, exposure: 1.05 });
  });

  it('resolveThreeProfile merges overrides over the chosen profile', () => {
    expect(resolveThreeProfile({ profile: 'lowpoly', marker: '#000000' })).toMatchObject({ id: 'lowpoly', fibre: 0, marker: '#000000' });
    expect(resolveThreeProfile()).toEqual(THREE_PROFILES.papercraft);
  });

  it('brand resolves papercraft', () => {
    expect(brand.resolved.three).toEqual(THREE_PROFILES.papercraft);
  });

  it('halloween overrides merge over papercraft', () => {
    expect(halloween.errors).toEqual([]);
    expect(halloween.resolved.three).toMatchObject({ id: 'papercraft', background: '#160f1f', fibre: 0.045, marker: '#b6ff3b' });
    expect(halloween.resolved.three.palette.roof).toBe('#4a2a72');
  });

  it('validateManifest rejects bad three colors and unknown profile', () => {
    const base = { id: 'x', name: 'X', schemes: ['light'] };
    expect(validateManifest({ ...base, three: { profile: 'voxel' } }).join(' ')).toMatch(/three\.profile/);
    expect(validateManifest({ ...base, three: { background: 'red' } }).join(' ')).toMatch(/three\.background/);
    expect(validateManifest({ ...base, three: { palette: { roof: 'nope' } } }).join(' ')).toMatch(/three\.palette\.roof/);
    expect(validateManifest({ ...base, three: { profile: 'lowpoly', sunIntensity: 2 } })).toEqual([]);
  });
});
