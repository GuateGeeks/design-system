import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeEnvironment, fakeRenderer, sizedContainer } from '../../../packages/three/test/helpers/fake-gl.ts';
import { LEGACY_BACKDROP, LEGACY_PROGRAMS, legacyShowcase, mountLegacySchool, type LegacySchool } from '@guategeeks/experience-legacy-school';

// The legacy scene builds its own WebGLRenderer; tests swap in the recording stand-in.
vi.mock('three', async (importOriginal) => {
  const three = await importOriginal<typeof import('three')>();
  return { ...three, WebGLRenderer: class { constructor() { return fakeRenderer(); } } };
});

let env: ReturnType<typeof fakeEnvironment>;
let school: LegacySchool | undefined;
let container: HTMLElement;
const frames = (n = 4) => { for (let i = 0; i < n; i++) vi.advanceTimersToNextFrame(); };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'performance'] });
  env = fakeEnvironment();
  container = sizedContainer(900, 600);
});
afterEach(() => {
  school?.dispose();
  school = undefined;
  container.remove();
  env.restore();
  vi.useRealTimers();
});

describe('legacy school', () => {
  it('showcase is the cotizador landing school', () => {
    const data = legacyShowcase() as { levels: string[]; students: number; programs: string[]; equipment: Array<{ programId: string; units: number; plan: string; sharing: string; stations: boolean }> };
    expect(data.levels).toEqual(['pre', 'prim', 'bas', 'bach']);
    expect(data.students).toBe(720);
    expect(data.programs).toEqual(['tale', 'master', 'spike', 'electronics', 'drones', 'immersive']);
    expect(data.equipment.map((e) => e.sharing)).toEqual(['separate', 'simultaneous', 'separate', 'simultaneous', 'separate', 'simultaneous']);
    expect(data.equipment.every((e) => e.units === 12 && e.plan === 'INTEGRA' && !e.stations)).toBe(true);
    expect(Object.keys(LEGACY_PROGRAMS)).toEqual(data.programs);
  });

  it('mounts the showcase school and reaches ready', () => {
    const onReady = vi.fn();
    school = mountLegacySchool(container, { reducedMotion: true, onReady });
    frames(6);
    expect(onReady).toHaveBeenCalledTimes(1);
    const d = school.getDiagnostics() as { animatedPrograms: string[] };
    expect([...d.animatedPrograms].sort()).toEqual(['drones', 'electronics', 'immersive', 'master', 'spike', 'tale']);
  });

  it('selecting a workshop reports it', () => {
    const onSelect = vi.fn();
    school = mountLegacySchool(container, { reducedMotion: true, onSelect });
    frames(6);
    const canvas = container.querySelector('canvas')!;
    canvas.getBoundingClientRect = () => container.getBoundingClientRect();
    const target = (school.getDiagnostics() as { selectTargets: Array<{ kind: string; id: string; x: number; y: number }> }).selectTargets.find((t) => t.kind === 'program')!;
    expect(target).toBeTruthy();
    const opts = { clientX: target.x, clientY: target.y, bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 };
    canvas.dispatchEvent(new PointerEvent('pointerdown', opts));
    window.dispatchEvent(new PointerEvent('pointerup', opts));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ kind: 'program', id: target.id }));
  });

  it('backdrop is the cotizador colour', () => {
    school = mountLegacySchool(container, { reducedMotion: true });
    expect(LEGACY_BACKDROP).toBe('#2e1853');
    expect(container.style.background).toContain('rgb(46, 24, 83)');
  });

  it('dispose removes the canvas', () => {
    school = mountLegacySchool(container, { reducedMotion: true });
    expect(container.querySelector('canvas')).toBeTruthy();
    school.dispose();
    school = undefined;
    expect(container.querySelector('canvas')).toBeNull();
  });
});
