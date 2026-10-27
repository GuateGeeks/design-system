import { createMascot } from './vendor/cotizador/campus-scene.js';
import { legacyShowcase } from './showcase.ts';

/** Where the preserved scene comes from. */
export const LEGACY_SOURCE = Object.freeze({ repo: 'GuateGeeks/cotizador', commit: 'a125f6f', date: '2026-10-24', path: 'asesor/lab' });
/** The cotizador drew the scene over this colour (asesor.css `--scene`); kept as it was, in every lab theme. */
export const LEGACY_BACKDROP = '#2e1853';

export interface LegacySchoolOptions {
  reducedMotion?: boolean;
  onSelect?(selection: { kind: 'program' | 'level'; id: string }): void;
  onReady?(): void;
  onLost?(): void;
}

export interface LegacySchool {
  rotate(delta: number): void;
  zoom(delta: number): void;
  resetView(): void;
  setPaused(paused: boolean): void;
  getDiagnostics(): Record<string, unknown>;
  dispose(): void;
}

/** The cotizador's low-poly school, as it was, showing its example school; tapping explores. */
export function mountLegacySchool(container: HTMLElement, opts: LegacySchoolOptions = {}): LegacySchool {
  container.style.background = LEGACY_BACKDROP;
  const scene = createMascot(container, {
    reduceMotion: opts.reducedMotion,
    onSelect: (selection) => opts.onSelect?.(selection),
    onReady: () => opts.onReady?.(),
    onLost: () => opts.onLost?.(),
  });
  scene.setHoverVerb('Explorar');
  scene.update(legacyShowcase());
  return {
    rotate: (delta) => scene.rotate(delta),
    zoom: (delta) => scene.zoom(delta),
    resetView: () => scene.resetView(),
    setPaused: (paused) => scene.setPaused(paused),
    getDiagnostics: () => scene.getDiagnostics(),
    dispose: () => scene.dispose(),
  };
}
