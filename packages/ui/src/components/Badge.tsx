import type { HTMLAttributes } from 'react';
import { cx } from '../cx.ts';

export type BadgeTone = 'neutral' | 'ok' | 'bad' | 'hint' | 'action';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-ink-muted',
  ok: 'bg-ok-soft text-ok',
  bad: 'bg-bad-soft text-bad',
  hint: 'bg-hint-soft text-hint',
  action: 'bg-wash text-ink',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      data-gg="badge"
      data-tone={tone}
      className={cx('inline-flex w-fit items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}
      {...rest}
    />
  );
}
