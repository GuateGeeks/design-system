import type { ReactNode } from 'react';
import { cx } from '../cx.ts';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div data-gg="empty-state" className={cx('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}>
      {icon && <div aria-hidden className="text-ink-subtle [&_svg]:size-10">{icon}</div>}
      <h3 className="text-xl text-ink">{title}</h3>
      {description && <p className="max-w-prose text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}
