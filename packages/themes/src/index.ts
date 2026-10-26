import { themes } from './generated/themes.ts';
import type { ResolvedTheme } from './types.ts';

export { themes, editions } from './generated/themes.ts';
export type * from './types.ts';

export function getTheme(id: string): ResolvedTheme | undefined {
  return themes.find((t) => t.id === id);
}
