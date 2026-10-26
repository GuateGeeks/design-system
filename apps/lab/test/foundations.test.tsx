import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { editions, themes } from '@guategeeks/themes';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import { FoundationsPage } from '../src/sections/foundations/FoundationsPage.tsx';

const play = vi.hoisted(() => vi.fn(() => null));
vi.mock('@guategeeks/motion', async (importOriginal) => ({ ...(await importOriginal<object>()), play }));

const outside = () => new Date('2026-06-01T18:00:00Z');
const renderWith = (theme: string) =>
  render(
    <ThemeProvider options={{ themes, editions, now: outside, search: '', storageKey: null, defaultTheme: theme }}>
      <FoundationsPage />
    </ThemeProvider>,
  );

beforeEach(() => play.mockClear());

describe('FoundationsPage', () => {
  it('lists the 23 semantic color roles', () => {
    renderWith('guategeeks');
    expect(document.querySelectorAll('[data-role]')).toHaveLength(23);
    expect(screen.getByText('--gg-color-action')).toBeTruthy();
  });

  it('contrast matrix passes for halloween', () => {
    renderWith('halloween');
    const rows = document.querySelectorAll('[data-contrast-row]');
    expect(rows).toHaveLength(22);
    for (const row of rows) expect(row.getAttribute('data-pass')).toBe('true');
  });

  it('plays a preset on click', async () => {
    const user = userEvent.setup();
    renderWith('guategeeks');
    await user.click(screen.getByRole('button', { name: 'Reproducir rise' }));
    expect(play).toHaveBeenCalledWith(expect.any(HTMLElement), 'rise');
  });

  it('shows the type scale and spacing', () => {
    renderWith('guategeeks');
    expect(screen.getByRole('heading', { name: 'Tipografía' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Espaciado y radios' })).toBeTruthy();
    expect(screen.getByText('--gg-size-display')).toBeTruthy();
  });
});
