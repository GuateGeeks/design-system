import { describe, expect, it } from 'vitest';
import type { Mesh } from 'three';
import { buildPiece, CATALOG, GROUPS, paperMaterials, releaseEntityGroup } from '@guategeeks/three';

describe('papercraft catalog', () => {
  it('catalog ids are unique and grouped', () => {
    const ids = CATALOG.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = new Set(GROUPS.map((g) => g.id));
    for (const piece of CATALOG) expect(groups.has(piece.group), piece.id).toBe(true);
    expect(CATALOG.length).toBeGreaterThan(40);
  });

  it('every catalog piece builds finite geometry', () => {
    const materials = paperMaterials();
    for (const piece of CATALOG) {
      const built = buildPiece(piece, materials);
      expect(built.error, piece.id).toBeNull();
      expect(built.triangles, piece.id).toBeGreaterThan(0);
      built.group.traverse((o) => {
        if (!(o as Mesh).isMesh) return;
        const p = (o as Mesh).geometry.getAttribute('position').array;
        for (let i = 0; i < p.length; i++) if (!Number.isFinite(p[i])) throw new Error(`${piece.id}: non-finite vertex`);
      });
      releaseEntityGroup(built.group);
    }
  });
});
