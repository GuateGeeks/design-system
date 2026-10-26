import type { ElementType, HTMLAttributes } from 'react';
import { cx } from '../cx.ts';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Hover and focus-within affordances for cards that act as a single target. */
  interactive?: boolean;
}

export function Card({ as: As = 'div', interactive = false, className, ...rest }: CardProps) {
  return (
    <As
      data-gg="card"
      data-interactive={interactive || undefined}
      className={cx(
        'rounded-card border border-line bg-surface p-6 text-ink',
        interactive && 'transition-colors duration-(--gg-duration-fast) hover:border-action focus-within:border-action',
        className,
      )}
      {...rest}
    />
  );
}
