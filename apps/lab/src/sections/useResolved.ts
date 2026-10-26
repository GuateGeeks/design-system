import { getTheme } from '@guategeeks/themes';
import { useTheme } from '@guategeeks/theme-runtime/react';

/** The active theme × scheme token values, as built by @guategeeks/themes. */
export function useResolvedValues(): Record<string, string> {
  const { theme, scheme } = useTheme();
  const resolved = getTheme(theme);
  return resolved?.values[scheme] ?? resolved?.values[resolved.defaultScheme] ?? {};
}
