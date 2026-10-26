import { describe, expect, it } from 'vitest';
import { getTheme } from '@guategeeks/themes';
import { profileOf } from '@guategeeks/three';

describe('profileOf', () => {
  it('returns the resolved 3d profile of a theme', () => {
    expect(profileOf(getTheme('halloween')!).background).toBe('#160f1f');
    expect(profileOf(getTheme('guategeeks')!).id).toBe('papercraft');
  });
});
