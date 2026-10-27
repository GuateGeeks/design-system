import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { themes } from '@guategeeks/themes';
import { createThemeController } from '@guategeeks/theme-runtime';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import type { GeekyActor } from '@guategeeks/geeky';
import { Geeky } from '@guategeeks/mascot/react';
import { GEEKY_INTENTS } from '@guategeeks/mascot';
import { fakeMatchMedia, type FakeMedia } from '../../theme-runtime/test/fake-media.ts';

// Every actor the component creates, to look inside without adding test hooks to the component.
const created = vi.hoisted(() => [] as GeekyActor[]);
vi.mock('@guategeeks/geeky', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@guategeeks/geeky')>();
  class Recorded extends mod.GeekyActor {
    constructor(...args: ConstructorParameters<typeof mod.GeekyActor>) { super(...args); created.push(this); }
  }
  return { ...mod, GeekyActor: Recorded };
});

const DEFAULT_FRAME = '#34314f';
const internal = (a: GeekyActor) => a as unknown as { opts: Record<string, unknown>; _destroyed: boolean; _paused: boolean; brain: { act: { id: string }; base: string } };
const live = () => created.filter((a) => !internal(a)._destroyed);
// Frames advance synchronously; awaiting lets the actions' promises (onActionEnd) settle.
const frames = async (n: number) => { for (let i = 0; i < n; i++) { act(() => { vi.advanceTimersToNextFrame(); }); if (i % 10 === 0) await act(async () => {}); } await act(async () => {}); };
const outside = () => new Date('2026-06-01T18:00:00Z');

let media: FakeMedia;
beforeEach(() => {
  created.length = 0;
  localStorage.clear();
  media = fakeMatchMedia();
});
afterEach(() => {
  cleanup();
  media.restore();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('<Geeky>', () => {
  it('renders an SVG Geeky, decorative by default, without three.js', () => {
    const { container } = render(<Geeky intent="welcome" />);
    const host = container.querySelector('[data-gg="geeky"]')!;
    expect(host).toBeTruthy();
    const svg = host.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('aria-label')).toBeNull();
    expect(host.querySelector('canvas')).toBeNull();
  });

  it('label names it exactly, also after an action starts', () => {
    const { container } = render(<Geeky intent="welcome" label="Geeky te da la bienvenida" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Geeky te da la bienvenida');
  });

  it('plays a one-shot intent once, then rests', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'performance'] });
    const ended = vi.fn();
    render(<Geeky intent="celebrate" onActionEnd={ended} />);
    await frames(400);
    expect(ended).toHaveBeenCalledTimes(1);
    expect(ended).toHaveBeenCalledWith('celebrate');
    expect(internal(live()[0]).brain.act.id).toBe('idle');
  });

  it('looping intents never end on their own', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'performance'] });
    const ended = vi.fn();
    render(<Geeky intent="waiting" onActionEnd={ended} />);
    await frames(700);
    expect(ended).not.toHaveBeenCalled();
    expect(internal(live()[0]).brain.act.id).toBe('waiting');
  });

  it('playKey replays the same intent', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'performance'] });
    const ended = vi.fn();
    const { rerender } = render(<Geeky intent="idea" playKey={1} onActionEnd={ended} />);
    await frames(300);
    rerender(<Geeky intent="idea" playKey={2} onActionEnd={ended} />);
    await frames(300);
    expect(ended).toHaveBeenCalledTimes(2);
  });

  it("reduced motion holds the intent's still pose", () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'performance'] });
    render(<Geeky intent="celebrate" reducedMotion />);
    act(() => { vi.advanceTimersByTime(6000); });
    expect(internal(live()[0]).brain.base).toBe(GEEKY_INTENTS.celebrate.action);
  });

  it('paused stops the animation', () => {
    const { rerender } = render(<Geeky intent="waiting" paused />);
    expect(internal(live()[0])._paused).toBe(true);
    rerender(<Geeky intent="waiting" />);
    expect(internal(live()[0])._paused).toBe(false);
  });

  it('recolours on scheme change without recreating', () => {
    const controller = createThemeController({ themes, now: outside, search: '' });
    render(<ThemeProvider controller={controller}><Geeky intent="welcome" /></ThemeProvider>);
    expect(live()).toHaveLength(1);
    expect(internal(live()[0]).opts.frameColor).toBe(DEFAULT_FRAME);
    act(() => controller.setScheme('dark'));
    expect(created).toHaveLength(1);
    expect(internal(live()[0]).opts.frameColor).toBe('#b8aee8');
    act(() => controller.setTheme('halloween'));
    expect(created).toHaveLength(1);
    expect(internal(live()[0]).opts.frameColor).toBe('#ff8a3d');
    controller.destroy();
  });

  it('unknown action falls back to idle and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Geeky action="nope" />);
    rerender(<Geeky action="nope" size="6rem" />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(/nope/);
    expect(internal(live()[0]).brain.act.id).toBe('idle');
  });

  it('works without ThemeProvider', () => {
    const { container } = render(<Geeky intent="idea" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(internal(live()[0]).opts.frameColor).toBe(DEFAULT_FRAME);
  });

  it('3d without WebGL keeps 2d', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<Geeky intent="welcome" render="3d" />);
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelector('canvas')).toBeNull();
    expect(live()[0].rendererKind).toBe('svg');
  });

  it('StrictMode leaves one actor and unmount destroys it', () => {
    const { unmount } = render(<StrictMode><Geeky intent="welcome" /></StrictMode>);
    expect(live()).toHaveLength(1);
    unmount();
    expect(live()).toHaveLength(0);
  });
});
