import type { ReactNode } from 'react';
import { Tooltip as RadixTooltip } from 'radix-ui';

export interface TooltipProps {
  content: ReactNode;
  /** A single focusable element. */
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root>
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
