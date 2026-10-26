import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getTheme, THREE_PROFILES, type ThreeProfile } from '@guategeeks/themes';
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

/** The campus scene in React: theme profile and reduced motion follow the runtime live; the text summary takes over without WebGL. */
export function CampusStage({ data, focus, view, paused = false, onSelect, onEngine, onState, diagnostics = false, createScene, createRenderer, className, children }: CampusStageProps) {
  const { theme, motion } = useTheme();
  const profile: ThreeProfile = getTheme(theme)?.three ?? THREE_PROFILES.papercraft;
  const reduced = motion === 'reduced';
  const [engine, setEngine] = useState<CampusScene | null>(null);
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  const [stats, setStats] = useState<CampusDiagnostics | null>(null);
  const latest = useRef({ onSelect, onEngine, profile, reduced });
  latest.current = { onSelect, onEngine, profile, reduced };
  const applied = useRef({ profile, reduced });

  const create = useMemo(() => (el: HTMLElement) => {
    const scene = (createScene ?? createCampusScene)(el, {
      profile: latest.current.profile,
      reducedMotion: latest.current.reduced,
      createRenderer,
      onReady: () => setReady(true),
      onLost: () => { setLost(true); setReady(false); },
      onSelect: (selection) => latest.current.onSelect?.(selection),
    });
    applied.current = { profile: latest.current.profile, reduced: latest.current.reduced };
    return scene;
  }, []);

  useEffect(() => { engine?.update(data); }, [engine, data]);
  useEffect(() => {
    if (!engine || applied.current.profile === profile) return;
    applied.current.profile = profile;
    engine.setProfile(profile);
  }, [engine, profile]);
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
  } : {};
  return (
    <div data-gg="campus-stage" data-ready={ready} data-lost={lost} {...attrs} className={cx('gg-campus relative isolate overflow-hidden bg-bg', className)}>
      {!lost && (
        <ThreeHost
          create={create}
          onEngine={(e) => { setEngine(e); latest.current.onEngine?.(e); }}
          onError={() => setLost(true)}
          className="absolute inset-0"
        />
      )}
      {children}
      <CampusSummary data={data} visible={lost} className={lost ? 'relative m-4' : undefined} />
    </div>
  );
}
