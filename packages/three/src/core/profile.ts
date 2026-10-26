import type { ResolvedTheme, ThreeProfile } from '@guategeeks/themes';

export type { ThreeProfile } from '@guategeeks/themes';

/** The 3D profile a theme resolves to (merged along `extends`). */
export function profileOf(theme: ResolvedTheme): ThreeProfile {
  return theme.three;
}
