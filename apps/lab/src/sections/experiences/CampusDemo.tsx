import { useEffect, useRef, useState } from 'react';
import { describeCampusChange, type CampusData, type CampusScene } from '@guategeeks/experience-campus';
import { CampusHud, CampusStage } from '@guategeeks/experience-campus/react';
import { getTheme } from '@guategeeks/themes';
import { play } from '@guategeeks/motion';
import { useTheme } from '@guategeeks/theme-runtime/react';
import { Card, GlassPanel, useMediaQuery } from '@guategeeks/ui';
import { CampusConfigurator, type CampusConfiguratorHandle } from './CampusConfigurator.tsx';
import { presetData } from './campusModel.ts';

type Selection = { kind: 'level' | 'program'; id: string };

/** The cotizador's campus as a lab experience: configure → live 3D → contextual feedback. No prices. */
export function CampusDemo() {
  const { theme } = useTheme();
  const wide = useMediaQuery('(min-width: 768px)');
  const [data, setData] = useState<CampusData>(() => presetData(3));
  const [previous, setPrevious] = useState<CampusData | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [paused, setPaused] = useState(false);
  const [engine, setEngine] = useState<CampusScene | null>(null);
  const configurator = useRef<CampusConfiguratorHandle>(null);
  const card = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  // The campus frames itself in the area the overlays leave free (HUD on the right, feedback at the bottom).
  useEffect(() => {
    const el = hud.current, feedbackEl = card.current;
    if (!engine || !el || !feedbackEl || typeof ResizeObserver === 'undefined') return;
    const apply = () => {
      const stage = el.closest('[data-gg="campus-stage"]')?.getBoundingClientRect();
      if (!stage) return;
      // HUD beside the campus when enough room remains; otherwise above it.
      const side = stage.width - el.offsetWidth >= 260;
      engine.setInsets(side
        ? { right: el.offsetWidth + 16, bottom: feedbackEl.offsetHeight + 16 }
        : { top: el.offsetHeight + 16, bottom: feedbackEl.offsetHeight + 16 });
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    observer.observe(feedbackEl);
    return () => observer.disconnect();
  }, [engine]);

  const change = (next: CampusData) => { setPrevious(data); setData(next); setSelection(null); };
  const context = selection ? (selection.kind === 'program' ? { kind: 'program', programId: selection.id } : { kind: 'level', levelId: selection.id }) : {};
  const feedback = describeCampusChange(data, selection ? null : previous, context);
  useEffect(() => { play(card.current, 'enter.item'); }, [feedback.title]);

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,22rem)_1fr]">
      <Card className="order-2 2xl:order-1 2xl:max-h-[70dvh] 2xl:overflow-y-auto">
        <CampusConfigurator ref={configurator} value={data} onChange={change} active={selection} />
      </Card>
      <CampusStage
        data={data}
        paused={paused}
        diagnostics
        onEngine={setEngine}
        onSelect={(s) => { setSelection(s); configurator.current?.focus(s.kind, s.id); }}
        className="order-1 h-[70dvh] min-h-[28rem] rounded-panel border border-line 2xl:order-2"
      >
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between gap-3 p-3">
          <div ref={hud} className="pointer-events-auto ml-auto w-full max-w-xs">
            <CampusHud key={wide ? 'wide' : 'narrow'} engine={engine} data={data} paused={paused} onPausedChange={setPaused} profile={getTheme(theme)?.three} defaultExpanded={wide} />
          </div>
          <div ref={card} role="status" aria-label="Lo que cambió" className="pointer-events-auto max-w-sm">
            <GlassPanel className="flex flex-col gap-1 p-4">
              <strong className="text-md">{feedback.title}</strong>
              <p className="text-sm text-ink-muted">{feedback.text}</p>
            </GlassPanel>
          </div>
        </div>
      </CampusStage>
    </div>
  );
}
