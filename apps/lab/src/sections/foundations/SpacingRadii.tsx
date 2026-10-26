import { Section } from '../Section.tsx';

const SPACE = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24'];
const RADII = ['control', 'card', 'panel', 'hero', 'pill'];

export function SpacingRadii() {
  return (
    <Section title="Espaciado y radios" description="Escala de 4 px; radios por rol, no por tamaño.">
      <div className="grid gap-6 lg:grid-cols-2">
        <ul className="flex flex-col gap-2">
          {SPACE.map((s) => (
            <li key={s} className="flex items-center gap-3">
              <code className="w-28 text-xs text-ink-muted">{`--gg-space-${s}`}</code>
              <span aria-hidden className="h-3 rounded-pill bg-accent" style={{ width: `var(--gg-space-${s})` }} />
            </li>
          ))}
        </ul>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {RADII.map((r) => (
            <li key={r} className="flex flex-col items-center gap-2">
              <span aria-hidden className="size-16 border-2 border-hero bg-hint-soft" style={{ borderRadius: `var(--gg-radius-${r})` }} />
              <code className="text-xs text-ink-muted">{`--gg-radius-${r}`}</code>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
