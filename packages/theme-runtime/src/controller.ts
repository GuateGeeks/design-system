import type { Edition, ResolvedTheme, SchemeName } from '@guategeeks/themes';
import { applyToRoot, media } from './dom.ts';
import { resolveEdition } from './edition.ts';
import { readStored, writeStored, type StoredAppearance } from './storage.ts';

export type SchemePreference = 'auto' | 'light' | 'dark';
export type MotionPreference = 'auto' | 'full' | 'reduced';

export interface ThemeState {
  theme: string;
  scheme: SchemeName;
  /** True when the theme supports a single scheme, so the scheme preference cannot apply. */
  schemeLocked: boolean;
  schemePreference: SchemePreference;
  motion: 'full' | 'reduced';
  motionPreference: MotionPreference;
  edition: Edition | null;
  variants: Record<string, string>;
}

export interface ThemeControllerOptions {
  themes: ResolvedTheme[];
  editions?: Edition[];
  defaultTheme?: string;
  defaultEdition?: string | null;
  root?: HTMLElement;
  now?: () => Date;
  search?: string;
  /** localStorage key; null disables persistence. Default 'gg-appearance'. */
  storageKey?: string | null;
}

export interface ThemeController {
  getState(): ThemeState;
  subscribe(listener: (state: ThemeState) => void): () => void;
  setTheme(id: string): void;
  setScheme(preference: SchemePreference): void;
  setMotion(preference: MotionPreference): void;
  setEdition(id: string | null): void;
  destroy(): void;
}

const DARK = '(prefers-color-scheme: dark)';
const REDUCE = '(prefers-reduced-motion: reduce)';
const SCHEMES: SchemePreference[] = ['auto', 'light', 'dark'];
const MOTIONS: MotionPreference[] = ['auto', 'full', 'reduced'];

export function createThemeController(opts: ThemeControllerOptions): ThemeController {
  const { themes, editions = [] } = opts;
  const storageKey = opts.storageKey === undefined ? 'gg-appearance' : opts.storageKey;
  const root = opts.root ?? (typeof document !== 'undefined' ? document.documentElement : undefined);
  const known = (id: string | undefined) => (id ? themes.find((t) => t.id === id) : undefined);
  const fallbackTheme = known(opts.defaultTheme) ?? known('guategeeks') ?? themes[0];
  if (!fallbackTheme) throw new Error('createThemeController needs at least one theme');

  const stored = readStored(storageKey);
  const choice: StoredAppearance = {
    theme: known(stored.theme)?.id,
    edition: stored.edition === 'none' || editions.some((e) => e.id === stored.edition) ? stored.edition : undefined,
    scheme: SCHEMES.includes(stored.scheme as SchemePreference) ? stored.scheme : 'auto',
    motion: MOTIONS.includes(stored.motion as MotionPreference) ? stored.motion : 'auto',
  };

  const darkQuery = media(DARK);
  const reduceQuery = media(REDUCE);
  const listeners = new Set<(s: ThemeState) => void>();

  const compute = (): ThemeState => {
    const edition = resolveEdition(editions, {
      explicit: choice.edition,
      search: opts.search ?? (typeof location !== 'undefined' ? location.search : ''),
      now: opts.now?.() ?? new Date(),
      productDefault: opts.defaultEdition,
    });
    const editionTheme = edition ? known(edition.theme) : undefined;
    const theme = editionTheme ?? known(choice.theme) ?? fallbackTheme;
    const schemePreference = choice.scheme ?? 'auto';
    const wanted: SchemeName = schemePreference === 'auto' ? (darkQuery?.matches ? 'dark' : 'light') : schemePreference;
    const schemeLocked = theme.schemes.length === 1;
    const scheme = theme.schemes.includes(wanted) ? wanted : theme.defaultScheme;
    const motionPreference = choice.motion ?? 'auto';
    const motion = motionPreference === 'auto' ? (reduceQuery?.matches ? 'reduced' : 'full') : motionPreference;
    return {
      theme: theme.id, scheme, schemeLocked, schemePreference, motion, motionPreference,
      edition: editionTheme ? edition : null,
      variants: editionTheme && edition ? { ...edition.variants } : {},
    };
  };

  let state = compute();
  if (root) applyToRoot(root, state);

  const update = (persist: boolean) => {
    if (persist) writeStored(storageKey, choice);
    const next = compute();
    const changed = JSON.stringify(next) !== JSON.stringify(state);
    state = next;
    if (root) applyToRoot(root, state);
    if (changed) for (const l of [...listeners]) l(state);
  };
  const onMediaChange = () => update(false);
  darkQuery?.addEventListener('change', onMediaChange);
  reduceQuery?.addEventListener('change', onMediaChange);

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setTheme(id) {
      if (!known(id)) return;
      choice.theme = id;
      choice.edition = 'none'; // choosing a theme opts out of the active edition
      update(true);
    },
    setScheme(preference) {
      if (!SCHEMES.includes(preference)) return;
      choice.scheme = preference;
      update(true);
    },
    setMotion(preference) {
      if (!MOTIONS.includes(preference)) return;
      choice.motion = preference;
      update(true);
    },
    setEdition(id) {
      if (id !== null && !editions.some((e) => e.id === id)) return;
      choice.edition = id ?? 'none';
      update(true);
    },
    destroy() {
      darkQuery?.removeEventListener('change', onMediaChange);
      reduceQuery?.removeEventListener('change', onMediaChange);
      listeners.clear();
    },
  };
}
