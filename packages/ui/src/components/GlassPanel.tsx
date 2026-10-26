import type { HTMLAttributes } from 'react';
import { cx } from '../cx.ts';

/** Translucent surface for HUDs and floating chrome; opaque when the user prefers reduced transparency. */
export function GlassPanel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-gg="glass-panel" className={cx('gg-glass rounded-panel border border-line text-ink shadow-float', className)} {...rest} />;
}
