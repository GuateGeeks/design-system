import { colorRoles } from '@guategeeks/tokens';
import { cx } from '@guategeeks/ui';
import { HEX } from './exportTheme.ts';

const toColorInput = (value: string) => {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) return `#${[...value.slice(1)].map((c) => c + c).join('')}`;
  if (/^#[0-9a-f]{8}$/i.test(value)) return value.slice(0, 7);
  return '#000000';
};

export interface RoleEditorProps {
  drafts: Record<string, string>;
  onChange(role: string, value: string): void;
}

export function RoleEditor({ drafts, onChange }: RoleEditorProps) {
  return (
    <ul className="grid gap-2">
      {colorRoles.map((role) => {
        const draft = drafts[role] ?? '';
        const invalid = !HEX.test(draft);
        return (
          <li key={role} className="flex items-center gap-2">
            <input
              type="color"
              aria-label={`Color de ${role}`}
              value={toColorInput(draft)}
              onChange={(e) => onChange(role, e.target.value)}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-control border border-line bg-surface"
            />
            <code className="w-28 shrink-0 truncate text-xs text-ink-muted">{role}</code>
            <input
              type="text"
              aria-label={`Hex de ${role}`}
              aria-invalid={invalid || undefined}
              value={draft}
              spellCheck={false}
              onChange={(e) => onChange(role, e.target.value.trim())}
              className={cx('min-h-(--gg-tap-min) w-full min-w-0 rounded-control border bg-surface px-2 font-mono text-sm text-ink', invalid ? 'border-bad' : 'border-line')}
            />
          </li>
        );
      })}
    </ul>
  );
}
