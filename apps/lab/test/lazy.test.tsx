import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@guategeeks/experience-campus/react', () => ({ CampusStage: () => <div />, CampusHud: () => null, CampusSummary: () => null }));

describe('lazy sections', () => {
  it('experiences load on demand', async () => {
    window.location.hash = '#/experiences';
    const { App } = await import('../src/App.tsx');
    render(<App />);
    expect(screen.getByText('Cargando…')).toBeTruthy();
    expect(await screen.findByRole('heading', { level: 2, name: 'Experiencias' })).toBeTruthy();
  });
});
