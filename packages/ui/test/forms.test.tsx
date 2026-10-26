import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberStepper, SegmentedControl, Select, Switch, Tabs, TextField } from '@guategeeks/ui';

const options = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'auto', label: 'Auto' },
] as const;

function Segmented({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState<'light' | 'dark' | 'auto'>('light');
  return <SegmentedControl label="Esquema" options={[...options]} value={value} onChange={setValue} disabled={disabled} />;
}

describe('form controls', () => {
  it('segmented keyboard', async () => {
    const user = userEvent.setup();
    render(<Segmented />);
    const claro = screen.getByRole('radio', { name: 'Claro' });
    expect(claro.getAttribute('aria-checked')).toBe('true');
    await user.click(claro);
    // Radix moves focus on a timer and selects only while the arrow key is still down, as in a real keypress.
    await user.keyboard('{ArrowRight>}');
    expect(screen.getByRole('radio', { name: 'Oscuro' }).getAttribute('aria-checked')).toBe('true');
    await user.keyboard('{/ArrowRight}');
    expect(screen.getByRole('radiogroup', { name: 'Esquema' })).toBeTruthy();
  });

  it('segmented disabled', () => {
    render(<Segmented disabled />);
    for (const radio of screen.getAllByRole('radio')) expect((radio as HTMLButtonElement).disabled).toBe(true);
  });

  it('text field errors', () => {
    render(<TextField label="Nombre" error="Requerido" hint="Como aparece en tu diploma" />);
    const input = screen.getByRole('textbox', { name: 'Nombre' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const described = (input.getAttribute('aria-describedby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent);
    expect(described).toContain('Requerido');
    expect(described).toContain('Como aparece en tu diploma');
  });

  it('stepper clamps', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberStepper label="Estudiantes" value={3} min={1} max={5} onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Estudiantes' });
    await user.clear(input);
    await user.type(input, '9');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('stepper buttons respect bounds', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberStepper label="Estudiantes" value={5} min={1} max={5} onChange={onChange} />);
    expect((screen.getByRole('button', { name: 'Aumentar Estudiantes' }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Disminuir Estudiantes' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('switch labels', () => {
    render(<Switch label="Sonido" />);
    expect(screen.getByRole('switch', { name: 'Sonido' })).toBeTruthy();
  });

  it('tabs switch panels', async () => {
    const user = userEvent.setup();
    render(<Tabs items={[{ id: 'a', label: 'Uno', content: 'Panel uno' }, { id: 'b', label: 'Dos', content: 'Panel dos' }]} />);
    await user.click(screen.getByRole('tab', { name: 'Dos' }));
    expect(screen.getByRole('tabpanel').textContent).toBe('Panel dos');
  });

  it('select is labelled', () => {
    render(<Select label="Nivel" options={[{ value: 'pri', label: 'Primaria' }]} placeholder="Elige" />);
    expect(screen.getByRole('combobox', { name: 'Nivel' })).toBeTruthy();
  });
});
