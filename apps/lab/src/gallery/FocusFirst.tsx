import { useEffect, useRef, type ReactNode } from 'react';

/** Focuses the first focusable descendant on mount, to show focus styles in a frame. */
export function FocusFirst({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])')?.focus();
  }, []);
  return <div ref={box} className="contents">{children}</div>;
}
