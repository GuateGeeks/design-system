import { Rocket, SearchX } from 'lucide-react';
import { Badge, Button, Card, EmptyState, GlassPanel } from '@guategeeks/ui';
import { Row } from '../Row.tsx';
import type { GalleryEntry } from '../types.ts';

export const card: GalleryEntry = {
  id: 'card',
  name: 'Card',
  description: 'Superficie con borde de 1 px y radio de tarjeta; la versión interactiva resalta al pasar o enfocar.',
  states: [
    {
      id: 'default',
      label: 'Contenido',
      render: () => (
        <Card className="max-w-sm">
          <h3 className="text-xl">Robótica con SPIKE</h3>
          <p className="mt-2 text-sm text-ink-muted">Construye, programa y prueba robots en equipo.</p>
        </Card>
      ),
    },
    {
      id: 'interactive',
      label: 'Interactiva',
      render: () => (
        <Card as="article" interactive className="flex max-w-sm flex-col gap-3">
          <Badge tone="action">Nuevo</Badge>
          <h3 className="text-xl">Drones educativos</h3>
          <p className="text-sm text-ink-muted">Vuela, mide y analiza datos reales.</p>
          <Button variant="secondary">Ver detalles</Button>
        </Card>
      ),
    },
  ],
};

export const badge: GalleryEntry = {
  id: 'badge',
  name: 'Badge',
  description: 'Etiquetas de estado con tonos semánticos: neutro, acción, correcto, error y pista.',
  states: [
    {
      id: 'default',
      label: 'Tonos',
      render: () => (
        <Row>
          <Badge>Borrador</Badge>
          <Badge tone="action">Nuevo</Badge>
          <Badge tone="ok">Completado</Badge>
          <Badge tone="bad">Vencido</Badge>
          <Badge tone="hint">Pista</Badge>
        </Row>
      ),
    },
  ],
};

export const glassPanel: GalleryEntry = {
  id: 'glass-panel',
  name: 'GlassPanel',
  description: 'Vidrio para HUD y controles flotantes sobre escenas; opaco si se prefiere menos transparencia.',
  states: [
    {
      id: 'default',
      label: 'Sobre escena',
      render: () => (
        <div className="relative overflow-hidden rounded-panel bg-hero p-10">
          <div aria-hidden className="absolute -left-10 -top-10 size-48 rounded-pill bg-action" />
          <div aria-hidden className="absolute -bottom-12 right-0 size-56 rounded-pill bg-accent" />
          <GlassPanel className="relative flex max-w-sm flex-col gap-2 p-5">
            <h3 className="text-lg">Mi propuesta</h3>
            <p className="text-sm text-ink-muted">Representación de tu configuración.</p>
          </GlassPanel>
        </div>
      ),
    },
  ],
};

export const emptyState: GalleryEntry = {
  id: 'empty-state',
  name: 'EmptyState',
  description: 'Mensaje para listas vacías o búsquedas sin resultado, con una acción para continuar.',
  states: [
    {
      id: 'default',
      label: 'Sin resultados',
      render: () => (
        <EmptyState icon={<SearchX />} title="Sin resultados" description="Prueba con otra palabra o quita un filtro." action={<Button variant="secondary">Limpiar filtros</Button>} />
      ),
    },
    {
      id: 'start',
      label: 'Primer uso',
      render: () => (
        <EmptyState icon={<Rocket />} title="Aún no tienes proyectos" description="Crea el primero y compártelo con tu equipo." action={<Button>Crear proyecto</Button>} />
      ),
    },
  ],
};
