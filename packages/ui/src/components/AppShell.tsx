import type { ReactNode } from 'react';
import { cx } from '../cx.ts';

export interface AppShellNavItem { id: string; label: string; icon: ReactNode; href: string; current?: boolean }

export interface AppShellProps {
  brand: ReactNode;
  nav: AppShellNavItem[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Sidebar navigation from 1024px; a bottom navigation bar on phones and tablets. */
export function AppShell({ brand, nav, actions, children, className }: AppShellProps) {
  return (
    <div data-gg="app-shell" className={cx('min-h-dvh bg-bg text-ink lg:grid lg:grid-cols-[14rem_1fr]', className)}>
      <header className="sticky top-0 z-(--gg-z-sticky) flex items-center justify-between gap-3 border-b border-line bg-bg px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:hidden">
        {brand}
        {actions}
      </header>
      <nav
        aria-label="Principal"
        className={cx(
          'fixed inset-x-0 bottom-0 z-(--gg-z-sticky) border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]',
          'lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-56 lg:flex-col lg:gap-6 lg:border-r lg:border-t-0 lg:p-4',
        )}
      >
        <div className="hidden lg:block">{brand}</div>
        <ul className="flex justify-around lg:flex-col lg:justify-start lg:gap-1">
          {nav.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
                className={cx(
                  'flex min-h-(--gg-tap-min) flex-col items-center justify-center gap-0.5 rounded-control px-3 text-xs font-medium text-ink-muted',
                  'lg:flex-row lg:justify-start lg:gap-3 lg:text-sm hover:text-ink [&_svg]:size-5',
                  'aria-[current=page]:text-ink aria-[current=page]:lg:bg-surface-2',
                )}
              >
                <span aria-hidden>{item.icon}</span>
                <span className="whitespace-nowrap">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
        {actions && <div className="hidden lg:mt-auto lg:block">{actions}</div>}
      </nav>
      <main className="min-w-0 pb-24 lg:pb-0">{children}</main>
    </div>
  );
}
