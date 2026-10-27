import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { editions, themes, type Edition } from '@guategeeks/themes';
import { createThemeController } from '@guategeeks/theme-runtime';
import { ThemeProvider, useEdition, useOptionalTheme, useTheme, useVariant } from '@guategeeks/theme-runtime/react';
import { fakeMatchMedia, type FakeMedia } from './fake-media.ts';

let media: FakeMedia;
beforeEach(() => {
  localStorage.clear();
  media = fakeMatchMedia();
});
afterEach(() => {
  cleanup();
  media.restore();
});

const outside = () => new Date('2026-06-01T18:00:00Z');

function ThemeName() {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme('halloween')}>{theme}</button>;
}

function ProgressKind() {
  return <span>{useVariant('progress', 'bar')}</span>;
}

function EditionName() {
  return <span>{useEdition()?.id ?? 'none'}</span>;
}

function OptionalTheme() {
  const state = useOptionalTheme();
  return <span>{state ? `${state.theme}/${state.scheme}` : 'none'}</span>;
}

describe('react bindings', () => {
  it('useOptionalTheme is null outside a provider and live inside', () => {
    const { unmount } = render(<OptionalTheme />);
    expect(screen.getByText('none')).toBeTruthy();
    unmount();
    const controller = createThemeController({ themes, now: outside, search: '' });
    render(<ThemeProvider controller={controller}><OptionalTheme /></ThemeProvider>);
    expect(screen.getByText('guategeeks/light')).toBeTruthy();
    act(() => controller.setScheme('dark'));
    expect(screen.getByText('guategeeks/dark')).toBeTruthy();
    controller.destroy();
  });

  it('useTheme re-renders on change', () => {
    render(<ThemeProvider options={{ themes, editions, now: outside, search: '' }}><ThemeName /></ThemeProvider>);
    expect(screen.getByRole('button').textContent).toBe('guategeeks');
    act(() => screen.getByRole('button').click());
    expect(screen.getByRole('button').textContent).toBe('halloween');
  });

  it('useVariant returns fallback then edition value', () => {
    const xp: Edition = { id: 'xp', name: 'XP', theme: 'guategeeks', variants: { progress: 'xp-levels' } };
    const { unmount } = render(
      <ThemeProvider options={{ themes, editions: [xp], now: outside, search: '' }}><ProgressKind /><EditionName /></ThemeProvider>,
    );
    expect(screen.getByText('bar')).toBeTruthy();
    unmount();
    render(
      <ThemeProvider options={{ themes, editions: [xp], now: outside, search: '?edition=xp' }}><ProgressKind /><EditionName /></ThemeProvider>,
    );
    expect(screen.getByText('xp-levels')).toBeTruthy();
    expect(screen.getByText('xp')).toBeTruthy();
  });

  it('uses a passed controller without destroying it', () => {
    const controller = createThemeController({ themes, now: outside, search: '' });
    const destroy = vi.spyOn(controller, 'destroy');
    const { unmount } = render(<ThemeProvider controller={controller}><ThemeName /></ThemeProvider>);
    unmount();
    expect(destroy).not.toHaveBeenCalled();
    controller.destroy();
  });

  it('provider destroys owned controller', () => {
    const { unmount } = render(<ThemeProvider options={{ themes, now: outside, search: '' }}><ThemeName /></ThemeProvider>);
    expect(media.listenerCount()).toBeGreaterThan(0);
    unmount();
    expect(media.listenerCount()).toBe(0);
  });

  it('StrictMode leaves exactly one live controller', () => {
    render(
      <StrictMode>
        <ThemeProvider options={{ themes, editions, now: outside, search: '' }}><ThemeName /></ThemeProvider>
      </StrictMode>,
    );
    act(() => screen.getByRole('button').click());
    expect(document.documentElement.dataset.theme).toBe('halloween');
    act(() => media.set('(prefers-color-scheme: dark)', true));
    act(() => media.set('(prefers-color-scheme: dark)', false));
    expect(document.documentElement.dataset.theme).toBe('halloween');
    expect(media.listenerCount()).toBe(2);
  });
});
