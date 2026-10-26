import { useState } from 'react';
import { Crosshair, Pause, Play, RefreshCcw, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import type { ThreeProfile } from '@guategeeks/themes';
import { PAL } from '@guategeeks/three';
import { cx, GlassPanel, IconButton, SegmentedControl, Tooltip } from '@guategeeks/ui';
import { campusCounts } from '../counts.ts';
import type { CampusScene, CampusView } from '../scene.ts';
import type { CampusData } from '../types.ts';

const VIEWS: Array<{ value: Exclude<CampusView, 'program'>; label: string }> = [
  { value: 'overview', label: 'General' }, { value: 'front', label: 'Frente' }, { value: 'patio', label: 'Patio' }, { value: 'people', label: 'Personas' },
];
const LEGEND: Array<{ key: string; label: string }> = [
  { key: 'wall', label: 'Aula' }, { key: 'frame', label: 'Taller' }, { key: 'roof', label: 'Cubierta' },
  { key: 'turquoise', label: 'Balcón y caminos' }, { key: 'orange', label: 'Entrada' }, { key: 'leaf', label: 'Jardines' },
];

export interface CampusHudProps {
  engine: CampusScene | null;
  data: CampusData;
  paused: boolean;
  onPausedChange(paused: boolean): void;
  profile?: ThreeProfile;
  className?: string;
}

function Tool({ label, icon, onClick, disabled }: { label: string; icon: React.ReactNode; onClick(): void; disabled: boolean }) {
  return <Tooltip content={label}><IconButton label={label} icon={icon} onClick={onClick} disabled={disabled} /></Tooltip>;
}

/** Glass HUD over the campus: proposal counters, camera tools, named views and the legend. */
export function CampusHud({ engine, data, paused, onPausedChange, profile, className }: CampusHudProps) {
  const [view, setView] = useState<Exclude<CampusView, 'program'>>('overview');
  const [legend, setLegend] = useState(false);
  const counts = campusCounts(data);
  const off = !engine;
  const swatch = (key: string) => profile?.palette[key] ?? PAL[key];
  return (
    <GlassPanel data-gg="campus-hud" className={cx('flex flex-col gap-3 p-4', className)}>
      <h3 className="text-lg">Mi propuesta</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {([['Estudiantes atendidos', counts.attended], ['Participaciones', counts.participations], ['Simultáneos', counts.simultaneous], ['Equipos', counts.teams]] as const).map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="text-xl font-medium tabular-nums">{value.toLocaleString('es-GT')}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Cámara">
        <Tool label="Programa activo" icon={<Crosshair />} onClick={() => engine?.setView('program')} disabled={off} />
        <Tool label="Girar a la izquierda" icon={<RotateCcw />} onClick={() => engine?.rotate(-0.25)} disabled={off} />
        <Tool label="Girar a la derecha" icon={<RotateCw />} onClick={() => engine?.rotate(0.25)} disabled={off} />
        <Tool label="Acercar" icon={<ZoomIn />} onClick={() => engine?.zoom(0.12)} disabled={off} />
        <Tool label="Alejar" icon={<ZoomOut />} onClick={() => engine?.zoom(-0.12)} disabled={off} />
        <Tool label="Restablecer vista" icon={<RefreshCcw />} onClick={() => { setView('overview'); engine?.resetView(); }} disabled={off} />
        <Tool label={paused ? 'Reanudar animación' : 'Pausar animación'} icon={paused ? <Play /> : <Pause />} onClick={() => onPausedChange(!paused)} disabled={off} />
      </div>
      <SegmentedControl<Exclude<CampusView, 'program'>>
        label="Vista"
        value={view}
        options={VIEWS}
        onChange={(next) => { setView(next); engine?.setView(next); }}
        disabled={off}
      />
      <button type="button" aria-expanded={legend} onClick={() => setLegend((v) => !v)} className="w-fit rounded-pill bg-surface-2 px-3 py-1 text-xs font-medium text-ink-muted hover:text-ink">
        Representación de tu configuración
      </button>
      {legend && (
        <ul className="grid grid-cols-2 gap-2 text-xs" aria-label="Leyenda">
          {LEGEND.map((item) => (
            <li key={item.key} className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-sm border border-line" style={{ background: swatch(item.key) }} />
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}
