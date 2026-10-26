import { useEffect, useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cx } from '../cx.ts';
import { fieldLabel } from './Field.tsx';
import { IconButton } from './IconButton.tsx';

export interface NumberStepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange(value: number): void;
  disabled?: boolean;
  className?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** −/+ buttons around a numeric text input; typed values are clamped when the input loses focus. */
export function NumberStepper({ label, value, min = -Infinity, max = Infinity, step = 1, onChange, disabled, className }: NumberStepperProps) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const parsed = Number.parseFloat(draft);
    const next = Number.isNaN(parsed) ? value : clamp(parsed, min, max);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };
  return (
    <div data-gg="number-stepper" className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={fieldLabel}>{label}</label>
      <div role="group" aria-label={label} className="inline-flex w-fit items-center gap-1 rounded-control border border-line bg-surface p-1">
        <IconButton label={`Disminuir ${label}`} icon={<Minus />} disabled={disabled || value <= min} onClick={() => onChange(clamp(value - step, min, max))} />
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
          className="w-14 bg-transparent text-center text-md font-medium tabular-nums text-ink"
        />
        <IconButton label={`Aumentar ${label}`} icon={<Plus />} disabled={disabled || value >= max} onClick={() => onChange(clamp(value + step, min, max))} />
      </div>
    </div>
  );
}
