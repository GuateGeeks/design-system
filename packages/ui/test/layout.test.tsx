import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Home, Palette } from 'lucide-react';
import { themes, type Edition } from '@guategeeks/themes';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import { AppShell, getVariants, Progress, registerVariant } from '@guategeeks/ui';

const outside = () => new Date('2026-06-01T18:00:00Z');
const withEdition = (variants: Record<string, string>) => {
  const edition: Edition = { id: 'e', name: 'E', theme: 'guategeeks', variants };
  return { themes, editions: [edition], now: outside, search: '?edition=e', storageKey: null };
};

describe('layout', () => {
  it('progress bar', () => {
    render(<Progress value={3} max={10} label="Avance" />);
    const bar = screen.getByRole('progressbar', { name: 'Avance' });
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(bar.getAttribute('aria-valuemax')).toBe('10');
    expect(getVariants('progress')).toContain('bar');
  });

  it('unregistered variant falls back', () => {
    render(<ThemeProvider options={withEdition({ progress: 'constellation' })}><Progress value={1} max={4} label="Avance" /></ThemeProvider>);
    expect(screen.getByRole('progressbar', { name: 'Avance' })).toBeTruthy();
  });

  it('registered variant renders', () => {
    registerVariant('progress', 'test', ({ value, max, label }: { value: number; max: number; label: string }) => (
      <output>{`${label}: ${value}/${max}`}</output>
    ));
    render(<ThemeProvider options={withEdition({ progress: 'test' })}><Progress value={2} max={5} label="Nivel" /></ThemeProvider>);
    expect(screen.getByText('Nivel: 2/5')).toBeTruthy();
  });

  it('app shell nav', () => {
    render(
      <AppShell
        brand={<span>GuateGeeks</span>}
        nav={[
          { id: 'home', label: 'Inicio', icon: <Home />, href: '#/' },
          { id: 'themes', label: 'Temas', icon: <Palette />, href: '#/themes', current: true },
        ]}
      >
        <p>Contenido</p>
      </AppShell>,
    );
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe('Temas');
    expect(screen.getByRole('main').textContent).toContain('Contenido');
  });
});
