import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { editions, themes } from '@guategeeks/themes';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import { ToastProvider } from '@guategeeks/ui';
import { registry } from '../src/gallery/registry.ts';

const EXPECTED = [
  'button', 'icon-button', 'link', 'card', 'badge', 'glass-panel', 'empty-state', 'tabs', 'segmented-control',
  'switch', 'text-field', 'number-stepper', 'select', 'dialog', 'tooltip', 'toast', 'app-shell', 'progress', 'background', 'geeky',
];

describe('gallery registry', () => {
  it('has one entry per component', () => {
    expect(registry.map((e) => e.id).sort()).toEqual([...EXPECTED].sort());
    expect(new Set(registry.map((e) => e.id)).size).toBe(registry.length);
  });

  it('every entry is described and has states', () => {
    for (const entry of registry) {
      expect(entry.description.length, entry.id).toBeGreaterThan(10);
      expect(entry.states.length, entry.id).toBeGreaterThan(0);
      expect(new Set(entry.states.map((s) => s.id)).size, entry.id).toBe(entry.states.length);
    }
  });

  it('every state renders', () => {
    for (const entry of registry) {
      for (const state of entry.states) {
        const { unmount } = render(
          <ThemeProvider options={{ themes, editions, storageKey: null, search: '' }}>
            <ToastProvider>{state.render()}</ToastProvider>
          </ThemeProvider>,
        );
        unmount();
      }
    }
  });
});
