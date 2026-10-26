import { useCallback, useSyncExternalStore } from 'react';

const getMql = (query: string) =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;

/** Live media query match; false during SSR and where matchMedia is unavailable. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mql = getMql(query);
    mql?.addEventListener('change', onChange);
    return () => mql?.removeEventListener('change', onChange);
  }, [query]);
  return useSyncExternalStore(subscribe, () => getMql(query)?.matches ?? false, () => false);
}
