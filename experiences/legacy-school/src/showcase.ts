// Ported from GuateGeeks/cotizador@a125f6f:asesor/asesor.js (showcaseData) (Apache-2.0 in this repo)
import { LEGACY_LEVELS, LEGACY_PROGRAMS } from './programs.ts';

const SHARING = { tale: 'separate', master: 'simultaneous', spike: 'separate', electronics: 'simultaneous', drones: 'separate', immersive: 'simultaneous' } as const;

/** The illustrative school the cotizador's landing showed: every level and technology, seen as an overview. */
export function legacyShowcase() {
  const context = { kind: 'overview' };
  return {
    step: 0, levels: Object.keys(LEGACY_LEVELS), students: 720, focusedLevel: undefined, focusedProgram: undefined, activeConfig: context, enrollment: [],
    programs: Object.keys(LEGACY_PROGRAMS),
    equipment: (Object.keys(LEGACY_PROGRAMS) as Array<keyof typeof SHARING>).map((id) => ({
      id: `${id}@vitrina`, programId: id, units: 12, plan: 'INTEGRA', stations: false, sharing: SHARING[id],
      groupIds: [], simIds: [], participants: null, capacity: null, rotations: [],
    })),
  };
}
