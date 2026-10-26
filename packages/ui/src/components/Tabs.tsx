import { useEffect, useRef, useState, type ReactNode } from 'react';
import { play } from '@guategeeks/motion';
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
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id);
  const active = value ?? internal;
  const panels = useRef(new Map<string, HTMLDivElement>());
  const first = useRef(true);
  // The newly shown panel rises in (a fade under reduced motion); never on first render.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    play(panels.current.get(active), 'enter.screen');
  }, [active]);
  return (
    <RadixTabs.Root
      data-gg="tabs"
      value={active}
      onValueChange={(next) => { setInternal(next); onValueChange?.(next); }}
      className={cx('flex flex-col gap-4', className)}
    >
      <RadixTabs.List className="flex gap-1 overflow-x-auto border-b border-line">
        {items.map((t) => (
          <RadixTabs.Trigger
            key={t.id}
            value={t.id}
            className="-mb-px shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 text-sm font-medium text-ink-muted min-h-(--gg-tap-min) hover:text-ink data-[state=active]:border-action data-[state=active]:text-ink"
          >
            {t.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((t) => (
        <RadixTabs.Content key={t.id} value={t.id} ref={(el) => { if (el) panels.current.set(t.id, el); else panels.current.delete(t.id); }} className="text-ink">{t.content}</RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
