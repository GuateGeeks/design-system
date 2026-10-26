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
  /**
   * Default true: apply to the root and follow OS changes immediately. With false, construction has no
   * side effects and the first subscribe() attaches — for controllers created during a React render,
   * which StrictMode or a discarded render may throw away.
   */
  attach?: boolean;
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
    edition: editions.some((e) => e.id === stored.edition) ? stored.edition : undefined,
    optedOut: Array.isArray(stored.optedOut) ? stored.optedOut.filter((id) => typeof id === 'string') : [],
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
      optedOut: choice.optedOut,
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
  let attached = false;

  const update = (persist: boolean) => {
    if (persist) writeStored(storageKey, choice);
    const next = compute();
    const changed = JSON.stringify(next) !== JSON.stringify(state);
    state = next;
    if (root && attached) applyToRoot(root, state);
    if (changed) for (const l of [...listeners]) l(state);
  };
  const optOutOfActive = () => {
    const active = state.edition?.id;
    choice.edition = undefined;
    if (active && !choice.optedOut?.includes(active)) choice.optedOut = [...(choice.optedOut ?? []), active];
  };

  const onMediaChange = () => update(false);
  const attach = () => {
    if (attached) return;
    darkQuery?.addEventListener('change', onMediaChange);
    reduceQuery?.addEventListener('change', onMediaChange);
    attached = true;
    update(false);
  };
  if (opts.attach !== false) attach();

  return {
    getState: () => state,
    subscribe(listener) {
      attach(); // first subscribe of a detached controller, or re-attach after destroy() (StrictMode remount)
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setTheme(id) {
      if (!known(id)) return;
      choice.theme = id;
      optOutOfActive(); // choosing a theme opts out of the edition shown now, not of future ones
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
      if (id === null) {
        optOutOfActive();
      } else {
        if (!editions.some((e) => e.id === id)) return;
        choice.edition = id;
        choice.optedOut = (choice.optedOut ?? []).filter((x) => x !== id);
      }
      update(true);
    },
    destroy() {
      darkQuery?.removeEventListener('change', onMediaChange);
      reduceQuery?.removeEventListener('change', onMediaChange);
      attached = false;
      listeners.clear();
    },
  };
}
