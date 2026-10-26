// Ported from GuateGeeks/socrates.app@7d60a1b:src/design-system/motion.ts (Apache-2.0 in this repo)
import { motion } from '@guategeeks/tokens';

/** Duration tokens in ms and easing curves, from @guategeeks/tokens. Never use magic numbers in components. */
export const duration = motion.duration;
export const easing = motion.easing;
export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;

/**
 * Springs for physics engines (Motion, GSAP). CSS and WAAPI keep using `easing.spring`.
 * `bounce` 0 settles without overshoot; perceived duration comes from the duration tokens.
 */
export const spring = {
  /** UI controls: respond and settle without bounce. */
  firm: { bounce: 0, duration: 'base' },
  /** Manipulable objects on release (tiles, buckets): a slight bounce. */
  soft: { bounce: 0.15, duration: 'base' },
} as const satisfies Record<string, { bounce: number; duration: DurationToken }>;
export type SpringToken = keyof typeof spring;

/** The theme-aware duration: reads `--gg-duration-<token>` on the element (theme intensity, reduced motion), else the token. */
export function effectiveDuration(el: Element, token: DurationToken): number {
  const raw = typeof getComputedStyle === 'function' ? getComputedStyle(el).getPropertyValue(`--gg-duration-${token}`).trim() : '';
  const n = parseFloat(raw);
  if (!raw || Number.isNaN(n)) return duration[token];
  return raw.endsWith('ms') ? n : Math.round(n * 1000);
}
