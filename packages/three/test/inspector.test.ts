import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THREE_PROFILES } from '@guategeeks/themes';
import { CATALOG, createInspector, PAL } from '@guategeeks/three';
import { fakeEnvironment, fakeRenderer, sizedContainer } from './helpers/fake-gl.ts';

let env: ReturnType<typeof fakeEnvironment>;
beforeEach(() => { env = fakeEnvironment(); });
afterEach(() => env.restore());

describe('inspector on the stage', () => {
  it('dispose removes every window listener it added', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const inspector = createInspector(sizedContainer(), { createRenderer: () => fakeRenderer(), profile: THREE_PROFILES.papercraft });
    inspector.dispose();
    const added = add.mock.calls.map(([type, fn]) => [type, fn]);
    for (const [type, fn] of added) expect(remove.mock.calls.some(([t, f]) => t === type && f === fn), String(type)).toBe(true);
  });

  it('shows a piece, rebuilds it with a new profile and disposes', () => {
    const renderer = fakeRenderer();
    const container = sizedContainer();
    const inspector = createInspector(container, { createRenderer: () => renderer, profile: THREE_PROFILES.papercraft });
    const [info] = inspector.show(CATALOG[0].id);
    expect(info.triangles).toBeGreaterThan(0);
    const renders = renderer.render.mock.calls.length;
    inspector.setProfile({ ...THREE_PROFILES.lowpoly, background: '#160f1f', palette: { roof: '#000000' } });
    expect(renderer.render.mock.calls.length).toBeGreaterThan(renders);
    expect(inspector.info()[0].id).toBe(CATALOG[0].id);
    expect(PAL.roof).not.toBe('#000000');
    inspector.dispose();
    expect(renderer.dispose).toHaveBeenCalled();
    expect(container.querySelector('canvas')).toBeNull();
  });
});
