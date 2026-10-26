import { describe, expect, it } from 'vitest';
import { changeset, geekySpec, lockedCommit, pinnedVersion, shouldUpdate, tagCommit } from '../../../scripts/update-geeky.mjs';

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

  it('lockedCommit reads the commit the lockfile installs', () => {
    const lock = { packages: { 'node_modules/@guategeeks/geeky': { resolved: 'git+ssh://git@github.com/GuateGeeks/geeky-animation.git#3463ee2281b3a68dc6cbdf18f227d04d30558a8c' } } };
    expect(lockedCommit(lock)).toBe('3463ee2281b3a68dc6cbdf18f227d04d30558a8c');
    expect(lockedCommit({ packages: {} })).toBeNull();
  });

  it('tagCommit peels annotated tags', () => {
    const annotated = 'aaaa111122223333444455556666777788889999\trefs/tags/v1.1.0\nbf20fc0aaaa1111222233334444555566667777\trefs/tags/v1.1.0^{}\n';
    expect(tagCommit(annotated)).toBe('bf20fc0aaaa1111222233334444555566667777');
    expect(tagCommit('cccc111122223333444455556666777788889999\trefs/tags/v1.2.0\n')).toBe('cccc111122223333444455556666777788889999');
    expect(tagCommit('')).toBeNull();
  });

  it('changeset bumps the mascot', () => {
    const text = changeset('1.2.0');
    expect(text).toMatch(/^---\n"@guategeeks\/mascot": minor\n---\n/);
    expect(text).toContain('v1.2.0');
  });
});

describe('.github/workflows/update-geeky.yml', () => {
  it('pins third-party actions by commit SHA (one of them receives a write token)', async () => {
    const workflow: string = (await import('../../../.github/workflows/update-geeky.yml?raw')).default;
    const thirdParty = [...workflow.matchAll(/uses: (\S+)/g)].map((m) => m[1]).filter((ref) => !ref.startsWith('actions/'));
    expect(thirdParty.length).toBeGreaterThan(0);
    for (const ref of thirdParty) expect(ref).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
  });
});
