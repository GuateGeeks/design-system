// Ported from GuateGeeks/socrates.app@7d60a1b:src/design-system/motion.ts (Apache-2.0 in this repo)
const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Reduced motion is the app setting (`data-motion` on <html>, owned by @guategeeks/theme-runtime)
 * or, when the app has no explicit "full" setting, the OS preference.
 */
export function prefersReducedMotion(): boolean {
  if (typeof document === 'undefined') return false;
  const setting = document.documentElement.dataset.motion;
  if (setting === 'reduced') return true;
  if (setting === 'full') return false;
  return typeof matchMedia === 'function' && matchMedia(QUERY).matches;
}

/** Notifies when the effective reduction changes (OS query or the `data-motion` attribute). Returns an unsubscribe. */
export function onReducedMotionChange(listener: (reduced: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {};
  let last = prefersReducedMotion();
  const check = () => {
    const now = prefersReducedMotion();
    if (now !== last) { last = now; listener(now); }
  };
  const query = typeof matchMedia === 'function' ? matchMedia(QUERY) : null;
  query?.addEventListener('change', check);
  const observer = typeof MutationObserver === 'function' ? new MutationObserver(check) : null;
  observer?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  return () => { query?.removeEventListener('change', check); observer?.disconnect(); };
}
