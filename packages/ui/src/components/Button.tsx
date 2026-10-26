import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { play } from '@guategeeks/motion';
import { cx } from '../cx.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'hero';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  loading?: boolean;
  iconStart?: ReactNode;
}

export const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium select-none min-h-(--gg-tap-min) ' +
  'transition-colors duration-(--gg-duration-fast) ease-responsive disabled:cursor-not-allowed disabled:opacity-50';

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-action text-on-action hover:bg-action-hover',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-2',
  ghost: 'bg-transparent text-ink hover:bg-surface-2',
  hero: 'bg-hero text-on-hero hover:opacity-90',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, iconStart, className, children, disabled, onPointerDown, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      data-gg="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cx(buttonBase, buttonVariants[variant], size === 'lg' ? 'px-6 text-lg' : 'px-4 text-sm', className)}
      onPointerDown={(e) => { play(e.currentTarget, 'select'); onPointerDown?.(e); }}
      {...rest}
    >
      {loading ? <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" /> : iconStart}
      {children}
    </button>
  );
});
