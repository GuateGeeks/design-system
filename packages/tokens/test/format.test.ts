import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildCss,
  buildNativeData,
  buildTailwind,
  buildTokenData,
  COLOR_ROLES,
  resolveTokens,
  type ResolvedToken,
} from '@guategeeks/tokens/build';
import * as generated from '@guategeeks/tokens';

let light: ResolvedToken[];
let dark: ResolvedToken[];
beforeAll(async () => {
  light = await resolveTokens('light');
  dark = await resolveTokens('dark');
});

const block = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`no block for ${selector}`);
  return css.slice(start, css.indexOf('}', start) + 1);
};

describe('tokens.css', () => {
  it('has brand light on :root', () => {
    const root = block(buildCss(light, dark), ':root');
    expect(root).toContain('--gg-color-action: #ef8556;');
    expect(root).toContain('color-scheme: light;');
  });

  it('has explicit dark', () => {
    const css = buildCss(light, dark);
    expect(block(css, '[data-scheme="dark"]')).toContain('--gg-color-bg: #121722;');
  });

  it('dark blocks only carry semantic colors', () => {
    const darkBlock = block(buildCss(light, dark), '[data-scheme="dark"]');
    expect(darkBlock).not.toContain('--gg-color-coral-500');
    expect(darkBlock).not.toContain('--gg-radius');
    expect(darkBlock.match(/--gg-color-/g)).toHaveLength(COLOR_ROLES.length);
  });

  it('follows OS dark without JS', () => {
    const css = buildCss(light, dark);
    const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
    expect(media).toContain(':root:where(:not([data-scheme])) {');
    expect(media).toContain('--gg-color-bg: #121722;');
  });

  it('reduced motion', () => {
    const css = buildCss(light, dark);
    const reduced = block(css, ':root[data-motion="reduced"], [data-motion="reduced"] [data-theme]');
    for (const d of ['instant', 'fast', 'base', 'slow', 'epic']) expect(reduced).toContain(`--gg-duration-${d}: 1ms;`);
    const media = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(media).toContain(':root:not([data-motion="full"]), :root:not([data-motion="full"]) [data-theme] {');
  });
});

describe('tailwind.css', () => {
  it('maps semantic roles', () => {
    const tw = buildTailwind(light);
    expect(tw.startsWith('@theme inline {')).toBe(true);
    for (const line of [
      '--color-action: var(--gg-color-action);',
      '--radius-control: var(--gg-radius-control);',
      '--font-display: var(--gg-font-display);',
      '--ease-spring: var(--gg-easing-spring);',
      '--shadow-float: var(--gg-shadow-float);',
      '--text-display: var(--gg-size-display);',
    ]) expect(tw).toContain(line);
    expect(tw).not.toContain('--color-coral-500');
  });
});

describe('ts and native outputs', () => {
  it('ts output', () => {
    const data = buildTokenData(light, dark);
    expect(data.motion.duration.base).toBe(240);
    expect(data.motion.easing.enter).toBe('cubic-bezier(0, 0, 0, 1)');
    expect(data.light['--gg-color-action']).toBe('#ef8556');
  });

  it('generated module matches the build data', () => {
    expect(generated.motion).toEqual(buildTokenData(light, dark).motion);
    expect(generated.tokenNames).toContain('--gg-color-action');
  });

  it('native output', () => {
    const native = buildNativeData(light, dark);
    expect(native.light.colorAction).toBe('#ef8556');
    expect(native.light.radiusControl).toBe(12);
    expect(native.light.sizeMd).toBe(16);
    expect(native.dark.colorBg).toBe('#121722');
  });
});
