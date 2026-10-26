import type { ResolvedToken } from './resolve.ts';

/** Tailwind v4 namespace for each semantic token group. Primitives are not exposed as utilities. */
const NAMESPACES: Record<string, string> = {
  color: 'color',
  radius: 'radius',
  font: 'font',
  easing: 'ease',
  shadow: 'shadow',
  size: 'text',
};

/** Primitive groups exposed as utilities: they are scales, not raw palette values. */
const SCALE_GROUPS = new Set(['easing', 'shadow', 'size']);
/** Primitive radii exposed next to the semantic ones; sm/md/lg/xl stay Tailwind's own. */
const RADIUS_PRIMITIVES = new Set(['hero', 'pill']);

export function buildTailwind(tokens: ResolvedToken[]): string {
  const lines: string[] = [];
  for (const t of tokens) {
    const ns = NAMESPACES[t.path[0]];
    if (!ns) continue;
    const exposed = t.layer === 'semantic' || SCALE_GROUPS.has(t.path[0]) || (t.path[0] === 'radius' && RADIUS_PRIMITIVES.has(t.path[1]));
    if (!exposed) continue;
    lines.push(`  --${ns}-${t.path.slice(1).join('-')}: var(--${t.name});`);
  }
  return `@theme inline {\n${lines.join('\n')}\n}\n`;
}
