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

/** A count from untrusted input: finite and never negative. */
const count = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

/** The HUD counters, from the configuration alone (cotizador asesor.js campusCounts()). Malformed input counts as zero. */
export function campusCounts(data: CampusData): CampusCounts {
  const enrollment = (Array.isArray(data?.enrollment) ? data.enrollment : []).filter((r) => r && typeof r.id === 'string');
  const equipment = (Array.isArray(data?.equipment) ? data.equipment : []).filter((e) => e && typeof e === 'object');
  const rows = new Map(enrollment.map((row) => [row.id, count(row.students)]));
  const ids = (list: unknown) => (Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : []);
  const sumOf = (list: Iterable<string>) => [...new Set(list)].reduce((n, id) => n + (rows.get(id) ?? 0), 0);
  const registered = enrollment.length ? sumOf(rows.keys()) : count(data?.students);
  return {
    attended: equipment.length ? sumOf(equipment.flatMap((e) => ids(e.groupIds))) : registered,
    participations: equipment.reduce((n, e) => n + (e.participants != null ? count(e.participants) : sumOf(ids(e.groupIds))), 0),
    simultaneous: equipment.filter((e) => e.sharing === 'simultaneous').reduce((n, e) => n + sumOf(ids(e.simIds)), 0),
    teams: equipment.reduce((n, e) => n + count(e.units), 0),
  };
}
