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
  three?: Record<string, unknown>;
  mascot?: { costume: string };
  assets?: Record<string, string>;
}

export interface ResolvedTheme {
  id: string;
  name: string;
  schemes: SchemeName[];
  defaultScheme: SchemeName;
  intensity: MotionIntensity;
  displayFont?: { family: string };
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
