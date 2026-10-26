import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countUp, effectiveDuration, play, presets, semantic } from '@guategeeks/motion';

let animate: ReturnType<typeof vi.fn>;
let reduceMatches = false;

beforeEach(() => {
  animate = vi.fn(() => ({}) as Animation);
  (Element.prototype as unknown as { animate: unknown }).animate = animate;
  reduceMatches = false;
  window.matchMedia = ((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' && reduceMatches,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  delete document.documentElement.dataset.motion;
});
afterEach(() => vi.restoreAllMocks());

const el = () => document.body.appendChild(document.createElement('div'));

describe('play', () => {
  it('maps semantics', () => {
    play(el(), 'feedback.correct');
    expect(animate).toHaveBeenCalledWith(presets.pop.keyframes, expect.objectContaining({ duration: 240 }));
    expect(semantic['reward.celebrate']).toBe('pop');
  });

  it('uses theme durations', () => {
    const node = el();
    node.style.setProperty('--gg-duration-base', '0.204s');
    play(node, 'rise');
    expect(animate.mock.calls[0][1].duration).toBe(204);
    expect(effectiveDuration(node, 'base')).toBe(204);
  });

  it('falls back to token durations', () => {
    expect(effectiveDuration(el(), 'slow')).toBe(420);
  });

  it('uses reduced keyframes', () => {
    document.documentElement.dataset.motion = 'reduced';
    play(el(), 'rise');
    const [frames, options] = animate.mock.calls[0];
    expect(frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(options.duration).toBeLessThanOrEqual(150);
    expect(options.iterations).toBe(1);
    expect(play(el(), 'pop')).toBeNull();
  });

  it('follows the OS when the app has no setting', () => {
    reduceMatches = true;
    expect(play(el(), 'pop')).toBeNull();
  });

  it('full overrides OS', () => {
    reduceMatches = true;
    document.documentElement.dataset.motion = 'full';
    play(el(), 'rise');
    expect(animate.mock.calls[0][0]).toEqual(presets.rise.keyframes);
  });

  it('glowOk uses the theme ok color', () => {
    const node = el();
    node.style.setProperty('--gg-color-ok', '#277248');
    play(node, 'glowOk');
    const frames = animate.mock.calls[0][0] as Keyframe[];
    expect(String(frames[0].boxShadow)).toContain('#277248');
    expect(JSON.stringify(frames)).not.toMatch(/rgb\(/);
  });

  it('countUp jumps when reduced', () => {
    document.documentElement.dataset.motion = 'reduced';
    const onFrame = vi.fn();
    countUp(0, 50, onFrame);
    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(onFrame).toHaveBeenCalledWith(50);
  });
});
