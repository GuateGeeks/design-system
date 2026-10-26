import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { editions, themes, THREE_PROFILES } from '@guategeeks/themes';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import { CATALOG, GROUPS } from '@guategeeks/three';
import Kit3dPage from '../src/sections/kit3d/Kit3dPage.tsx';

function fakeInspector() {
  return {
    show: vi.fn((id: string) => [{ id, label: id, triangles: 120, budget: null }]),
    showPerson: vi.fn(() => ({ id: 'person', triangles: 300, budget: 320 })),
    setView: vi.fn(), setProfile: vi.fn(), dispose: vi.fn(),
  };
}

const setup = () => {
  const inspector = fakeInspector();
  render(
    <ThemeProvider options={{ themes, editions, storageKey: null, search: '?edition=none' }}>
      <Kit3dPage createInspector={() => inspector as never} />
    </ThemeProvider>,
  );
  return inspector;
};

describe('Kit3dPage', () => {
  it('lists every catalog group', () => {
    setup();
    for (const g of GROUPS) expect(screen.getByRole('tab', { name: g.label })).toBeTruthy();
  });

  it('choosing a piece updates the viewer and the triangle readout', async () => {
    const user = userEvent.setup();
    const inspector = setup();
    const piece = CATALOG.find((p) => p.group === 'kit')!;
    await user.click(screen.getByRole('button', { name: piece.label }));
    expect(inspector.show).toHaveBeenLastCalledWith(piece.id, expect.anything());
    expect(screen.getByText(/120 triángulos/)).toBeTruthy();
  });

  it('profile switch passes the profile', async () => {
    const user = userEvent.setup();
    const inspector = setup();
    await user.click(screen.getByRole('radio', { name: 'Low-poly' }));
    expect(inspector.setProfile).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'lowpoly', fibre: THREE_PROFILES.lowpoly.fibre }));
  });

  it('views change the camera', async () => {
    const user = userEvent.setup();
    const inspector = setup();
    await user.click(screen.getByRole('radio', { name: 'Frente' }));
    expect(inspector.setView).toHaveBeenLastCalledWith('front');
  });
});
