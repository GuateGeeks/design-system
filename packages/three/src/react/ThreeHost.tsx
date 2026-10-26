import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

export interface ThreeHostProps<E extends { dispose(): void }> extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onError'> {
  /** Creates the imperative engine inside the host element. Called once per mount. */
  create(container: HTMLElement): E;
  /** The live engine, or null after disposal. */
  onEngine?(engine: E | null): void;
  /** The engine could not start (for example, no WebGL). */
  onError?(error: unknown): void;
  children?: ReactNode;
}

/**
 * Hosts an imperative engine (a campus scene, the papercraft inspector, …) in React: creates it in an
 * effect, so a StrictMode remount or a discarded render never leaves a second live engine, and disposes it
 * on unmount. Engines own their renderer, render loop and quality governor.
 */
export function ThreeHost<E extends { dispose(): void }>({ create, onEngine, onError, children, ...rest }: ThreeHostProps<E>) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ create, onEngine, onError });
  callbacks.current = { create, onEngine, onError };
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let engine: E | null = null;
    try {
      engine = callbacks.current.create(el);
    } catch (error) {
      callbacks.current.onError?.(error);
      return;
    }
    callbacks.current.onEngine?.(engine);
    return () => {
      callbacks.current.onEngine?.(null);
      engine?.dispose();
    };
  }, []);
  return <div ref={host} data-gg="three-host" {...rest}>{children}</div>;
}
