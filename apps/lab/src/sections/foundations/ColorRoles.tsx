import { Copy } from 'lucide-react';
import { colorRoles } from '@guategeeks/tokens';
import { IconButton, useToast } from '@guategeeks/ui';
import { Section } from '../Section.tsx';
import { useResolvedValues } from '../useResolved.ts';

export function ColorRoles() {
  const values = useResolvedValues();
  const toast = useToastSafe();
  return (
    <Section title="Colores semánticos" description="Los componentes solo usan estos roles. Cada tema define su valor en claro y oscuro.">
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {colorRoles.map((role) => {
          const name = `--gg-color-${role}`;
          return (
            <li key={role} data-role={role} className="flex items-center gap-3 rounded-control border border-line bg-surface p-2">
              <span aria-hidden className="size-10 shrink-0 rounded-control border border-line" style={{ background: `var(${name})` }} />
              <div className="flex min-w-0 flex-1 flex-col">
                <code className="truncate text-sm text-ink">{name}</code>
                <span className="text-xs text-ink-muted">{values[name] ?? '—'}</span>
              </div>
              <IconButton
                label={`Copiar ${name}`}
                icon={<Copy />}
                onClick={() => {
                  void navigator.clipboard?.writeText(`var(${name})`);
                  toast?.show({ title: `Copiado var(${name})`, tone: 'ok' });
                }}
              />
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function useToastSafe() {
  try {
    return useToast();
  } catch {
    return null;
  }
}
