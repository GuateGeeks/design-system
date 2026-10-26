import { registerVariant, VariantSlot } from '../variants.tsx';

export interface ProgressProps {
  value: number;
  max: number;
  label: string;
  /** Values (0..max) drawn as ticks. */
  milestones?: number[];
}

function ProgressBar({ value, max, label, milestones = [] }: ProgressProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      data-gg="progress"
      data-variant="bar"
      className="relative h-2.5 w-full overflow-hidden rounded-pill bg-surface-2"
    >
      <div className="h-full rounded-pill bg-action transition-[width] duration-(--gg-duration-slow) ease-standard" style={{ width: `${pct}%` }} />
      {milestones.map((m) => (
        <span key={m} aria-hidden className="absolute top-0 h-full w-0.5 bg-surface" style={{ left: `${max > 0 ? (m / max) * 100 : 0}%` }} />
      ))}
    </div>
  );
}

registerVariant('progress', 'bar', ProgressBar);

/** Progress is an extension point: editions can swap the bar for xp-levels, constellation, … */
export function Progress(props: ProgressProps) {
  return <VariantSlot point="progress" fallback="bar" props={props} />;
}
