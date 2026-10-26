import { useId } from 'react';
import { Select as RadixSelect } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { cx } from '../cx.ts';
import { fieldControl, fieldLabel } from './Field.tsx';

export interface SelectProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value?: T;
  defaultValue?: T;
  onValueChange?(value: T): void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select<T extends string>({ label, options, onValueChange, placeholder, className, ...rest }: SelectProps<T>) {
  const id = useId();
  return (
    <div data-gg="select" className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={fieldLabel}>{label}</label>
      <RadixSelect.Root onValueChange={(v) => onValueChange?.(v as T)} {...rest}>
        <RadixSelect.Trigger id={id} className={cx(fieldControl, 'inline-flex items-center justify-between gap-2 text-left')}>
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon><ChevronDown aria-hidden className="size-4 text-ink-muted" /></RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content position="popper" sideOffset={6} className="z-(--gg-z-overlay) min-w-(--radix-select-trigger-width) rounded-control border border-line bg-surface p-1 text-ink shadow-float">
            <RadixSelect.Viewport>
              {options.map((o) => (
                <RadixSelect.Item key={o.value} value={o.value} className="flex items-center justify-between gap-2 rounded-control px-3 py-2 text-sm outline-none min-h-(--gg-tap-min) data-highlighted:bg-surface-2">
                  <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator><Check aria-hidden className="size-4 text-link" /></RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
