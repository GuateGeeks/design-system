import { describe, expect, it } from 'vitest';
import { campusCounts, type CampusData } from '@guategeeks/experience-campus';

const data: CampusData = {
  levels: ['pre', 'prim'], programs: ['tale', 'spike'],
  enrollment: [
    { id: 'a', levelId: 'pre', students: 20 }, { id: 'b', levelId: 'pre', students: 22 },
    { id: 'c', levelId: 'prim', students: 30 }, { id: 'd', levelId: 'prim', students: null },
  ],
  equipment: [
    { id: 'tale@pre', programId: 'tale', units: 6, groupIds: ['a', 'b'], sharing: 'separate', simIds: [] },
    { id: 'spike@prim', programId: 'spike', units: 8, groupIds: ['b', 'c'], sharing: 'simultaneous', simIds: ['b', 'c'], participants: 52 },
  ],
};

describe('campusCounts', () => {
  it('derives the HUD counters from the configuration', () => {
    expect(campusCounts(data)).toEqual({ attended: 72, participations: 94, simultaneous: 52, teams: 14 });
  });

  it('without programs, attended is everyone registered', () => {
    expect(campusCounts({ ...data, programs: [], equipment: [] })).toEqual({ attended: 72, participations: 0, simultaneous: 0, teams: 0 });
  });

  it('falls back to the total students when there is no enrollment', () => {
    expect(campusCounts({ levels: ['pre'], programs: [], enrollment: [], equipment: [], students: 40 }).attended).toBe(40);
  });
});

describe('campusCounts with malformed input', () => {
  it('is finite, non-negative and never throws', () => {
    const bad = {
      levels: ['pre', 'zzz'], programs: ['x'],
      enrollment: [{ id: 'a', levelId: 'pre', students: -50 }, { id: 'b', levelId: 'pre', students: Number.NaN }, null],
      equipment: [{ id: 'e', programId: 'tale', units: -3, groupIds: ['a', 'b'], participants: -10 }],
    } as unknown as CampusData;
    const counts = campusCounts(bad);
    for (const value of Object.values(counts)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
    expect(() => campusCounts({} as CampusData)).not.toThrow();
    expect(campusCounts({} as CampusData)).toEqual({ attended: 0, participations: 0, simultaneous: 0, teams: 0 });
  });
});
