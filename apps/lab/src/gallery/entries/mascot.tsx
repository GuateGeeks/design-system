import { Geeky } from '@guategeeks/mascot/react';
import type { GalleryEntry } from '../types.ts';

export const geeky: GalleryEntry = {
  id: 'geeky',
  name: 'Geeky',
  group: 'surfaces',
  description: 'Geeky en pantallas de producto: se elige qué comunica (una intención) y toma los colores del tema. Sin nombre accesible es decorativo; el mensaje importante siempre va en texto.',
  states: [
    {
      id: 'bienvenida',
      label: 'Bienvenida, con nombre',
      render: () => (
        <div className="flex items-center gap-4">
          <Geeky intent="welcome" label="Geeky te da la bienvenida" />
          <p className="max-w-xs text-sm text-ink-muted">¡Hola! Empecemos tu primer proyecto.</p>
        </div>
      ),
    },
    { id: 'celebrar', label: 'Celebrar', render: () => <Geeky intent="celebrate" label="Geeky celebra tu logro" /> },
    { id: 'error', label: 'Algo falló', render: () => <Geeky intent="error" label="Geeky: algo falló" /> },
    { id: 'decorativo', label: 'Decorativo', render: () => <Geeky intent="idle" size="5rem" /> },
  ],
};
