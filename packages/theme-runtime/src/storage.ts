import type { MotionPreference, SchemePreference } from './controller.ts';

export interface StoredAppearance {
  theme?: string;
  edition?: string;
  scheme?: SchemePreference;
  motion?: MotionPreference;
}

/** Storage can be missing, blocked or corrupt (private mode, cleared data); every access degrades to defaults. */
export function readStored(key: string | null): StoredAppearance {
  if (!key) return {};
  try {
    const raw = globalThis.localStorage?.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? (parsed as StoredAppearance) : {};
  } catch {
    return {};
  }
}

export function writeStored(key: string | null, value: StoredAppearance): void {
  if (!key) return;
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Not persisted; the choice still applies for this page.
  }
}
