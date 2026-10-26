import type { ReactNode } from 'react';

/** Shared label/hint/error styling for form controls. */
export const fieldLabel = 'text-sm font-medium text-ink';
export const fieldHint = 'text-xs text-ink-muted';
export const fieldError = 'text-xs font-medium text-bad';
export const fieldControl =
  'w-full rounded-control border border-line bg-surface px-3 text-ink min-h-(--gg-tap-min) ' +
  'placeholder:text-ink-subtle hover:border-ink-subtle aria-invalid:border-bad disabled:opacity-50';

export function FieldMessages({ hintId, errorId, hint, error }: { hintId: string; errorId: string; hint?: ReactNode; error?: ReactNode }) {
  return (
    <>
      {hint && <p id={hintId} className={fieldHint}>{hint}</p>}
      {error && <p id={errorId} className={fieldError}>{error}</p>}
    </>
  );
}
