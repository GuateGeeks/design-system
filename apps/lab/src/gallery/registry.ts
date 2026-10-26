import type { ReactNode } from 'react';

export interface GalleryState { id: string; label: string; render: () => ReactNode }
export interface GalleryEntry { id: string; name: string; description: string; states: GalleryState[] }

/** Every component shown in the lab. Entries are added in src/gallery/entries/. */
export const registry: GalleryEntry[] = [];

export function findEntry(id: string): GalleryEntry | undefined {
  return registry.find((e) => e.id === id);
}

export function findState(entry: string, state: string): GalleryState | undefined {
  return findEntry(entry)?.states.find((s) => s.id === state);
}
