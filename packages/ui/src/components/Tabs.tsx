import type { ReactNode } from 'react';
import { Tabs as RadixTabs } from 'radix-ui';
import { cx } from '../cx.ts';

export interface TabItem { id: string; label: string; content: ReactNode }

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?(value: string): void;
  className?: string;
}

export function Tabs({ items, value, defaultValue, onValueChange, className }: TabsProps) {
  return (
    <RadixTabs.Root
      data-gg="tabs"
      value={value}
      defaultValue={defaultValue ?? items[0]?.id}
      onValueChange={onValueChange}
      className={cx('flex flex-col gap-4', className)}
    >
      <RadixTabs.List className="flex gap-1 overflow-x-auto border-b border-line">
        {items.map((t) => (
          <RadixTabs.Trigger
            key={t.id}
            value={t.id}
            className="-mb-px border-b-2 border-transparent px-3 text-sm font-medium text-ink-muted min-h-(--gg-tap-min) hover:text-ink data-[state=active]:border-action data-[state=active]:text-ink"
          >
            {t.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((t) => (
        <RadixTabs.Content key={t.id} value={t.id} className="text-ink">{t.content}</RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
