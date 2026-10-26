import { BookOpen, Home, Trophy, User } from 'lucide-react';
import { AppShell, Badge, Button, GradientBlobs, Progress } from '@guategeeks/ui';
import type { GalleryEntry } from '../types.ts';

export const appShell: GalleryEntry = {
  id: 'app-shell',
  name: 'AppShell',
  group: 'structure',
  description: 'Navegación lateral desde 1024 px y barra inferior en teléfonos y tabletas.',
  states: [
    {
      id: 'default',
      label: 'Navegación',
      preview: 'frame',
      render: () => (
        <div className="-m-6">
          <AppShell
            brand={<span className="text-lg font-medium">Sócrates</span>}
            actions={<Badge tone="action">Halloween</Badge>}
            nav={[
              { id: 'home', label: 'Inicio', icon: <Home />, href: '#', current: true },
              { id: 'explore', label: 'Explorar', icon: <BookOpen />, href: '#' },
              { id: 'goals', label: 'Logros', icon: <Trophy />, href: '#' },
              { id: 'me', label: 'Mi espacio', icon: <User />, href: '#' },
            ]}
          >
            <div className="flex flex-col gap-2 p-6">
              <h2 className="text-2xl">Hola, Ada</h2>
              <p className="text-ink-muted">Tu siguiente lección te espera.</p>
            </div>
          </AppShell>
        </div>
      ),
    },
  ],
};

const hero = (
  <div className="flex min-h-64 flex-col justify-center gap-3 p-8">
    <h2 className="text-3xl">Aprender haciendo</h2>
    <p className="max-w-md text-ink-muted">Robótica, programación y tecnología para tu escuela.</p>
    <Button className="w-fit">Conocer los programas</Button>
  </div>
);

export const background: GalleryEntry = {
  id: 'background',
  name: 'Background',
  group: 'structure',
  description: 'Punto de extensión de fondo: plano o manchas de color que se mueven con el puntero (estáticas con movimiento reducido).',
  states: [
    { id: 'gradient-blobs', label: 'Manchas', render: () => <GradientBlobs className="-m-6 rounded-panel">{hero}</GradientBlobs> },
    { id: 'flat', label: 'Plano', render: () => <div className="-m-6 rounded-panel bg-bg">{hero}</div> },
  ],
};

export const progress: GalleryEntry = {
  id: 'progress',
  name: 'Progress',
  group: 'structure',
  description: 'Punto de extensión: las ediciones pueden cambiar la barra por niveles de XP, constelaciones o tarjetas perforadas.',
  states: [
    { id: 'default', label: 'En curso', render: () => <div className="max-w-md"><Progress value={7} max={12} label="Avance de la unidad" milestones={[4, 8]} /></div> },
    { id: 'complete', label: 'Completo', render: () => <div className="max-w-md"><Progress value={12} max={12} label="Avance de la unidad" /></div> },
  ],
};
