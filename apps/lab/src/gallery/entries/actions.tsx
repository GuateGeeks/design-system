import { ArrowRight, Heart, Settings, X } from 'lucide-react';
import { Button, IconButton, Link } from '@guategeeks/ui';
import { FocusFirst } from '../FocusFirst.tsx';
import { Row } from '../Row.tsx';
import type { GalleryEntry } from '../types.ts';

const buttons = (props: { disabled?: boolean; loading?: boolean } = {}) => (
  <Row>
    <Button {...props}>Inscribirme</Button>
    <Button variant="secondary" {...props}>Ver programa</Button>
    <Button variant="ghost" {...props}>Cancelar</Button>
    <Button variant="hero" size="lg" iconStart={<ArrowRight aria-hidden className="size-4" />} {...props}>Empezar</Button>
  </Row>
);

export const button: GalleryEntry = {
  id: 'button',
  name: 'Button',
  description: 'Acción principal en coral con tinta oscura; secundaria, fantasma y héroe en ciruela.',
  states: [
    { id: 'default', label: 'Variantes', render: () => buttons() },
    { id: 'focus', label: 'Foco', render: () => <FocusFirst>{buttons()}</FocusFirst> },
    { id: 'disabled', label: 'Deshabilitado', render: () => buttons({ disabled: true }) },
    { id: 'loading', label: 'Cargando', render: () => buttons({ loading: true }) },
  ],
};

const icons = (disabled = false) => (
  <Row>
    <IconButton label="Cerrar" icon={<X />} disabled={disabled} />
    <IconButton label="Favorito" icon={<Heart />} variant="secondary" disabled={disabled} />
    <IconButton label="Ajustes" icon={<Settings />} variant="primary" disabled={disabled} />
  </Row>
);

export const iconButton: GalleryEntry = {
  id: 'icon-button',
  name: 'IconButton',
  description: 'Botón solo con icono; siempre lleva un nombre accesible y mide al menos 44 px.',
  states: [
    { id: 'default', label: 'Variantes', render: () => icons() },
    { id: 'focus', label: 'Foco', render: () => <FocusFirst>{icons()}</FocusFirst> },
    { id: 'disabled', label: 'Deshabilitado', render: () => icons(true) },
  ],
};

const paragraph = (
  <p className="max-w-prose text-ink">
    Conoce los <Link href="#/">programas educativos</Link> de GuateGeeks y lleva la robótica a tu escuela.
  </p>
);

export const link: GalleryEntry = {
  id: 'link',
  name: 'Link',
  description: 'Enlace en texto con coral oscuro para conservar el contraste sobre superficies claras.',
  states: [
    { id: 'default', label: 'En texto', render: () => paragraph },
    { id: 'focus', label: 'Foco', render: () => <FocusFirst>{paragraph}</FocusFirst> },
  ],
};
