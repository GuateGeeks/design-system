import { button, iconButton, link } from './entries/actions.tsx';
import { dialog, toast, tooltip } from './entries/overlays.tsx';
import { numberStepper, segmentedControl, select, switchEntry, tabs, textField } from './entries/forms.tsx';
import { appShell, background, progress } from './entries/layout.tsx';
import { badge, card, emptyState, glassPanel } from './entries/surfaces.tsx';
import { geeky } from './entries/mascot.tsx';
import type { GalleryEntry, GalleryState, GroupId } from './types.ts';

export type { GalleryEntry, GalleryState, GroupId };

/** Sections of the Components page, in order. */
export const GROUPS: ReadonlyArray<{ id: GroupId; label: string }> = [
  { id: 'actions', label: 'Acciones' },
  { id: 'surfaces', label: 'Superficies' },
  { id: 'forms', label: 'Formularios' },
  { id: 'overlays', label: 'Superposiciones' },
  { id: 'structure', label: 'Estructura' },
];

/** Every component shown in the lab, in the order the gallery lists them. */
export const registry: GalleryEntry[] = [
  button, iconButton, link, card, badge, glassPanel, emptyState, geeky,
  tabs, segmentedControl, switchEntry, textField, numberStepper, select,
  dialog, tooltip, toast, appShell, progress, background,
];

export function findEntry(id: string): GalleryEntry | undefined {
  return registry.find((e) => e.id === id);
}

export function findState(entry: string, state: string): GalleryState | undefined {
  return findEntry(entry)?.states.find((s) => s.id === state);
}
