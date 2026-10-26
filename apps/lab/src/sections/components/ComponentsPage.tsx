import { Card, EmptyState } from '@guategeeks/ui';
import { findEntry, registry } from '../../gallery/registry.ts';
import { Section } from '../Section.tsx';
import { EntryView } from './EntryView.tsx';

export function ComponentsPage({ id }: { id?: string }) {
  if (id) {
    const entry = findEntry(id);
    return entry ? <EntryView entry={entry} /> : <EmptyState title="Este componente no existe." />;
  }
  return (
    <Section title="Componentes" description="Cada componente en cada estado. Los marcos usan el tema, esquema, movimiento y vista de la barra superior.">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {registry.map((entry) => (
          <li key={entry.id}>
            <Card as="a" href={`#/components/${entry.id}`} interactive className="flex h-full flex-col gap-2">
              <span className="text-lg font-medium text-ink">{entry.name}</span>
              <span className="text-sm text-ink-muted">{entry.description}</span>
              <span className="mt-auto text-xs text-ink-subtle">{`${entry.states.length} ${entry.states.length === 1 ? 'estado' : 'estados'}`}</span>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
