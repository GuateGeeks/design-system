// Ported from GuateGeeks/socrates.app@7d60a1b:src/design-system/motion.ts (Apache-2.0 in this repo)
import type { DurationToken, EasingToken } from './tokens.ts';

export interface Preset {
  /** Keyframes, or a function of the element for presets that read theme colors. */
  keyframes: Keyframe[] | ((el: Element) => Keyframe[]);
  duration: DurationToken;
  easing: EasingToken;
  /** Alternative keyframes under reduced motion; null = do not animate. */
  reduced?: Keyframe[] | null;
  iterations?: number;
  /**
   * Exit: keeps the last frame until the component unmounts. Every other preset ends in the
   * element's natural state (its last frame must match its CSS).
   */
  exit?: true;
}

const okGlow = (el: Element): Keyframe[] => {
  const ok = (typeof getComputedStyle === 'function' && getComputedStyle(el).getPropertyValue('--gg-color-ok').trim()) || 'currentColor';
  return [
    { boxShadow: `0 0 0 0 color-mix(in srgb, ${ok} 55%, transparent)` },
    { boxShadow: `0 0 0 14px color-mix(in srgb, ${ok} 0%, transparent)` },
  ];
};

/** Preset catalog. Adding one = adding an entry; the lab gallery lists it automatically. */
export const presets = {
  fadeIn: { keyframes: [{ opacity: 0 }, { opacity: 1 }], duration: 'base', easing: 'enter' },
  fadeOut: { keyframes: [{ opacity: 1 }, { opacity: 0 }], duration: 'fast', easing: 'exit', exit: true },
  rise: {
    keyframes: [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
    duration: 'base', easing: 'enter', reduced: [{ opacity: 0 }, { opacity: 1 }],
  },
  slideInRight: {
    keyframes: [{ opacity: 0, transform: 'translateX(12px)' }, { opacity: 1, transform: 'none' }],
    duration: 'base', easing: 'enter', reduced: [{ opacity: 0 }, { opacity: 1 }],
  },
  slideInLeft: {
    keyframes: [{ opacity: 0, transform: 'translateX(-12px)' }, { opacity: 1, transform: 'none' }],
    duration: 'base', easing: 'enter', reduced: [{ opacity: 0 }, { opacity: 1 }],
  },
  sheetUp: {
    keyframes: [{ transform: 'translateY(100%)' }, { transform: 'none' }],
    duration: 'slow', easing: 'enter', reduced: [{ opacity: 0 }, { opacity: 1 }],
  },
  pop: {
    keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.14)', offset: 0.4 }, { transform: 'scale(1)' }],
    duration: 'base', easing: 'responsive', reduced: null,
  },
  popIn: {
    keyframes: [{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'scale(1)' }],
    duration: 'base', easing: 'enter', reduced: [{ opacity: 0 }, { opacity: 1 }],
  },
  press: {
    keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(0.97)', offset: 0.35 }, { transform: 'scale(1)' }],
    duration: 'fast', easing: 'responsive', reduced: null,
  },
  shake: {
    keyframes: [
      { transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' },
      { transform: 'translateX(-2px)' }, { transform: 'translateX(1px)' }, { transform: 'translateX(0)' },
    ],
    duration: 'base', easing: 'responsive', reduced: null,
  },
  wiggle: {
    keyframes: [
      { transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(5deg)' },
      { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' },
    ],
    duration: 'base', easing: 'responsive', reduced: null,
  },
  glowOk: { keyframes: okGlow, duration: 'epic', easing: 'enter', reduced: null },
  pulse: {
    keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
    duration: 'epic', easing: 'standard', reduced: null, iterations: Infinity,
  },
  float: {
    keyframes: [{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }],
    duration: 'epic', easing: 'standard', reduced: null, iterations: Infinity,
  },
  stamp: {
    keyframes: [
      { opacity: 0, transform: 'scale(2.2) rotate(-12deg)' },
      { opacity: 1, transform: 'scale(0.92) rotate(-4deg)', offset: 0.7 },
      // Settles upright: the badge's natural state, and the same as with reduced motion.
      { opacity: 1, transform: 'none' },
    ],
    duration: 'slow', easing: 'enter', reduced: [{ opacity: 0 }, { opacity: 1 }],
  },
} satisfies Record<string, Preset>;

export type PresetName = keyof typeof presets;

/** Intents → preset. Retune the whole product's feel here. */
export const semantic = {
  'feedback.correct': 'pop',
  'feedback.incorrect': 'shake',
  'feedback.hint': 'wiggle',
  'select': 'press',
  'enter.screen': 'rise',
  'enter.step': 'slideInRight',
  'enter.item': 'popIn',
  'reward.badge': 'stamp',
  'reward.celebrate': 'pop',
  'attention': 'pulse',
  'idle.mascot': 'float',
} as const satisfies Record<string, PresetName>;
export type Semantic = keyof typeof semantic;
