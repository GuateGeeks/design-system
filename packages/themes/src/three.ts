/**
 * 3D profiles: how a theme looks in the papercraft scenes (spec §4.2 `three`). Scene background,
 * lights, ground shadow, focus marker, paper grain and palette overrides of the kit's pieces.
 */
export type ThreeProfileId = 'papercraft' | 'lowpoly';

export interface ThreeProfile {
  id: ThreeProfileId;
  background: string;
  ground: string;
  groundOpacity: number;
  sky: string;
  skyGround: string;
  skyIntensity: number;
  sun: string;
  sunIntensity: number;
  fill: string;
  fillIntensity: number;
  exposure: number;
  marker: string;
  preview: string;
  fibre: number;
  mottle: number;
  /** Overrides of the kit palettes (PAL/PAPER keys), e.g. { roof: '#3b2a48' }. */
  palette: Record<string, string>;
}

export type ThreeProfileInput = { profile?: ThreeProfileId } & Partial<Omit<ThreeProfile, 'id'>>;

const PAPERCRAFT: ThreeProfile = Object.freeze({
  id: 'papercraft',
  background: '#F4F1F6',
  ground: '#3a2470',
  groundOpacity: 0.16,
  sky: '#ffffff',
  skyGround: '#d9cfe6',
  skyIntensity: 1.55,
  sun: '#fff3e4',
  sunIntensity: 2.1,
  fill: '#e6dcff',
  fillIntensity: 0.45,
  exposure: 1,
  marker: '#ffc857',
  preview: '#25c2c6',
  fibre: 0.045,
  mottle: 0.025,
  palette: Object.freeze({}) as Record<string, string>,
});

export const THREE_PROFILES: Readonly<Record<ThreeProfileId, ThreeProfile>> = Object.freeze({
  papercraft: PAPERCRAFT,
  lowpoly: Object.freeze({ ...PAPERCRAFT, id: 'lowpoly', fibre: 0, mottle: 0, exposure: 1.05 }) as ThreeProfile,
});

export const THREE_COLOR_KEYS = ['background', 'ground', 'sky', 'skyGround', 'sun', 'fill', 'marker', 'preview'] as const;
export const THREE_NUMBER_KEYS = ['groundOpacity', 'skyIntensity', 'sunIntensity', 'fillIntensity', 'exposure', 'fibre', 'mottle'] as const;

/** Merge overrides (in order) over the profile they name, default papercraft. */
export function resolveThreeProfile(...inputs: Array<ThreeProfileInput | undefined>): ThreeProfile {
  const id = [...inputs].reverse().find((i) => i?.profile)?.profile ?? 'papercraft';
  const out: ThreeProfile = { ...THREE_PROFILES[id], palette: { ...THREE_PROFILES[id].palette } };
  for (const input of inputs) {
    if (!input) continue;
    const { profile: _profile, palette, ...rest } = input;
    Object.assign(out, rest);
    if (palette) Object.assign(out.palette, palette);
  }
  return out;
}
