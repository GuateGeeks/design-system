import { describe, expect, it } from 'vitest';
import type { BufferAttribute, Mesh } from 'three';
import { MODEL_THREE_KEYS } from '@guategeeks/geeky/model';
import geekyPackage from '@guategeeks/geeky/package.json' with { type: 'json' };
import mascotPackage from '../package.json' with { type: 'json' };
import { createGeeky3D } from '@guategeeks/mascot';
import { GEEKY_THREE } from '../src/three-namespace.ts';

const spec: string = mascotPackage.dependencies['@guategeeks/geeky'];
const pinned = /#v(\d+\.\d+\.\d+)$/.exec(spec)?.[1] ?? null;

describe('Geeky from GuateGeeks/geeky-animation', () => {
  it.skipIf(!pinned)('installed Geeky matches the pinned tag', () => {
    expect(geekyPackage.version).toBe(pinned);
  });

  it('GEEKY_THREE covers MODEL_THREE_KEYS', () => {
    for (const key of MODEL_THREE_KEYS) expect((GEEKY_THREE as Record<string, unknown>)[key], key).toBeDefined();
    expect(Object.keys(GEEKY_THREE).sort()).toEqual([...MODEL_THREE_KEYS].sort());
  });

  it('palette reaches the model', () => {
    const geeky = createGeeky3D({}, { reduced: true, palette: { frame: '#ff0000' } });
    expect(geeky.ownMaterials()).toHaveLength(2);
    const red: Mesh[] = [];
    geeky.group.traverse((o) => {
      const colour = (o as Mesh).isMesh ? ((o as Mesh).geometry.getAttribute('color') as BufferAttribute | undefined) : undefined;
      if (colour && colour.getX(0) === 1 && colour.getY(0) === 0 && colour.getZ(0) === 0) red.push(o as Mesh);
    });
    expect(red.length).toBeGreaterThan(0);
    geeky.dispose();
  });

  it('unknown cue returns false', () => {
    const geeky = createGeeky3D({}, { reduced: false });
    expect(geeky.cue('no-such-action')).toBe(false);
    expect(geeky.cue('greet')).toBe(true);
    geeky.dispose();
  });
});
