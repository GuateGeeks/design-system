import Color from 'colorjs.io';

export interface ContrastPair { fg: string; bg: string; min: number }
export interface ContrastResult extends ContrastPair { ratio: number; pass: boolean }

const text = (fg: string, bg: string): ContrastPair => ({ fg, bg, min: 4.5 });
const ui = (fg: string, bg: string): ContrastPair => ({ fg, bg, min: 3 });

/** WCAG 2.2 AA pairs every theme × scheme must pass: 4.5:1 for text, 3:1 for the focus indicator. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  text('ink', 'bg'), text('ink', 'surface'), text('ink', 'surface-2'),
  text('ink-muted', 'surface'), text('ink-muted', 'surface-2'),
  text('ink-subtle', 'surface'), text('ink-subtle', 'surface-2'),
  text('on-action', 'action'), text('on-action', 'action-hover'),
  text('link', 'bg'), text('link', 'surface'), text('link', 'surface-2'),
  text('on-hero', 'hero'),
  text('ok', 'surface'), text('bad', 'surface'), text('hint', 'surface'),
  text('ink', 'wash'),
  text('ok', 'ok-soft'), text('bad', 'bad-soft'), text('hint', 'hint-soft'),
  ui('focus', 'bg'), ui('focus', 'surface'),
];

export function contrastRatio(fg: string, bg: string): number {
  try {
    return new Color(fg).contrast(new Color(bg), 'WCAG21');
  } catch {
    return 0;
  }
}

/** `values` is keyed by CSS name ('--gg-color-ink'). Missing or unparsable colors fail with ratio 0. */
export function checkContrast(values: Record<string, string>): ContrastResult[] {
  return CONTRAST_PAIRS.map((pair) => {
    const fg = values[`--gg-color-${pair.fg}`];
    const bg = values[`--gg-color-${pair.bg}`];
    const ratio = fg && bg ? contrastRatio(fg, bg) : 0;
    return { ...pair, ratio, pass: ratio >= pair.min };
  });
}
