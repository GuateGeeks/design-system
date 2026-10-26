import { useRef } from 'react';
import { Play } from 'lucide-react';
import { duration, easing, play, presets, type PresetName } from '@guategeeks/motion';
import { useTheme } from '@guategeeks/theme-runtime/react';
import { Badge, Button } from '@guategeeks/ui';
import { Section } from '../Section.tsx';

function PresetDemo({ name }: { name: PresetName }) {
  const target = useRef<HTMLSpanElement>(null);
  return (
    <li className="flex items-center gap-3 rounded-control border border-line bg-surface p-2">
      <span ref={target} aria-hidden className="size-8 shrink-0 rounded-control bg-action" />
      <code className="flex-1 text-sm text-ink">{name}</code>
      <Button variant="ghost" aria-label={`Reproducir ${name}`} iconStart={<Play aria-hidden className="size-4" />} onClick={() => play(target.current, name)} />
    </li>
  );
}

export function MotionTokens() {
  const { motion } = useTheme();
  return (
    <Section title="Movimiento" description="Duraciones y curvas por token; los presets degradan con movimiento reducido.">
      {motion === 'reduced' && <Badge tone="hint">Movimiento reducido activo</Badge>}
      <div className="grid gap-6 lg:grid-cols-2">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {Object.entries(duration).map(([k, v]) => (
            <div key={k} className="contents">
              <dt><code>{`--gg-duration-${k}`}</code></dt>
              <dd className="text-ink-muted">{`${v} ms`}</dd>
            </div>
          ))}
          {Object.entries(easing).map(([k, v]) => (
            <div key={k} className="contents">
              <dt><code>{`--gg-easing-${k}`}</code></dt>
              <dd className="truncate text-ink-muted">{v}</dd>
            </div>
          ))}
        </dl>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(presets) as PresetName[]).map((name) => <PresetDemo key={name} name={name} />)}
        </ul>
      </div>
    </Section>
  );
}
