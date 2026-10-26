import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx.ts';
import { fieldControl, fieldLabel, FieldMessages } from './Field.tsx';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div data-gg="text-field" className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className={fieldLabel}>{label}</label>
      <input ref={ref} id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={fieldControl} {...rest} />
      <FieldMessages hintId={hintId} errorId={errorId} hint={hint} error={error} />
    </div>
  );
});
