import type { ReactNode } from 'react';
import { Tooltip as RadixTooltip } from 'radix-ui';

export interface TooltipProps {
  content: ReactNode;
  /** A single focusable element. */
  children: ReactNode;
  /** Controlled visibility (e.g. pinned open in the lab gallery). */
  open?: boolean;
}

export function Tooltip({ content, children, open }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root open={open}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            data-gg="tooltip"
            sideOffset={6}
            className="z-(--gg-z-overlay) max-w-xs rounded-control bg-ink px-3 py-1.5 text-xs text-bg shadow-float"
          >
            {content}
            <RadixTooltip.Arrow className="fill-ink" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
