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
