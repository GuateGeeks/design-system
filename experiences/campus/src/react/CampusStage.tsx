import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { geekyPalette, getTheme, THREE_PROFILES, type MascotPalette, type ResolvedTheme, type SchemeName, type ThreeProfile } from '@guategeeks/themes';
import type { StageOptions } from '@guategeeks/three';
import { ThreeHost } from '@guategeeks/three/react';
import { useTheme } from '@guategeeks/theme-runtime/react';
import { cx } from '@guategeeks/ui';
import { createCampusScene, type CampusDiagnostics, type CampusScene, type CampusSceneOptions, type CampusView } from '../scene.ts';
import type { CampusData, CampusFocus } from '../types.ts';
import { CampusSummary } from './CampusSummary.tsx';

export interface CampusStageState { ready: boolean; lost: boolean; diagnostics?: CampusDiagnostics }

export interface CampusStageProps {
  data: CampusData;
  focus?: CampusFocus;
  view?: CampusView;
  paused?: boolean;
  onSelect?: CampusSceneOptions['onSelect'];
  onEngine?(engine: CampusScene | null): void;
  onState?(state: CampusStageState): void;
  /** Poll diagnostics every second and expose them as data-* attributes (labs and tests). */
  diagnostics?: boolean;
  createScene?: (container: HTMLElement, options: CampusSceneOptions) => CampusScene;
  createRenderer?: StageOptions['createRenderer'];
  className?: string;
  /** Overlays (HUD, feedback) drawn over the scene. */
  children?: ReactNode;
}

/** Relative luminance of a #rrggbb colour (WCAG). */
function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  };
  return .2126 * channel(0) + .7152 * channel(1) + .0722 * channel(2);
}

/**
 * Geeky's palette for the 3D scene: the scheme the scene looks like (its background), not the UI's. A theme
 * without that scheme (Halloween is dark only) uses its default scheme.
 */
export function scenePalette(theme: ResolvedTheme | undefined, profile: ThreeProfile): MascotPalette {
  const looks: SchemeName = /^#[0-9a-f]{6}$/i.test(profile.background) && luminance(profile.background) < .5 ? 'dark' : 'light';
  return geekyPalette(theme, theme && !theme.schemes.includes(looks) ? theme.defaultScheme : looks);
}

/** The campus scene in React: theme profile and reduced motion follow the runtime live; the text summary takes over without WebGL. */
export function CampusStage({ data, focus, view, paused = false, onSelect, onEngine, onState, diagnostics = false, createScene, createRenderer, className, children }: CampusStageProps) {
  const { theme, motion } = useTheme();
  const resolved = getTheme(theme);
  const profile: ThreeProfile = resolved?.three ?? THREE_PROFILES.papercraft;
  const palette = scenePalette(resolved, profile);
  const paletteKey = JSON.stringify(palette);
  const reduced = motion === 'reduced';
  const [engine, setEngine] = useState<CampusScene | null>(null);
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  // `failed`: the engine could not start (no WebGL) — the host unmounts. `lost`: a context loss that may come back.
  const [failed, setFailed] = useState(false);
  const [stats, setStats] = useState<CampusDiagnostics | null>(null);
  const latest = useRef({ onSelect, onEngine, profile, reduced, palette });
  latest.current = { onSelect, onEngine, profile, reduced, palette };
  const applied = useRef({ profile, reduced, paletteKey });

  const create = useMemo(() => (el: HTMLElement) => {
    const scene = (createScene ?? createCampusScene)(el, {
      profile: latest.current.profile,
      reducedMotion: latest.current.reduced,
      geekyPalette: latest.current.palette,
      createRenderer,
      onReady: () => setReady(true),
      onLost: () => { setLost(true); setReady(false); },
      onRestored: () => setLost(false),
      onSelect: (selection) => latest.current.onSelect?.(selection),
    });
    applied.current = { profile: latest.current.profile, reduced: latest.current.reduced, paletteKey: JSON.stringify(latest.current.palette) };
    return scene;
  }, []);

  useEffect(() => { engine?.update(data); }, [engine, data]);
  useEffect(() => {
    if (!engine || applied.current.profile === profile) return;
    applied.current.profile = profile;
    engine.setProfile(profile);
  }, [engine, profile]);
  useEffect(() => {
    if (!engine || applied.current.paletteKey === paletteKey) return;
    applied.current.paletteKey = paletteKey;
    engine.setGeekyPalette?.(latest.current.palette);
  }, [engine, paletteKey]);
  useEffect(() => {
    if (!engine || applied.current.reduced === reduced) return;
    applied.current.reduced = reduced;
    engine.setReducedMotion(reduced);
  }, [engine, reduced]);
  useEffect(() => { if (engine && view) engine.setView(view); }, [engine, view]);
  useEffect(() => { if (engine && focus) engine.setFocus(focus); }, [engine, focus]);
  useEffect(() => { engine?.setPaused(paused); }, [engine, paused]);
  useEffect(() => {
    if (!engine || !diagnostics) return;
    const read = () => setStats(engine.getDiagnostics());
    read();
    const timer = setInterval(read, 1000);
    return () => clearInterval(timer);
  }, [engine, diagnostics, data]);
  useEffect(() => { onState?.({ ready, lost, diagnostics: stats ?? undefined }); }, [ready, lost, stats, onState]);

  const attrs = stats ? {
    'data-triangles': stats.triangles, 'data-draw-calls': stats.drawCalls, 'data-materials': stats.materials, 'data-frame-pending': String(stats.framePending),
    // Screen positions of selectable buildings (client px), for labs and end-to-end tests.
    'data-targets': JSON.stringify((stats.selectTargets ?? []).map((t) => ({ kind: t.kind, id: t.id, x: Math.round(t.x), y: Math.round(t.y) }))),
  } : {};
  return (
    <div data-gg="campus-stage" data-ready={ready} data-lost={lost} {...attrs} className={cx('gg-campus relative isolate overflow-hidden bg-bg', className)}>
      {!failed && (
        <ThreeHost
          create={create}
          onEngine={(e) => { setEngine(e); latest.current.onEngine?.(e); }}
          onError={() => { setFailed(true); setLost(true); }}
          className={cx('absolute inset-0', lost && 'invisible')}
        />
      )}
      {/* Without 3D the overlays (HUD, feedback) have nothing to act on: the summary takes the whole stage. */}
      {!lost && children}
      <CampusSummary data={data} visible={lost} className={lost ? 'relative z-20 m-4 max-h-[calc(100%-2rem)] overflow-y-auto' : undefined} />
    </div>
  );
}
