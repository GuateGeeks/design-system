import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Edition, ResolvedTheme } from '@guategeeks/themes';
import { createThemeController, type ThemeController, type ThemeControllerOptions } from '../controller.ts';

export interface ThemeContextValue {
  controller: ThemeController;
  themes: ResolvedTheme[];
  editions: Edition[];
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** An existing controller; the provider never destroys it. */
  controller?: ThemeController;
  /** Options for a controller the provider creates and destroys on unmount. */
  options?: ThemeControllerOptions;
  children?: ReactNode;
}

export function ThemeProvider({ controller, options, children }: ThemeProviderProps) {
  // Created detached: a render StrictMode discards leaves no listeners and never touches <html>.
  const [owned] = useState(() => (controller ? null : createThemeController({ ...(options ?? { themes: [] }), attach: false })));
  useEffect(() => () => owned?.destroy(), [owned]);
  const active = controller ?? owned!;
  // Keeps the controller attached (root attributes, OS listeners) while mounted, even if no child subscribes.
  useEffect(() => active.subscribe(() => {}), [active]);
  const value: ThemeContextValue = {
    controller: active,
    themes: options?.themes ?? [],
    editions: options?.editions ?? [],
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
