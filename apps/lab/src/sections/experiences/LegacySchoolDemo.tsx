import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { LEGACY_LEVELS, LEGACY_PROGRAMS, LEGACY_SOURCE, mountLegacySchool, type LegacyProgramId, type LegacySchool } from '@guategeeks/experience-legacy-school';
import { ThreeHost } from '@guategeeks/three/react';
import { useTheme } from '@guategeeks/theme-runtime/react';
import { Button, GlassPanel } from '@guategeeks/ui';

type Selection = { kind: 'program' | 'level'; id: string };
type Target = { kind: string; id: string; x: number; y: number };

const PROGRAM_IDS = Object.keys(LEGACY_PROGRAMS) as LegacyProgramId[];

function TextAlternative() {
  return (
    <div data-gg="legacy-school-text" className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-4 text-sm text-ink">
      <p>La vista 3D no está disponible en este navegador. Esta era la escuela de ejemplo del cotizador:</p>
      <p>Niveles: {Object.values(LEGACY_LEVELS).join(', ')}; 720 estudiantes.</p>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {PROGRAM_IDS.map((id) => <li key={id}><strong>{LEGACY_PROGRAMS[id].name}</strong>: {LEGACY_PROGRAMS[id].action.toLowerCase()}. {LEGACY_PROGRAMS[id].detail}</li>)}
      </ul>
    </div>
  );
}

/** The cotizador's previous low-poly school, preserved as a historical reference (not themed, not configurable). */
export default function LegacySchoolDemo() {
  const { motion } = useTheme();
  const [school, setSchool] = useState<LegacySchool | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);

  // Diagnostics (tap targets in client coordinates) for the e2e suite, refreshed like the campus stage.
  useEffect(() => {
    if (!school) return;
    const read = () => setTargets((school.getDiagnostics().selectTargets as Target[]) ?? []);
    read();
    const timer = setInterval(read, 1000);
    return () => clearInterval(timer);
  }, [school]);
  useEffect(() => { school?.setPaused(paused); }, [school, paused]);

  const program = selection?.kind === 'program' ? LEGACY_PROGRAMS[selection.id as LegacyProgramId] : null;
  const level = selection?.kind === 'level' ? LEGACY_LEVELS[selection.id as keyof typeof LEGACY_LEVELS] : null;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="legacy-school-title">
      <h3 id="legacy-school-title" className="text-xl">Escuela low poly · Referencia histórica</h3>
      <p className="max-w-prose text-sm text-ink-muted">
        La maqueta 3D del cotizador antes del campus de cartulina, tal como era ({LEGACY_SOURCE.repo}, commit {LEGACY_SOURCE.commit}, 24 de octubre de 2026). Se conserva como referencia: no cambia con los temas ni se configura. Gírala, acércate y toca un taller para ver su actividad.
      </p>
      {failed ? <TextAlternative /> : (
        <div
          data-gg="legacy-school-stage"
          data-ready={ready ? 'true' : 'false'}
          data-targets={JSON.stringify(targets)}
          className="relative h-[70dvh] min-h-[28rem] overflow-hidden rounded-panel border border-line"
        >
          <ThreeHost<LegacySchool>
            className="absolute inset-0"
            create={(el) => mountLegacySchool(el, {
              reducedMotion: motion === 'reduced',
              onReady: () => setReady(true),
              onLost: () => setFailed(true),
              onSelect: setSelection,
            })}
            onEngine={setSchool}
            onError={() => setFailed(true)}
          />
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between gap-3 p-3">
            <div className="pointer-events-auto ml-auto flex gap-2">
              <Button variant="secondary" iconStart={<RotateCcw />} onClick={() => { school?.resetView(); setSelection(null); }}>Restablecer vista</Button>
              <Button variant="secondary" iconStart={paused ? <Play /> : <Pause />} onClick={() => setPaused((p) => !p)}>{paused ? 'Reanudar' : 'Pausar'}</Button>
            </div>
            <div data-gg="legacy-school-panel" role="status" className="pointer-events-auto max-w-sm">
              <GlassPanel className="flex flex-col gap-1 p-4">
                {program ? (
                  <>
                    <strong className="text-md">{program.name} · {program.action}</strong>
                    <p className="text-sm text-ink-muted">{program.detail}</p>
                  </>
                ) : level ? (
                  <strong className="text-md">Aulas de {level}</strong>
                ) : (
                  <p className="text-sm text-ink-muted">Toca un taller para ver su actividad.</p>
                )}
              </GlassPanel>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
