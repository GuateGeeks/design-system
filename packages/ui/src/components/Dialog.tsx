import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { X } from 'lucide-react';
import { play } from '@guategeeks/motion';
import { cx } from '../cx.ts';
import { useMediaQuery } from '../hooks/useMediaQuery.ts';
import { IconButton } from './IconButton.tsx';

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?(open: boolean): void;
  title: string;
  description?: ReactNode;
  /** Element that opens the dialog; focus returns to it on close. */
  trigger?: ReactNode;
  children?: ReactNode;
  size?: 'compact' | 'wide';
}

/** A centered dialog from 640px up; a bottom sheet on phones. */
export function Dialog({ open, defaultOpen, onOpenChange, title, description, trigger, children, size = 'compact' }: DialogProps) {
  const wide = useMediaQuery('(min-width: 640px)');
  const presentation = wide ? 'dialog' : 'sheet';
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isOpen = open ?? internalOpen;
  const content = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    play(overlay.current, 'fadeIn');
    play(content.current, presentation === 'sheet' ? 'sheetUp' : 'popIn');
  }, [isOpen, presentation]);
  const change = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={change}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay ref={overlay} className="fixed inset-0 z-(--gg-z-modal) bg-ink/40" />
        <RadixDialog.Content
          ref={content}
          data-gg="dialog"
          data-presentation={presentation}
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cx(
            'fixed z-(--gg-z-modal) flex flex-col gap-4 border border-line bg-surface p-6 text-ink shadow-float',
            presentation === 'dialog'
              ? cx('left-1/2 top-1/2 max-h-[85dvh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-panel', size === 'wide' ? 'max-w-3xl' : 'max-w-md')
              : 'inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-panel pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
          )}
        >
          {presentation === 'sheet' && <div aria-hidden className="mx-auto -mt-2 h-1.5 w-10 rounded-pill bg-line" />}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <RadixDialog.Title className="text-xl">{title}</RadixDialog.Title>
              {description && <RadixDialog.Description className="text-sm text-ink-muted">{description}</RadixDialog.Description>}
            </div>
            <RadixDialog.Close asChild>
              <IconButton label="Cerrar" icon={<X />} className="-mr-2 -mt-2" />
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
