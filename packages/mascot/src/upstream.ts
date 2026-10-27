import geeky from '@guategeeks/geeky/package.json' with { type: 'json' };

/** The geeky-animation release this design system ships (pinned in package.json). */
export const GEEKY_UPSTREAM = Object.freeze({
  version: geeky.version,
  repository: 'GuateGeeks/geeky-animation',
  release: `https://github.com/GuateGeeks/geeky-animation/releases/tag/v${geeky.version}`,
  changelog: `https://github.com/GuateGeeks/geeky-animation/blob/v${geeky.version}/CHANGELOG.md`,
});
