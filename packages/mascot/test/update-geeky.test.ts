import { describe, expect, it } from 'vitest';
import { changeset, geekySpec, pinnedVersion, shouldUpdate } from '../../../scripts/update-geeky.mjs';

describe('scripts/update-geeky.mjs', () => {
  it('geekySpec pins a release tag', () => {
    expect(geekySpec('1.2.0')).toBe('github:GuateGeeks/geeky-animation#v1.2.0');
    expect(() => geekySpec('v1.2')).toThrow(/X\.Y\.Z/);
    expect(() => geekySpec('1.2.0-beta')).toThrow(/X\.Y\.Z/);
  });

  it('pinnedVersion reads only tag specs', () => {
    expect(pinnedVersion(geekySpec('1.2.0'))).toBe('1.2.0');
    expect(pinnedVersion('github:GuateGeeks/geeky-animation#feature/package')).toBeNull();
    expect(pinnedVersion(undefined)).toBeNull();
  });

  it('shouldUpdate only moves forward', () => {
    expect(shouldUpdate('1.1.0', '1.1.0')).toBe(false);
    expect(shouldUpdate('1.2.0', '1.1.0')).toBe(false);
    expect(shouldUpdate('1.1.0', '1.1.1')).toBe(true);
    expect(shouldUpdate('1.9.0', '1.10.0')).toBe(true);
    expect(shouldUpdate('1.10.0', '1.9.0')).toBe(false);
    expect(shouldUpdate(null, '1.1.0')).toBe(true);
  });

  it('changeset bumps the mascot', () => {
    const text = changeset('1.2.0');
    expect(text).toMatch(/^---\n"@guategeeks\/mascot": minor\n---\n/);
    expect(text).toContain('v1.2.0');
  });
});
