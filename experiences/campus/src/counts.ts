import type { CampusData } from './types.ts';

export interface CampusCounts {
  /** Students reached: those in groups of some program, or everyone registered when no program is chosen. */
  attended: number;
  /** Sum of participations over programs (a student in two programs counts twice). */
  participations: number;
  /** Students working at the same time in programs whose groups share the equipment simultaneously. */
  simultaneous: number;
  /** Equipment units across programs. */
  teams: number;
}

/** The HUD counters, from the configuration alone (cotizador asesor.js campusCounts()). */
export function campusCounts(data: CampusData): CampusCounts {
  const rows = new Map(data.enrollment.map((row) => [row.id, row.students ?? 0]));
  const sumOf = (ids: Iterable<string>) => [...new Set(ids)].reduce((n, id) => n + (rows.get(id) ?? 0), 0);
  const registered = data.enrollment.length ? sumOf(rows.keys()) : data.students ?? 0;
  const equipment = data.equipment ?? [];
  return {
    attended: equipment.length ? sumOf(equipment.flatMap((e) => e.groupIds)) : registered,
    participations: equipment.reduce((n, e) => n + (e.participants ?? sumOf(e.groupIds)), 0),
    simultaneous: equipment.filter((e) => e.sharing === 'simultaneous').reduce((n, e) => n + sumOf(e.simIds ?? []), 0),
    teams: equipment.reduce((n, e) => n + (e.units ?? 0), 0),
  };
}
