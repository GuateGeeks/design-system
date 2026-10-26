import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Color } from 'three';
import { THREE_PROFILES } from '@guategeeks/themes';
import { createStage, type Stage } from '@guategeeks/three';
import { fakeEnvironment, fakeRenderer, sizedContainer } from './helpers/fake-gl.ts';

let env: ReturnType<typeof fakeEnvironment>;
let renderer: ReturnType<typeof fakeRenderer>;
let stage: Stage | undefined;
const make = (opts: Partial<Parameters<typeof createStage>[1]> = {}) =>
  (stage = createStage(sizedContainer(), { profile: THREE_PROFILES.papercraft, createRenderer: () => renderer as never, ...opts }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'performance'] });
  env = fakeEnvironment();
  renderer = fakeRenderer();
});
afterEach(() => {
  stage?.dispose();
  stage = undefined;
  env.restore();
  vi.useRealTimers();
});

const frames = () => renderer.render.mock.calls.length;

describe('createStage', () => {
  it('renders on demand', () => {
    const s = make();
    s.onFrame(() => false);
    vi.advanceTimersToNextFrame();
    const after = frames();
    expect(after).toBeGreaterThanOrEqual(1);
    vi.advanceTimersByTime(1000);
    expect(frames()).toBe(after);
    expect(s.getDiagnostics().framePending).toBe(false);
    s.requestFrame();
    vi.advanceTimersToNextFrame();
    expect(frames()).toBe(after + 1);
  });

  it('keeps running while active and respects the fps cap', () => {
    const s = make();
    let left = 3;
    s.onFrame(() => left-- > 0);
    s.requestFrame();
    const times: number[] = [];
    renderer.render.mockImplementation(() => times.push(performance.now()));
    vi.advanceTimersByTime(1000);
    expect(times.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(1000 / 30 - 1);
    expect(s.getDiagnostics().maxFps).toBe(30);
  });

  it('degrades to eco after sustained slow frames', () => {
    // A slow device: every animation frame arrives 120 ms after it was requested.
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 120) as unknown as number) as never;
    const s = make();
    s.onFrame(() => true);
    s.requestFrame();
    vi.advanceTimersByTime(80 * 160);
    window.requestAnimationFrame = raf;
    expect(s.quality).toBe('eco');
    expect(renderer.shadowMap.enabled).toBe(false);
    expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(1);
  });

  it('hidden tab pauses', () => {
    const s = make();
    s.onFrame(() => true);
    vi.advanceTimersToNextFrame();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const n = frames();
    vi.advanceTimersByTime(500);
    expect(frames()).toBe(n);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(100);
    expect(frames()).toBeGreaterThan(n);
  });

  it('off-screen pauses', () => {
    const s = make();
    s.onFrame(() => true);
    vi.advanceTimersToNextFrame();
    env.setVisible(false);
    const n = frames();
    vi.advanceTimersByTime(500);
    expect(frames()).toBe(n);
    expect(s.getDiagnostics().visible).toBe(false);
    env.setVisible(true);
    vi.advanceTimersByTime(100);
    expect(frames()).toBeGreaterThan(n);
  });

  it('reduced motion stops the loop', () => {
    const s = make();
    const ticks: boolean[] = [];
    s.onFrame((t) => { ticks.push(t.live); return t.live; });
    s.requestFrame();
    vi.advanceTimersByTime(200);
    s.setReducedMotion(true);
    vi.advanceTimersByTime(200);
    const n = frames();
    vi.advanceTimersByTime(500);
    expect(frames()).toBe(n);
    expect(ticks.at(-1)).toBe(false);
  });

  it('context loss reports onLost', () => {
    const onLost = vi.fn();
    const s = make({ onLost });
    const event = new Event('webglcontextlost', { cancelable: true });
    s.canvas.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onLost).toHaveBeenCalled();
    expect(s.getDiagnostics().contextLost).toBe(true);
  });

  it('reports ready after the first render', () => {
    const onReady = vi.fn();
    make({ onReady });
    vi.advanceTimersToNextFrame();
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('setProfile applies scene colors', () => {
    const s = make();
    s.setProfile({ ...THREE_PROFILES.papercraft, background: '#160f1f', sunIntensity: 1.4, exposure: 1.2 });
    expect((s.scene.background as Color).getHexString()).toBe('160f1f');
    expect(s.lights.sun.intensity).toBe(1.4);
    expect(renderer.toneMappingExposure).toBe(1.2);
  });

  it('dispose removes listeners and observers', () => {
    const s = make();
    const canvas = s.canvas;
    s.dispose();
    expect(env.disconnects.intersection).toBe(1);
    expect(env.disconnects.resize).toBe(1);
    expect(renderer.dispose).toHaveBeenCalled();
    expect(canvas.isConnected).toBe(false);
  });

  it('canvas is decorative and lets pages scroll', () => {
    const s = make();
    expect(s.canvas.getAttribute('aria-hidden')).toBe('true');
    expect(s.canvas.style.touchAction).toBe('pan-y');
  });
});
