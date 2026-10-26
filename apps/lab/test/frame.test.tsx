import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { App } from '../src/App.tsx';
import { fakeMatchMedia } from '../../../packages/theme-runtime/test/fake-media.ts';

const go = (hash: string) => act(() => {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
});

afterEach(() => vi.useRealTimers());

describe('frame route', () => {
  it('re-applies appearance when only the hash changes', () => {
    window.location.hash = '#/frame/button/default?theme=halloween&scheme=dark&motion=reduced';
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('halloween');
    go('#/frame/badge/default?theme=guategeeks&scheme=light&motion=full');
    expect(document.documentElement.dataset).toMatchObject({ theme: 'guategeeks', scheme: 'light', motion: 'full' });
    expect(document.querySelector('[data-frame]')?.getAttribute('data-frame')).toBe('badge/default');
  });

  it('an unknown edition falls back to the theme param, even inside an edition window', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-31T18:00:00Z'));
    window.location.hash = '#/frame/badge/default?theme=guategeeks&scheme=light&edition=halloween-2025';
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('guategeeks');
  });

  it('frames release their controllers', () => {
    const media = fakeMatchMedia();
    try {
      window.location.hash = '#/frame/button/default?theme=guategeeks';
      const { unmount } = render(<App />);
      go('#/frame/badge/default?theme=halloween');
      go('#/frame/card/default?theme=guategeeks');
      expect(media.listenerCount()).toBe(2);
      unmount();
      expect(media.listenerCount()).toBe(0);
    } finally {
      media.restore();
    }
  });
});
