import { describe, expect, it } from 'vitest';
import type { Edition } from '@guategeeks/themes';
import { isWithinWindow, resolveEdition } from '@guategeeks/theme-runtime';

const halloween: Edition = {
  id: 'halloween-2026',
  name: 'Halloween 2026',
  theme: 'halloween',
  variants: {},
  window: { from: '2026-10-24', to: '2026-11-02', tz: 'America/Guatemala' },
};
const editions = [halloween];
const inWindow = new Date('2026-10-31T18:00:00Z');
const outside = new Date('2026-06-01T18:00:00Z');

describe('resolveEdition', () => {
  it('explicit beats everything', () => {
    expect(resolveEdition(editions, { explicit: 'none', now: inWindow })).toBeNull();
    expect(resolveEdition(editions, { explicit: 'halloween-2026', now: outside })?.id).toBe('halloween-2026');
  });

  it('url override beats window', () => {
    expect(resolveEdition(editions, { search: '?edition=halloween-2026', now: outside })?.id).toBe('halloween-2026');
    expect(resolveEdition(editions, { search: '?edition=none', now: inWindow })).toBeNull();
  });

  it('active window applies', () => {
    expect(resolveEdition(editions, { now: inWindow })?.id).toBe('halloween-2026');
    expect(resolveEdition(editions, { now: outside })).toBeNull();
  });

  it('evaluates windows in the edition timezone', () => {
    const w = halloween.window!;
    expect(isWithinWindow(w, new Date('2026-10-24T05:00:00Z'))).toBe(false);
    expect(isWithinWindow(w, new Date('2026-10-24T06:00:00Z'))).toBe(true);
    expect(isWithinWindow(w, new Date('2026-11-03T05:59:00Z'))).toBe(true);
    expect(isWithinWindow(w, new Date('2026-11-03T06:00:00Z'))).toBe(false);
  });

  it('product default last', () => {
    expect(resolveEdition(editions, { now: outside, productDefault: 'halloween-2026' })?.id).toBe('halloween-2026');
  });

  it('ignores unknown ids', () => {
    expect(resolveEdition(editions, { explicit: 'nope', search: '?edition=nope', now: outside })).toBeNull();
  });
});
