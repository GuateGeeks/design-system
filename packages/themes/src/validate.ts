import { THREE_COLOR_KEYS, THREE_NUMBER_KEYS, THREE_PROFILES } from './three.ts';
import type { ThemeManifest } from './types.ts';

export * from './contrast.ts';

const ID = /^[a-z][a-z0-9-]*$/;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const SCHEMES = new Set(['light', 'dark']);
const INTENSITIES = new Set(['calm', 'standard', 'playful']);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Structural checks for a theme manifest. Returns human-readable errors; empty means valid. */
export function validateManifest(input: unknown): string[] {
  if (!isObject(input)) return ['manifest must be an object'];
  const m = input as Partial<ThemeManifest> & Record<string, unknown>;
  const errors: string[] = [];
  if (typeof m.id !== 'string' || !ID.test(m.id)) errors.push('id must match /^[a-z][a-z0-9-]*$/');
  if (typeof m.name !== 'string' || !m.name.trim()) errors.push('name is required');
  if (m.extends !== undefined && (typeof m.extends !== 'string' || !ID.test(m.extends))) errors.push('extends must be a theme id');
  if (!Array.isArray(m.schemes) || m.schemes.length === 0 || !m.schemes.every((s) => SCHEMES.has(s)) || new Set(m.schemes).size !== m.schemes.length) {
    errors.push('schemes must be a non-empty list of unique "light" | "dark"');
  }
  if (m.tokens !== undefined) {
    if (!isObject(m.tokens) || Object.keys(m.tokens).some((k) => !['shared', 'light', 'dark'].includes(k))) {
      errors.push('tokens may only contain shared, light and dark trees');
    } else if (Object.values(m.tokens).some((tree) => !isObject(tree))) {
      errors.push('each tokens entry must be a token tree');
    }
  }
  if (m.motion !== undefined && (!isObject(m.motion) || !INTENSITIES.has(String(m.motion.intensity)))) {
    errors.push('motion.intensity must be calm | standard | playful');
  }
  const display = isObject(m.fonts) ? m.fonts.display : undefined;
  if (m.fonts !== undefined && display !== undefined && (!isObject(display) || typeof display.family !== 'string' || typeof display.import !== 'string')) {
    errors.push('fonts.display needs family and import');
  }
  if (m.three !== undefined) errors.push(...validateThree(m.three));
  return errors;
}

function validateThree(three: unknown): string[] {
  if (!isObject(three)) return ['three must be an object'];
  const errors: string[] = [];
  if (three.profile !== undefined && !(String(three.profile) in THREE_PROFILES)) errors.push('three.profile must be papercraft | lowpoly');
  for (const key of THREE_COLOR_KEYS) if (three[key] !== undefined && !HEX.test(String(three[key]))) errors.push(`three.${key} must be a hex color`);
  for (const key of THREE_NUMBER_KEYS) if (three[key] !== undefined && !(typeof three[key] === 'number' && Number.isFinite(three[key]) && (three[key] as number) >= 0)) errors.push(`three.${key} must be a non-negative number`);
  if (three.palette !== undefined) {
    if (!isObject(three.palette)) errors.push('three.palette must be an object');
    else for (const [key, value] of Object.entries(three.palette)) if (!HEX.test(String(value))) errors.push(`three.palette.${key} must be a hex color`);
  }
  return errors;
}

export type { ThemeManifest };
