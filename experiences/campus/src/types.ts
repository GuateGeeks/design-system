import type { planCampus } from './plan.ts';

export type LevelId = 'pre' | 'prim' | 'bas' | 'bach';
export type ProgramId = 'tale' | 'master' | 'spike' | 'electronics' | 'drones' | 'immersive';

export interface EnrollmentRow { id: string; levelId: LevelId; gradeId?: string; label?: string; sectionName?: string; students: number | null }

export interface EquipmentEntry {
  id: string; programId: ProgramId; units: number | null; plan?: string; stations?: boolean | number; sharing?: 'separate' | 'simultaneous' | 'unknown' | null;
  flexBimestres?: number; groupIds: string[]; simIds?: string[]; participants?: number; capacity?: number | null; rotations?: unknown[];
}

export type CampusFocus =
  | { kind: 'overview' }
  | { kind: 'level'; levelId: LevelId; emphasis?: 'explore' | 'edit'; id?: string }
  | { kind: 'program'; programId: ProgramId; emphasis?: 'explore' | 'edit'; id?: string }
  | { kind: string; [key: string]: unknown };

/** What the configurator sends the campus (the cotizador's mascotData() shape). */
export interface CampusData {
  levels: LevelId[];
  students?: number;
  programs: ProgramId[];
  enrollment: EnrollmentRow[];
  equipment: EquipmentEntry[];
  focusedLevel?: LevelId | null;
  focusedProgram?: ProgramId | null;
  activeConfig?: CampusFocus | null;
  preview?: { programId: ProgramId } | null;
  step?: number;
}

export type CampusPlan = ReturnType<typeof planCampus>;
