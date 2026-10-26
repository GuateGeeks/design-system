import { useState } from 'react';
import { Moon, Sun, SunMoon } from 'lucide-react';
import { NumberStepper, SegmentedControl, Select, Switch, Tabs, TextField } from '@guategeeks/ui';
import type { GalleryEntry } from '../types.ts';

function SegmentedDemo({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState<'auto' | 'light' | 'dark'>('auto');
  return (
    <SegmentedControl<'auto' | 'light' | 'dark'>
      label="Esquema"
      value={value}
      onChange={setValue}
      disabled={disabled}
      options={[
        { value: 'auto', label: 'Auto', icon: <SunMoon aria-hidden /> },
        { value: 'light', label: 'Claro', icon: <Sun aria-hidden /> },
        { value: 'dark', label: 'Oscuro', icon: <Moon aria-hidden /> },
      ]}
    />
  );
}

function StepperDemo({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState(24);
  return <NumberStepper label="Estudiantes" value={value} min={1} max={60} onChange={setValue} disabled={disabled} />;
}

const levels = [
  { value: 'pre', label: 'Preprimaria' },
  { value: 'pri', label: 'Primaria' },
  { value: 'bas', label: 'Básico' },
  { value: 'bach', label: 'Bachillerato' },
];

export const tabs: GalleryEntry = {
  id: 'tabs',
  name: 'Tabs',
  description: 'Pestañas para alternar vistas relacionadas; se navegan con flechas.',
  states: [
    {
      id: 'default',
      label: 'Pestañas',
      render: () => (
        <Tabs items={[
          { id: 'res', label: 'Resumen', content: <p className="text-sm text-ink-muted">Tres programas para 120 estudiantes.</p> },
          { id: 'eq', label: 'Equipos', content: <p className="text-sm text-ink-muted">24 kits SPIKE Prime.</p> },
          { id: 'cal', label: 'Calendario', content: <p className="text-sm text-ink-muted">Inicia en enero.</p> },
        ]} />
      ),
    },
  ],
};

export const segmentedControl: GalleryEntry = {
  id: 'segmented-control',
  name: 'SegmentedControl',
  description: 'Elección única entre pocas opciones visibles; las flechas cambian la selección.',
  states: [
    { id: 'default', label: 'Normal', render: () => <SegmentedDemo /> },
    { id: 'disabled', label: 'Deshabilitado', render: () => <SegmentedDemo disabled /> },
  ],
};

export const switchEntry: GalleryEntry = {
  id: 'switch',
  name: 'Switch',
  description: 'Interruptor para preferencias que se aplican de inmediato.',
  states: [
    { id: 'default', label: 'Normal', render: () => <div className="max-w-xs"><Switch label="Sonidos" defaultChecked /><Switch label="Narración" /></div> },
    { id: 'disabled', label: 'Deshabilitado', render: () => <div className="max-w-xs"><Switch label="Sonidos" disabled defaultChecked /></div> },
  ],
};

export const textField: GalleryEntry = {
  id: 'text-field',
  name: 'TextField',
  description: 'Campo de texto con etiqueta visible, ayuda y error anunciados al lector de pantalla.',
  states: [
    { id: 'default', label: 'Normal', render: () => <TextField className="max-w-sm" label="Nombre de la escuela" hint="Como aparece en documentos oficiales" placeholder="Colegio…" /> },
    { id: 'error', label: 'Error', render: () => <TextField className="max-w-sm" label="Correo" defaultValue="direccion@" error="Escribe un correo completo." /> },
    { id: 'disabled', label: 'Deshabilitado', render: () => <TextField className="max-w-sm" label="Código" defaultValue="GG-2026" disabled /> },
  ],
};

export const numberStepper: GalleryEntry = {
  id: 'number-stepper',
  name: 'NumberStepper',
  description: 'Cantidades con botones grandes y entrada directa; el valor se ajusta a los límites.',
  states: [
    { id: 'default', label: 'Normal', render: () => <StepperDemo /> },
    { id: 'disabled', label: 'Deshabilitado', render: () => <StepperDemo disabled /> },
  ],
};

export const select: GalleryEntry = {
  id: 'select',
  name: 'Select',
  description: 'Lista desplegable para elegir entre muchas opciones.',
  states: [
    { id: 'default', label: 'Normal', render: () => <Select className="max-w-xs" label="Nivel" options={levels} defaultValue="pri" /> },
    { id: 'placeholder', label: 'Sin elegir', render: () => <Select className="max-w-xs" label="Nivel" options={levels} placeholder="Elige un nivel" /> },
    { id: 'disabled', label: 'Deshabilitado', render: () => <Select className="max-w-xs" label="Nivel" options={levels} defaultValue="bas" disabled /> },
  ],
};
