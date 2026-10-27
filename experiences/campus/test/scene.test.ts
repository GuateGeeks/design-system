import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BufferGeometry, Mesh } from 'three';
import { getTheme, THREE_PROFILES } from '@guategeeks/themes';
import { CAMPUS_BUDGET, createCampusScene, stateInput, type CampusScene } from '@guategeeks/experience-campus';
import { fakeEnvironment, fakeRenderer, sizedContainer } from '../../../packages/three/test/helpers/fake-gl.ts';

let env: ReturnType<typeof fakeEnvironment>;
let scene: CampusScene | undefined;
let container: HTMLElement;
const make = (opts: Partial<Parameters<typeof createCampusScene>[1]> = {}) => {
  container = sizedContainer(900, 600);
  scene = createCampusScene(container, { profile: THREE_PROFILES.papercraft, reducedMotion: true, createRenderer: () => fakeRenderer() as never, ...opts });
  return scene;
};
const geometriesIn = (root: { traverse(cb: (o: unknown) => void): void }) => {
  const set = new Set<BufferGeometry>();
  root.traverse((o) => { if ((o as Mesh).isMesh) set.add((o as Mesh).geometry); });
  return set.size;
};
const frames = (n = 3) => { for (let i = 0; i < n; i++) vi.advanceTimersToNextFrame(); };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'performance'] });
  env = fakeEnvironment();
});
afterEach(() => {
  scene?.dispose();
  scene = undefined;
  env.restore();
  vi.useRealTimers();
});

describe('createCampusScene', () => {
  it('state 1 builds one classroom entity and reaches ready', () => {
    const onReady = vi.fn();
    const s = make({ onReady });
    s.update(stateInput(1));
    frames();
    expect(onReady).toHaveBeenCalledTimes(1);
    const d = s.getDiagnostics();
    expect(d.rooms).toBe(1);
    expect(d.entityKeys.length).toBeGreaterThan(0);
    expect(d.errors).toEqual([]);
  });

  it('growing to state 6 keeps existing entity keys', () => {
    const s = make();
    s.update(stateInput(3));
    frames();
    const before = s.getDiagnostics().entityKeys;
    s.update(stateInput(6));
    frames();
    const after = s.getDiagnostics().entityKeys;
    expect(after.length).toBeGreaterThan(before.length);
    for (const key of before.filter((k) => k.startsWith('bay:'))) expect(after).toContain(key);
  });

  it('setProfile rebuilds without leaking geometries', () => {
    const s = make();
    s.update(stateInput(6));
    frames();
    const sceneGraph = s.getStage().scene;
    const baseline = geometriesIn(sceneGraph);
    s.setProfile(getTheme('halloween')!.three);
    frames();
    expect(s.getStage().scene.background).toBeTruthy();
    s.setProfile(THREE_PROFILES.papercraft);
    frames();
    expect(geometriesIn(sceneGraph)).toBe(baseline);
    expect(s.getDiagnostics().entities).toBeGreaterThan(0);
  });

  it('setGeekyPalette rebuilds Geeky without leaking geometries', () => {
    const s = make();
    s.update(stateInput(3));
    frames();
    const graph = s.getStage().scene;
    const baseline = geometriesIn(graph);
    s.setGeekyPalette({ frame: '#ff0000' });
    frames();
    s.setGeekyPalette(undefined);
    frames();
    expect(geometriesIn(graph)).toBe(baseline);
  });

  it('geeky uses the palette', () => {
    const s = make({ geekyPalette: { frame: '#00ff00' } });
    s.update(stateInput(1));
    frames();
    const coloured = (hex: string) => {
      let found = false;
      s.getStage().scene.traverse((o) => {
        const c = (o as Mesh).isMesh ? (o as Mesh).geometry.getAttribute('color') : undefined;
        if (c && c.getX(0) === parseInt(hex.slice(1, 3), 16) / 255 && c.getY(0) === parseInt(hex.slice(3, 5), 16) / 255 && c.getZ(0) === parseInt(hex.slice(5, 7), 16) / 255) found = true;
      });
      return found;
    };
    expect(coloured('#00ff00')).toBe(true);
    s.setGeekyPalette({ frame: '#ff0000' });
    frames();
    expect(coloured('#ff0000')).toBe(true);
    expect(coloured('#00ff00')).toBe(false);
  });

  it('setView frames named views', () => {
    const s = make();
    s.update(stateInput(6));
    frames();
    const overview = { ...s.getDiagnostics().framing.target };
    s.setView('patio');
    frames();
    const d = s.getDiagnostics();
    expect(d.view).toBe('patio');
    expect(d.framing.target).not.toEqual(overview);
    s.resetView();
    frames();
    expect(s.getDiagnostics().view).toBe('overview');
  });

  it('selection emits onSelect', () => {
    const onSelect = vi.fn();
    const s = make({ onSelect });
    s.update(stateInput(6));
    frames();
    const target = s.getDiagnostics().selectTargets.find((t) => t.kind === 'program');
    expect(target).toBeTruthy();
    const canvas = container.querySelector('canvas')!;
    const opts = { clientX: target.x, clientY: target.y, bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 };
    canvas.dispatchEvent(new PointerEvent('pointerdown', opts));
    window.dispatchEvent(new PointerEvent('pointerup', opts));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ kind: 'program', id: target.id }));
  });

  it('reduced motion settles immediately', () => {
    const s = make({ reducedMotion: true });
    s.update(stateInput(6));
    frames(2);
    const d = s.getDiagnostics();
    expect(d.transitionsActive).toBe(0);
    expect(d.framePending).toBe(false);
  });

  it('context loss reports onLost', () => {
    const onLost = vi.fn();
    const s = make({ onLost });
    s.update(stateInput(1));
    container.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(onLost).toHaveBeenCalled();
    expect(s.getDiagnostics().contextLost).toBe(true);
  });

  it('recovers after a context restore', () => {
    const onRestored = vi.fn();
    const s = make({ onRestored });
    s.update(stateInput(3));
    frames();
    const canvas = container.querySelector('canvas')!;
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(s.getDiagnostics().contextLost).toBe(true);
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    frames();
    expect(onRestored).toHaveBeenCalledTimes(1);
    expect(s.getDiagnostics().contextLost).toBe(false);
    expect(s.getDiagnostics().entities).toBeGreaterThan(0);
  });

  it('budget at the maximum configuration', () => {
    const s = make();
    s.update(stateInput(6));
    frames();
    const d = s.getDiagnostics();
    const triangles = Object.values(d.breakdown as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(triangles).toBeLessThanOrEqual(CAMPUS_BUDGET.triangles);
    expect(d.materials).toBeLessThanOrEqual(CAMPUS_BUDGET.materials);
  });

  it('dispose releases the canvas and the tag', () => {
    const s = make();
    s.update(stateInput(2));
    s.dispose();
    scene = undefined;
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('.gg-campus-tag')).toBeNull();
  });
});
