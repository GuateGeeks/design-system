import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { App } from '../src/App.tsx';

const go = (hash: string) => act(() => {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
});

describe('frame route', () => {
  it('re-applies appearance when only the hash changes', () => {
    window.location.hash = '#/frame/button/default?theme=halloween&scheme=dark&motion=reduced';
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('halloween');
    go('#/frame/badge/default?theme=guategeeks&scheme=light&motion=full');
    expect(document.documentElement.dataset).toMatchObject({ theme: 'guategeeks', scheme: 'light', motion: 'full' });
    expect(document.querySelector('[data-frame]')?.getAttribute('data-frame')).toBe('badge/default');
  });
});
