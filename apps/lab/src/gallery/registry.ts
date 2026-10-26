import { button, iconButton, link } from './entries/actions.tsx';
import { dialog, toast, tooltip } from './entries/overlays.tsx';
import { numberStepper, segmentedControl, select, switchEntry, tabs, textField } from './entries/forms.tsx';
import { appShell, progress } from './entries/layout.tsx';
import { badge, card, emptyState, glassPanel } from './entries/surfaces.tsx';
import type { GalleryEntry, GalleryState } from './types.ts';

export type { GalleryEntry, GalleryState };

/** Every component shown in the lab, in the order the gallery lists them. */
export const registry: GalleryEntry[] = [
  button, iconButton, link, card, badge, glassPanel, emptyState,
  tabs, segmentedControl, switchEntry, textField, numberStepper, select,
  dialog, tooltip, toast, appShell, progress,
];

export function findEntry(id: string): GalleryEntry | undefined {
  return registry.find((e) => e.id === id);
}

export function findState(entry: string, state: string): GalleryState | undefined {
  return findEntry(entry)?.states.find((s) => s.id === state);
}
