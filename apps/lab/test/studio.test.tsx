import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { editions, getTheme, themes } from '@guategeeks/themes';
import { validateManifest } from '@guategeeks/themes/validate';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import { exportTheme } from '../src/sections/studio/exportTheme.ts';
import { StudioPage } from '../src/sections/studio/StudioPage.tsx';

describe('exportTheme', () => {
  it('writes overrides as a DTCG manifest extending the base', () => {
    const manifest = exportTheme(getTheme('guategeeks')!, 'light', { '--gg-color-action': '#00aa88' }, { id: 'mint', name: 'Mint' });
    expect(manifest).toMatchObject({ id: 'mint', name: 'Mint', extends: 'guategeeks', schemes: ['light'], motion: { intensity: 'standard' } });
    expect(manifest.tokens?.light).toEqual({ color: { action: { $value: '#00aa88' } } });
    expect(validateManifest(manifest)).toEqual([]);
  });

  it('keeps single-scheme bases single-scheme and honours intensity', () => {
    const manifest = exportTheme(getTheme('halloween')!, 'dark', {}, { id: 'spooky', name: 'Spooky', intensity: 'calm' });
    expect(manifest.schemes).toEqual(['dark']);
    expect(manifest.motion).toEqual({ intensity: 'calm' });
  });
});

const renderStudio = () =>
  render(<ThemeProvider options={{ themes, editions, storageKey: null, search: '?edition=none' }}><StudioPage /></ThemeProvider>);

describe('StudioPage', () => {
  it('invalid hex is flagged, ignored by the preview and blocks export', async () => {
    const user = userEvent.setup();
    renderStudio();
    const preview = screen.getByTestId('studio-preview');
    const field = screen.getByRole('textbox', { name: 'Hex de action' });
    await user.clear(field);
    await user.type(field, '#00aa88');
    expect(preview.style.getPropertyValue('--gg-color-action')).toBe('#00aa88');
    await user.clear(field);
    await user.type(field, '#zz');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(preview.style.getPropertyValue('--gg-color-action')).toBe('#00aa88');
    expect((screen.getByRole('button', { name: 'Exportar theme.json' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('failing contrast lists the pair and blocks export', async () => {
    const user = userEvent.setup();
    renderStudio();
    const field = screen.getByRole('textbox', { name: 'Hex de on-action' });
    await user.clear(field);
    await user.type(field, '#ef8556');
    const reasons = screen.getByRole('list', { name: 'Motivos para no exportar' });
    expect(within(reasons).getByText(/^on-action\/action:/)).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Exportar theme.json' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('export is enabled for a valid theme', () => {
    renderStudio();
    expect((screen.getByRole('button', { name: 'Exportar theme.json' }) as HTMLButtonElement).disabled).toBe(false);
  });
});
