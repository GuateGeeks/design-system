/**
 * Moves @guategeeks/mascot to a GuateGeeks/geeky-animation release.
 *
 *   node scripts/update-geeky.mjs <X.Y.Z | vX.Y.Z | latest>      (npm run geeky:update -- 1.2.0)
 *
 * Pins `@guategeeks/geeky` to the release tag, reinstalls and adds a changeset. It never moves backwards:
 * when the requested version is not newer than the pinned one it changes nothing. In GitHub Actions it
 * writes `changed=true|false` and `version` to $GITHUB_OUTPUT (.github/workflows/update-geeky.yml).
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const GEEKY_REPO = 'GuateGeeks/geeky-animation';
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

/** The dependency spec for a release: github:GuateGeeks/geeky-animation#vX.Y.Z. */
export function geekySpec(version) {
  if (!SEMVER.test(version)) throw new Error(`Geeky version must be X.Y.Z, got ${version}`);
  return `github:${GEEKY_REPO}#v${version}`;
}

/** The version a spec pins, or null when it points at a branch or commit. */
export function pinnedVersion(spec) {
  return /#v(\d+\.\d+\.\d+)$/.exec(spec ?? '')?.[1] ?? null;
}

/** True only when `next` is newer than `current` (numeric semver), or nothing is pinned yet. */
export function shouldUpdate(current, next) {
  if (current === null) return true;
  const a = SEMVER.exec(current).slice(1).map(Number), b = SEMVER.exec(next).slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return b[i] > a[i];
  return false;
}

export function changeset(version) {
  return `---\n"@guategeeks/mascot": minor\n---\n\nUpdate Geeky to v${version} (${GEEKY_REPO}).\n`;
}

const root = new URL('../', import.meta.url);
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8', ...opts });

function output(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join(''));
}

function main(requested = 'latest') {
  const next = requested === 'latest'
    ? run('gh', ['release', 'view', '--repo', GEEKY_REPO, '--json', 'tagName', '-q', '.tagName']).trim().replace(/^v/, '')
    : requested.replace(/^v/, '');
  const spec = geekySpec(next);
  const mascot = JSON.parse(readFileSync(new URL('packages/mascot/package.json', root), 'utf8'));
  const current = pinnedVersion(mascot.dependencies['@guategeeks/geeky']);
  if (!shouldUpdate(current, next)) {
    console.log(`geeky already at v${current}${next === current ? '' : ` (not moving back to v${next})`}`);
    output({ changed: false, version: current });
    return;
  }
  run('npm', ['pkg', 'set', '-w', '@guategeeks/mascot', `dependencies.@guategeeks/geeky=${spec}`]);
  run('npm', ['install', '--no-audit', '--no-fund'], { stdio: 'inherit' });
  writeFileSync(new URL(`.changeset/geeky-v${next}.md`, root), changeset(next));
  console.log(`geeky ${current ? `v${current}` : 'unpinned'} -> v${next}`);
  output({ changed: true, version: next });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(process.argv[2]); }
  catch (error) { console.error(error.message); process.exit(1); }
}
