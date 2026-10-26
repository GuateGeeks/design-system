import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@guategeeks/theme-runtime/react';
import { Link, SegmentedControl } from '@guategeeks/ui';
import type { GalleryEntry } from '../../gallery/types.ts';
import { frameHref } from '../../router.ts';
import { useLab } from '../../shell/LabContext.tsx';
import { ViewportFrame } from '../../shell/ViewportFrame.tsx';

export function EntryView({ entry }: { entry: GalleryEntry }) {
  const { theme, schemePreference, motionPreference, edition } = useTheme();
  const { viewport } = useLab();
  const [state, setState] = useState(entry.states[0].id);
  const current = entry.states.find((s) => s.id === state) ?? entry.states[0];
  const src = frameHref(entry.id, current.id, { theme, scheme: schemePreference, motion: motionPreference, edition: edition?.id ?? null });
  return (
    <div className="flex flex-col gap-6">
      <Link href="#/components" className="inline-flex w-fit items-center gap-1 text-sm"><ArrowLeft aria-hidden className="size-4" />Componentes</Link>
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl">{entry.name}</h2>
        <p className="max-w-prose text-ink-muted">{entry.description}</p>
      </div>
      {entry.states.length > 1 && (
        <SegmentedControl label="Estado" value={current.id} options={entry.states.map((s) => ({ value: s.id, label: s.label }))} onChange={setState} />
      )}
      <ViewportFrame key={src + viewport} viewport={viewport} src={src} title={`${entry.name} · ${current.label}`} />
      <Link href={src} target="_blank" rel="noreferrer" className="text-sm">Abrir este marco</Link>
    </div>
  );
}
