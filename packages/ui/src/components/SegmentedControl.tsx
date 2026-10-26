import { useId, type ReactNode } from 'react';
import { RadioGroup } from 'radix-ui';
import { cx } from '../cx.ts';
import { fieldLabel } from './Field.tsx';

export interface SegmentedOption<T extends string> { value: T; label: string; icon?: ReactNode }

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange(value: T): void;
  disabled?: boolean;
  className?: string;
}

/** A radio group drawn as segments: arrow keys move the selection. */
export function SegmentedControl<T extends string>({ label, options, value, onChange, disabled, className }: SegmentedControlProps<T>) {
  const labelId = useId();
  return (
    <div data-gg="segmented-control" className={cx('flex flex-col gap-1.5', className)}>
      <span id={labelId} className={fieldLabel}>{label}</span>
      <RadioGroup.Root
        aria-labelledby={labelId}
        value={value}
        onValueChange={(v) => onChange(v as T)}
        disabled={disabled}
        orientation="horizontal"
        className="inline-flex w-fit gap-1 rounded-control border border-line bg-surface-2 p-1"
      >
        {options.map((o) => (
          <RadioGroup.Item
            key={o.value}
            value={o.value}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-control px-3 text-sm font-medium text-ink-muted min-h-(--gg-tap-min)',
              'transition-colors duration-(--gg-duration-fast) ease-responsive hover:text-ink disabled:opacity-50',
              'data-[state=checked]:bg-surface data-[state=checked]:text-ink data-[state=checked]:shadow-subtle [&_svg]:size-4',
            )}
          >
            {o.icon}
            {o.label}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
}
