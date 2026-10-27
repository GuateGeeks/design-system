import { useEffect, useRef, type CSSProperties } from 'react';
import { GeekyActor } from '@guategeeks/geeky';
import { FRAME } from '@guategeeks/geeky/core';
import { geekyPalette, getTheme, type MascotPalette } from '@guategeeks/themes';
import { useOptionalTheme } from '@guategeeks/theme-runtime/react';
import { loops, resolveGeekyAction, type GeekyIntent } from '../intents.ts';

export interface GeekyProps {
  /** What Geeky should communicate (recommended). Wins over `action`. */
  intent?: GeekyIntent;
  /** A geeky-animation action id; unknown ids warn once and show the idle rest. */
  action?: string;
  /** '3d' loads three.js on demand and stays 2D without WebGL. */
  render?: '2d' | '3d';
  /** Width and height (CSS length). */
  size?: string;
  /** Pokes, drag-to-spin and their reactions. Off by default on product screens. */
  interactive?: boolean;
  /** The eyes follow the pointer. */
  followPointer?: boolean;
  /** Idle fidgets (look around, yawn…) while resting. */
  autonomous?: boolean;
  /** Stops all animation (still pose). Offer a pause control when a looping intent stays on screen. */
  paused?: boolean;
  /** Accessible name. Without it Geeky is decorative (hidden from assistive technology). */
  label?: string;
  /** Change it to replay the current one-shot intent or action. */
  playKey?: unknown;
  /** Overrides the theme's Geeky palette (only `frame` applies to the Live renderers). */
  palette?: MascotPalette;
  /** Overrides the theme runtime's motion preference (and the OS setting without a runtime). */
  reducedMotion?: boolean;
  /** Called when a one-shot intent or action finishes (not when it is interrupted). */
  onActionEnd?: (id: string) => void;
  className?: string;
}

const loadThree = () => import('three');

/** Geeky, the GuateGeeks guide, for product screens: the geeky-animation Live actor with theme colours, motion preference and accessibility. */
export function Geeky({
  intent, action, render = '2d', size = '8rem', interactive = false, followPointer = true, autonomous = false,
  paused = false, label, playKey, palette, reducedMotion, onActionEnd, className,
}: GeekyProps) {
  const host = useRef<HTMLDivElement>(null);
  const actor = useRef<GeekyActor | null>(null);
  const warned = useRef(new Set<string>());
  const latest = useRef({ onActionEnd });
  latest.current = { onActionEnd };

  const theme = useOptionalTheme();
  const resolvedTheme = theme ? (theme.themes.find((t) => t.id === theme.theme) ?? getTheme(theme.theme)) : undefined;
  const frame = palette?.frame ?? (theme ? geekyPalette(resolvedTheme, theme.scheme).frame : undefined) ?? FRAME;
  const reduced: boolean | 'system' = reducedMotion ?? (theme ? theme.motion === 'reduced' : 'system');
  const target = resolveGeekyAction({ intent, action });
  const looping = loops({ intent }, target.id);

  // The actor lives as long as the element; settings that the actor cannot change live recreate it.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const created = new GeekyActor(el, {
      renderer: 'svg', interactive, reactions: interactive, dragMode: interactive ? 'spin' : 'none',
      followPointer, autonomous, reducedMotion: reduced, label: label ?? null, actionLabels: false, frameColor: frame,
    });
    actor.current = created;
    return () => { created.destroy(); if (actor.current === created) actor.current = null; };
    // Only what the actor cannot update in place; the effects below apply the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, label]);

  useEffect(() => { actor.current?.setFrameColor(frame); }, [frame, interactive, label]);
  useEffect(() => { actor.current?.setReducedMotion(reduced); }, [reduced, interactive, label]);
  useEffect(() => { actor.current?.setAutonomous(autonomous); }, [autonomous, interactive, label]);
  useEffect(() => { actor.current?.setFollowPointer(followPointer); }, [followPointer, interactive, label]);
  useEffect(() => {
    const a = actor.current;
    if (!a) return;
    if (render === '3d') void a.loadRenderer('three', { THREE: loadThree });
    else a.setRenderer('svg');
  }, [render, interactive, label]);
  useEffect(() => {
    const a = actor.current;
    if (!a) return;
    if (paused) a.pause(); else a.resume();
  }, [paused, interactive, label]);

  useEffect(() => {
    if (!target.known && action !== undefined && !warned.current.has(action)) {
      warned.current.add(action);
      console.warn(`<Geeky>: unknown action "${action}", showing the idle rest`);
    }
  }, [action, target.known]);

  useEffect(() => {
    const a = actor.current;
    if (!a) return;
    let current = true;
    const id = target.id;
    // Loops become the resting action; with reduced motion a one-shot holds its still pose too.
    const holds = looping || reduced === true;
    a.setBase(holds ? id : 'idle');
    void a.play(id, { restart: true }).then((result) => {
      if (current && result.completed && !looping) latest.current.onActionEnd?.(id);
    });
    return () => { current = false; };
  }, [target.id, looping, reduced, playKey, interactive, label]);

  const style: CSSProperties = { width: size, height: size, position: 'relative', display: 'inline-block' };
  return <div ref={host} data-gg="geeky" className={className} style={style} />;
}
