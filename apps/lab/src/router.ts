import { useSyncExternalStore } from 'react';
import type { MotionPreference, SchemePreference } from '@guategeeks/theme-runtime';

export type Section = 'foundations' | 'components' | 'studio' | 'experiences' | 'geeky' | 'kit3d';

export interface FrameParams {
  theme: string;
  scheme: SchemePreference;
  motion: MotionPreference;
  edition: string | null;
}

export type Route =
  | { section: Section; id?: string }
  | { frame: { entry: string; state: string } & FrameParams }
  | { frames: true }
  | { notFound: string };

const SECTIONS: Section[] = ['foundations', 'components', 'studio', 'experiences', 'geeky', 'kit3d'];
const SCHEMES: SchemePreference[] = ['auto', 'light', 'dark'];
const MOTIONS: MotionPreference[] = ['auto', 'full', 'reduced'];

const pick = <T extends string>(value: string | null, allowed: T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/** Hash routes: #/foundations, #/components/<entry>, #/studio, #/frame/<entry>/<state>?theme=&scheme=&motion=&edition=, #/frames. */
export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return { section: 'foundations' };
  const [head, ...rest] = parts;
  if (head === 'frames' && rest.length === 0) return { frames: true };
  if (head === 'frame' && rest.length === 2) {
    const q = new URLSearchParams(query);
    return {
      frame: {
        entry: rest[0],
        state: rest[1],
        theme: q.get('theme') || 'guategeeks',
        scheme: pick(q.get('scheme'), SCHEMES, 'auto'),
        motion: pick(q.get('motion'), MOTIONS, 'auto'),
        edition: q.get('edition') || null,
      },
    };
  }
  if (SECTIONS.includes(head as Section) && rest.length <= 1) {
    return rest[0] ? { section: head as Section, id: rest[0] } : { section: head as Section };
  }
  return { notFound: path };
}

export function frameHref(entry: string, state: string, params: FrameParams): string {
  const q = new URLSearchParams({ theme: params.theme, scheme: params.scheme, motion: params.motion });
  if (params.edition) q.set('edition', params.edition);
  return `#/frame/${encodeURIComponent(entry)}/${encodeURIComponent(state)}?${q}`;
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  return parseRoute(hash);
}
