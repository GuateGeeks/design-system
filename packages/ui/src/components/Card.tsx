import type { ElementType, HTMLAttributes } from 'react';
import { cx } from '../cx.ts';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Hover and focus-within affordances for cards that act as a single target. */
  interactive?: boolean;
  /** For `as="a"`. */
  href?: string;
}

export function Card({ as: As = 'div', interactive = false, className, ...rest }: CardProps) {
  return (
    <As
      data-gg="card"
      data-interactive={interactive || undefined}
      className={cx(
        'rounded-card border border-line bg-surface p-6 text-ink',
        interactive && 'transition-[translate,box-shadow,border-color] duration-(--gg-duration-fast) ease-responsive hover:-translate-y-0.5 hover:border-action hover:shadow-float focus-within:border-action calm:hover:translate-y-0',
        className,
      )}
      {...rest}
    />
  );
}
