// Ported from GuateGeeks/socrates.app@7d60a1b:src/design-system/motion.ts (Apache-2.0 in this repo)
import { presets, semantic, type Preset, type PresetName, type Semantic } from './presets.ts';
import { prefersReducedMotion } from './reduced.ts';
import { duration, easing, effectiveDuration, type DurationToken } from './tokens.ts';

export interface PlayOptions { delay?: number; duration?: DurationToken; iterations?: number }

/** Plays a preset (or semantic intent) on an element. Returns the Animation, or null when nothing animates. */
export function play(el: Element | null | undefined, name: PresetName | Semantic, opts: PlayOptions = {}): Animation | null {
  if (!el || typeof (el as HTMLElement).animate !== 'function') return null;
  const presetName = (name in semantic ? semantic[name as Semantic] : name) as PresetName;
  const p: Preset = presets[presetName];
  const reduced = prefersReducedMotion();
  const full = typeof p.keyframes === 'function' ? p.keyframes(el) : p.keyframes;
  const frames = reduced ? (p.reduced === undefined ? full : p.reduced) : full;
  if (!frames) return null;
  const ms = effectiveDuration(el, opts.duration ?? p.duration);
  return (el as HTMLElement).animate(frames, {
    duration: reduced ? Math.min(duration.fast, ms) : ms,
    easing: easing[p.easing],
    delay: opts.delay ?? 0,
    iterations: reduced ? 1 : opts.iterations ?? p.iterations ?? 1,
    // `backwards` covers a stagger delay with the first frame; when done the element returns to its CSS.
    // Only exits keep their final frame.
    fill: p.exit ? 'both' : 'backwards',
  });
}

/** Staggered: plays a preset on a list with an increasing delay (lists, options, badges). */
export function stagger(els: ArrayLike<Element>, name: PresetName | Semantic, step = 45): void {
  Array.from(els).forEach((el, i) => play(el, name, { delay: i * step }));
}

/** FLIP for reorders (sortable lists, buckets). */
export function flip(els: HTMLElement[], mutate: () => void): void {
  const first = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
  mutate();
  if (prefersReducedMotion()) return;
  requestAnimationFrame(() => {
    for (const el of els) {
      const a = first.get(el); if (!a || !el.isConnected) continue;
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: effectiveDuration(el, 'base'), easing: easing.responsive });
    }
  });
}

/** Animates a number from `from` to `to` (XP counters). */
export function countUp(from: number, to: number, onFrame: (v: number) => void, ms: number = duration.epic): () => void {
  if (prefersReducedMotion()) { onFrame(to); return () => {}; }
  let raf = 0; const t0 = performance.now();
  const tick = (t: number) => {
    const k = Math.min(1, (t - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    onFrame(Math.round(from + (to - from) * e));
    if (k < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
