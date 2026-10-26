import { afterEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { cleanup, render } from '@testing-library/react';
import { ThreeHost } from '@guategeeks/three/react';

afterEach(() => cleanup());

describe('ThreeHost', () => {
  it('keeps exactly one live engine and disposes it on unmount (StrictMode)', () => {
    let live = 0;
    const create = vi.fn(() => { live++; return { dispose: () => { live--; } }; });
    const onEngine = vi.fn();
    const { unmount, container } = render(<StrictMode><ThreeHost create={create} onEngine={onEngine} className="stage" /></StrictMode>);
    expect(live).toBe(1);
    expect(create.mock.calls.at(-1)?.[0]).toBe(container.querySelector('.stage'));
    expect(onEngine).toHaveBeenLastCalledWith(expect.objectContaining({ dispose: expect.any(Function) }));
    unmount();
    expect(live).toBe(0);
    expect(onEngine).toHaveBeenLastCalledWith(null);
  });

  it('reports engines that cannot start', () => {
    const onError = vi.fn();
    render(<ThreeHost create={() => { throw new Error('no webgl'); }} onError={onError} />);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
