/**
 * Theme palettes for the papercraft kit. Pieces read `PAL.x` / `PAPER.x` while they build, so a theme
 * profile overrides colours by swapping the values of the registered palette objects for the duration
 * of a synchronous build (`withPalette`). Plain keys apply to every registered palette that has them.
 */
type Palette = Record<string, unknown>;

const registered: Palette[] = [];

export function registerPalette(palette: Palette): void {
  if (!registered.includes(palette)) registered.push(palette);
}

export function withPalette<T>(overrides: Readonly<Record<string, string>> | undefined, build: () => T): T {
  const saved: Array<[Palette, string, unknown]> = [];
  for (const [key, value] of Object.entries(overrides ?? {})) {
    for (const palette of registered) {
      if (typeof palette[key] !== 'string') continue;
      saved.push([palette, key, palette[key]]);
      palette[key] = value;
    }
  }
  try {
    return build();
  } finally {
    for (let i = saved.length - 1; i >= 0; i--) {
      const [palette, key, value] = saved[i];
      palette[key] = value;
    }
  }
}

/** Stable identity of a set of overrides; '' for none. */
export function paletteSignature(overrides: Readonly<Record<string, string>> | undefined): string {
  return Object.keys(overrides ?? {}).sort().map((k) => `${k}=${overrides[k]}`).join(';');
}
