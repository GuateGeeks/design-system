import { forwardRef, useImperativeHandle, useRef } from 'react';
import { LEVEL_IDS, LEVEL_NAMES, PROGRAM_IDS, PROGRAM_NAMES, type CampusData, type LevelId, type ProgramId } from '@guategeeks/experience-campus';
import { Button, cx, NumberStepper, Switch } from '@guategeeks/ui';
import { levelStudents, presetData, setLevel, setProgram, setStudents } from './campusModel.ts';

export interface CampusConfiguratorProps {
  value: CampusData;
  onChange(value: CampusData): void;
  /** The configuration the visitor is looking at (highlighted). */
  active?: { kind: 'level' | 'program'; id: string } | null;
}

export interface CampusConfiguratorHandle { focus(kind: 'level' | 'program', id: string): void }

const PRESETS: Array<[1 | 3 | 6, string]> = [[1, 'Un aula'], [3, 'Escuela mediana'], [6, 'Campus completo']];

export const CampusConfigurator = forwardRef<CampusConfiguratorHandle, CampusConfiguratorProps>(function CampusConfigurator({ value, onChange, active }, ref) {
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({
    focus(kind, id) {
      const row = root.current?.querySelector<HTMLElement>(`[data-config="${kind}:${id}"]`);
      row?.scrollIntoView?.({ block: 'nearest' });
      row?.querySelector<HTMLElement>('[role="switch"]')?.focus();
    },
  }));
  const isActive = (kind: string, id: string) => active?.kind === kind && active.id === id;
  return (
    <div ref={root} data-gg="campus-configurator" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg">Punto de partida</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(([n, label]) => <Button key={n} variant="secondary" onClick={() => onChange(presetData(n))}>{label}</Button>)}
        </div>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg">Niveles</legend>
        {(LEVEL_IDS as readonly LevelId[]).map((id) => {
          const on = value.levels.includes(id);
          return (
            <div key={id} data-config={`level:${id}`} data-active={isActive('level', id)} className={cx('flex flex-col gap-2 rounded-card border border-transparent p-2', isActive('level', id) && 'border-action bg-wash')}>
              <Switch label={LEVEL_NAMES[id]} checked={on} onCheckedChange={(checked) => onChange(setLevel(value, id, checked))} />
              {on && <NumberStepper label={`Estudiantes de ${LEVEL_NAMES[id]}`} value={levelStudents(value, id)} min={0} max={400} step={10} onChange={(n) => onChange(setStudents(value, id, n))} />}
            </div>
          );
        })}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg">Programas</legend>
        {(PROGRAM_IDS as readonly ProgramId[]).map((id) => (
          <div key={id} data-config={`program:${id}`} data-active={isActive('program', id)} className={cx('rounded-card border border-transparent px-2', isActive('program', id) && 'border-action bg-wash')}>
            <Switch label={PROGRAM_NAMES[id]} checked={value.programs.includes(id)} onCheckedChange={(checked) => onChange(setProgram(value, id, checked))} />
          </div>
        ))}
      </fieldset>
    </div>
  );
});
