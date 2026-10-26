import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@guategeeks/experience-campus/react', () => ({ CampusStage: () => <div />, CampusHud: () => null, CampusSummary: () => null }));

describe('lazy sections', () => {
  it('experiences load on demand', { timeout: 20_000 }, async () => {
    window.location.hash = '#/experiences';
    const { App } = await import('../src/App.tsx');
    render(<App />);
    expect(screen.getByText('Cargando…')).toBeTruthy();
    // The lazy chunk pulls in the 3D packages; a cold transform can take seconds.
    expect(await screen.findByRole('heading', { level: 2, name: 'Experiencias' }, { timeout: 10_000 })).toBeTruthy();
  });
});
