import { Section } from '../Section.tsx';

const SIZES = ['display', '3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs'] as const;

export function TypeScale() {
  return (
    <Section title="Tipografía" description="Inter en interfaz y títulos; los temas pueden cambiar la fuente de títulos.">
      <ul className="flex flex-col gap-3">
        {SIZES.map((size) => (
          <li key={size} className="flex flex-wrap items-baseline gap-x-4 border-b border-line-soft pb-2">
            <code className="w-40 shrink-0 text-xs text-ink-muted">{`--gg-size-${size}`}</code>
            <span
              className="min-w-0 text-ink"
              style={{
                fontSize: `var(--gg-size-${size})`,
                fontFamily: size === 'display' || size.includes('xl') ? 'var(--gg-font-display)' : 'var(--gg-font-ui)',
                letterSpacing: size === 'display' ? 'var(--gg-tracking-display)' : undefined,
              }}
            >
              Aprender haciendo
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
