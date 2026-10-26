import type { CSSProperties } from 'react';
import type { SchemeName } from '@guategeeks/themes';
import { findState } from '../../gallery/registry.ts';

const SAMPLES: Array<[string, string]> = [
  ['button', 'default'], ['badge', 'default'], ['card', 'interactive'], ['text-field', 'error'],
  ['segmented-control', 'default'], ['progress', 'default'], ['empty-state', 'start'],
];

/** Gallery samples under the base theme with the overrides applied inline. */
export function StudioPreview({ theme, scheme, overrides }: { theme: string; scheme: SchemeName; overrides: Record<string, string> }) {
  return (
    <div
      data-testid="studio-preview"
      data-theme={theme}
      data-scheme={scheme}
      style={overrides as CSSProperties}
      className="flex flex-col gap-6 rounded-panel border border-line bg-bg p-6 text-ink"
    >
      {SAMPLES.map(([entry, state]) => <div key={`${entry}/${state}`}>{findState(entry, state)?.render()}</div>)}
    </div>
  );
}
