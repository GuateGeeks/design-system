import { describe, expect, it, vi } from 'vitest';
import type { Mesh } from 'three';
import { createGeeky3D } from '@guategeeks/mascot';

const goal = (x = 0) => ({ goal: { x, y: 1, z: 0 }, look: [0, 0, 0] as [number, number, number], perched: false, celebrate: false, ground: 0, cameraYaw: -0.55 });

describe('Geeky 3D', () => {
  it('builds with exactly two own materials', () => {
    const geeky = createGeeky3D({}, { reduced: true });
    expect(geeky.ownMaterials()).toHaveLength(2);
    expect(geeky.group.name).toBe('geeky');
    geeky.dispose();
  });

  it('reduced motion is static', () => {
    const geeky = createGeeky3D({}, { reduced: true });
    geeky.tick(0, 0.016, { ...goal(3), moving: true });
    expect(geeky.settled).toBe(true);
    expect(geeky.group.position.x).toBe(3);
    expect(geeky.cue?.('celebrate')).toBe(false);
    geeky.dispose();
  });

  it('glides toward a goal and settles', () => {
    const geeky = createGeeky3D({}, { reduced: false });
    geeky.tick(0, 0.016, { ...goal(0), moving: true });
    let t = 0;
    geeky.tick((t += 0.016), 0.016, { ...goal(2), moving: true });
    expect(geeky.state.gliding).toBe(true);
    for (let i = 0; i < 2000 && !geeky.settled; i++) geeky.tick((t += 0.016), 0.016, { ...goal(2), moving: true });
    expect(geeky.settled).toBe(true);
    expect(geeky.group.position.x).toBeCloseTo(2, 1);
    geeky.dispose();
  });

  it('dispose releases geometries', () => {
    const geeky = createGeeky3D({}, { reduced: true });
    const meshes: Mesh[] = [];
    geeky.group.traverse((o) => { if ((o as Mesh).isMesh) meshes.push(o as Mesh); });
    expect(meshes.length).toBeGreaterThan(0);
    const spies = meshes.map((m) => vi.spyOn(m.geometry, 'dispose'));
    geeky.dispose();
    expect(spies.some((s) => s.mock.calls.length > 0)).toBe(true);
  });
});
