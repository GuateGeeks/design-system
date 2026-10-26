import { describe, expect, it, vi } from 'vitest';
import { Mesh } from 'three';
import { backOut, createBuilder, hash, PAL, paletteSignature, pick, releaseEntityGroup, Rig, smooth, span, withPalette } from '@guategeeks/three';

describe('kit utilities', () => {
  it('hash and pick are deterministic', () => {
    expect(hash('a', 1)).toBe(hash('a', 1));
    expect(hash('a', 1)).not.toBe(hash('a', 2));
    for (let i = 0; i < 50; i++) { const h = hash('x', i); expect(h).toBeGreaterThanOrEqual(0); expect(h).toBeLessThan(1); }
    expect(pick(['a', 'b', 'c'], 'seed')).toBe(pick(['a', 'b', 'c'], 'seed'));
  });

  it('easings', () => {
    expect(backOut(1)).toBeCloseTo(1);
    expect(smooth(0.5)).toBe(0.5);
    expect(span(-1, 0, 1)).toBe(0);
    expect(span(2, 0, 1)).toBe(1);
  });
});

describe('palettes', () => {
  it('withPalette swaps and restores, even on throw', () => {
    const roof = PAL.roof;
    expect(withPalette({ roof: '#123456' }, () => PAL.roof)).toBe('#123456');
    expect(PAL.roof).toBe(roof);
    expect(() => withPalette({ roof: '#000000' }, () => { throw new Error('boom'); })).toThrow('boom');
    expect(PAL.roof).toBe(roof);
  });

  it('paletteSignature is stable for equal overrides in any key order', () => {
    expect(paletteSignature({ roof: '#111111', lawn: '#222222' })).toBe(paletteSignature({ lawn: '#222222', roof: '#111111' }));
    expect(paletteSignature({})).toBe('');
  });
});

describe('builder', () => {
  it('builds skinned geometry under bones', () => {
    const rig = new Rig();
    rig.add('table', 'root', 1, 0, 0);
    const b = createBuilder(rig);
    b.bone('table').box(0, 0, 0, 1, 1, 1, '#ffffff');
    const group = b.finish({ solid: undefined, soft: undefined, glow: undefined, glass: undefined, blob: undefined } as never);
    const meshes = group.children.filter((c): c is Mesh => (c as Mesh).isMesh);
    expect(meshes).toHaveLength(1);
    expect(meshes[0].geometry.getAttribute('skinIndex')).toBeTruthy();
    expect(group.userData.triangles).toBe(12);
  });

  it('releaseEntityGroup disposes geometries', () => {
    const b = createBuilder();
    b.box(0, 0, 0, 1, 1, 1, '#ffffff');
    const group = b.finish({} as never);
    const mesh = group.children.find((c) => (c as Mesh).isMesh) as Mesh;
    const dispose = vi.spyOn(mesh.geometry, 'dispose');
    releaseEntityGroup(group);
    expect(dispose).toHaveBeenCalled();
  });
});
