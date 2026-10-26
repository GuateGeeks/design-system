import { useEffect, useRef, type ReactNode } from 'react';
import { prefersReducedMotion } from '@guategeeks/motion';
import { cx } from '../cx.ts';
import { registerVariant, VariantSlot } from '../variants.tsx';

export interface BackgroundProps { children?: ReactNode; className?: string }

function Flat({ children, className }: BackgroundProps) {
  return <div data-gg="background" data-variant="flat" className={cx('relative bg-bg', className)}>{children}</div>;
}

/**
 * Three soft blobs in the action, accent and hero colours that slowly morph and drift with the pointer
 * (ported from the GuateGeeks page hero, GuateGeeks/guategeeks.github.io src/components/Hero.jsx).
 * Static under reduced motion: no morphing, no parallax.
 */
export function GradientBlobs({ children, className }: BackgroundProps) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0, x = 0, y = 0;
    const onMove = (event: PointerEvent) => {
      x = (event.clientX / window.innerWidth - 0.5) * 2;
      y = (event.clientY / window.innerHeight - 0.5) * 2;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty('--gg-parallax-x', x.toFixed(3));
        el.style.setProperty('--gg-parallax-y', y.toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={root} data-gg="background" data-variant="gradient-blobs" className={cx('relative isolate overflow-hidden bg-bg', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <span className="gg-blob gg-blob-1" />
        <span className="gg-blob gg-blob-2" />
        <span className="gg-blob gg-blob-3" />
      </div>
      {children}
    </div>
  );
}

registerVariant('background', 'flat', Flat);
registerVariant('background', 'gradient-blobs', GradientBlobs);

/** Background is an extension point: editions can request flat, gradient-blobs, starfield, … */
export function Background({ fallback = 'flat', ...props }: BackgroundProps & { fallback?: string }) {
  return <VariantSlot point="background" fallback={fallback} props={props} />;
}
