import { useId } from 'react';
import { Switch as RadixSwitch } from 'radix-ui';
import { cx } from '../cx.ts';

export interface SwitchProps {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?(checked: boolean): void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ label, className, ...rest }: SwitchProps) {
  const id = useId();
  return (
    <div data-gg="switch" className={cx('flex items-center justify-between gap-4 min-h-(--gg-tap-min)', className)}>
      <label htmlFor={id} className="text-sm text-ink">{label}</label>
      <RadixSwitch.Root
        id={id}
        className="relative h-7 w-12 shrink-0 rounded-pill bg-line transition-colors duration-(--gg-duration-fast) data-[state=checked]:bg-action disabled:opacity-50"
        {...rest}
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-1 rounded-pill bg-surface shadow-subtle transition-transform duration-(--gg-duration-fast) ease-responsive data-[state=checked]:translate-x-6" />
      </RadixSwitch.Root>
    </div>
  );
}
