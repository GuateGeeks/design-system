// Ported from GuateGeeks/cotizador@673ee22:asesor/test/{people-contract,primaria-r2}.test.js (geometric checks).
// The two checks that compare against the cotizador's docs and R2 JSON package stay in the cotizador.
import { describe, expect, it } from 'vitest';
import type { Mesh } from 'three';
import {
  addPaperPerson, createBuilder, instancePoint, measureBase, PRIMARIA_BASE, R2_FACTS, R2_INSTANCES, R2_PROVENANCE, R2_RECIPES, recipeFaces,
} from '@guategeeks/three';

describe('primaria student', () => {
  it('alumno base de primaria: medidas, presupuesto y plan = caras emitidas', () => {
    const m = measureBase();
    expect(Math.abs(m.H - 0.78)).toBeLessThanOrEqual(0.78 * 0.005);
    expect(Math.abs(m.head / m.H - 0.28)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(m.shoulders / m.H - 0.26)).toBeLessThanOrEqual(0.01);
    expect(m.minY).toBeGreaterThanOrEqual(-1e-6);
    for (const c of m.person.components) expect(c.triangles, c.id).toBe(c.planned);
  });

  it('alumno base de primaria: presupuesto ≤ 320 con las recetas R3 (geometría ≤ 313)', () => {
    const m = measureBase();
    expect(m.total).toBeLessThanOrEqual(320);
    expect(m.geometry).toBeLessThanOrEqual(313);
  });
});

describe('R2 package', () => {
  it('R2: 20 recetas, 33 instancias, 280 triángulos; montaje coherente con sus sockets', () => {
    expect(Object.keys(R2_RECIPES)).toHaveLength(20);
    expect(R2_INSTANCES).toHaveLength(33);
    for (const [id, o] of Object.entries(R2_PROVENANCE.r3) as Array<[string, { triangles: number }]>) expect(R2_RECIPES[id].faces.length, `${id} R3`).toBe(o.triangles);
    expect(R2_FACTS.r2PackageTriangles).toBe(280);
    expect(R2_FACTS.packageTriangles).toBe(280 + R2_FACTS.r3Delta);
    expect(R2_FACTS.emittedTriangles).toBe(272 + R2_FACTS.r3Delta);
    const byId = Object.fromEntries(R2_INSTANCES.map((i) => [i.id, i]));
    for (const i of R2_INSTANCES) {
      if (!i.parent || !i.target) continue;
      const a = instancePoint(i, R2_RECIPES[i.recipe].sockets[i.source].at);
      const parent = byId[i.parent];
      const c = instancePoint(parent, R2_RECIPES[parent.recipe].sockets[i.target].at);
      expect(Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]), `${i.id} → ${i.parent}.${i.target}`).toBeLessThan(1e-6);
    }
  });

  it('R2 emitido: cada instancia en su hueso, caras exteriores y conteo por instancia', () => {
    const b = createBuilder();
    b.base('solid');
    const p = addPaperPerson(b, { ...PRIMARIA_BASE, id: 't' });
    const g = b.finish({});
    for (const i of R2_INSTANCES) {
      const c = p.components.find((x) => x.id === i.id);
      expect(c.triangles, i.id).toBe(recipeFaces(i.recipe).length);
      expect(Object.keys(c.perBone), i.id).toEqual([i.bone]);
    }
    const solid = g.children.find((m) => (m as Mesh).isMesh && m.name === 'solid') as Mesh;
    const pos = solid.geometry.getAttribute('position');
    const idx = solid.geometry.index!;
    const tri = (k: number) => [0, 1, 2].map((j) => { const v = idx.getX(k * 3 + j); return [pos.getX(v), pos.getY(v), pos.getZ(v)]; });
    for (const c of p.components) {
      const i = R2_INSTANCES.find((x) => x.id === c.id);
      if (!i || !['P01', 'P02', 'P12', 'P13', 'P14', 'P16', 'P18', 'P19'].includes(i.recipe)) continue;
      const [s, e] = c.ranges[0];
      const T: number[][][] = [];
      for (let k = s; k < e; k++) T.push(tri(k));
      const ctr = T.flat().reduce((a, v) => a.map((x, j) => x + v[j] / (T.length * 3)), [0, 0, 0]);
      for (const [a, b_, c_] of T) {
        const u = b_.map((x, j) => x - a[j]);
        const w = c_.map((x, j) => x - a[j]);
        const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
        const m = [a, b_, c_].reduce((acc, v) => acc.map((x, j) => x + v[j] / 3), [0, 0, 0]);
        expect(n[0] * (m[0] - ctr[0]) + n[1] * (m[1] - ctr[1]) + n[2] * (m[2] - ctr[2]), `${c.id}: cara hacia dentro`).toBeGreaterThan(0);
      }
    }
    g.userData.skeleton?.dispose();
  });
});
