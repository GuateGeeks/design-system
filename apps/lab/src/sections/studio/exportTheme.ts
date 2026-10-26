import type { MotionIntensity, ResolvedTheme, SchemeName, ThemeManifest } from '@guategeeks/themes';

export const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Turns studio overrides (CSS name → hex) into a manifest that extends `base` — ready for packages/themes/themes/<id>/theme.json. */
export function exportTheme(
  base: ResolvedTheme,
  scheme: SchemeName,
  overrides: Record<string, string>,
  meta: { id: string; name: string; intensity?: MotionIntensity },
): ThemeManifest {
  const color: Record<string, { $value: string }> = {};
  for (const [name, value] of Object.entries(overrides)) {
    const role = name.replace(/^--gg-color-/, '');
    if (role !== name) color[role] = { $value: value };
  }
  const schemes = base.schemes.length === 1 ? [...base.schemes] : [scheme];
  return {
    id: meta.id,
    name: meta.name,
    extends: base.id,
    schemes,
    motion: { intensity: meta.intensity ?? base.intensity },
    tokens: { [scheme]: { color } },
  };
}
