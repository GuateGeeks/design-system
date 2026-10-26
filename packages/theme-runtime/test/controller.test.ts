import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { editions, themes } from '@guategeeks/themes';
import { createThemeController, type ThemeController } from '@guategeeks/theme-runtime';
import { fakeMatchMedia, type FakeMedia } from './fake-media.ts';

const outside = () => new Date('2026-06-01T18:00:00Z');
const inWindow = () => new Date('2026-10-31T18:00:00Z');
const html = () => document.documentElement;

let media: FakeMedia;
let controller: ThemeController | undefined;
const create = (opts: Partial<Parameters<typeof createThemeController>[0]> = {}) =>
  (controller = createThemeController({ themes, editions, now: outside, search: '', ...opts }));

beforeEach(() => {
  localStorage.clear();
  media = fakeMatchMedia();
  for (const a of ['data-theme', 'data-scheme', 'data-motion']) html().removeAttribute(a);
});
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  vi.restoreAllMocks();
  media.restore();
});

describe('createThemeController', () => {
  it('applies attributes', () => {
    create();
    expect(html().dataset).toMatchObject({ theme: 'guategeeks', scheme: 'light', motion: 'full' });
  });

  it('follows the OS when auto', () => {
    media.set('(prefers-color-scheme: dark)', true);
    const c = create();
    expect(html().dataset.scheme).toBe('dark');
    const seen: string[] = [];
    c.subscribe((s) => seen.push(s.scheme));
    media.set('(prefers-color-scheme: dark)', false);
    expect(html().dataset.scheme).toBe('light');
    expect(seen).toEqual(['light']);
  });

  it('forces the only supported scheme', () => {
    const c = create();
    c.setScheme('light');
    c.setTheme('halloween');
    expect(c.getState()).toMatchObject({ scheme: 'dark', schemeLocked: true, schemePreference: 'light' });
    expect(html().dataset.scheme).toBe('dark');
    c.setTheme('guategeeks');
    expect(c.getState()).toMatchObject({ scheme: 'light', schemeLocked: false });
  });

  it('edition drives theme and variants', () => {
    const c = create({ now: inWindow });
    expect(c.getState().theme).toBe('halloween');
    expect(c.getState().edition?.id).toBe('halloween-2026');
    c.setTheme('guategeeks');
    expect(c.getState()).toMatchObject({ theme: 'guategeeks', edition: null });
  });

  it('reduced motion', () => {
    const c = create();
    c.setMotion('reduced');
    expect(html().dataset.motion).toBe('reduced');
    c.setMotion('auto');
    expect(html().dataset.motion).toBe('full');
    media.set('(prefers-reduced-motion: reduce)', true);
    expect(html().dataset.motion).toBe('reduced');
  });

  it('persists and restores', () => {
    const first = create();
    first.setTheme('halloween');
    first.setMotion('reduced');
    first.destroy();
    expect(JSON.parse(localStorage.getItem('gg-appearance') ?? '{}')).toMatchObject({ theme: 'halloween', motion: 'reduced' });
    const second = create();
    expect(second.getState()).toMatchObject({ theme: 'halloween', motionPreference: 'reduced' });
  });

  it('survives throwing storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const c = create();
    expect(() => c.setTheme('halloween')).not.toThrow();
    expect(c.getState().theme).toBe('halloween');
  });

  it('falls back on unknown ids', () => {
    localStorage.setItem('gg-appearance', JSON.stringify({ theme: 'gone', edition: 'nope' }));
    const c = create({ search: '?edition=nope' });
    expect(c.getState()).toMatchObject({ theme: 'guategeeks', edition: null });
    c.setTheme('nope');
    expect(c.getState().theme).toBe('guategeeks');
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('gg-appearance', '{not json');
    expect(create().getState().theme).toBe('guategeeks');
  });

  it('does not persist when storageKey is null', () => {
    create({ storageKey: null }).setTheme('halloween');
    expect(localStorage.length).toBe(0);
  });

  it('subscribing after destroy re-attaches (StrictMode remount)', () => {
    const c = create();
    c.destroy();
    const listener = vi.fn();
    c.subscribe(listener);
    media.set('(prefers-color-scheme: dark)', true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(html().dataset.scheme).toBe('dark');
  });

  it('destroy removes listeners', () => {
    const c = create();
    const listener = vi.fn();
    c.subscribe(listener);
    c.destroy();
    media.set('(prefers-color-scheme: dark)', true);
    expect(listener).not.toHaveBeenCalled();
    expect(media.listenerCount()).toBe(0);
  });
});
