import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { editions, themes } from '@guategeeks/themes';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import { ToastProvider } from '@guategeeks/ui';
import { GROUPS, registry } from '../src/gallery/registry.ts';
import { ComponentsPage } from '../src/sections/components/ComponentsPage.tsx';
import { LabProvider } from '../src/shell/LabContext.tsx';

const renderPage = (id?: string) =>
  render(
    <ThemeProvider options={{ themes, editions, storageKey: null, search: '?edition=none' }}>
      <ToastProvider>
        <LabProvider>
          <ComponentsPage id={id} />
        </LabProvider>
      </ToastProvider>
    </ThemeProvider>,
  );

describe('ComponentsPage', () => {
  it('shows every component on one page, grouped', () => {
    renderPage();
    for (const group of GROUPS) expect(screen.getByRole('heading', { level: 2, name: group.label })).toBeTruthy();
    for (const entry of registry) {
      const section = document.getElementById(`component-${entry.id}`);
      expect(section, entry.id).toBeTruthy();
      expect(within(section!).getByRole('heading', { level: 3, name: entry.name })).toBeTruthy();
    }
  });

  it('every entry belongs to a known group', () => {
    const ids = new Set(GROUPS.map((g) => g.id));
    for (const entry of registry) expect(ids.has(entry.group), entry.id).toBe(true);
  });

  it('renders inline states in place, all of them at once', () => {
    renderPage();
    const button = document.getElementById('component-button')!;
    for (const label of ['Variantes', 'Deshabilitado', 'Cargando']) expect(within(button).getByText(label)).toBeTruthy();
    expect(within(button).getAllByRole('button', { name: 'Inscribirme' }).length).toBeGreaterThanOrEqual(3);
  });

  it('does not open overlays, toasts or steal focus on load', () => {
    renderPage();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('[data-gg="toast"]')).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it('frame-only states appear as frames or links, not inline', () => {
    renderPage();
    const shell = document.getElementById('component-app-shell')!;
    expect(within(shell).getByTitle(/AppShell/)).toBeTruthy();
    const button = document.getElementById('component-button')!;
    expect(within(button).getByRole('link', { name: /Foco/ }).getAttribute('href')).toMatch(/^#\/frame\/button\/focus\?/);
  });

  it('a component route scrolls to its section', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    renderPage('select');
    expect(scroll).toHaveBeenCalled();
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('component-select'));
  });

  it('has an index linking to every component', () => {
    renderPage();
    const index = screen.getByRole('navigation', { name: 'Índice de componentes' });
    expect(within(index).getAllByRole('link')).toHaveLength(registry.length);
  });
});
