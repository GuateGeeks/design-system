import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { editions, themes } from '@guategeeks/themes';
import { ThemeProvider } from '@guategeeks/theme-runtime/react';
import { ToastProvider } from '@guategeeks/ui';
import { stateInput, type CampusData } from '@guategeeks/experience-campus';
import { presetData, setLevel, setProgram, setStudents } from '../src/sections/experiences/campusModel.ts';

const stage = vi.hoisted(() => ({ last: null as null | { data: CampusData; onSelect?: (s: { kind: string; id: string }) => void } }));
vi.mock('@guategeeks/experience-campus/react', () => ({
  CampusStage: (props: { data: CampusData; onSelect?: (s: { kind: string; id: string }) => void; children?: unknown }) => {
    stage.last = props;
    return <div data-testid="stage">{JSON.stringify(props.data.programs)}{props.children as never}</div>;
  },
  CampusHud: () => <div>HUD</div>,
  CampusSummary: () => null,
}));

const { CampusDemo } = await import('../src/sections/experiences/CampusDemo.tsx');

const wrap = (ui: React.ReactNode) => render(
  <ThemeProvider options={{ themes, editions, storageKey: null, search: '?edition=none' }}><ToastProvider>{ui}</ToastProvider></ThemeProvider>,
);

describe('campus model', () => {
  it('presets are the plan fixture states', () => {
    expect(presetData(6)).toMatchObject(stateInput(6));
    expect(presetData(1)).toEqual({ levels: [], programs: [], enrollment: [], equipment: [] });
  });

  it('levels, students and programs edit the data', () => {
    let data = setLevel(presetData(1), 'prim', true);
    expect(data.levels).toEqual(['prim']);
    data = setStudents(data, 'prim', 90);
    expect(data.enrollment.filter((r) => r.levelId === 'prim').reduce((n, r) => n + (r.students ?? 0), 0)).toBe(90);
    data = setProgram(data, 'spike', true);
    const spike = data.equipment.find((e) => e.programId === 'spike')!;
    expect(spike.groupIds.length).toBeGreaterThan(0);
    expect(spike.units).toBeGreaterThan(0);
    data = setLevel(data, 'prim', false);
    expect(data.enrollment).toEqual([]);
    expect(data.equipment.find((e) => e.programId === 'spike')!.groupIds).toEqual([]);
  });
});

describe('campus model: programs follow the levels', () => {
  it('adding a level extends programs that serve it, with units recomputed', () => {
    let data = setLevel(presetData(1), 'prim', true);
    data = setProgram(data, 'electronics', true);
    const before = data.equipment.find((e) => e.programId === 'electronics')!;
    data = setLevel(data, 'bas', true);
    const after = data.equipment.find((e) => e.programId === 'electronics')!;
    expect(after.groupIds.sort()).toEqual(['bas-lab', 'prim-lab']);
    expect(after.units).toBeGreaterThan(before.units!);
  });

  it('unrelated programs keep their groups when a level is added', () => {
    let data = setLevel(presetData(1), 'pre', true);
    data = setProgram(data, 'tale', true);
    const tale = data.equipment.find((e) => e.programId === 'tale')!;
    data = setLevel(data, 'bach', true);
    expect(data.equipment.find((e) => e.programId === 'tale')).toEqual(tale);
  });
});

describe('CampusDemo', () => {
  it('toggling a program updates the stage data', async () => {
    const user = userEvent.setup();
    wrap(<CampusDemo />);
    await user.click(screen.getByRole('button', { name: 'Escuela mediana' }));
    await user.click(screen.getByRole('switch', { name: 'Drones' }));
    expect(stage.last!.data.programs).toContain('drones');
  });

  it('presets set the fixture state', async () => {
    const user = userEvent.setup();
    wrap(<CampusDemo />);
    await user.click(screen.getByRole('button', { name: 'Campus completo' }));
    expect(stage.last!.data).toMatchObject(stateInput(6));
  });

  it('selecting a building focuses its configuration', async () => {
    const user = userEvent.setup();
    wrap(<CampusDemo />);
    await user.click(screen.getByRole('button', { name: 'Campus completo' }));
    act(() => stage.last!.onSelect!({ kind: 'program', id: 'drones' }));
    const row = screen.getByRole('switch', { name: 'Drones' }).closest('[data-config]')!;
    expect(row.getAttribute('data-active')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('switch', { name: 'Drones' }));
  });

  it('feedback describes the last change', async () => {
    const user = userEvent.setup();
    wrap(<CampusDemo />);
    await user.click(screen.getByRole('button', { name: 'Escuela mediana' }));
    await user.click(screen.getByRole('switch', { name: 'Drones' }));
    const feedback = screen.getByRole('status', { name: 'Lo que cambió' });
    expect(within(feedback).getByText('Explorar el vuelo')).toBeTruthy();
  });
});
