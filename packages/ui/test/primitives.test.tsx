import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { X } from 'lucide-react';
import { Badge, Button, Card, EmptyState, GlassPanel, IconButton, Link } from '@guategeeks/ui';

describe('primitives', () => {
  it('button variants', () => {
    render(<><Button>Guardar</Button><Button variant="hero">Explorar</Button></>);
    const [primary, hero] = screen.getAllByRole('button');
    expect(primary.dataset).toMatchObject({ gg: 'button', variant: 'primary' });
    expect(hero.dataset.variant).toBe('hero');
  });

  it('button loading is busy and disabled', () => {
    render(<Button loading>Enviar</Button>);
    const button = screen.getByRole('button', { name: /Enviar/ });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('icon button requires label', () => {
    render(<IconButton label="Cerrar" icon={<X />} />);
    expect(screen.getByRole('button', { name: 'Cerrar' }).dataset.gg).toBe('icon-button');
  });

  it('badge tones', () => {
    render(<Badge tone="ok">Listo</Badge>);
    expect(screen.getByText('Listo').dataset).toMatchObject({ gg: 'badge', tone: 'ok' });
  });

  it('card renders as the requested element', () => {
    render(<Card as="article" interactive>Contenido</Card>);
    const card = screen.getByText('Contenido');
    expect(card.tagName).toBe('ARTICLE');
    expect(card.dataset).toMatchObject({ gg: 'card', interactive: 'true' });
  });

  it('link, glass panel and empty state render', () => {
    render(<>
      <Link href="#/x">Ver más</Link>
      <GlassPanel>Panel</GlassPanel>
      <EmptyState title="Sin resultados" description="Prueba otra búsqueda" />
    </>);
    expect(screen.getByRole('link', { name: 'Ver más' }).dataset.gg).toBe('link');
    expect(screen.getByText('Panel').dataset.gg).toBe('glass-panel');
    expect(screen.getByRole('heading', { name: 'Sin resultados' })).toBeTruthy();
  });
});
