import { useEffect, useMemo, useRef, useState } from 'react';
import type { ThreeProfile } from '@guategeeks/themes';
import { createInspector as defaultCreate } from '@guategeeks/three';
import { ThreeHost } from '@guategeeks/three/react';

export type InspectorView = '34' | 'front' | 'side' | 'top' | 'close';
export interface PieceInfo { id: string; label?: string; triangles: number; budget: number | null }
type Inspector = {
  show(id: string, opts?: { view?: string }): PieceInfo[];
  setView(view: string): void;
  setProfile(profile: ThreeProfile): void;
  dispose(): void;
};

export interface PieceViewerProps {
  pieceId: string;
  profile: ThreeProfile;
  view: InspectorView;
  createInspector?: (container: HTMLElement, options: { profile: ThreeProfile }) => Inspector;
  onInfo?(info: PieceInfo | null): void;
  className?: string;
}

/** One papercraft piece in the inspector (same stage, lights and profile as every scene). */
export function PieceViewer({ pieceId, profile, view, createInspector, onInfo, className }: PieceViewerProps) {
  const [inspector, setInspector] = useState<Inspector | null>(null);
  const [failed, setFailed] = useState(false);
  const latest = useRef({ profile, createInspector });
  latest.current = { profile, createInspector };
  const shownProfile = useRef(profile);
  const create = useMemo(() => (el: HTMLElement) => {
    shownProfile.current = latest.current.profile;
    return (latest.current.createInspector ?? (defaultCreate as unknown as NonNullable<PieceViewerProps['createInspector']>))(el, { profile: latest.current.profile });
  }, []);
  useEffect(() => { if (inspector) onInfo?.(inspector.show(pieceId, { view })[0] ?? null); }, [inspector, pieceId]);
  useEffect(() => { inspector?.setView(view); }, [inspector, view]);
  useEffect(() => {
    if (!inspector || shownProfile.current === profile) return;
    shownProfile.current = profile;
    inspector.setProfile(profile);
  }, [inspector, profile]);
  if (failed) return <p className="text-sm text-ink-muted">Este navegador no puede mostrar 3D.</p>;
  return <ThreeHost<Inspector> create={create} onEngine={setInspector} onError={() => setFailed(true)} className={className} />;
}
