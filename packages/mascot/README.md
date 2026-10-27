# @guategeeks/mascot

Geeky, the GuateGeeks guide, for GuateGeeks products and experiences.

## `<Geeky>` on product screens (`@guategeeks/mascot/react`)

```tsx
import { Geeky } from '@guategeeks/mascot/react';

<Geeky intent="celebrate" />                                   // decorative, next to a text that says it
<Geeky intent="welcome" label="Geeky te da la bienvenida" />   // named for assistive technology
<Geeky intent="waiting" paused={paused} />                     // offer pause for long waits
```

- **Intents** (`GEEKY_INTENTS`): `welcome`, `goodbye`, `celebrate`, `reward`, `waiting`, `thinking`, `idea`, `attention`, `error`, `learning`, `idle`. One-shot intents play once and Geeky rests (`onActionEnd`; `playKey` replays); `waiting`, `thinking` and `idle` loop. `action` takes a raw geeky-animation id; unknown ids warn once and show the idle rest.
- **Theme:** the frame colour comes from the active theme and scheme (`mascot.palette` in the theme manifest); `palette` overrides it. **Motion** follows the theme runtime (`reducedMotion` overrides); reduced motion holds the intent's still pose. Works without `ThemeProvider` (Geeky's own colours, OS motion setting).
- **Accessibility:** without `label` Geeky is decorative (`aria-hidden`); the important message is always text. No idle fidgets unless `autonomous`; no pokes or drag unless `interactive`.
- **3D:** `render="3d"` loads three.js on demand and stays 2D without WebGL. Everything exported from `/react` is free of three.js.
- Also exported: `GEEKY_ACTIONS`, `GEEKY_ACTION_LIST`, `GEEKY_GROUPS`, `GEEKY_UPSTREAM` (the pinned geeky-animation version and links).

The lab's **Geeky** section is the guide for product teams: try it live and copy the code.

## Geeky in 3D scenes

- `createGeeky3D(materials?, { reduced?, palette? })`: Geeky in 3D inside a scene built on `@guategeeks/three`. It glides to goals, perches, follows the camera with its gaze, plays short cues (`cue('celebrate')`; unknown or looping ids return `false`) and rests so the scene can render on demand. Geeky owns exactly two materials; `palette` takes hex colours for `frame`, `back`, `lid`, `heart` and `blush`.
- `GEEKY_ACTIONS`, `GEEKY_ACTION_LIST`: the action catalogue.
- `GeekyPalette` (type).

## Where Geeky comes from

Geeky is made in [GuateGeeks/geeky-animation](https://github.com/GuateGeeks/geeky-animation): the brain, the actions, the rig, the geometry and the artwork. This package depends on it as `@guategeeks/geeky`, pinned to a release tag in `package.json` (`github:GuateGeeks/geeky-animation#vX.Y.Z`), and only adapts it to GuateGeeks scenes (`src/geeky3d.ts`). Change Geeky in geeky-animation, never here.

`src/three-namespace.ts` passes Geeky only the three.js members it uses (`MODEL_THREE_KEYS`); `test/upstream.test.ts` checks that list, the installed version against the pinned tag, the palette and unknown cues.

`test/geeky-signature.test.ts` records what the 3D Geeky looks like as data (meshes, vertices, colours and bounds of sampled poses) in `test/__snapshots__/geeky-signature.json`; the update workflow rewrites it and flags the pull request when it differs, anywhere else a difference fails the tests. The 2D `<Geeky>` is in the lab's visual baselines (gallery entry `geeky`, every theme and viewport).

## Updating Geeky

A geeky-animation release opens a pull request here on its own (`.github/workflows/update-geeky.yml`: on the release's notification, weekly, or run by hand). To update by hand:

```bash
npm run geeky:update -- 1.2.0
npm run build && npm test && npm run e2e
```

`geeky:update` pins the new tag, reinstalls and adds a changeset. If Geeky changed, `npx vitest run --project mascot test/geeky-signature.test.ts -u` rewrites the signature; review its diff and the release notes before merging.

## Provenance

`src/geeky3d.ts` is ported from GuateGeeks/cotizador@673ee22:asesor/lab/campus-geeky.js (Apache-2.0 in this repo). Until 2026-10-26 this package vendored eight files of geeky-animation@0089c59 plus the cotizador's `embedded.js`; `createGeekyModel` in geeky-animation v1.1.0 replaces them.
