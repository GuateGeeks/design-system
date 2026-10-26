import { useEffect } from 'react';
import { Info } from 'lucide-react';
import { Button, Dialog, IconButton, NumberStepper, Tooltip, useToast } from '@guategeeks/ui';
import type { GalleryEntry } from '../types.ts';

function ToastOnMount() {
  const toast = useToast();
  useEffect(() => toast.show({ title: 'Propuesta guardada', description: 'Puedes descargarla cuando quieras.', tone: 'ok' }), [toast]);
  return <p className="text-sm text-ink-muted">Las notificaciones aparecen abajo a la derecha.</p>;
}

function ToastTrigger() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => toast.show({ title: 'Propuesta guardada', description: 'Puedes descargarla cuando quieras.', tone: 'ok' })}>Guardar propuesta</Button>
      <Button variant="secondary" onClick={() => toast.show({ title: 'No se pudo enviar', description: 'Revisa tu conexión e inténtalo de nuevo.', tone: 'bad' })}>Simular error</Button>
    </div>
  );
}

export const dialog: GalleryEntry = {
  id: 'dialog',
  name: 'Dialog',
  group: 'overlays',
  description: 'Diálogo centrado en escritorio y hoja inferior en teléfonos; el foco vuelve al botón que lo abrió.',
  states: [
    {
      id: 'open',
      label: 'Abierto',
      preview: 'frame',
      render: () => (
        <Dialog defaultOpen title="Configurar nivel" description="Ajusta la matrícula de Primaria." trigger={<Button>Configurar</Button>}>
          <NumberStepper label="Estudiantes" value={90} min={1} max={400} onChange={() => {}} />
          <Button>Guardar</Button>
        </Dialog>
      ),
    },
    { id: 'closed', label: 'Cerrado', render: () => <Dialog title="Configurar nivel" trigger={<Button>Configurar</Button>}><p>Contenido</p></Dialog> },
  ],
};

export const tooltip: GalleryEntry = {
  id: 'tooltip',
  name: 'Tooltip',
  group: 'overlays',
  description: 'Ayuda breve al enfocar o pasar sobre un control; nunca contiene información imprescindible.',
  states: [
    { id: 'open', label: 'Visible', render: () => <div className="pt-12"><Tooltip open content="Estimación sujeta a confirmación"><IconButton label="Más información" icon={<Info />} /></Tooltip></div> },
  ],
};

export const toast: GalleryEntry = {
  id: 'toast',
  name: 'Toast',
  group: 'overlays',
  description: 'Confirmaciones breves anunciadas de forma cortés al lector de pantalla.',
  states: [
    { id: 'trigger', label: 'Al guardar', render: () => <ToastTrigger /> },
    { id: 'open', label: 'Visible', render: () => <ToastOnMount />, preview: 'link' },
  ],
};
