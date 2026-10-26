import { useMemo } from 'react';
import { cx } from '@guategeeks/ui';
import { LEVEL_NAMES, PROGRAM_NAMES } from '../layout.ts';
import { planCampus } from '../plan.ts';
import { campusCounts } from '../counts.ts';
import type { CampusData } from '../types.ts';

const n = (value: number) => value.toLocaleString('es-GT');
const list = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`);

export interface CampusSummaryProps { data: CampusData; visible: boolean; className?: string }

/** The text alternative of the campus: always in the page; visible when 3D is unavailable. */
export function CampusSummary({ data, visible, className }: CampusSummaryProps) {
  const text = useMemo(() => {
    const plan = planCampus(data);
    const counts = campusCounts(data);
    const levels = data.levels.map((id) => LEVEL_NAMES[id]);
    const programs = data.programs.map((id) => PROGRAM_NAMES[id]);
    return [
      levels.length ? `Niveles: ${list(levels)}.` : 'Aún no hay niveles configurados.',
      `${n(plan.stats.rooms)} aulas y ${n(plan.stats.projectRooms)} talleres representados, con ${n(plan.stats.people)} personas.`,
      programs.length ? `Programas: ${list(programs)}.` : 'Aún no hay programas.',
      `${n(counts.attended)} estudiantes atendidos, ${n(counts.participations)} participaciones, ${n(counts.teams)} equipos.`,
    ];
  }, [data]);
  return (
    <section role="region" aria-label="Resumen del campus" data-gg="campus-summary" className={cx(visible ? 'rounded-card border border-line bg-surface p-4 text-sm text-ink' : 'sr-only', className)}>
      <ul className="flex flex-col gap-1">{text.map((line) => <li key={line}>{line}</li>)}</ul>
    </section>
  );
}
