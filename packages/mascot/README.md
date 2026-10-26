# @guategeeks/mascot

Geeky, the GuateGeeks guide, for GuateGeeks experiences.

- `createGeeky3D(materials?, { reduced?, palette? })`: Geeky in 3D inside a scene built on `@guategeeks/three`. It glides to goals, perches, follows the camera with its gaze, plays short cues (`cue('celebrate')`; unknown or looping ids return `false`) and rests so the scene can render on demand. Geeky owns exactly two materials; `palette` takes hex colours for `frame`, `back`, `lid`, `heart` and `blush`.
- `GEEKY_ACTIONS`, `GEEKY_ACTION_LIST`: the action catalogue.
- `GeekyPalette` (type).

## Where Geeky comes from

Geeky is made in [GuateGeeks/geeky-animation](https://github.com/GuateGeeks/geeky-animation): the brain, the actions, the rig, the geometry and the artwork. This package depends on it as `@guategeeks/geeky`, pinned to a release tag in `package.json` (`github:GuateGeeks/geeky-animation#vX.Y.Z`), and only adapts it to GuateGeeks scenes (`src/geeky3d.ts`). Change Geeky in geeky-animation, never here.

`src/three-namespace.ts` passes Geeky only the three.js members it uses (`MODEL_THREE_KEYS`); `test/upstream.test.ts` checks that list, the installed version against the pinned tag, the palette and unknown cues.

## Updating Geeky

A geeky-animation release opens a pull request here on its own (`.github/workflows/update-geeky.yml`: on the release's notification, weekly, or run by hand). To update by hand:

```bash
npm run geeky:update -- 1.2.0
npm run build && npm test && npm run e2e
```

`geeky:update` pins the new tag, reinstalls and adds a changeset. Review the release notes and any changed visual baselines before merging.

## Provenance

`src/geeky3d.ts` is ported from GuateGeeks/cotizador@673ee22:asesor/lab/campus-geeky.js (Apache-2.0 in this repo). Until 2026-10-26 this package vendored eight files of geeky-animation@0089c59 plus the cotizador's `embedded.js`; `createGeekyModel` in geeky-animation v1.1.0 replaces them.
