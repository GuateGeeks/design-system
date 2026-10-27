import type { ThreeProfile, ThreeProfileInput } from './three.ts';

export type { ThreeProfile, ThreeProfileId, ThreeProfileInput } from './three.ts';
export type SchemeName = 'light' | 'dark';
export type MotionIntensity = 'calm' | 'standard' | 'playful';
export type DesignTokenTree = Record<string, unknown>;

/** A theme changes how things look, sound and feel — never logic. See spec §4.2. */
export interface ThemeManifest {
  id: string;
  name: string;
  extends?: string;
  schemes: SchemeName[];
  tokens?: { shared?: DesignTokenTree; light?: DesignTokenTree; dark?: DesignTokenTree };
  fonts?: { display?: { family: string; import: string } };
  motion?: { intensity: MotionIntensity };
  audio?: Record<string, string>;
  three?: ThreeProfileInput;
  mascot?: { costume?: string; palette?: Partial<Record<SchemeName, MascotPalette>> };
  assets?: Record<string, string>;
}

/** Geeky's colours (hex), structurally @guategeeks/geeky's GeekyPalette. Unset keys keep Geeky's defaults. */
export interface MascotPalette {
  /** Rims, bridge, arms, brows and lid creases; needs 3:1 contrast against the scheme's background. */
  frame?: string;
  back?: string;
  lid?: string;
  heart?: string;
  blush?: string;
}

export interface ResolvedTheme {
  id: string;
  name: string;
  schemes: SchemeName[];
  defaultScheme: SchemeName;
  intensity: MotionIntensity;
  displayFont?: { family: string };
  /** 3D scene profile, merged along `extends`. */
  three: ThreeProfile;
  /** Geeky's palette per scheme, merged along `extends` (child keys win). */
  mascot: { palette: Partial<Record<SchemeName, MascotPalette>> };
  /** Keys are CSS custom property names, e.g. '--gg-color-action'. */
  values: Partial<Record<SchemeName, Record<string, string>>>;
}

/** A named bundle: theme + requested variants + content + optional date window. See spec §4.4. */
export interface Edition {
  id: string;
  name: string;
  theme: string;
  variants: Record<string, string>;
  content?: Record<string, { banner?: string; geeky?: string[] }>;
  /** Inclusive YYYY-MM-DD dates evaluated in the IANA timezone `tz`. */
  window?: { from: string; to: string; tz: string };
}
