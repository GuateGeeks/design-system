import { readdirSync, readFileSync } from 'node:fs';
import { loadSource, resolveTokens, toMs, type ResolvedToken } from '@guategeeks/tokens/build';
import { checkContrast } from '../contrast.ts';
import { resolveThreeProfile } from '../three.ts';
import type { DesignTokenTree, Edition, MotionIntensity, ResolvedTheme, SchemeName, ThemeManifest } from '../types.ts';
import { validateManifest } from '../validate.ts';
import { formatThemeCss } from './format.ts';

const packageRoot = new URL('../../', import.meta.url); // same from src/build and dist/build

const readJson = <T>(url: URL): T => JSON.parse(readFileSync(url, 'utf8')) as T;

export function loadManifests(): ThemeManifest[] {
  const dir = new URL('themes/', packageRoot);
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => readJson<ThemeManifest>(new URL(`${d.name}/theme.json`, dir)))
    .sort((a, b) => (a.id === 'guategeeks' ? -1 : b.id === 'guategeeks' ? 1 : a.id.localeCompare(b.id)));
}

export function loadEditions(): Edition[] {
  const dir = new URL('editions/', packageRoot);
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => readJson<Edition>(new URL(f, dir)));
}

export function checkEditions(editions: Edition[], manifests: ThemeManifest[]): string[] {
  const ids = new Set(manifests.map((m) => m.id));
  return editions.filter((e) => !ids.has(e.theme)).map((e) => `edition ${e.id}: unknown theme "${e.theme}"`);
}

const INTENSITY_SCALE: Record<MotionIntensity, number> = { calm: 1.25, standard: 1, playful: 0.85 };

export interface ThemeBuild {
  resolved: ResolvedTheme;
  css: string;
  errors: string[];
  /** Resolved tokens per supported scheme (used for native output). */
  tokens: Partial<Record<SchemeName, ResolvedToken[]>>;
  fontImport?: string;
}

/** Root-first ancestry, e.g. [guategeeks, halloween]. Throws on unknown parents and cycles. */
function chain(manifest: ThemeManifest, all: ThemeManifest[]): ThemeManifest[] {
  const out: ThemeManifest[] = [];
  const seen = new Set<string>();
  let current: ThemeManifest | undefined = manifest;
  while (current) {
    if (seen.has(current.id)) throw new Error(`extends cycle at "${current.id}"`);
    seen.add(current.id);
    out.unshift(current);
    if (!current.extends) break;
    const parentId: string = current.extends;
    current = all.find((m) => m.id === parentId);
    if (!current) throw new Error(`unknown parent theme "${parentId}"`);
  }
  return out;
}

function scaleDurations(tokens: ResolvedToken[], intensity: MotionIntensity): ResolvedToken[] {
  const k = INTENSITY_SCALE[intensity];
  if (k === 1) return tokens;
  return tokens.map((t) => (t.path[0] === 'duration' ? { ...t, value: `${Math.round(toMs(t.value) * k) / 1000}s` } : t));
}

/** The brand UI font stack, appended after a theme's display family as fallback. */
function brandStack(): string[] {
  const family = loadSource().primitives.family as { inter: { $value: string[] } };
  return family.inter.$value;
}

const asValues = (tokens: ResolvedToken[]) => Object.fromEntries(tokens.map((t) => [`--${t.name}`, String(t.value)]));

export async function buildTheme(manifest: ThemeManifest, all: ThemeManifest[]): Promise<ThemeBuild> {
  const errors = validateManifest(manifest).map((e) => `${manifest.id}: ${e}`);
  let lineage: ThemeManifest[];
  try {
    lineage = chain(manifest, all);
  } catch (error) {
    errors.push(`${manifest.id}: ${(error as Error).message}`);
    lineage = [manifest];
  }

  const intensity = [...lineage].reverse().find((m) => m.motion)?.motion?.intensity ?? 'standard';
  const display = [...lineage].reverse().find((m) => m.fonts?.display)?.fonts?.display;
  const fontTree: DesignTokenTree[] = display
    ? [{ font: { display: { $value: [display.family, ...brandStack()] } } }]
    : [];

  const tokens: ThemeBuild['tokens'] = {};
  const values: ResolvedTheme['values'] = {};
  for (const scheme of manifest.schemes ?? []) {
    const overrides = lineage.flatMap((m) => [m.tokens?.shared, m.tokens?.[scheme]].filter((t): t is DesignTokenTree => !!t));
    const resolved = scaleDurations(await resolveTokens(scheme, [...overrides, ...fontTree]), intensity);
    tokens[scheme] = resolved;
    values[scheme] = asValues(resolved);
    for (const r of checkContrast(values[scheme]!)) {
      if (!r.pass) errors.push(`${manifest.id} (${scheme}): ${r.fg}/${r.bg} contrast ${r.ratio.toFixed(2)} < ${r.min}`);
    }
  }

  const schemes = manifest.schemes ?? [];
  const resolved: ResolvedTheme = {
    id: manifest.id,
    name: manifest.name,
    schemes,
    defaultScheme: schemes[0] ?? 'light',
    intensity,
    ...(display ? { displayFont: { family: display.family } } : {}),
    three: resolveThreeProfile(...lineage.map((m) => m.three)),
    values,
  };
  const build = { resolved, errors, tokens, fontImport: display?.import };
  return { ...build, css: formatThemeCss(build) };
}
