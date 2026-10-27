/** The cotizador's school scene (campus-scene.js, a125f6f). Declarations written for this repository. */
export interface LegacySceneOptions {
  reduceMotion?: boolean;
  onSelect?(selection: { kind: 'program' | 'level'; id: string }): void;
  onReady?(): void;
  onLost?(error?: unknown): void;
}
export interface LegacyScene {
  update(data: object): void;
  resize(): void;
  rotate(delta: number): void;
  zoom(delta: number): void;
  resetView(): void;
  setPaused(paused: boolean): void;
  setFocus(focus: object): void;
  setInsets(insets: { top?: number; right?: number; bottom?: number; left?: number }): void;
  setHoverVerb(verb: string): void;
  getDiagnostics(): Record<string, unknown> & { selectTargets: Array<{ kind: string; id: string; x: number; y: number }> };
  dispose(): void;
}
export const CAMPUS_BUDGET: Readonly<{ triangles: number; drawCalls: number; materials: number }>;
export function createMascot(container: HTMLElement, opts?: LegacySceneOptions): LegacyScene;
