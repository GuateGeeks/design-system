import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { play } from '@guategeeks/motion';
import { cx } from '../cx.ts';
import { buttonBase, buttonVariants, type ButtonVariant } from './Button.tsx';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name; icons alone are not announced. */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', className, onPointerDown, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      data-gg="icon-button"
      data-variant={variant}
      className={cx(buttonBase, buttonVariants[variant], 'min-w-(--gg-tap-min) p-0 [&_svg]:size-5', className)}
      onPointerDown={(e) => { play(e.currentTarget, 'select'); onPointerDown?.(e); }}
      {...rest}
    >
      {icon}
    </button>
  );
});
