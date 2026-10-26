import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Dialog, ToastProvider, Tooltip, useToast } from '@guategeeks/ui';

let wide = true;
beforeEach(() => {
  wide = true;
  window.matchMedia = ((query: string) => ({
    matches: query === '(min-width: 640px)' ? wide : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  (Element.prototype as unknown as { animate: unknown }).animate = vi.fn(() => ({}));
});
afterEach(() => vi.restoreAllMocks());

function Example({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog title="Configurar" description="Ajusta tu propuesta" trigger={<Button>Abrir</Button>} onOpenChange={onOpenChange}>
      <p>Contenido</p>
    </Dialog>
  );
}

describe('overlays', () => {
  it('dialog on wide screens', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(screen.getByRole('dialog', { name: 'Configurar' }).dataset.presentation).toBe('dialog');
  });

  it('sheet on phones', async () => {
    wide = false;
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(screen.getByRole('dialog', { name: 'Configurar' }).dataset.presentation).toBe('sheet');
  });

  it('dialog a11y', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Example onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Configurar' })).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('dialog has a close button', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('toast announces', async () => {
    function Saver() {
      const toast = useToast();
      return <Button onClick={() => toast.show({ title: 'Guardado', tone: 'ok' })}>Guardar</Button>;
    }
    const user = userEvent.setup();
    render(<ToastProvider><Saver /></ToastProvider>);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    // Radix announces on the next frame through a polite status region.
    await waitFor(() => expect(screen.getAllByRole('status').some((s) => s.textContent?.includes('Guardado'))).toBe(true));
    expect(screen.getByRole('region', { name: /Notificaciones/ })).toBeTruthy();
  });

  it('tooltip labels its trigger on focus', async () => {
    const user = userEvent.setup();
    render(<Tooltip content="Copiar valor"><Button>Copiar</Button></Tooltip>);
    await user.tab();
    expect((await screen.findByRole('tooltip')).textContent).toContain('Copiar valor');
  });

  it('tooltip can be shown open', async () => {
    render(<Tooltip content="Siempre visible" open><Button>Info</Button></Tooltip>);
    expect((await screen.findByRole('tooltip')).textContent).toContain('Siempre visible');
  });

  it('useToast is stable across renders', async () => {
    const seen = new Set<unknown>();
    function ShowOnMount() {
      const toast = useToast();
      seen.add(toast);
      useEffect(() => toast.show({ title: 'Una vez' }), [toast]);
      return null;
    }
    render(<ToastProvider><ShowOnMount /></ToastProvider>);
    await waitFor(() => expect(screen.getAllByText('Una vez').length).toBeGreaterThan(0));
    expect(seen.size).toBe(1);
  });
});
