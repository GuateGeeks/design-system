import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { cx } from '../cx.ts';

export const Link = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function Link({ className, ...rest }, ref) {
  return (
    <a
      ref={ref}
      data-gg="link"
      className={cx('font-medium text-link underline-offset-4 hover:underline rounded-sm', className)}
      {...rest}
    />
  );
});
