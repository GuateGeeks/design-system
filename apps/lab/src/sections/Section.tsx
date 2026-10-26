import type { ReactNode } from 'react';

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl">{title}</h2>
        {description && <p className="max-w-prose text-sm text-ink-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}
