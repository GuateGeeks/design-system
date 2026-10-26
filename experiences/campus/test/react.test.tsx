import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { editions, themes } from '@guategeeks/themes';
import { createThemeController } from '@guategeeks/theme-runtime';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import { stateInput, type CampusData, type CampusScene } from '@guategeeks/experience-campus';
import { CampusHud, CampusStage, CampusSummary } from '@guategeeks/experience-campus/react';

afterEach(() => cleanup());

function fakeEngine() {
  const engine = {
    update: vi.fn(), resize: vi.fn(), rotate: vi.fn(), zoom: vi.fn(), resetView: vi.fn(), setPaused: vi.fn(), setReducedMotion: vi.fn(),
    setFocus: vi.fn(), setInsets: vi.fn(), setHoverVerb: vi.fn(), setView: vi.fn(), setProfile: vi.fn(), capture: vi.fn(() => null),
    getDiagnostics: vi.fn(() => ({ triangles: 1000, drawCalls: 20, materials: 8, framePending: false, contextLost: false })),
    getStage: vi.fn(), dispose: vi.fn(),
  };
  return engine as unknown as CampusScene & Record<string, ReturnType<typeof vi.fn>>;
}

const controller = () => createThemeController({ themes, editions, storageKey: null, search: '?edition=none' });
const data = stateInput(3) as CampusData;

describe('CampusStage', () => {
  it('passes theme profile changes to setProfile', () => {
    const engine = fakeEngine();
    const c = controller();
    render(<ThemeProvider controller={c} options={{ themes, editions }}><CampusStage data={data} createScene={() => engine} /></ThemeProvider>);
    expect(engine.update).toHaveBeenCalledWith(data);
    act(() => c.setTheme('halloween'));
    expect(engine.setProfile).toHaveBeenLastCalledWith(expect.objectContaining({ background: '#160f1f' }));
  });

  it('forwards reduced motion', () => {
    const engine = fakeEngine();
    const c = controller();
    render(<ThemeProvider controller={c} options={{ themes, editions }}><CampusStage data={data} createScene={() => engine} /></ThemeProvider>);
    act(() => c.setMotion('reduced'));
    expect(engine.setReducedMotion).toHaveBeenLastCalledWith(true);
  });

  it('shows the summary when 3D cannot start', () => {
    render(<ThemeProvider controller={controller()} options={{ themes, editions }}>
      <CampusStage data={data} createScene={() => { throw new Error('no webgl'); }} />
    </ThemeProvider>);
    const summary = screen.getByRole('region', { name: 'Resumen del campus' });
    expect(summary.className).not.toContain('sr-only');
    expect(summary.textContent).toMatch(/aulas/);
  });
});

describe('CampusHud', () => {
  it('buttons call the engine', async () => {
    const user = userEvent.setup();
    const engine = fakeEngine();
    const onPausedChange = vi.fn();
    render(<CampusHud engine={engine} data={data} paused={false} onPausedChange={onPausedChange} />);
    await user.click(screen.getByRole('button', { name: 'Girar a la izquierda' }));
    expect(engine.rotate).toHaveBeenCalledWith(-0.25);
    await user.click(screen.getByRole('button', { name: 'Acercar' }));
    expect(engine.zoom).toHaveBeenCalledWith(0.12);
    await user.click(screen.getByRole('button', { name: 'Restablecer vista' }));
    expect(engine.resetView).toHaveBeenCalled();
    await user.click(screen.getByRole('radio', { name: 'Patio' }));
    expect(engine.setView).toHaveBeenCalledWith('patio');
    await user.click(screen.getByRole('button', { name: 'Pausar animación' }));
    expect(onPausedChange).toHaveBeenCalledWith(true);
  });

  it('shows the counters', () => {
    render(<CampusHud engine={null} data={data} paused={false} onPausedChange={() => {}} />);
    expect(screen.getByText('Estudiantes atendidos')).toBeTruthy();
    expect(screen.getByText('Equipos')).toBeTruthy();
  });
});

describe('CampusSummary', () => {
  it('is visually hidden while 3D works and visible otherwise', () => {
    const { rerender } = render(<CampusSummary data={data} visible={false} />);
    expect(screen.getByRole('region', { name: 'Resumen del campus' }).className).toContain('sr-only');
    rerender(<CampusSummary data={data} visible />);
    expect(screen.getByRole('region', { name: 'Resumen del campus' }).className).not.toContain('sr-only');
  });
});
