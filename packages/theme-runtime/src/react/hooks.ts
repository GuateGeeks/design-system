import { useContext, useSyncExternalStore } from 'react';
import type { Edition, ResolvedTheme } from '@guategeeks/themes';
import type { ThemeController, ThemeState } from '../controller.ts';
import { ThemeContext } from './ThemeProvider.tsx';

export type UseThemeResult = ThemeState &
  Pick<ThemeController, 'setTheme' | 'setScheme' | 'setMotion' | 'setEdition'> & { themes: ResolvedTheme[]; editions: Edition[] };

function useController() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

function useThemeState(): ThemeState {
  const { controller } = useController();
  return useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
}

export function useTheme(): UseThemeResult {
  const { controller, themes, editions } = useController();
  const state = useThemeState();
  return {
    ...state,
    setTheme: controller.setTheme,
    setScheme: controller.setScheme,
    setMotion: controller.setMotion,
    setEdition: controller.setEdition,
    themes,
    editions,
  };
}

/** The value an edition requests for an extension point, or `fallback`. */
export function useVariant(point: string, fallback: string): string {
  return useThemeState().variants[point] ?? fallback;
}

export function useEdition(): Edition | null {
  return useThemeState().edition;
}
