import { readFileSync } from 'node:fs';
import StyleDictionary from 'style-dictionary';
import type { DesignTokens } from 'style-dictionary/types';

export type DesignTokenTree = Record<string, unknown>;
export type SchemeName = 'light' | 'dark';

export interface ResolvedToken {
  /** CSS name without the leading dashes, e.g. "gg-color-action". */
  name: string;
  path: string[];
  value: string | number;
  type?: string;
  layer: 'primitive' | 'semantic';
}

export interface TokenSource {
  primitives: DesignTokenTree;
  semantic: { base: DesignTokenTree; light: DesignTokenTree; dark: DesignTokenTree };
}

const PRIMITIVE_FILES = ['color', 'dimension', 'typography', 'motion', 'effects'];

const readTree = (relative: string): DesignTokenTree =>
  JSON.parse(readFileSync(new URL(`../../src/source/${relative}.tokens.json`, import.meta.url) /* same from src/build and dist/build */, 'utf8'));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Deep-merges token trees. A token (an object with `$value`) from a later tree replaces the earlier `$value` and keeps the earlier `$type`. */
export function mergeTrees(...trees: DesignTokenTree[]): DesignTokenTree {
  const out: DesignTokenTree = {};
  for (const tree of trees) {
    for (const [key, value] of Object.entries(tree)) {
      const prev = out[key];
      if (isObject(prev) && isObject(value)) {
        out[key] = '$value' in value ? { ...prev, ...value } : mergeTrees(prev, value);
      } else {
        out[key] = isObject(value) ? mergeTrees(value) : value;
      }
    }
  }
  return out;
}

export function loadSource(): TokenSource {
  return {
    primitives: mergeTrees(...PRIMITIVE_FILES.map((f) => readTree(`primitives/${f}`))),
    semantic: {
      base: readTree('semantic/base'),
      light: readTree('semantic/light'),
      dark: readTree('semantic/dark'),
    },
  };
}

function hasPath(tree: DesignTokenTree, path: string[]): boolean {
  let node: unknown = tree;
  for (const key of path) {
    if (!isObject(node) || !(key in node)) return false;
    node = node[key];
  }
  return isObject(node) && '$value' in node;
}

export async function resolveTokens(scheme: SchemeName, extra: DesignTokenTree[] = []): Promise<ResolvedToken[]> {
  const source = loadSource();
  const tokens = mergeTrees(source.primitives, source.semantic.base, source.semantic[scheme], ...extra);
  const semanticTrees = [source.semantic.base, source.semantic.light, source.semantic.dark];
  const sd = new StyleDictionary({
    tokens: tokens as DesignTokens,
    platforms: { css: { transformGroup: 'css', prefix: 'gg' } },
    log: { verbosity: 'silent' },
  });
  const { allTokens } = await sd.getPlatformTokens('css');
  return allTokens.map((t) => ({
    name: String(t.name),
    path: t.path,
    value: t.$value as string | number,
    type: t.$type,
    layer: semanticTrees.some((tree) => hasPath(tree, t.path)) ? 'semantic' : 'primitive',
  }));
}
