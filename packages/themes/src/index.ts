import { themes } from './generated/themes.ts';
import type { MascotPalette, ResolvedTheme, SchemeName } from './types.ts';

export { themes, editions } from './generated/themes.ts';
export type * from './types.ts';
export { resolveThreeProfile, THREE_PROFILES } from './three.ts';

/** Geeky's palette for a theme and scheme; `{}` keeps Geeky's own colours. */
export function geekyPalette(theme: ResolvedTheme | undefined, scheme: SchemeName): MascotPalette {
  return { ...theme?.mascot?.palette?.[scheme] };
}

export function getTheme(id: string): ResolvedTheme | undefined {
  return themes.find((t) => t.id === id);
}
