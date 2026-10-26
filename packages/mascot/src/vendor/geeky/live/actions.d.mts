export interface GeekyAction { id: string; label: string; group: string; loop?: boolean; dur: number; desc?: string }
export const ACTIONS: Record<string, GeekyAction>;
export const GROUPS: Record<string, string>;
export const ALIASES: Readonly<Record<string, string>>;
export function resolveAction(id: string): GeekyAction;
export const ACTION_LIST: Array<{ id: string; label: string; group: string; loop?: boolean; duration: number; description?: string }>;
