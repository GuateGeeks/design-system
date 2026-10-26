import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { presets } from '@guategeeks/motion';
import { Background, Button, getVariants, GradientBlobs, Tabs, ToastProvider, useToast } from '@guategeeks/ui';

let animate: ReturnType<typeof vi.fn>;
beforeEach(() => {
  animate = vi.fn(() => ({}));
  (Element.prototype as unknown as { animate: unknown }).animate = animate;
  window.matchMedia = ((query: string) => ({ matches: query === '(min-width: 640px)', media: query, addEventListener() {}, removeEventListener() {} })) as never;
  delete document.documentElement.dataset.motion;
});
afterEach(() => vi.restoreAllMocks());

describe('background', () => {
  it('defaults to flat', () => {
    render(<Background><p>Contenido</p></Background>);
    expect(screen.getByText('Contenido').closest('[data-gg="background"]')?.getAttribute('data-variant')).toBe('flat');
  });

  it('a fallback picks the variant when no edition asks for one', () => {
    render(<Background fallback="gradient-blobs"><p>Hola</p></Background>);
    expect(screen.getByText('Hola').closest('[data-gg="background"]')?.getAttribute('data-variant')).toBe('gradient-blobs');
    expect(getVariants('background')).toEqual(expect.arrayContaining(['flat', 'gradient-blobs']));
  });

  it('gradient-blobs follow the pointer, but not under reduced motion', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const { unmount } = render(<GradientBlobs />);
    expect(add.mock.calls.some(([type]) => type === 'pointermove')).toBe(true);
    unmount();
    add.mockClear();
    document.documentElement.dataset.motion = 'reduced';
    render(<GradientBlobs />);
    expect(add.mock.calls.some(([type]) => type === 'pointermove')).toBe(false);
  });
});

describe('component motion', () => {
  it('tabs panel plays rise on change', async () => {
    const user = userEvent.setup();
    render(<Tabs items={[{ id: 'a', label: 'Uno', content: 'Panel uno' }, { id: 'b', label: 'Dos', content: 'Panel dos' }]} />);
    animate.mockClear();
    await user.click(screen.getByRole('tab', { name: 'Dos' }));
    expect(animate).toHaveBeenCalledWith(presets.rise.keyframes, expect.anything());
  });

  it('toast plays slideInRight on wide screens', async () => {
    const user = userEvent.setup();
    function Saver() {
      const toast = useToast();
      return <Button onClick={() => toast.show({ title: 'Listo' })}>Guardar</Button>;
    }
    render(<ToastProvider><Saver /></ToastProvider>);
    animate.mockClear();
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(animate).toHaveBeenCalledWith(presets.slideInRight.keyframes, expect.anything()));
  });
});
