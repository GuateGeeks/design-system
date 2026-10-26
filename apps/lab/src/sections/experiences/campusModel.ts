import { LEVEL_IDS, LEVEL_NAMES, PROGRAM_LEVELS, stateInput, type CampusData, type LevelId, type ProgramId } from '@guategeeks/experience-campus';

export const EMPTY_CAMPUS: CampusData = { levels: [], programs: [], enrollment: [], equipment: [] };
/** Students that share one kit (illustrative; the cotizador's pricing engine is not part of the lab). */
const STUDENTS_PER_KIT = 4;

/** The cotizador's reference growth states (1 = empty campus, 6 = every level and program). */
export function presetData(n: 1 | 3 | 6): CampusData {
  return { ...EMPTY_CAMPUS, ...(stateInput(n) as Partial<CampusData>) };
}

export const levelStudents = (data: CampusData, level: LevelId): number =>
  data.enrollment.filter((r) => r.levelId === level).reduce((n, r) => n + (r.students ?? 0), 0);

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

/**
 * Groups and units of every program follow the enrolled levels it serves. An entry is kept untouched while
 * its groups and their students are unchanged (so preset entries keep their sharing, plan and units).
 */
function withEquipment(data: CampusData): CampusData {
  const equipment = data.programs.map((programId) => {
    const existing = data.equipment.find((e) => e.programId === programId);
    const groupIds = data.enrollment.filter((r) => (PROGRAM_LEVELS[programId] as readonly string[]).includes(r.levelId)).map((r) => r.id);
    const participants = data.enrollment.filter((r) => groupIds.includes(r.id)).reduce((n, r) => n + (r.students ?? 0), 0);
    if (existing && sameSet(existing.groupIds, groupIds) && (existing.participants === undefined || existing.participants === participants)) return existing;
    return {
      ...(existing ?? { id: `${programId}@lab`, programId, sharing: 'separate' as const, plan: 'INTEGRA', stations: false }),
      groupIds,
      simIds: (existing?.simIds ?? []).filter((id) => groupIds.includes(id)),
      participants,
      units: participants ? Math.ceil(participants / STUDENTS_PER_KIT) : null,
    };
  });
  return { ...data, equipment };
}

export function setLevel(data: CampusData, level: LevelId, on: boolean): CampusData {
  if (on === data.levels.includes(level)) return data;
  const levels = (LEVEL_IDS as readonly LevelId[]).filter((id) => (id === level ? on : data.levels.includes(id)));
  const enrollment = on
    ? [...data.enrollment, { id: `${level}-lab`, levelId: level, label: LEVEL_NAMES[level], students: 30 }]
    : data.enrollment.filter((r) => r.levelId !== level);
  return withEquipment({ ...data, levels, enrollment });
}

export function setStudents(data: CampusData, level: LevelId, students: number): CampusData {
  if (!data.levels.includes(level)) return data;
  const enrollment = [...data.enrollment.filter((r) => r.levelId !== level), { id: `${level}-lab`, levelId: level, label: LEVEL_NAMES[level], students }];
  return withEquipment({ ...data, enrollment });
}

export function setProgram(data: CampusData, program: ProgramId, on: boolean): CampusData {
  if (on === data.programs.includes(program)) return data;
  const programs = on ? [...data.programs, program] : data.programs.filter((id) => id !== program);
  return withEquipment({ ...data, programs, equipment: data.equipment.filter((e) => e.programId !== program || on) });
}
