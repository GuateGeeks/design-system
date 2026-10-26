import { SegmentedControl, Select } from '@guategeeks/ui';
import { useTheme } from '@guategeeks/theme-runtime/react';
import type { MotionPreference, SchemePreference } from '@guategeeks/theme-runtime';
import { copy } from '../copy.ts';
import { useLab, type Viewport } from './LabContext.tsx';

const t = copy.toolbar;
const NONE = 'none';

export function Toolbar() {
  const theme = useTheme();
  const { viewport, setViewport } = useLab();
  const current = theme.themes.find((x) => x.id === theme.theme);
  return (
    <section aria-label={t.label} className="flex flex-wrap items-start gap-x-6 gap-y-4">
      <Select
        label={t.theme}
        value={theme.theme}
        options={theme.themes.map((x) => ({ value: x.id, label: x.name }))}
        onValueChange={theme.setTheme}
        className="w-44"
      />
      <SegmentedControl<SchemePreference>
        label={t.scheme}
        value={theme.schemeLocked ? theme.scheme : theme.schemePreference}
        options={(['auto', 'light', 'dark'] as const).map((v) => ({ value: v, label: t.schemeOptions[v] }))}
        onChange={theme.setScheme}
        disabled={theme.schemeLocked}
      />
      <SegmentedControl<MotionPreference>
        label={t.motion}
        value={theme.motionPreference}
        options={(['auto', 'full', 'reduced'] as const).map((v) => ({ value: v, label: t.motionOptions[v] }))}
        onChange={theme.setMotion}
      />
      <Select
        label={t.edition}
        value={theme.edition?.id ?? NONE}
        options={[{ value: NONE, label: t.noEdition }, ...theme.editions.map((e) => ({ value: e.id, label: e.name }))]}
        onValueChange={(v) => theme.setEdition(v === NONE ? null : v)}
        className="w-48"
      />
      <SegmentedControl<Viewport>
        label={t.viewport}
        value={viewport}
        options={(['phone', 'tablet', 'desktop'] as const).map((v) => ({ value: v, label: t.viewportOptions[v] }))}
        onChange={setViewport}
      />
      {theme.schemeLocked && current && <p className="text-xs text-ink-muted">{t.schemeLocked(current.name)}</p>}
    </section>
  );
}
