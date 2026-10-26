import type { ThemeState } from './controller.ts';

export function applyToRoot(root: HTMLElement, state: ThemeState): void {
  root.dataset.theme = state.theme;
  root.dataset.scheme = state.scheme;
  root.dataset.motion = state.motion;
}

export function media(query: string): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;
}
